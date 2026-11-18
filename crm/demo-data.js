// crm/demo-data.js
// ============================================================
// MODO DEMO — datos 100% ficticios para grabar/mostrar el CRM sin exponer
// clientes reales. Se activa con el interruptor "Demo" del dashboard (se
// guarda en localStorage 'crm_demo'). Cuando está activo, el CRM NO lee ni
// escribe la base real: todo responde desde aquí, en memoria.
// ============================================================
(function () {
  var DAY = 86400000, now = Date.now();
  var iso = function (d) { return new Date(now - d * DAY).toISOString(); };
  var ymd = function (d) { return new Date(now - d * DAY).toISOString().slice(0, 10); };
  var uid = function (n) { return '00000000-0000-4000-8000-' + String(n).padStart(12, '0'); };

  var people = [
    ['Valentina Ríos', 'Casa Ríos Atelier', 'Web premium + IA', 'ec', 'won', 'hot', 4800, 4800, 'paid', 3],
    ['Liam Bennett', 'Bennett & Co. Realty', 'Website + AI (complete system)', 'ca', 'won', 'hot', 7200, 3600, 'partial', 6],
    ['Sofía Andrade', 'Clínica Dermalux', 'Web premium + IA', 'ec', 'proposal_sent', 'hot', 5200, 0, 'unpaid', 2],
    ['Charlotte Moreau', 'Maison Moreau Wines', 'Premium web design', 'ca', 'proposal_sent', 'warm', 6400, 0, 'unpaid', 4],
    ['Mateo Salvador', 'Hacienda San Mateo', 'Landing de lujo', 'ec', 'qualified', 'warm', 3200, 0, 'unpaid', 5],
    ['Olivia Chen', 'Northlight Wellness', 'AI automation (chatbots & agents)', 'ca', 'qualified', 'hot', 5900, 0, 'unpaid', 1],
    ['Isabella Ponce', 'Joyería Ponce', 'E-commerce de lujo', 'ec', 'contacted', 'warm', 4100, 0, 'unpaid', 7],
    ['Noah Williams', 'Williams Yacht Charters', 'Premium web design', 'ca', 'contacted', 'warm', 8800, 0, 'unpaid', 8],
    ['Camila Herrera', 'Estudio Herrera Arquitectos', 'Web premium + IA', 'ec', 'new', 'hot', 0, 0, 'unpaid', 0],
    ['Ethan Clarke', 'Clarke Private Wealth', 'Website + AI (complete system)', 'ca', 'new', 'warm', 0, 0, 'unpaid', 1],
    ['Lucía Montalvo', 'Café Montalvo', 'Landing de lujo', 'ec', 'new', 'cold', 0, 0, 'unpaid', 2],
    ['Amelia Scott', 'Scott Fine Interiors', 'Premium web design', 'ca', 'won', 'warm', 5500, 5500, 'paid', 21],
    ['Diego Cordero', 'Cordero Legal', 'Web premium + IA', 'ec', 'won', 'warm', 3900, 1950, 'deposit', 14],
    ['Harper Lewis', 'Lewis Boutique Hotel', 'AI automation (chatbots & agents)', 'ca', 'lost', 'cold', 4200, 0, 'unpaid', 30]
  ];
  var leads = people.map(function (p, i) {
    var slug = p[1].toLowerCase().replace(/[^a-z]+/g, '');
    return {
      id: uid(i + 1), name: p[0], company: p[1], service: p[2], plan: p[2], country: p[3],
      status: p[4], priority: p[5], deal_value: p[6], amount_paid: p[7], payment_status: p[8],
      currency: p[3] === 'ca' ? 'CAD' : 'USD', email: 'hola@' + slug + (p[3] === 'ca' ? '.ca' : '.ec'),
      phone: p[3] === 'ca' ? '+1 416 555 01' + (10 + i) : '+593 99 555 01' + (10 + i),
      created_at: iso(p[9]), updated_at: iso(Math.max(0, p[9] - 1)),
      source_page: p[3] === 'ca' ? 'https://www.pittahaya.com/en/contact.html' : 'https://www.pittahaya.com/contacto.html',
      message: 'Buscamos una presencia digital a la altura de nuestra marca: elegante, rápida y que convierta.',
      project_stage: p[4] === 'won' ? ['design', 'review', 'launch', 'delivered'][i % 4] : null,
      next_followup: p[4] === 'contacted' ? ymd(0) : null, payment_due: p[8] === 'partial' || p[8] === 'deposit' ? ymd(-5) : null,
      followups_sent: Math.min(3, Math.floor(p[9] / 3)), autofollow: true, last_followup_at: p[9] >= 2 ? iso(Math.floor(p[9] / 2)) : null,
      tax_amount: 0, withholding: 0
    };
  });

  var byCountry = function (c) { return leads.filter(function (l) { return l.country === c; }); };
  var sum = function (a, k) { return a.reduce(function (s, l) { return s + (Number(l[k]) || 0); }, 0); };
  function countryRow(c) {
    var L = byCountry(c), rev = sum(L, 'amount_paid'), won = L.filter(function (l) { return l.status === 'won'; });
    var exp = c === 'ec' ? 2140 : 3380, threshold = c === 'ec' ? 20000 : 30000;
    var r12 = rev + (c === 'ec' ? 9200 : 14800);
    return {
      code: c, name: c === 'ec' ? 'Ecuador' : 'Canadá', flag: c === 'ec' ? '🇪🇨' : '🇨🇦', currency: c === 'ec' ? 'USD' : 'CAD',
      taxName: c === 'ec' ? 'IVA' : 'GST/HST', threshold: threshold, rolling12Revenue: r12, yearRevenue: r12 - 2100,
      thresholdRemaining: Math.max(0, threshold - r12), thresholdPct: Math.round(r12 / threshold * 100),
      zone: r12 / threshold > .8 ? 'warning' : 'safe', registered: false,
      revenueCollected: rev, revenueThisMonth: Math.round(rev * .6), pipelineValue: sum(L.filter(function (l) { return ['qualified', 'proposal_sent', 'contacted'].indexOf(l.status) > -1; }), 'deal_value'),
      outstanding: sum(won, 'deal_value') - sum(won, 'amount_paid'), taxCollected: 0, taxPaid: 0,
      expenses: exp, directCosts: Math.round(exp * .45), operatingCosts: Math.round(exp * .55),
      grossProfit: rev - Math.round(exp * .45), netProfit: rev - exp, profit: rev - exp
    };
  }
  var expenses = [
    ['Hosting Vercel Pro', 'software', 'operating', 'ca', 26], ['Licencias de diseño', 'software', 'operating', 'ec', 59],
    ['Fotografía de producto', 'freelance', 'direct', 'ec', 480], ['Copywriter bilingüe', 'freelance', 'direct', 'ca', 750],
    ['Ads Meta — lanzamiento', 'marketing', 'operating', 'ec', 320], ['Dominio + correo', 'software', 'operating', 'ca', 38],
    ['API de IA', 'software', 'direct', 'ca', 94], ['Coworking', 'office', 'operating', 'ec', 180]
  ].map(function (e, i) {
    return { id: uid(900 + i), label: e[0], category: e[1], cost_type: e[2], country: e[3], amount: e[4], currency: e[3] === 'ca' ? 'CAD' : 'USD', expense_date: ymd(i * 3), recurring: i % 3 === 0 };
  });
  var invoices = leads.filter(function (l) { return l.amount_paid > 0; }).map(function (l, i) {
    return { id: uid(800 + i), number: (l.country === 'ca' ? 'CA-' : 'EC-') + String(1041 + i), doc_type: 'factura', country: l.country, currency: l.currency, client_name: l.name, client_company: l.company, lead_id: l.id, issue_date: ymd(3 + i * 4), total: l.deal_value, amount_paid: l.amount_paid };
  });

  function months(c) {
    var names = ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'], base = c === 'ec' ? 2600 : 3900;
    return names.map(function (n, i) {
      var rev = Math.round(base * (0.7 + i * 0.16 + (i % 2 ? .08 : 0))), exp = Math.round(rev * (0.38 - i * .02));
      return { month: n, label: n, revenue: rev, expenses: exp, profit: rev - exp };
    });
  }
  function counts(k) { var o = {}; leads.forEach(function (l) { o[l[k]] = (o[l[k]] || 0) + 1; }); return o; }

  function metrics() {
    var won = leads.filter(function (l) { return l.status === 'won'; }).length;
    return {
      total: leads.length, newThisWeek: leads.filter(function (l) { return now - new Date(l.created_at) < 7 * DAY; }).length,
      hot: leads.filter(function (l) { return l.priority === 'hot'; }).length,
      conversionRate: Math.round(won / leads.length * 100), topService: 'Web premium + IA',
      statusCounts: counts('status'), serviceCounts: counts('service'), priorityCounts: counts('priority'),
      pnl: { byCategory: { software: 217, freelance: 1230, marketing: 320, office: 180 } }
    };
  }
  function autopilotStats() {
    var up = leads.filter(function (l) { return ['won', 'lost'].indexOf(l.status) < 0 && l.followups_sent < 3; }).map(function (l, i) {
      var due = new Date(new Date(l.created_at).getTime() + [2, 5, 9][l.followups_sent] * DAY);
      return { id: l.id, name: l.name, email: l.email, country: l.country, step: l.followups_sent + 1, totalSteps: 3, dueAt: due.toISOString(), overdue: due < now, paused: !l.autofollow };
    });
    var perDay = []; for (var d = 13; d >= 0; d--) perDay.push({ date: ymd(d), count: [1, 0, 2, 3, 1, 4, 2, 0, 3, 5, 2, 4, 3, 6][13 - d] });
    var recent = leads.filter(function (l) { return l.last_followup_at; }).map(function (l) { return { id: l.id, name: l.name, email: l.email, country: l.country, step: Math.max(1, l.followups_sent), at: l.last_followup_at }; });
    return { ok: true, enabled: true, stats: { enrolled: up.filter(function (u) { return !u.paused; }).length, sentTotal: 36, sentThisWeek: 18, dueNow: up.filter(function (u) { return u.overdue; }).length, completed: 9, optedOut: 1 }, upcoming: up, recent: recent, perDay: perDay };
  }
  function leadDetail(id) {
    var l = leads.filter(function (x) { return x.id === id; })[0];
    if (!l) return null;
    return {
      lead: l,
      notes: [{ id: uid(700), author: 'Admin', content: 'Le encantó la propuesta visual. Quiere chatbot bilingüe para reservas.', created_at: iso(1) },
              { id: uid(701), author: 'Admin', content: 'Llamada de descubrimiento: busca estética editorial, tonos cálidos.', created_at: iso(3) }],
      tasks: [{ id: uid(710), title: '💬 WhatsApp · Confirmar recepción de propuesta', due_date: ymd(0), completed: false },
              { id: uid(711), title: '✉️ Email · Enviar caso de éxito similar', due_date: ymd(-2), completed: false },
              { id: uid(712), title: '📞 Llamada de cierre', due_date: ymd(-5), completed: true }]
    };
  }

  function respond(params, method, body) {
    var a = params.action;
    if (method !== 'GET') {
      // Escrituras simuladas (no tocan la base real).
      if (a === 'lead' && method === 'PATCH' && body) leads.forEach(function (l) { if (l.id === params.id) Object.keys(body).forEach(function (k) { l[k] = body[k]; }); });
      if (a === 'lead-autofollow') leads.forEach(function (l) { if (l.id === (params.id || body.id)) l.autofollow = body.autofollow !== false; });
      if (a === 'run-followups') return { ok: true, enabled: true, sent: 2, considered: 11, details: [] };
      if (a === 'autopilot') return { enabled: true };
      return { ok: true, demo: true };
    }
    switch (a) {
      case 'metrics': return metrics();
      case 'leads': {
        var r = leads.slice(), q = (params.search || '').toLowerCase();
        if (params.status) r = r.filter(function (l) { return l.status === params.status; });
        if (params.priority) r = r.filter(function (l) { return l.priority === params.priority; });
        if (q) r = r.filter(function (l) { return (l.name + l.company + l.email).toLowerCase().indexOf(q) > -1; });
        return { leads: r, total: r.length };
      }
      case 'lead': return leadDetail(params.id);
      case 'agenda': {
        var d = function (n) { var x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
        var L = function (i) { var l = leads[i % leads.length]; return { id: l.id, name: l.name, company: l.company, phone: l.phone, country: l.country, service: l.service }; };
        return {
          upcoming: [
            { id: 'dm1', lead_id: L(0).id, title: '📅 Reunión: hoy · 15:00', due_date: d(0), lead: L(0) },
            { id: 'dm2', lead_id: L(1).id, title: '📅 Reunión: mañana · 10:00', due_date: d(1), lead: L(1) },
            { id: 'dm3', lead_id: L(2).id, title: '📅 Reunión: viernes · 09:30', due_date: d(3), lead: L(2) }
          ],
          cancelled: [{ id: 'dm4', lead_id: L(3).id, title: '❌ Cancelada — Reunión: jueves · 16:00', due_date: d(2), completed_at: new Date().toISOString(), lead: L(3) }]
        };
      }
      case 'reminders':
        return {
          receivables: leads.filter(function (l) { return l.status === 'won' && l.deal_value > l.amount_paid; }).map(function (l, i) { return { id: l.id, name: l.name, company: l.company, service: l.service, country: l.country, currency: l.currency, pending: l.deal_value - l.amount_paid, deal_value: l.deal_value, payment_due: i ? l.payment_due : null, overdueDays: i ? 0 : 4, agingDays: 12 }; }),
          followups: leads.filter(function (l) { return l.next_followup; }).map(function (l, i) { return { id: l.id, name: l.name, service: l.service, country: l.country, next_followup: l.next_followup, overdueDays: i }; })
        };
      case 'fiscal': return { countries: [countryRow('ec'), countryRow('ca')] };
      case 'monthly': return { countries: ['ec', 'ca'].map(function (c) { var r = countryRow(c); return { code: c, name: r.name, flag: r.flag, currency: r.currency, months: months(c) }; }) };
      case 'fiscal-period': {
        var c = countryRow(params.country || 'ec');
        return { country: c.code, name: c.name, flag: c.flag, currency: c.currency, taxName: c.taxName, registered: false, revenue: c.revenueCollected, expenses: c.expenses, profit: c.profit, taxCollected: 0, taxPaid: 0, netTax: 0, withholding: 0, invoices: invoices.filter(function (i) { return i.country === c.code; }).length };
      }
      case 'invoices': return { invoices: params.lead_id ? invoices.filter(function (i) { return i.lead_id === params.lead_id; }) : (params.country ? invoices.filter(function (i) { return i.country === params.country; }) : invoices) };
      case 'expenses': return { expenses: expenses };
      case 'recurring': return { recurring: [] };
      case 'autopilot': return { enabled: true };
      case 'autopilot-stats': return autopilotStats();
      case 'files':
        return { files: [
          { path: params.lead_id + '/1__contract__Contrato-de-servicios.pdf', name: 'Contrato-de-servicios.pdf', category: 'contract', uploaded_at: iso(4), size: 284000 },
          { path: params.lead_id + '/2__proposal__Propuesta-Pittahaya.pdf', name: 'Propuesta-Pittahaya.pdf', category: 'proposal', uploaded_at: iso(6), size: 1930000 },
          { path: params.lead_id + '/3__invoice__Factura-EC-1041.pdf', name: 'Factura-EC-1041.pdf', category: 'invoice', uploaded_at: iso(2), size: 118000 },
          { path: params.lead_id + '/4__other__Moodboard.png', name: 'Moodboard.png', category: 'other', uploaded_at: iso(5), size: 3420000 }
        ] };
      case 'ai-followup': {
        var LD = leadDetail(params.id); if (!LD) return null; var L = LD.lead, en = L.country === 'ca', fn = L.name.split(' ')[0];
        return { aiEnabled: true, plan: { source: 'ai', urgency: 'high', language: en ? 'en' : 'es',
          nextAction: en ? 'Close the proposal this week' : 'Cerrar la propuesta esta semana',
          reasoning: en ? 'High-intent lead, proposal viewed twice, budget confirmed — momentum is now.' : 'Lead de alta intención: vio la propuesta dos veces y confirmó presupuesto. El momento es ahora.',
          cadence: [
            { day: 0, channel: 'whatsapp', goal: en ? 'Confirm they reviewed it' : 'Confirmar que la revisó', message: en ? 'Hi ' + fn + ', did you get a chance to review the proposal? Happy to walk you through it in 10 minutes.' : 'Hola ' + fn + ', ¿pudiste revisar la propuesta? Con gusto te la explico en 10 minutos.' },
            { day: 2, channel: 'email', goal: en ? 'Add value' : 'Aportar valor', message: en ? 'Sharing a similar luxury project we launched — results speak for themselves.' : 'Te comparto un proyecto de lujo similar que lanzamos; los resultados hablan solos.' },
            { day: 5, channel: 'call', goal: en ? 'Close' : 'Cerrar', message: en ? 'Quick call to lock the start date and kickoff.' : 'Llamada breve para fijar fecha de inicio y arranque.' }
          ] } };
      }
      case 'settings': return { settings: {} };
      case 'whoami': return { role: 'admin' };
      default: return {};
    }
  }

  window.CRM_DEMO = {
    // Leads REALES que entran mientras grabas: se mezclan con los ficticios.
    since: function () { try { return Number(localStorage.getItem('crm_demo_since')) || Date.now(); } catch (e) { return Date.now(); } },
    isDemoId: function (id) { return /^00000000-0000-4000-8000-/.test(String(id || '')); },
    addLive: function (list) {
      var added = [];
      (list || []).forEach(function (r) {
        if (leads.some(function (l) { return l.id === r.id; })) return;
        var l = Object.assign({ status: 'new', priority: 'hot', deal_value: 0, amount_paid: 0, payment_status: 'unpaid', followups_sent: 0, autofollow: true }, r, { live: true });
        l.currency = l.currency || (l.country === 'ca' ? 'CAD' : 'USD');
        leads.unshift(l); added.push(l);
      });
      return added;
    },
    isOn: function () { try { return localStorage.getItem('crm_demo') === '1'; } catch (e) { return false; } },
    set: function (on) { try { localStorage.setItem('crm_demo', on ? '1' : '0'); if (on) localStorage.setItem('crm_demo_since', String(Date.now() - 10 * 60000)); } catch (e) {} },
    respond: function (params, method, body) {
      return new Promise(function (res) { setTimeout(function () { res(JSON.parse(JSON.stringify(respond(params, method || 'GET', body || {}) || {}))); }, 120); });
    }
  };
})();
