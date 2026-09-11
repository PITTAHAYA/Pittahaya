// api/crm.js
// ============================================================
// Pittahaya CRM — Admin Data API
// All routes require a valid Supabase session token.
// Place this file at: /api/crm.js in your Vercel project.
// ============================================================

const normalizeSupabaseUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(?:rest|auth)\/v1$/, "");

// Inicialización a prueba de fallos: si el require o createClient revientan al
// cargar el módulo (dependencia faltante, clave inválida, etc.), lo capturamos
// para devolver un error legible en vez de que Vercel reporte un crash mudo
// (FUNCTION_INVOCATION_FAILED) en TODAS las rutas.
let supabase = null;
let INIT_ERROR = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
} catch (e) {
  INIT_ERROR = e;
}

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
// Dos roles:
//   admin      → acceso total (dueño). CRM_ADMIN_EMAILS
//   accountant → SOLO LECTURA, limitado a un país. CRM_ACCOUNTANT_EC / _CA
// Los correos del contador se crean en Supabase (Auth → Users) por el dueño.
function accountantMap() {
  const map = {};
  (process.env.CRM_ACCOUNTANT_EC || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean).forEach(e => map[e] = 'ec');
  (process.env.CRM_ACCOUNTANT_CA || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean).forEach(e => map[e] = 'ca');
  return map;
}
async function requireAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const adminEmails = (process.env.CRM_ADMIN_EMAILS || 'jfmcorp@jfmcorporation.com').split(',').map(e => e.trim());
  if (adminEmails.includes(user.email)) return { user, role: 'admin', country: null };
  const accountants = accountantMap();
  const scope = accountants[String(user.email || '').toLowerCase()];
  if (scope) return { user, role: 'accountant', country: scope };
  return null;
}

function sanitize(str, maxLen = 500) {
  if (!str) return null;
  return String(str).trim().slice(0, maxLen);
}

// ── Países / config fiscal ───────────────────────────────────
// Pittahaya factura desde dos países. Cada uno tiene su moneda, su
// umbral de "pequeño proveedor" (bajo el cual NO hay que registrarse
// ni declarar impuesto de venta) y su tasa de impuesto para cuando se
// cruce ese umbral. Cambiar aquí = cambia en todo el CRM.
//   ec = Ecuador · ca = Canadá
const COUNTRIES = {
  ec: { code: 'ec', name: 'Ecuador', flag: '🇪🇨', currency: 'USD', taxName: 'IVA',     taxRate: 0.15, threshold: 20000, registered: false },
  ca: { code: 'ca', name: 'Canadá',  flag: '🇨🇦', currency: 'CAD', taxName: 'GST/HST', taxRate: 0.05, threshold: 30000, registered: false }
};
const COUNTRY_CODES = Object.keys(COUNTRIES);
const normCountry   = (c) => COUNTRY_CODES.includes(String(c || '').toLowerCase()) ? String(c).toLowerCase() : 'ec';
const currencyFor   = (c) => COUNTRIES[normCountry(c)].currency;

// Lee la configuración fiscal guardada (si registró IVA/GST y desde cuándo)
// y la fusiona sobre los valores por defecto. Degrada sin error si la tabla
// crm_settings aún no está migrada → todos como pequeño proveedor.
const FISCAL_KEY = 'fiscal_config';
async function loadFiscalConfig() {
  const cfg = {};
  COUNTRY_CODES.forEach(c => {
    cfg[c] = { registered: COUNTRIES[c].registered, registeredAt: null, taxRate: COUNTRIES[c].taxRate };
  });
  try {
    const { data, error } = await supabase.from('crm_settings').select('value').eq('key', FISCAL_KEY).single();
    if (error) throw error;
    const saved = (data && data.value) || {};
    COUNTRY_CODES.forEach(c => {
      if (saved[c]) {
        cfg[c].registered   = !!saved[c].registered;
        cfg[c].registeredAt = saved[c].registeredAt || null;
        if (Number.isFinite(Number(saved[c].taxRate))) cfg[c].taxRate = Number(saved[c].taxRate);
      }
    });
  } catch (e) { /* sin tabla de settings todavía → defaults */ }
  return cfg;
}

// ── Finance / progress helpers ───────────────────────────────
const FINANCE_FIELDS    = ['deal_value', 'amount_paid', 'currency', 'payment_status', 'project_stage', 'next_followup', 'country', 'tax_amount', 'withholding', 'payment_due'];
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
// La moneda se deriva del país (Ecuador→USD, Canadá→CAD) para no mezclar.
const financeFromBody = (b) => {
  const country = normCountry(b.country);
  return {
    deal_value:     toMoney(b.deal_value),
    amount_paid:    toMoney(b.amount_paid),
    country,
    currency:       currencyFor(country),
    tax_amount:     toMoney(b.tax_amount),
    withholding:    toMoney(b.withholding),
    payment_status: PAYMENT_STATUSES.includes(b.payment_status) ? b.payment_status : 'unpaid',
    project_stage:  PROJECT_STAGES.includes(b.project_stage) ? b.project_stage : '',
    next_followup:  (b.next_followup && /^\d{4}-\d{2}-\d{2}$/.test(b.next_followup)) ? b.next_followup : null,
    payment_due:    (b.payment_due && /^\d{4}-\d{2}-\d{2}$/.test(b.payment_due)) ? b.payment_due : null
  };
};

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
  const { status, priority, service, source_page, country, search, sort = 'created_at', order = 'desc', limit = 50, offset = 0 } = req.query;

  const safeSort = ALLOWED_SORT_COLS.has(sort) ? sort : 'created_at';
  const safeOrder = order === 'asc' ? 'asc' : 'desc';

  let query = supabase.from('leads').select('*', { count: 'exact' });

  if (status)      query = query.eq('status', status);
  if (country && COUNTRY_CODES.includes(country)) query = query.eq('country', country);
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
  if (req.crmScope && lead.country !== req.crmScope) return res.status(404).json({ error: 'Lead no encontrado' });

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
  // País → fija también la moneda para no mezclar CAD y USD.
  if (b.country      !== undefined) { updates.country = normCountry(b.country); updates.currency = currencyFor(b.country); }
  if (b.tax_amount   !== undefined) updates.tax_amount  = toMoney(b.tax_amount);
  if (b.withholding  !== undefined) updates.withholding = toMoney(b.withholding);
  if (b.payment_due  !== undefined) updates.payment_due = (b.payment_due && /^\d{4}-\d{2}-\d{2}$/.test(b.payment_due)) ? b.payment_due : null;

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
  if (req.query.country && COUNTRY_CODES.includes(req.query.country)) q = q.eq('country', req.query.country);
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
  const country = normCountry(b.country);
  const expense = {
    label,
    amount,
    category:  EXPENSE_CATEGORIES.includes(b.category) ? b.category : 'otros',
    cost_type: COST_TYPES.includes(b.cost_type) ? b.cost_type : 'operating',
    country,
    currency:  currencyFor(country),
    tax_amount: toMoney(b.tax_amount),
    expense_date: (b.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(b.expense_date)) ? b.expense_date : new Date().toISOString().slice(0, 10),
    recurring: !!b.recurring
  };
  let { data, error } = await supabase.from('expenses').insert(expense).select().single();
  // Si las columnas nuevas aún no están migradas, inserta lo esencial.
  if (error && isSchemaError(error)) {
    const core = { ...expense };
    ['country', 'tax_amount'].forEach(f => delete core[f]);
    ({ data, error } = await supabase.from('expenses').insert(core).select().single());
  }
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
  if (b.country !== undefined) { updates.country = normCountry(b.country); updates.currency = currencyFor(b.country); }
  if (b.tax_amount !== undefined) updates.tax_amount = toMoney(b.tax_amount);
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nada que actualizar' });
  let { error } = await supabase.from('expenses').update(updates).eq('id', id);
  if (error && isSchemaError(error)) {
    const core = { ...updates };
    ['country', 'tax_amount'].forEach(f => delete core[f]);
    if (Object.keys(core).length) ({ error } = await supabase.from('expenses').update(core).eq('id', id));
  }
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

// Monthly P&L for the last 6 months, split by country (for the trend charts).
async function getMonthly(req, res) {
  const now = new Date();
  const keys = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  // acc[country][monthKey] = { revenue, expenses }
  const acc = {};
  COUNTRY_CODES.forEach(c => { acc[c] = {}; keys.forEach(k => acc[c][k] = { revenue: 0, expenses: 0 }); });
  const scope = req.crmScope; // el contador solo ve su país

  try {
    let { data, error } = await supabase.from('leads').select('amount_paid, country, updated_at');
    if (error && isSchemaError(error)) ({ data } = await supabase.from('leads').select('amount_paid, updated_at'));
    (data || []).forEach(l => {
      const c = acc[normCountry(l.country)] ? normCountry(l.country) : 'ec';
      const k = String(l.updated_at || '').slice(0, 7);
      if (acc[c][k]) acc[c][k].revenue += Number(l.amount_paid) || 0;
    });
  } catch (e) { /* sin datos */ }
  try {
    let { data, error } = await supabase.from('expenses').select('amount, country, expense_date');
    if (error && isSchemaError(error)) ({ data } = await supabase.from('expenses').select('amount, expense_date'));
    (data || []).forEach(e => {
      const c = acc[normCountry(e.country)] ? normCountry(e.country) : 'ec';
      const k = String(e.expense_date || '').slice(0, 7);
      if (acc[c][k]) acc[c][k].expenses += Number(e.amount) || 0;
    });
  } catch (e) { /* sin datos */ }

  const MONTH_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const codes = scope ? [scope] : COUNTRY_CODES;
  const countries = codes.map(c => ({
    code: c, name: COUNTRIES[c].name, flag: COUNTRIES[c].flag, currency: COUNTRIES[c].currency,
    months: keys.map(k => {
      const d = acc[c][k];
      const mi = Number(k.slice(5, 7)) - 1;
      return {
        month: k, label: `${MONTH_ES[mi] || ''} ${k.slice(2, 4)}`,
        revenue:  Math.round(d.revenue * 100) / 100,
        expenses: Math.round(d.expenses * 100) / 100,
        profit:   Math.round((d.revenue - d.expenses) * 100) / 100
      };
    })
  }));
  return res.status(200).json({ countries });
}

// ── Radar fiscal (por país) ──────────────────────────────────
// El reporte que le facilita la vida al contador: por cada país, cuánto
// se cobró (año y rolling 12 meses), impuesto cobrado vs pagado, y qué
// tan cerca está del umbral de "pequeño proveedor" donde toca registrarse.
async function getFiscal(req, res) {
  const now = new Date();
  const yearStart = `${now.getUTCFullYear()}-01-01`;
  const rolling12 = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())).toISOString();
  const monthAgo  = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fcfg = await loadFiscalConfig();

  // Base por país desde el config.
  const acc = {};
  COUNTRY_CODES.forEach(c => {
    acc[c] = {
      ...COUNTRIES[c],
      registered: fcfg[c].registered, taxRate: fcfg[c].taxRate, registeredAt: fcfg[c].registeredAt,
      revenueCollected: 0, rolling12Revenue: 0, yearRevenue: 0, revenueThisMonth: 0,
      pipelineValue: 0, outstanding: 0, wonRevenue: 0,
      taxCollected: 0, withholding: 0, taxPaid: 0, taxNet: 0,
      expenses: 0, directCosts: 0, operatingCosts: 0, profit: 0, deals: 0, wonDeals: 0
    };
  });

  // ── Ventas (leads) ──
  try {
    let { data, error } = await supabase.from('leads')
      .select('deal_value, amount_paid, tax_amount, withholding, status, country, updated_at');
    if (error && isSchemaError(error)) {
      // Columnas nuevas sin migrar: cae todo a Ecuador por defecto.
      ({ data } = await supabase.from('leads').select('deal_value, amount_paid, status, updated_at'));
    } else if (error) { throw error; }
    (data || []).forEach(r => {
      const c = acc[normCountry(r.country)] ? normCountry(r.country) : 'ec';
      const ap = Number(r.amount_paid) || 0;
      const dv = Number(r.deal_value) || 0;
      const A = acc[c];
      A.revenueCollected += ap;
      A.taxCollected += Number(r.tax_amount) || 0;
      A.withholding  += Number(r.withholding) || 0;
      if (ap > 0) A.deals++;
      if (r.status === 'won') { A.wonDeals++; A.wonRevenue += dv; A.outstanding += Math.max(0, dv - ap); }
      else if (r.status !== 'lost') { A.pipelineValue += dv; }
      const u = String(r.updated_at || '');
      if (u >= yearStart) A.yearRevenue += ap;
      if (u >= rolling12) A.rolling12Revenue += ap;
      if (u >= monthAgo)  A.revenueThisMonth += ap;
    });
  } catch (e) { /* sin datos de ventas */ }

  // ── Gastos ──
  try {
    let { data, error } = await supabase.from('expenses').select('amount, tax_amount, cost_type, country');
    if (error && isSchemaError(error)) {
      ({ data } = await supabase.from('expenses').select('amount, cost_type'));
    } else if (error) { throw error; }
    (data || []).forEach(e => {
      const c = acc[normCountry(e.country)] ? normCountry(e.country) : 'ec';
      const amt = Number(e.amount) || 0;
      acc[c].expenses += amt;
      acc[c].taxPaid  += Number(e.tax_amount) || 0;
      if (e.cost_type === 'direct') acc[c].directCosts += amt; else acc[c].operatingCosts += amt;
    });
  } catch (e) { /* sin gastos */ }

  // ── Derivados + estado del umbral ──
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const countries = COUNTRY_CODES.map(c => {
    const A = acc[c];
    const roll = round2(A.rolling12Revenue);
    const pct  = A.threshold > 0 ? Math.round(roll / A.threshold * 100) : 0;
    const remaining = Math.max(0, round2(A.threshold - roll));
    const zone = pct >= 100 ? 'over' : pct >= 70 ? 'warning' : 'safe';
    const grossProfit = A.revenueCollected - A.directCosts;
    const netProfit   = grossProfit - A.operatingCosts;
    return {
      code: A.code, name: A.name, flag: A.flag, currency: A.currency,
      taxName: A.taxName, taxRate: A.taxRate, registered: A.registered,
      threshold: A.threshold,
      revenueCollected: round2(A.revenueCollected),
      yearRevenue:      round2(A.yearRevenue),
      rolling12Revenue: roll,
      revenueThisMonth: round2(A.revenueThisMonth),
      pipelineValue:    round2(A.pipelineValue),
      outstanding:      round2(A.outstanding),
      thresholdPct: pct,
      thresholdRemaining: remaining,
      zone,
      taxCollected: round2(A.taxCollected),
      withholding:  round2(A.withholding),
      taxPaid:      round2(A.taxPaid),
      taxNet:       round2(A.taxCollected - A.taxPaid),
      expenses:     round2(A.expenses),
      directCosts:    round2(A.directCosts),
      operatingCosts: round2(A.operatingCosts),
      grossProfit:  round2(grossProfit),
      netProfit:    round2(netProfit),
      profit:       round2(A.revenueCollected - A.expenses),
      deals: A.deals, wonDeals: A.wonDeals
    };
  });

  // El contador solo ve su país.
  const scoped = req.crmScope ? countries.filter(c => c.code === req.crmScope) : countries;
  return res.status(200).json({ countries: scoped, generatedAt: now.toISOString() });
}

// ── Reporte fiscal por período (mes / trimestre / año) ───────
// El "descarga y declara": para un país y un rango de fechas, cuánto
// entró, cuánto impuesto se cobró y se pagó, y el NETO a declarar.
async function getFiscalPeriod(req, res) {
  const country = normCountry(req.query.country);
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const start = DATE.test(req.query.start) ? req.query.start : `${new Date().getUTCFullYear()}-01-01`;
  const end   = DATE.test(req.query.end)   ? req.query.end   : new Date().toISOString().slice(0, 10);
  const fcfg  = await loadFiscalConfig();
  const cfg   = COUNTRIES[country];
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

  const r = {
    country, name: cfg.name, flag: cfg.flag, currency: cfg.currency, taxName: cfg.taxName,
    taxRate: fcfg[country].taxRate, registered: fcfg[country].registered,
    start, end,
    revenue: 0, taxCollected: 0, withholding: 0,
    taxPaid: 0, expenses: 0, directCosts: 0, operatingCosts: 0,
    netTax: 0, profit: 0, invoices: 0
  };

  // Ingresos (por updated_at, igual convención que el resto del CRM).
  try {
    let { data, error } = await supabase.from('leads')
      .select('amount_paid, tax_amount, withholding, country, updated_at')
      .gte('updated_at', start + 'T00:00:00Z').lt('updated_at', end + 'T23:59:59Z');
    if (error && isSchemaError(error)) {
      ({ data } = await supabase.from('leads').select('amount_paid, updated_at')
        .gte('updated_at', start + 'T00:00:00Z').lt('updated_at', end + 'T23:59:59Z'));
    } else if (error) { throw error; }
    (data || []).forEach(l => {
      if (normCountry(l.country) !== country) return;
      const ap = Number(l.amount_paid) || 0;
      if (ap > 0) r.invoices++;
      r.revenue      += ap;
      r.taxCollected += Number(l.tax_amount) || 0;
      r.withholding  += Number(l.withholding) || 0;
    });
  } catch (e) { /* sin ventas */ }

  // Gastos (por expense_date).
  try {
    let { data, error } = await supabase.from('expenses')
      .select('amount, tax_amount, cost_type, country, expense_date')
      .gte('expense_date', start).lte('expense_date', end);
    if (error && isSchemaError(error)) {
      ({ data } = await supabase.from('expenses').select('amount, cost_type, expense_date')
        .gte('expense_date', start).lte('expense_date', end));
    } else if (error) { throw error; }
    (data || []).forEach(e => {
      if (normCountry(e.country) !== country) return;
      const amt = Number(e.amount) || 0;
      r.expenses += amt;
      r.taxPaid  += Number(e.tax_amount) || 0;
      if (e.cost_type === 'direct') r.directCosts += amt; else r.operatingCosts += amt;
    });
  } catch (e) { /* sin gastos */ }

  r.netTax = r.taxCollected - r.taxPaid;
  r.profit = r.revenue - r.expenses;
  ['revenue','taxCollected','withholding','taxPaid','expenses','directCosts','operatingCosts','netTax','profit']
    .forEach(k => r[k] = round2(r[k]));
  return res.status(200).json(r);
}

// ── Settings fiscales (activar/desactivar impuesto por país) ──
async function getSettings(req, res) {
  const cfg = await loadFiscalConfig();
  const countries = COUNTRY_CODES.map(c => ({
    code: c, name: COUNTRIES[c].name, flag: COUNTRIES[c].flag,
    currency: COUNTRIES[c].currency, taxName: COUNTRIES[c].taxName,
    threshold: COUNTRIES[c].threshold,
    registered: cfg[c].registered, registeredAt: cfg[c].registeredAt, taxRate: cfg[c].taxRate
  }));
  return res.status(200).json({ countries });
}

async function updateSettings(req, res) {
  const b = req.body || {};
  const country = normCountry(b.country);
  const cfg = await loadFiscalConfig();
  if (b.registered !== undefined) {
    cfg[country].registered = !!b.registered;
    cfg[country].registeredAt = b.registered
      ? (/^\d{4}-\d{2}-\d{2}$/.test(b.registeredAt) ? b.registeredAt : new Date().toISOString().slice(0, 10))
      : null;
  }
  if (b.taxRate !== undefined) {
    const t = Number(b.taxRate);
    if (Number.isFinite(t) && t >= 0 && t <= 1) cfg[country].taxRate = Math.round(t * 10000) / 10000;
  }
  const value = {};
  COUNTRY_CODES.forEach(c => { value[c] = cfg[c]; });
  const { error } = await supabase.from('crm_settings')
    .upsert({ key: FISCAL_KEY, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, country: cfg[country] });
}

// ── Facturas (respaldo contable, guardadas) ──────────────────
const DOC_TYPES = ['factura', 'recibo'];

// Número secuencial por país (EC-000001 / CA-000001), guardado en settings.
async function nextInvoiceNumber(country) {
  const cc = country === 'ca' ? 'CA' : 'EC';
  const key = 'invoice_counters';
  let counters = { ec: 0, ca: 0 };
  try {
    const { data } = await supabase.from('crm_settings').select('value').eq('key', key).single();
    if (data && data.value) counters = { ...counters, ...data.value };
  } catch (e) { /* sin contador todavía */ }
  counters[country] = (Number(counters[country]) || 0) + 1;
  await supabase.from('crm_settings').upsert(
    { key, value: counters, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return `${cc}-${String(counters[country]).padStart(6, '0')}`;
}

async function createInvoice(req, res) {
  const b = req.body || {};
  const country = normCountry(b.country);
  const cfg = COUNTRIES[country];

  // Ítems: [{desc, qty, price}] — recalculamos montos en el servidor.
  const rawItems = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  const items = rawItems.map(it => ({
    desc:  sanitize(it && it.desc, 300) || '',
    qty:   Math.max(0, Number(it && it.qty)   || 0),
    price: Math.max(0, Number(it && it.price) || 0)
  })).filter(it => it.desc || it.qty || it.price);
  if (!items.length) return res.status(400).json({ error: 'La factura necesita al menos una línea.' });

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  let taxRate = Number(b.tax_rate);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) taxRate = 0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const base = {
    lead_id:        b.lead_id || null,
    country,
    currency:       cfg.currency,
    doc_type:       DOC_TYPES.includes(b.doc_type) ? b.doc_type : 'factura',
    client_name:    sanitize(b.client_name, 200) || '',
    client_company: sanitize(b.client_company, 200) || '',
    client_email:   sanitize(b.client_email, 200) || '',
    client_phone:   sanitize(b.client_phone, 60) || '',
    items,
    subtotal:   toMoney(subtotal),
    tax_name:   cfg.taxName,
    tax_rate:   Math.round(taxRate * 10000) / 10000,
    tax_amount: toMoney(taxAmount),
    total:      toMoney(total),
    amount_paid: toMoney(b.amount_paid),
    notes:      sanitize(b.notes, 1000) || '',
    issue_date: (b.issue_date && /^\d{4}-\d{2}-\d{2}$/.test(b.issue_date)) ? b.issue_date : new Date().toISOString().slice(0, 10),
    status:     ['draft', 'issued', 'paid', 'void'].includes(b.status) ? b.status : 'issued'
  };

  // Inserta con número secuencial; reintenta una vez si choca el unique.
  for (let attempt = 0; attempt < 2; attempt++) {
    const number = await nextInvoiceNumber(country);
    const { data, error } = await supabase.from('invoices').insert({ ...base, number }).select().single();
    if (!error) return res.status(201).json({ invoice: data });
    if (String(error.code) === '23505' && attempt === 0) continue; // número duplicado → reintenta
    if (isSchemaError(error)) return res.status(500).json({ error: 'Falta correr la migración de facturas en Supabase.' });
    return res.status(500).json({ error: error.message });
  }
  return res.status(500).json({ error: 'No se pudo asignar número de factura.' });
}

async function getInvoices(req, res) {
  let q = supabase.from('invoices').select('*').order('issue_date', { ascending: false }).limit(500);
  if (req.query.lead_id) q = q.eq('lead_id', req.query.lead_id);
  if (req.query.country && COUNTRY_CODES.includes(req.query.country)) q = q.eq('country', req.query.country);
  const { data, error } = await q;
  if (error) {
    if (isSchemaError(error)) return res.status(200).json({ invoices: [] });
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ invoices: data || [] });
}

async function getInvoice(req, res, id) {
  const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: 'Factura no encontrada' });
  // El contador solo ve facturas de su país.
  if (req.crmScope && data.country !== req.crmScope) return res.status(404).json({ error: 'Factura no encontrada' });
  return res.status(200).json({ invoice: data });
}

// ── Cobros y seguimientos (recordatorios) ────────────────────
// Dos listas accionables: saldos por cobrar (con días de atraso vs. la fecha
// de vencimiento) y seguimientos cuya fecha ya llegó. Respeta el país del rol.
function daysDiff(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00Z'), b = new Date(toISO + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}
async function getReminders(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const cols = 'id,name,email,company,phone,service,country,currency,deal_value,amount_paid,payment_status,status,next_followup,payment_due,updated_at';
  let q = supabase.from('leads').select(cols);
  const scope = req.crmScope || (COUNTRY_CODES.includes(req.query.country) ? req.query.country : null);
  if (scope) q = q.eq('country', scope);

  let { data, error } = await q;
  if (error && isSchemaError(error)) {
    // Sin las columnas nuevas: usa lo básico y no filtra por país.
    ({ data } = await supabase.from('leads').select('id,name,email,company,phone,service,deal_value,amount_paid,payment_status,status,next_followup,updated_at'));
  } else if (error) { return res.status(500).json({ error: error.message }); }

  const receivables = [], followups = [];
  (data || []).forEach(l => {
    if (l.status === 'lost') return;
    const country = normCountry(l.country);
    const dv = Number(l.deal_value) || 0, ap = Number(l.amount_paid) || 0;
    const pending = Math.round((dv - ap) * 100) / 100;
    if (pending > 0.001 && l.payment_status !== 'paid') {
      const due = (l.payment_due && /^\d{4}-\d{2}/.test(l.payment_due)) ? String(l.payment_due).slice(0, 10) : null;
      receivables.push({
        id: l.id, name: l.name, company: l.company, email: l.email, phone: l.phone,
        service: l.service, country, currency: currencyFor(country),
        deal_value: dv, amount_paid: ap, pending, payment_status: l.payment_status,
        payment_due: due,
        overdueDays: due && due < today ? daysDiff(due, today) : 0,
        agingDays: l.updated_at ? Math.max(0, daysDiff(String(l.updated_at).slice(0, 10), today)) : 0
      });
    }
    const nf = (l.next_followup && /^\d{4}-\d{2}-\d{2}/.test(l.next_followup)) ? String(l.next_followup).slice(0, 10) : null;
    if (nf && nf <= today && l.status !== 'won') {
      followups.push({
        id: l.id, name: l.name, company: l.company, service: l.service,
        country, next_followup: nf, overdueDays: daysDiff(nf, today), status: l.status
      });
    }
  });
  receivables.sort((a, b) => (b.overdueDays - a.overdueDays) || (b.pending - a.pending));
  followups.sort((a, b) => a.next_followup < b.next_followup ? -1 : 1);
  return res.status(200).json({ today, receivables, followups });
}

// ── Asistente de seguimiento (IA + automatización) ───────────
// Genera, para un lead, la próxima mejor acción, una cadencia de seguimiento
// y un mensaje listo para enviar. Usa un LLM real si hay LLM_API_KEY; si no,
// un motor de reglas que produce el mismo resultado. Es la prueba viva de la
// automatización con IA que vende Pittahaya.
const STATUS_ES = { new:'nuevo', contacted:'contactado', qualified:'calificado', proposal_sent:'propuesta enviada', won:'ganado', lost:'perdido' };

function buildFollowupContext(lead) {
  const now = Date.now();
  const days = (d) => d ? Math.max(0, Math.round((now - new Date(d).getTime()) / 86400000)) : null;
  const dv = Number(lead.deal_value) || 0, ap = Number(lead.amount_paid) || 0;
  return {
    lang: lead.country === 'ca' ? 'en' : 'es',
    firstName: String(lead.name || '').trim().split(/\s+/)[0] || (lead.country === 'ca' ? 'there' : 'hola'),
    daysSinceCreated: days(lead.created_at),
    daysSinceUpdated: days(lead.updated_at),
    pending: Math.round((dv - ap) * 100) / 100,
    dealValue: dv, currency: lead.currency || (lead.country === 'ca' ? 'CAD' : 'USD'),
    service: lead.service || '', status: lead.status || 'new', stage: lead.project_stage || '',
    paymentStatus: lead.payment_status || 'unpaid'
  };
}

// Motor de reglas: elige la mejor jugada según el estado real del lead.
function rulesFollowup(lead, ctx) {
  const es = ctx.lang === 'es';
  const money = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const svc = ctx.service || (es ? 'tu proyecto' : 'your project');
  const N = ctx.firstName;
  let urgency = 'medium', nextAction, reasoning, cadence = [];

  if (lead.status === 'won' && ctx.pending > 0.01) {
    urgency = 'high';
    nextAction = es ? `Cobrar el saldo pendiente de ${money(ctx.pending)} ${ctx.currency}` : `Collect the outstanding ${money(ctx.pending)} ${ctx.currency}`;
    reasoning = es ? `Cliente ganado con saldo por cobrar y ${ctx.daysSinceUpdated ?? 0} días sin movimiento.` : `Won client with a balance due and ${ctx.daysSinceUpdated ?? 0} days without movement.`;
    cadence = [
      { day: 0, channel: 'whatsapp', goal: es ? 'Recordatorio amable de pago' : 'Friendly payment reminder',
        message: es ? `Hola ${N}, un recordatorio del saldo de ${money(ctx.pending)} ${ctx.currency} por ${svc}. ¿Te paso los datos de pago?` : `Hi ${N}, a quick reminder about the ${money(ctx.pending)} ${ctx.currency} balance for ${svc}. Want me to resend the payment details?` },
      { day: 3, channel: 'email', goal: es ? 'Reenviar factura + datos' : 'Resend invoice + details',
        message: es ? `Hola ${N}, te reenvío la factura con los datos de pago. Cualquier duda, con gusto te ayudo.` : `Hi ${N}, resending the invoice with payment details. Happy to help with any questions.` },
      { day: 7, channel: 'call', goal: es ? 'Llamada breve de cierre' : 'Short closing call',
        message: es ? `Llamar para confirmar fecha de pago.` : `Call to confirm a payment date.` }
    ];
  } else if (lead.status === 'proposal_sent') {
    urgency = (ctx.daysSinceUpdated ?? 0) >= 3 ? 'high' : 'medium';
    nextAction = es ? 'Dar seguimiento a la propuesta enviada' : 'Follow up on the sent proposal';
    reasoning = es ? `Propuesta enviada hace ${ctx.daysSinceUpdated ?? 0} días sin respuesta.` : `Proposal sent ${ctx.daysSinceUpdated ?? 0} days ago with no reply.`;
    cadence = [
      { day: 0, channel: 'whatsapp', goal: es ? 'Confirmar que la recibió' : 'Confirm they received it',
        message: es ? `Hola ${N}, ¿pudiste revisar la propuesta de ${svc}? Me encantaría resolver cualquier duda.` : `Hi ${N}, did you get a chance to review the ${svc} proposal? Happy to clear up any questions.` },
      { day: 2, channel: 'email', goal: es ? 'Aportar valor / caso' : 'Add value / a case',
        message: es ? `Hola ${N}, te comparto un ejemplo de un proyecto similar por si ayuda a decidir.` : `Hi ${N}, sharing a similar project example in case it helps you decide.` },
      { day: 5, channel: 'whatsapp', goal: es ? 'Crear urgencia suave' : 'Gentle urgency',
        message: es ? `Hola ${N}, sigo con un cupo disponible esta semana para arrancar ${svc}. ¿Avanzamos?` : `Hi ${N}, I still have a slot this week to start ${svc}. Shall we move forward?` }
    ];
  } else if (lead.status === 'new' || lead.status === 'contacted' || lead.status === 'qualified') {
    urgency = (ctx.daysSinceCreated ?? 0) >= 2 ? 'high' : 'medium';
    nextAction = es ? 'Primer contacto rápido y personal' : 'Fast, personal first touch';
    reasoning = es ? `Lead ${STATUS_ES[lead.status]} de hace ${ctx.daysSinceCreated ?? 0} días — la velocidad de respuesta define la conversión.` : `${lead.status} lead from ${ctx.daysSinceCreated ?? 0} days ago — response speed drives conversion.`;
    cadence = [
      { day: 0, channel: 'whatsapp', goal: es ? 'Romper el hielo' : 'Break the ice',
        message: es ? `Hola ${N}, soy de Pittahaya. Vi tu interés en ${svc}. ¿Cuál es el objetivo principal que buscas?` : `Hi ${N}, this is Pittahaya. I saw your interest in ${svc}. What's the main goal you're after?` },
      { day: 1, channel: 'email', goal: es ? 'Enviar diagnóstico/propuesta' : 'Send diagnosis/proposal',
        message: es ? `Hola ${N}, te preparé un diagnóstico rápido para ${svc}. ¿Te va una llamada de 15 min?` : `Hi ${N}, I put together a quick diagnosis for ${svc}. Up for a 15-min call?` },
      { day: 4, channel: 'whatsapp', goal: es ? 'Reintento con prueba social' : 'Retry with social proof',
        message: es ? `Hola ${N}, te dejo un caso de un cliente parecido. ¿Lo vemos juntos?` : `Hi ${N}, here's a case from a similar client. Want to go through it together?` }
    ];
  } else {
    urgency = 'low';
    nextAction = es ? 'Reactivar o pedir testimonio' : 'Re-engage or ask for a testimonial';
    reasoning = es ? 'Sin acción urgente pendiente; buen momento para nutrir la relación.' : 'No urgent action pending; a good moment to nurture the relationship.';
    cadence = [
      { day: 0, channel: 'email', goal: es ? 'Reconectar con valor' : 'Reconnect with value',
        message: es ? `Hola ${N}, ¿cómo va todo con ${svc}? Si necesitas una mejora o mantenimiento, aquí estoy.` : `Hi ${N}, how's everything going with ${svc}? If you need an upgrade or maintenance, I'm here.` }
    ];
  }
  return { source: 'rules', language: ctx.lang, urgency, nextAction, reasoning, cadence, draftMessage: cadence[0] ? cadence[0].message : '' };
}

// Llama a un LLM real (Anthropic u OpenAI) si hay clave. Devuelve null si falla.
async function llmFollowup(lead, ctx) {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;
  const isAnthropic = key.startsWith('sk-ant');
  const sys = `You are the follow-up strategist for Pittahaya, a premium web design & AI automation studio. Given a sales lead, return ONLY minified JSON (no markdown) with this exact shape:
{"urgency":"high|medium|low","nextAction":"one line","reasoning":"one line","cadence":[{"day":0,"channel":"whatsapp|email|call","goal":"short","message":"ready-to-send text"}],"draftMessage":"the day-0 message"}
Write every "message" and text in ${ctx.lang === 'en' ? 'ENGLISH' : 'SPANISH (tuteo, Ecuador)'}. Keep messages warm, concise, no emojis as structure. 2-4 cadence steps.`;
  const user = `Lead: name=${lead.name}; firstName=${ctx.firstName}; service=${ctx.service}; status=${ctx.status}; stage=${ctx.stage}; payment=${ctx.paymentStatus}; dealValue=${ctx.dealValue} ${ctx.currency}; pendingBalance=${ctx.pending}; daysSinceCreated=${ctx.daysSinceCreated}; daysSinceUpdated=${ctx.daysSinceUpdated}; country=${lead.country}. Produce the follow-up plan.`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    let text;
    if (isAnthropic) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 900, system: sys, messages: [{ role: 'user', content: user }] })
      });
      if (!r.ok) throw new Error('anthropic ' + r.status);
      const j = await r.json();
      text = (j.content || []).map(b => b.text || '').join('');
    } else {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.5, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] })
      });
      if (!r.ok) throw new Error('openai ' + r.status);
      const j = await r.json();
      text = j.choices?.[0]?.message?.content || '';
    }
    const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.cadence)) return null;
    return {
      source: 'ai', language: ctx.lang,
      urgency: ['high', 'medium', 'low'].includes(parsed.urgency) ? parsed.urgency : 'medium',
      nextAction: String(parsed.nextAction || '').slice(0, 300),
      reasoning: String(parsed.reasoning || '').slice(0, 500),
      cadence: parsed.cadence.slice(0, 5).map(s => ({
        day: Number(s.day) || 0,
        channel: ['whatsapp', 'email', 'call'].includes(s.channel) ? s.channel : 'email',
        goal: String(s.goal || '').slice(0, 120),
        message: String(s.message || '').slice(0, 800)
      })),
      draftMessage: String(parsed.draftMessage || (parsed.cadence[0] && parsed.cadence[0].message) || '').slice(0, 800)
    };
  } catch (e) {
    return null; // cae al motor de reglas
  } finally {
    clearTimeout(timer);
  }
}

// Piloto automático: correr el auto-envío ahora (botón admin del CRM) y
// leer/cambiar el interruptor global.
async function runFollowupsNow(req, res) {
  const { runAutoFollowups } = require('../lib/followup');
  const force = !!(req.body && req.body.force);
  const result = await runAutoFollowups({ force });
  return res.status(200).json(result);
}
// Panorama completo del piloto automático para el panel de control.
async function getAutopilotStats(req, res) {
  const { CADENCE_DAYS } = require('../lib/followup');
  const DAY = 86400000;
  const ENROLL_WINDOW = 14;   // días en que un lead sigue en cadencia
  const now = Date.now();

  // ¿Encendido?
  let enabled = true;
  try {
    const { data } = await supabase.from('crm_settings').select('value').eq('key', 'autopilot').single();
    if (data && data.value && data.value.enabled === false) enabled = false;
  } catch (e) {}

  // Leads de los últimos 60 días (ventana de visualización).
  const since = new Date(now - 60 * DAY).toISOString();
  let leads = [];
  try {
    const { data, error } = await supabase.from('leads')
      .select('id,name,email,service,country,source_page,status,created_at,followups_sent,autofollow,last_followup_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    leads = data || [];
  } catch (e) {
    return res.status(200).json({ ok: false, enabled, error: String(e.message || e).slice(0, 200), cadence: CADENCE_DAYS, stats: {}, upcoming: [], recent: [] });
  }

  let enrolled = 0, completed = 0, sentTotal = 0, dueNow = 0, optedOut = 0, sentThisWeek = 0;
  const upcoming = [], recent = [];
  const weekAgo = now - 7 * DAY;

  for (const l of leads) {
    const idx = Number(l.followups_sent) || 0;
    sentTotal += idx;
    const active = !['won', 'lost'].includes(l.status);
    const inWindow = (now - new Date(l.created_at).getTime()) <= ENROLL_WINDOW * DAY;
    if (l.autofollow === false) optedOut++;
    if (l.last_followup_at && new Date(l.last_followup_at).getTime() >= weekAgo) sentThisWeek++;

    if (idx >= CADENCE_DAYS.length) {
      completed++;
    } else if (active && l.autofollow !== false && inWindow) {
      enrolled++;
      const dueAt = new Date(l.created_at).getTime() + CADENCE_DAYS[idx] * DAY;
      const overdue = now >= dueAt;
      if (overdue) dueNow++;
      upcoming.push({ id: l.id, name: l.name, email: l.email, country: l.country, step: idx + 1, totalSteps: CADENCE_DAYS.length, dueAt: new Date(dueAt).toISOString(), overdue });
    }

    if (l.last_followup_at) {
      recent.push({ id: l.id, name: l.name, email: l.email, country: l.country, step: idx, at: l.last_followup_at });
    }
  }

  upcoming.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  recent.sort((a, b) => new Date(b.at) - new Date(a.at));

  return res.status(200).json({
    ok: true,
    enabled,
    cadence: CADENCE_DAYS,
    stats: { enrolled, completed, sentTotal, sentThisWeek, dueNow, optedOut, considered: leads.length },
    upcoming: upcoming.slice(0, 40),
    recent: recent.slice(0, 25)
  });
}

async function getAutopilot(req, res) {
  let enabled = true;
  try {
    const { data } = await supabase.from('crm_settings').select('value').eq('key', 'autopilot').single();
    if (data && data.value && data.value.enabled === false) enabled = false;
  } catch (e) { /* sin registro → encendido por defecto */ }
  return res.status(200).json({ enabled });
}
async function setAutopilot(req, res) {
  const enabled = !(req.body && req.body.enabled === false);
  const { error } = await supabase.from('crm_settings')
    .upsert({ key: 'autopilot', value: { enabled }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ enabled });
}

async function getAiFollowup(req, res, id) {
  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error || !lead) return res.status(404).json({ error: 'Lead no encontrado' });
  const ctx = buildFollowupContext(lead);
  const ai = await llmFollowup(lead, ctx);
  const plan = ai || rulesFollowup(lead, ctx);
  return res.status(200).json({ plan, aiEnabled: !!process.env.LLM_API_KEY });
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
  let q = supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (req.query.country && COUNTRY_CODES.includes(req.query.country)) q = q.eq('country', req.query.country);
  const { data, error } = await q;

  if (error) return res.status(500).json({ error: error.message });

  const headers = ['id','created_at','country','name','email','phone','company','service','plan','message','source_page','source_demo','status','priority','social','deal_value','amount_paid','tax_amount','withholding','currency','payment_status','project_stage','next_followup','utm_source','utm_medium','utm_campaign'];
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
  if (INIT_ERROR) {
    return res.status(500).json({ error: 'Init del CRM falló: ' + String(INIT_ERROR && INIT_ERROR.message || INIT_ERROR).slice(0, 300) });
  }
  if (!supabase) {
    return res.status(500).json({ error: 'CRM no configurado. Revisa SUPABASE_URL y SUPABASE_SERVICE_KEY en Vercel.' });
  }

  try {
    const auth = await requireAuth(req);
    if (!auth) return res.status(401).json({ error: 'No autorizado' });
    const user = auth.user;
    req.crmRole  = auth.role;
    req.crmScope = auth.country;   // 'ec' | 'ca' para contador; null para admin

    const { action, id } = req.query;

    // ¿Quién soy? — para que el login redirija al panel correcto.
    if (req.method === 'GET' && action === 'whoami') {
      return res.status(200).json({ email: user.email, role: auth.role, country: auth.country });
    }

    // El contador es SOLO LECTURA y limitado a su país.
    if (auth.role === 'accountant') {
      if (req.method !== 'GET') return res.status(403).json({ error: 'Acceso de solo lectura.' });
      req.query.country = auth.country;        // fuerza el país en todo endpoint que lo use
      const allowed = ['fiscal', 'fiscal-period', 'reminders', 'invoices', 'invoice', 'export', 'leads', 'expenses', 'lead'];
      if (!allowed.includes(action)) return res.status(403).json({ error: 'No disponible para este rol.' });
    }

    // NOTA: cada ruta va con `await` para que un fallo async caiga en este
    // catch (si no, Vercel lo reporta como FUNCTION_INVOCATION_FAILED).
    if (req.method === 'GET' && action === 'metrics') return await getMetrics(req, res);
    if (req.method === 'GET' && action === 'fiscal') return await getFiscal(req, res);
    if (req.method === 'GET' && action === 'fiscal-period') return await getFiscalPeriod(req, res);
    if (req.method === 'GET' && action === 'reminders') return await getReminders(req, res);
    if (req.method === 'GET' && action === 'ai-followup' && id) return await getAiFollowup(req, res, id);
    if (req.method === 'GET'   && action === 'autopilot') return await getAutopilot(req, res);
    if (req.method === 'GET'   && action === 'autopilot-stats') return await getAutopilotStats(req, res);
    if (req.method === 'PATCH' && action === 'autopilot') return await setAutopilot(req, res);
    if (req.method === 'POST'  && action === 'run-followups') return await runFollowupsNow(req, res);
    if (req.method === 'GET'   && action === 'settings') return await getSettings(req, res);
    if (req.method === 'PATCH' && action === 'settings') return await updateSettings(req, res);
    if (req.method === 'GET'  && action === 'invoices') return await getInvoices(req, res);
    if (req.method === 'GET'  && action === 'invoice' && id) return await getInvoice(req, res, id);
    if (req.method === 'POST' && action === 'invoice') return await createInvoice(req, res);
    if (req.method === 'GET' && action === 'export') return await exportCSV(req, res);
    if (req.method === 'GET' && action === 'leads') return await getLeads(req, res);
    if (req.method === 'GET' && action === 'lead' && id) return await getLead(req, res, id);
    if (req.method === 'POST' && action === 'create-lead') return await createLead(req, res);
    if (req.method === 'GET'    && action === 'expenses') return await getExpenses(req, res);
    if (req.method === 'GET'    && action === 'monthly')  return await getMonthly(req, res);
    if (req.method === 'POST'   && action === 'expense')  return await createExpense(req, res);
    if (req.method === 'POST'   && action === 'recurring') return await generateRecurring(req, res);
    if (req.method === 'PATCH'  && action === 'expense' && id) return await updateExpense(req, res, id);
    if (req.method === 'DELETE' && action === 'expense' && id) return await deleteExpense(req, res, id);
    if (req.method === 'PATCH'  && action === 'lead' && id) return await updateLead(req, res, id);
    if (req.method === 'DELETE' && action === 'lead' && id) return await deleteLead(req, res, id);
    if (req.method === 'POST' && action === 'note' && id) return await addNote(req, res, id);
    if (req.method === 'DELETE' && action === 'note' && id) return await deleteNote(req, res, id);
    if (req.method === 'POST' && action === 'task' && id) return await addTask(req, res, id);
    if (req.method === 'PATCH' && action === 'task' && id) return await updateTask(req, res, id);
    if (req.method === 'DELETE' && action === 'task' && id) return await deleteTask(req, res, id);

    return res.status(404).json({ error: 'Ruta no encontrada' });
  } catch (err) {
    console.error('CRM API error:', err);
    // Mensaje real (recortado) para poder diagnosticar desde el navegador.
    return res.status(500).json({ error: 'Error del servidor: ' + String(err && err.message || err).slice(0, 300) });
  }
};
