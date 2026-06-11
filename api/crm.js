// api/crm.js
// ============================================================
// Pittahaya CRM — Admin Data API
// All routes require a valid Supabase session token.
// Place this file at: /api/crm.js in your Vercel project.
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const normalizeSupabaseUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(?:rest|auth)\/v1$/, "");

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const securityHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff'
};

function setBaseHeaders(req, res) {
  Object.entries(securityHeaders).forEach(([key, value]) => res.setHeader(key, value));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const origin = req.headers.origin;
  if (!origin) return;

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const sameHost = new URL(origin).host === req.headers.host;
    if (sameHost || origin === configuredOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  } catch {
    // Ignore malformed origins.
  }
}

// ── Auth guard ────────────────────────────────────────────────
async function requireAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  // Only allow specific admin email(s)
  const adminEmails = (process.env.CRM_ADMIN_EMAILS || 'jfmcorp@jfmcorporation.com').split(',').map(e => e.trim());
  if (!adminEmails.includes(user.email)) return null;
  return user;
}

function sanitize(str, maxLen = 500) {
  if (!str) return null;
  return String(str).trim().slice(0, maxLen);
}

// ── Finance / progress helpers ───────────────────────────────
const FINANCE_FIELDS    = ['deal_value', 'amount_paid', 'currency', 'payment_status', 'project_stage', 'next_followup'];
const PAYMENT_STATUSES  = ['unpaid', 'deposit', 'partial', 'paid'];
const PROJECT_STAGES    = ['', 'diagnosis', 'design', 'review', 'launch', 'delivered'];
const toMoney = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};
// True when an error means the finance columns aren't in the DB yet (so the
// CRM keeps working before the SQL migration is run).
const isSchemaError = (err) => {
  if (!err) return false;
  const m = String(err.message || '').toLowerCase();
  return err.code === '42703' || err.code === 'PGRST204' ||
         m.includes('column') || m.includes('schema cache') || m.includes('does not exist');
};
// Build the finance fields from a request body, validated.
const financeFromBody = (b) => ({
  deal_value:     toMoney(b.deal_value),
  amount_paid:    toMoney(b.amount_paid),
  currency:       (sanitize(b.currency, 8) || 'USD').toUpperCase().slice(0, 8),
  payment_status: PAYMENT_STATUSES.includes(b.payment_status) ? b.payment_status : 'unpaid',
  project_stage:  PROJECT_STAGES.includes(b.project_stage) ? b.project_stage : '',
  next_followup:  (b.next_followup && /^\d{4}-\d{2}-\d{2}$/.test(b.next_followup)) ? b.next_followup : null
});

// Neutralize PostgREST filter metacharacters before interpolating a
// user-supplied value into an `.or(...)` filter string. Commas, parens,
// asterisks and backslashes can break out of the value context and inject
// extra conditions, so we strip them and cap the length. (This endpoint is
// already admin-only — this is defense in depth.)
function sanitizeFilterValue(str, maxLen = 120) {
  return String(str || "")
    .replace(/[,()*\\%]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

// ── Route handlers ────────────────────────────────────────────

const ALLOWED_SORT_COLS = new Set(['created_at', 'updated_at', 'name', 'email', 'status', 'priority', 'company', 'service', 'source_page']);

async function getLeads(req, res) {
  const { status, priority, service, source_page, search, sort = 'created_at', order = 'desc', limit = 50, offset = 0 } = req.query;

  const safeSort = ALLOWED_SORT_COLS.has(sort) ? sort : 'created_at';
  const safeOrder = order === 'asc' ? 'asc' : 'desc';

  let query = supabase.from('leads').select('*', { count: 'exact' });

  if (status)      query = query.eq('status', status);
  if (priority)    query = query.eq('priority', priority);
  if (service)     query = query.ilike('service', `%${service}%`);
  if (source_page) query = query.ilike('source_page', `%${source_page}%`);
  if (search) {
    const s = sanitizeFilterValue(search);
    if (s) query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`);
  }

  query = query
    .order(safeSort, { ascending: safeOrder === 'asc' })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ leads: data, total: count });
}

async function getLead(req, res, id) {
  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: 'Lead no encontrado' });

  const [{ data: notes }, { data: tasks }] = await Promise.all([
    supabase.from('lead_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
    supabase.from('lead_tasks').select('*').eq('lead_id', id).order('due_date', { ascending: true }),
  ]);

  return res.status(200).json({ lead, notes: notes || [], tasks: tasks || [] });
}

// Create a lead manually from the CRM (e.g. a referral or a client you landed
// yourself). Mirrors the columns the public form writes.
async function createLead(req, res) {
  const b = req.body || {};
  const name  = sanitize(b.name, 100);
  const email = sanitize(b.email, 200);
  if (!name || !email) return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Correo no válido' });

  const statuses   = ['new','contacted','qualified','proposal_sent','won','lost'];
  const priorities = ['cold','warm','hot'];
  const lead = {
    name,
    email,
    phone:   sanitize(b.phone, 40),
    company: sanitize(b.company, 200) || '',
    service: sanitize(b.service, 120) || '',
    plan:    sanitize(b.plan, 120) || '',
    message: sanitize(b.message, 2000) || '',
    source_page: 'manual',
    source_demo: 'crm-manual',
    status:   statuses.includes(b.status) ? b.status : 'new',
    priority: priorities.includes(b.priority) ? b.priority : 'warm',
    social:  sanitize(b.social, 400) || '',
    ip_address: '0.0.0.0',
    user_agent: 'CRM manual entry',
    ...financeFromBody(b)
  };

  let { data, error } = await supabase.from('leads').insert(lead).select().single();
  // If new columns aren't migrated yet, insert the core fields only.
  if (error && isSchemaError(error)) {
    const core = { ...lead };
    [...FINANCE_FIELDS, 'social'].forEach(f => delete core[f]);
    ({ data, error } = await supabase.from('leads').insert(core).select().single());
  }
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ lead: data });
}

async function updateLead(req, res, id) {
  const allowed = ['status','priority','assigned_to','company','phone','service','plan'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = sanitize(req.body[key], 200);
  }
  // Finance / progress fields (typed + validated)
  const b = req.body || {};
  if (b.deal_value  !== undefined) updates.deal_value  = toMoney(b.deal_value);
  if (b.amount_paid !== undefined) updates.amount_paid = toMoney(b.amount_paid);
  if (b.currency    !== undefined) updates.currency    = (sanitize(b.currency, 8) || 'USD').toUpperCase().slice(0, 8);
  if (b.payment_status !== undefined && PAYMENT_STATUSES.includes(b.payment_status)) updates.payment_status = b.payment_status;
  if (b.project_stage  !== undefined && PROJECT_STAGES.includes(b.project_stage))    updates.project_stage  = b.project_stage;
  if (b.next_followup  !== undefined) updates.next_followup = (b.next_followup && /^\d{4}-\d{2}-\d{2}$/.test(b.next_followup)) ? b.next_followup : null;
  if (b.social !== undefined) updates.social = sanitize(b.social, 400) || '';

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nada que actualizar' });

  let { error } = await supabase.from('leads').update(updates).eq('id', id);
  if (error && isSchemaError(error)) {
    const core = { ...updates };
    [...FINANCE_FIELDS, 'social'].forEach(f => delete core[f]);
    if (Object.keys(core).length) ({ error } = await supabase.from('leads').update(core).eq('id', id));
  }
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function addNote(req, res, leadId) {
  const content = sanitize(req.body.content, 2000);
  const author  = sanitize(req.body.author, 100) || 'Admin';
  if (!content) return res.status(400).json({ error: 'La nota no puede estar vacía' });
  const { data, error } = await supabase.from('lead_notes').insert({ lead_id: leadId, content, author }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ note: data });
}

async function deleteNote(req, res, noteId) {
  const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function addTask(req, res, leadId) {
  const title    = sanitize(req.body.title, 300);
  const due_date = req.body.due_date || null;
  if (!title) return res.status(400).json({ error: 'La tarea necesita un título' });
  const { data, error } = await supabase.from('lead_tasks').insert({ lead_id: leadId, title, due_date }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ task: data });
}

async function updateTask(req, res, taskId) {
  const updates = {};
  if (req.body.completed !== undefined) {
    updates.completed = Boolean(req.body.completed);
    updates.completed_at = req.body.completed ? new Date().toISOString() : null;
  }
  if (req.body.title)    updates.title    = sanitize(req.body.title, 300);
  if (req.body.due_date) updates.due_date = req.body.due_date;
  const { error } = await supabase.from('lead_tasks').update(updates).eq('id', taskId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function deleteTask(req, res, taskId) {
  const { error } = await supabase.from('lead_tasks').delete().eq('id', taskId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

// Delete a lead and its related notes/tasks (in case the FK isn't ON DELETE CASCADE).
async function deleteLead(req, res, id) {
  await supabase.from('lead_notes').delete().eq('lead_id', id);
  await supabase.from('lead_tasks').delete().eq('lead_id', id);
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

// ── Expenses ──────────────────────────────────────────────────
const EXPENSE_CATEGORIES = ['software','marketing','contratistas','oficina','impuestos','otros'];
const COST_TYPES = ['direct','operating'];

async function getExpenses(req, res) {
  let q = supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(500);
  const month = req.query.month;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const start = `${month}-01`;
    const d = new Date(start + 'T00:00:00Z');
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    q = q.gte('expense_date', start).lt('expense_date', end);
  }
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ expenses: data || [] });
}

async function createExpense(req, res) {
  const b = req.body || {};
  const label  = sanitize(b.label, 200);
  const amount = toMoney(b.amount);
  if (!label) return res.status(400).json({ error: 'La descripción es obligatoria' });
  if (!(amount > 0)) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  const expense = {
    label,
    amount,
    category:  EXPENSE_CATEGORIES.includes(b.category) ? b.category : 'otros',
    cost_type: COST_TYPES.includes(b.cost_type) ? b.cost_type : 'operating',
    currency:  (sanitize(b.currency, 8) || 'USD').toUpperCase().slice(0, 8),
    expense_date: (b.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(b.expense_date)) ? b.expense_date : new Date().toISOString().slice(0, 10),
    recurring: !!b.recurring
  };
  const { data, error } = await supabase.from('expenses').insert(expense).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ expense: data });
}

async function updateExpense(req, res, id) {
  const b = req.body || {};
  const updates = {};
  if (b.label !== undefined) { const l = sanitize(b.label, 200); if (l) updates.label = l; }
  if (b.amount !== undefined) updates.amount = toMoney(b.amount);
  if (b.category !== undefined && EXPENSE_CATEGORIES.includes(b.category)) updates.category = b.category;
  if (b.cost_type !== undefined && COST_TYPES.includes(b.cost_type)) updates.cost_type = b.cost_type;
  if (b.expense_date !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(b.expense_date)) updates.expense_date = b.expense_date;
  if (b.recurring !== undefined) updates.recurring = !!b.recurring;
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nada que actualizar' });
  const { error } = await supabase.from('expenses').update(updates).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function deleteExpense(req, res, id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

// Copy every recurring expense template into the given month (one-click).
// Skips templates that already have a row in that month with the same label,
// so it's safe to press more than once. Copies are non-recurring instances.
async function generateRecurring(req, res) {
  const b = req.body || {};
  const now = new Date();
  const month = (b.month && /^\d{4}-\d{2}$/.test(b.month))
    ? b.month
    : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const start = `${month}-01`;
  const d = new Date(start + 'T00:00:00Z');
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);

  // 1. recurring templates
  const { data: templates, error: tErr } = await supabase
    .from('expenses').select('*').eq('recurring', true);
  if (tErr) return res.status(500).json({ error: tErr.message });
  if (!templates || !templates.length) return res.status(200).json({ created: 0, message: 'No hay gastos recurrentes definidos.' });

  // 2. what already exists that month
  const { data: existing, error: eErr } = await supabase
    .from('expenses').select('label').gte('expense_date', start).lt('expense_date', end);
  if (eErr) return res.status(500).json({ error: eErr.message });
  const have = new Set((existing || []).map(e => String(e.label || '').trim().toLowerCase()));

  const toInsert = templates
    .filter(t => !have.has(String(t.label || '').trim().toLowerCase()))
    .map(t => ({
      label: t.label,
      amount: toMoney(t.amount),
      category: t.category || 'otros',
      cost_type: t.cost_type || 'operating',
      currency: t.currency || 'USD',
      expense_date: start,
      recurring: false
    }));

  if (!toInsert.length) return res.status(200).json({ created: 0, message: 'Todos los gastos recurrentes ya están en este mes.' });
  const { error: iErr } = await supabase.from('expenses').insert(toInsert);
  if (iErr) return res.status(500).json({ error: iErr.message });
  return res.status(200).json({ created: toInsert.length });
}

// Monthly P&L for the last 6 months (for the trend chart).
async function getMonthly(req, res) {
  const now = new Date();
  const keys = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  const acc = {};
  keys.forEach(k => acc[k] = { month: k, revenue: 0, expenses: 0, profit: 0 });
  try {
    const { data: leads } = await supabase.from('leads').select('amount_paid, updated_at');
    (leads || []).forEach(l => {
      const k = String(l.updated_at || '').slice(0, 7);
      if (acc[k]) acc[k].revenue += Number(l.amount_paid) || 0;
    });
  } catch (e) { /* finance columns not migrated */ }
  try {
    const { data: exp } = await supabase.from('expenses').select('amount, expense_date');
    (exp || []).forEach(e => {
      const k = String(e.expense_date || '').slice(0, 7);
      if (acc[k]) acc[k].expenses += Number(e.amount) || 0;
    });
  } catch (e) { /* expenses table not migrated */ }
  const MONTH_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const months = keys.map(k => {
    const d = acc[k];
    const mi = Number(k.slice(5, 7)) - 1;
    return {
      month: k,
      label: `${MONTH_ES[mi] || ''} ${k.slice(2, 4)}`,
      revenue:  Math.round(d.revenue * 100) / 100,
      expenses: Math.round(d.expenses * 100) / 100,
      profit:   Math.round((d.revenue - d.expenses) * 100) / 100
    };
  });
  return res.status(200).json({ months });
}

async function getMetrics(req, res) {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: total },
    { count: newThisWeek },
    { count: hot },
    { count: won },
    { count: totalClosed },
    { data: byStatus },
    { data: byPriority },
    { data: byService },
    { data: bySource },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('priority', 'hot'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'won'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).in('status', ['won', 'lost']),
    supabase.from('leads').select('status').gte('created_at', monthAgo),
    supabase.from('leads').select('priority').gte('created_at', monthAgo),
    supabase.from('leads').select('service').not('service', 'is', null).gte('created_at', monthAgo),
    supabase.from('leads').select('source_page').not('source_page', 'is', null).gte('created_at', monthAgo),
    supabase.from('leads').select('id,name,email,company,service,status,priority,created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  // Aggregate
  const statusCounts = {};
  (byStatus || []).forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  const priorityCounts = {};
  (byPriority || []).forEach(r => { priorityCounts[r.priority] = (priorityCounts[r.priority] || 0) + 1; });

  const serviceCounts = {};
  (byService || []).forEach(r => {
    if (r.service) serviceCounts[r.service] = (serviceCounts[r.service] || 0) + 1;
  });

  const sourceCounts = {};
  (bySource || []).forEach(r => {
    const page = r.source_page?.split('?')[0]?.split('#')[0] || 'Desconocido';
    sourceCounts[page] = (sourceCounts[page] || 0) + 1;
  });

  const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const conversionRate = totalClosed > 0 ? Math.round((won / totalClosed) * 100) : 0;

  // ── Financial aggregates (graceful: zeros if the columns aren't migrated) ──
  const finance = {
    revenueCollected: 0,  // total actually received (sum amount_paid)
    pipelineValue: 0,     // sum deal_value of open leads (not won/lost)
    outstanding: 0,       // owed by won clients (deal_value - amount_paid)
    wonRevenue: 0,        // sum deal_value of won
    revenueThisMonth: 0,  // amount_paid on leads updated this month
    avgDeal: 0,
    currency: 'USD'
  };
  try {
    const { data: money, error: moneyErr } =
      await supabase.from('leads').select('deal_value, amount_paid, status, currency, updated_at');
    if (moneyErr) throw moneyErr;
    let wonCount = 0;
    (money || []).forEach(r => {
      const dv = Number(r.deal_value) || 0;
      const ap = Number(r.amount_paid) || 0;
      finance.revenueCollected += ap;
      if (r.status === 'won') { finance.wonRevenue += dv; finance.outstanding += Math.max(0, dv - ap); wonCount++; }
      else if (r.status !== 'lost') { finance.pipelineValue += dv; }
      if (r.updated_at && r.updated_at >= monthAgo) finance.revenueThisMonth += ap;
      if (r.currency) finance.currency = r.currency;
    });
    finance.avgDeal = wonCount > 0 ? Math.round((finance.wonRevenue / wonCount) * 100) / 100 : 0;
    ['revenueCollected','pipelineValue','outstanding','wonRevenue','revenueThisMonth']
      .forEach(k => finance[k] = Math.round(finance[k] * 100) / 100);
  } catch (e) {
    // Finance columns not migrated yet — leave zeros. (Not an error for the dashboard.)
  }

  // ── P&L: revenue vs expenses → gross & net profit ──
  const pnl = {
    revenue: finance.revenueCollected,
    directCosts: 0, operatingCosts: 0,
    grossProfit: 0, netProfit: 0,
    expensesTotal: 0, expensesThisMonth: 0,
    byCategory: {}
  };
  try {
    const { data: exp, error: expErr } = await supabase.from('expenses').select('amount, cost_type, category, expense_date');
    if (expErr) throw expErr;
    const mm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    (exp || []).forEach(e => {
      const amt = Number(e.amount) || 0;
      pnl.expensesTotal += amt;
      if (e.cost_type === 'direct') pnl.directCosts += amt; else pnl.operatingCosts += amt;
      const cat = e.category || 'otros';
      pnl.byCategory[cat] = (pnl.byCategory[cat] || 0) + amt;
      if (e.expense_date && String(e.expense_date) >= mm) pnl.expensesThisMonth += amt;
    });
    pnl.grossProfit = pnl.revenue - pnl.directCosts;
    pnl.netProfit   = pnl.grossProfit - pnl.operatingCosts;
    ['directCosts','operatingCosts','grossProfit','netProfit','expensesTotal','expensesThisMonth']
      .forEach(k => pnl[k] = Math.round(pnl[k] * 100) / 100);
  } catch (e) { /* expenses table not migrated yet */ }

  return res.status(200).json({
    total,
    newThisWeek,
    hot,
    conversionRate,
    topService,
    statusCounts,
    priorityCounts,
    serviceCounts,
    sourceCounts,
    recentLeads: recentLeads || [],
    finance,
    pnl,
  });
}

async function exportCSV(req, res) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const headers = ['id','created_at','name','email','phone','company','service','plan','message','source_page','source_demo','status','priority','social','deal_value','amount_paid','currency','payment_status','project_stage','next_followup','utm_source','utm_medium','utm_campaign'];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  const csv = [
    headers.join(','),
    ...(data || []).map(row => headers.map(h => escape(row[h])).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pittahaya-leads-${new Date().toISOString().slice(0,10)}.csv"`);
  return res.status(200).send('\uFEFF' + csv); // BOM for Excel UTF-8
}

// ── Main router ───────────────────────────────────────────────

module.exports = async function handler(req, res) {
  setBaseHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!supabase) {
    return res.status(500).json({ error: 'CRM no configurado. Revisa SUPABASE_URL y SUPABASE_SERVICE_KEY en Vercel.' });
  }

  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { action, id } = req.query;

  try {
    // GET /api/crm?action=metrics
    if (req.method === 'GET' && action === 'metrics') return getMetrics(req, res);
    // GET /api/crm?action=export
    if (req.method === 'GET' && action === 'export') return exportCSV(req, res);
    // GET /api/crm?action=leads
    if (req.method === 'GET' && action === 'leads') return getLeads(req, res);
    // GET /api/crm?action=lead&id=uuid
    if (req.method === 'GET' && action === 'lead' && id) return getLead(req, res, id);
    // PATCH /api/crm?action=lead&id=uuid
    // POST /api/crm?action=create-lead  (manual lead entry)
    if (req.method === 'POST' && action === 'create-lead') return createLead(req, res);
    // Expenses
    if (req.method === 'GET'    && action === 'expenses') return getExpenses(req, res);
    if (req.method === 'GET'    && action === 'monthly')  return getMonthly(req, res);
    if (req.method === 'POST'   && action === 'expense')  return createExpense(req, res);
    if (req.method === 'POST'   && action === 'recurring') return generateRecurring(req, res);
    if (req.method === 'PATCH'  && action === 'expense' && id) return updateExpense(req, res, id);
    if (req.method === 'DELETE' && action === 'expense' && id) return deleteExpense(req, res, id);
    if (req.method === 'PATCH'  && action === 'lead' && id) return updateLead(req, res, id);
    if (req.method === 'DELETE' && action === 'lead' && id) return deleteLead(req, res, id);
    // POST /api/crm?action=note&id=leadUuid
    if (req.method === 'POST' && action === 'note' && id) return addNote(req, res, id);
    // DELETE /api/crm?action=note&id=noteUuid
    if (req.method === 'DELETE' && action === 'note' && id) return deleteNote(req, res, id);
    // POST /api/crm?action=task&id=leadUuid
    if (req.method === 'POST' && action === 'task' && id) return addTask(req, res, id);
    // PATCH /api/crm?action=task&id=taskUuid
    if (req.method === 'PATCH' && action === 'task' && id) return updateTask(req, res, id);
    // DELETE /api/crm?action=task&id=taskUuid
    if (req.method === 'DELETE' && action === 'task' && id) return deleteTask(req, res, id);

    return res.status(404).json({ error: 'Ruta no encontrada' });
  } catch (err) {
    console.error('CRM API error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
