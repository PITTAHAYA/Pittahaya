// lib/followup.js
// ============================================================
// Piloto automático de seguimiento de leads (auto-envío de la cadencia).
// Compartido por el cron (/api/cron-followups) y el botón admin del CRM
// (/api/crm?action=run-followups). Envía SOLO correos (el canal seguro de
// automatizar); WhatsApp sigue siendo manual desde el CRM.
//
// Diseño seguro:
//  · Solo leads creados en los últimos DAYS_WINDOW días (no reactiva backlog).
//  · Se detiene si el lead es 'won'/'lost' o si autofollow=false.
//  · Un solo correo por lead por corrida (nunca ráfagas).
//  · Interruptor global 'autopilot' en crm_settings (on/off).
//  · Cada correo lleva pie de "responde BAJA/STOP para no recibir más".
// ============================================================

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const { randomUUID } = require("crypto");

const DAYS_WINDOW = 14;          // solo leads recientes
const MAX_PER_RUN = 40;          // tope de envíos por corrida
// Cadencia (solo correo). El día 0 ya lo cubre el correo de confirmación,
// así que el auto-seguimiento empieza al día 2.
const CADENCE_DAYS = [2, 5, 9];

const escapeHtml = (v) => String(v || "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const normalizeSupabaseUrl = (value) =>
  String(value || "").trim().replace(/\/+$/, "").replace(/\/(?:rest|auth)\/v1$/, "");

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").toLowerCase());
const daysAgoIso = (n) => new Date(Date.now() - n * 86400000).toISOString();

// ── Contenido de la cadencia (bilingüe por país del lead) ─────
function buildStep(lead, index) {
  // El idioma sale de la PÁGINA donde se generó el lead (igual que el correo de
  // confirmación): si vino de una URL con /en/ → inglés; si no → español.
  const en = /\/en\//.test(lead.source_page || "");
  const first = String(lead.name || "").trim().split(/\s+/)[0] || (en ? "there" : "");
  const name = escapeHtml(first);
  const svc = escapeHtml(lead.service || (en ? "your project" : "tu proyecto"));
  const site = "https://www.pittahaya.com";

  const steps = en ? [
    { subject: "Following up on your Pittahaya request",
      body: `Hi ${name || "there"}, just checking in on your interest in ${svc}. Do you have 15 minutes this week for a quick call? Happy to answer anything.` },
    { subject: `A quick idea for ${svc}`,
      body: `Hi ${name || "there"}, I put together a couple of ideas for ${svc} and a similar project we did. Want me to send them over?` },
    { subject: "Still here when you're ready",
      body: `Hi ${name || "there"}, no rush at all — I'll leave this here. Whenever you'd like to move forward with ${svc}, just reply and we'll get started.` }
  ] : [
    { subject: "Seguimiento de tu solicitud a Pittahaya",
      body: `Hola ${name || ""}, paso a saludarte por tu interés en ${svc}. ¿Tienes 15 minutos esta semana para una llamada rápida? Con gusto resuelvo cualquier duda.` },
    { subject: `Una idea rápida para ${svc}`,
      body: `Hola ${name || ""}, preparé un par de ideas para ${svc} y un caso parecido que hicimos. ¿Te los comparto?` },
    { subject: "Aquí seguimos cuando quieras",
      body: `Hola ${name || ""}, sin ninguna prisa — lo dejo por aquí. Cuando quieras avanzar con ${svc}, respóndeme y arrancamos.` }
  ];
  const s = steps[index];
  if (!s) return null;

  const optOut = en ? "Reply STOP if you'd rather not receive follow-ups." : "Responde BAJA si prefieres no recibir seguimientos.";
  const sign = en ? "— The Pittahaya team" : "— El equipo de Pittahaya";

  const tagline = en ? "Premium websites & AI automation" : "Webs premium y automatización con IA";
  const html = `
    <div style="background:#f4f2ee;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ece7de;border-radius:16px;overflow:hidden;box-shadow:0 2px 6px rgba(20,14,4,.05)">
        <div style="height:4px;background:linear-gradient(90deg,#e6bf74,#e83487)"></div>
        <div style="padding:32px 32px 10px">
          <p style="margin:0 0 22px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#c9943a;font-weight:700">Pittahaya</p>
          <p style="font-size:15.5px;line-height:1.7;color:#28251f;margin:0 0 22px">${escapeHtml(s.body)}</p>
          <p style="font-size:15px;color:#1a1a1a;font-weight:600;margin:0 0 2px">${sign}</p>
          <p style="font-size:13px;color:#9a8f7d;margin:0 0 26px">${tagline}</p>
        </div>
        <div style="padding:15px 32px;background:#faf7f2;border-top:1px solid #efe9df">
          <a href="${site}" style="color:#c9943a;text-decoration:none;font-size:13px;font-weight:600">pittahaya.com</a>
          <span style="color:#cabfac;font-size:12px"> &nbsp;·&nbsp; </span>
          <span style="color:#b0a690;font-size:12px">${optOut}</span>
        </div>
      </div>
    </div>`;
  const text = [s.body, "", "pittahaya.com", sign, "", optOut].join("\n");
  return { subject: s.subject, html, text };
}

// ── REST helpers (Supabase) ──────────────────────────────────
function supaConfig() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing_supabase_config");
  return { url, key };
}
async function supaGet(path) {
  const { url, key } = supaConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!res.ok) throw new Error(`supabase_get_${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
async function supaPatch(path, body) {
  const { url, key } = supaConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`supabase_patch_${res.status}: ${(await res.text()).slice(0, 200)}`);
  return true;
}

// ¿Está encendido el piloto automático? (crm_settings key 'autopilot')
async function autopilotEnabled() {
  try {
    const rows = await supaGet(`crm_settings?key=eq.autopilot&select=value`);
    const v = rows && rows[0] && rows[0].value;
    // Por defecto ENCENDIDO si no hay registro (el dueño lo pidió activo).
    if (!v) return true;
    return v.enabled !== false;
  } catch { return true; }
}

async function sendEmail(to, subject, html, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("missing_resend_key");
  const from = process.env.LEAD_FROM_EMAIL || "Pittahaya <hola@jfmcorporation.com>";
  const replyTo = process.env.LEAD_TO_EMAIL || "jfmcorp@jfmcorporation.com";
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`, "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(), "User-Agent": "pittahaya-autopilot/1.0"
    },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html, text })
  });
  if (!res.ok) throw new Error(`resend_${res.status}: ${(await res.text()).slice(0, 200)}`);
  return true;
}

// ── El corazón: enviar el siguiente paso a cada lead que toque ──
// force=true ignora la espera de días (día 2/5/9) y manda el siguiente paso
// pendiente ya mismo. Lo usa el botón manual del CRM para probar/demostrar;
// el cron diario SIEMPRE respeta el calendario (force=false).
async function runAutoFollowups({ limit = MAX_PER_RUN, force = false } = {}) {
  const enabled = await autopilotEnabled();
  if (!enabled) return { ok: true, enabled: false, sent: 0, considered: 0, details: [] };

  // Leads recientes, activos e inscritos. Filtramos y ordenamos en JS para
  // tolerar bases sin las columnas nuevas (degrada sin romper).
  let leads;
  try {
    leads = await supaGet(
      `leads?created_at=gte.${encodeURIComponent(daysAgoIso(DAYS_WINDOW))}` +
      `&status=not.in.(won,lost)` +
      `&select=id,name,email,service,country,source_page,status,created_at,followups_sent,autofollow&order=created_at.asc&limit=200`
    );
  } catch (e) {
    return { ok: false, error: String(e.message || e), sent: 0, considered: 0, details: [] };
  }

  const now = Date.now();
  const details = [];
  let sent = 0;

  for (const lead of leads || []) {
    if (sent >= limit) break;
    if (lead.autofollow === false) continue;
    if (!isEmail(lead.email)) continue;
    const idx = Number(lead.followups_sent) || 0;
    if (idx >= CADENCE_DAYS.length) continue;               // ya completó la cadencia
    const dueAt = new Date(lead.created_at).getTime() + CADENCE_DAYS[idx] * 86400000;
    if (!force && now < dueAt) continue;                    // aún no le toca (salvo modo "enviar ya")

    const step = buildStep(lead, idx);
    if (!step) continue;
    try {
      await sendEmail(lead.email, step.subject, step.html, step.text);
      await supaPatch(`leads?id=eq.${lead.id}`, { followups_sent: idx + 1, last_followup_at: new Date().toISOString() });
      sent++;
      details.push({ lead: lead.name, email: lead.email, step: idx + 1, subject: step.subject });
    } catch (e) {
      details.push({ lead: lead.name, email: lead.email, step: idx + 1, error: String(e.message || e).slice(0, 160) });
    }
  }

  return { ok: true, enabled: true, sent, considered: (leads || []).length, details };
}

module.exports = { runAutoFollowups, buildStep, autopilotEnabled, CADENCE_DAYS };
