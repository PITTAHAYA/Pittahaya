// Entrada de leads para el agente de voz con IA (recepcionista).
// Servidor a servidor: el agente envía un POST con
//   Authorization: Bearer <VOICE_AGENT_SECRET>
// Guarda el lead en la misma tabla `leads` del CRM y envía los mismos correos
// que el formulario web. No usa Turnstile: la clave secreta reemplaza esa
// verificación, así que nunca debe exponerse en el navegador.
const { timingSafeEqual } = require("crypto");
const {
  cleanText, cleanMessage, isEmail, sendJson, getClientIp, parseBody,
  insertLead, sendAdminNotification, sendLeadConfirmation, responseHeaders
} = require("./submit-lead.js")._shared;

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map();
const MAX_FAILS = 10;
const fails = new Map();

const tooMany = (map, key, max) => {
  const now = Date.now();
  const list = (map.get(key) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  map.set(key, list);
  return list.length > max;
};

// Limpia la clave: espacios, saltos de línea y comillas que se cuelan al pegarla.
const clean = (v) => String(v || "").trim().replace(/^["']|["']$/g, "").trim();

const secretOk = (req) => {
  const secret = clean(process.env.VOICE_AGENT_SECRET);
  if (secret.length < 24) return false; // sin clave fuerte configurada, se rechaza todo
  const h = req.headers || {};
  // Acepta "Authorization: Bearer <clave>", "Authorization: <clave>",
  // "X-API-Key: <clave>" o "X-Voice-Secret: <clave>".
  // Los espacios "raros" (espacio fino, invisible, no separable) llegan como
  // bytes no ASCII: se convierten en separador y se toma la última palabra.
  const lastToken = (v) => String(v || "").replace(/[^\x21-\x7E]+/g, " ").trim().split(" ").pop();
  const candidates = [
    lastToken(h.authorization),
    clean(h.authorization).replace(/^Bearer\s+/i, ""),
    clean(h["x-api-key"]),
    clean(h["x-voice-secret"])
  ];
  const b = Buffer.from(secret);
  return candidates.some((given) => {
    const a = Buffer.from(clean(given));
    return a.length === b.length && timingSafeEqual(a, b);
  });
};

const PRIORITIES = ["hot", "warm", "cold"];
const { parseWhen, norm } = require("../lib/voice-when.js");
const TZ = process.env.BUSINESS_TZ || "America/Vancouver";

// ===== Supabase REST mínimo (misma clave de servicio que insertLead) =====
const sbBase = () => String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const sbKey = () => process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sb = async (path, opts = {}) => {
  const r = await fetch(`${sbBase()}/rest/v1/${path}`, {
    method: opts.method || "GET",
    headers: {
      apikey: sbKey(), Authorization: `Bearer ${sbKey()}`, "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation"
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const text = await r.text();
  if (!r.ok) { const e = new Error("supabase_" + r.status); e.details = text.slice(0, 300); throw e; }
  try { return JSON.parse(text || "null"); } catch { return null; }
};
const addNote = (leadId, content) =>
  sb("lead_notes", { method: "POST", body: { lead_id: leadId, content: content.slice(0, 2000), author: "Recepcionista IA" } });
const addTask = (leadId, title, due) =>
  sb("lead_tasks", { method: "POST", body: { lead_id: leadId, title: title.slice(0, 300), due_date: due || null } });

// ===== Comparar clientes: teléfono, correo y nombre =====
const digits = (v) => String(v || "").replace(/\D/g, "");
const samePhone = (a, b) => { const x = digits(a), y = digits(b); return x.length >= 7 && y.length >= 7 && x.slice(-10) === y.slice(-10); };
const nameTokens = (v) => norm(v).replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
const nameScore = (a, b) => {
  const A = nameTokens(a), B = nameTokens(b);
  if (!A.length || !B.length) return 0;
  const shared = A.filter((w) => B.includes(w)).length;
  return shared ? (shared >= 2 || A.length === 1 || B.length === 1 ? 2 : 1) : -1; // -1 = nombres distintos
};

// Busca al cliente: correo exacto > teléfono (+ nombre para desempatar) > nombre completo.
const findLead = async ({ phone, email, name }) => {
  const cols = "id,name,email,phone,company,status,created_at";
  if (isEmail(email)) {
    const r = await sb(`leads?select=${cols}&email=ilike.${encodeURIComponent(email)}&order=created_at.desc&limit=5`);
    if (r && r.length) return { lead: r.sort((x, y) => nameScore(name, y.name) - nameScore(name, x.name))[0], by: "email" };
  }
  const recent = (await sb(`leads?select=${cols}&order=created_at.desc&limit=1000`)) || [];
  if (digits(phone).length >= 7) {
    const byPhone = recent.filter((l) => samePhone(l.phone, phone));
    if (byPhone.length) {
      byPhone.sort((x, y) => nameScore(name, y.name) - nameScore(name, x.name));
      const best = byPhone[0];
      return { lead: best, by: "phone", nameMismatch: name ? nameScore(name, best.name) < 0 : false };
    }
  }
  if (nameTokens(name).length >= 2) {
    const byName = recent.filter((l) => nameScore(name, l.name) === 2 && nameTokens(l.name).length >= 2);
    if (byName.length === 1) return { lead: byName[0], by: "name" };
  }
  return null;
};

// ===== Avisos: correo + Telegram (mismo bot que el chatbot) =====
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const crmLink = (id) => `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pittahaya.com"}/crm/lead.html?id=${encodeURIComponent(id || "")}`;

const telegram = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3900), disable_web_page_preview: true })
    });
    if (!r.ok) console.warn("telegram_failed", r.status);
  } catch (e) { console.warn("telegram_error", e.message); }
};

const sendMail = async (subject, color, heading, rows, leadId) => {
  if (!process.env.RESEND_API_KEY) return;
  const to = process.env.LEAD_TO_EMAIL || "jfmcorp@jfmcorporation.com";
  const from = process.env.LEAD_FROM_EMAIL || "Pittahaya <hola@jfmcorporation.com>";
  const row = ([k, v]) => v ? `<tr><td style="padding:6px 0;color:#6b7280;width:140px;vertical-align:top">${k}</td><td style="padding:6px 0;color:#111;font-weight:600">${esc(v)}</td></tr>` : "";
  const html = `<div style="background:#f3f4f6;padding:24px;font-family:Arial,sans-serif"><div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:${color};color:#fff;padding:16px 22px;font-size:17px;font-weight:700">${heading}</div>
    <div style="padding:20px 22px"><table style="width:100%;font-size:14px;border-collapse:collapse">${rows.map(row).join("")}</table>
    <a href="${crmLink(leadId)}" style="display:inline-block;margin-top:16px;background:#111;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">Abrir en el CRM</a></div></div></div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html })
    });
    if (!r.ok) console.warn("resend_failed", r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.warn("resend_error", e.message); }
};

const fmtWhen = (w, raw) => {
  if (!w) return raw || "por confirmar";
  const d = new Date(w.date + "T12:00:00Z");
  const day = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(d);
  return `${day}${w.time ? " · " + w.time : ""}`;
};

// ===== Reunión: tarea en la agenda con fecha real =====
const scheduleMeeting = async (leadId, rawTime) => {
  const w = parseWhen(rawTime, { tz: TZ });
  const label = fmtWhen(w, cleanText(rawTime, 120));
  await addTask(leadId, `📅 Reunión: ${label}${w && rawTime ? ` (dijo: "${cleanText(rawTime, 80)}")` : ""}`, w ? w.date : null);
  // También como próximo seguimiento, para que salga en "Seguimientos" ese día.
  if (w) await sb(`leads?id=eq.${encodeURIComponent(leadId)}`, { method: "PATCH", prefer: "return=minimal", body: { next_followup: w.date } }).catch(() => {});
  return { w, label };
};

const isCancelIntent = (raw, body) => {
  const fields = [body.action, raw.name, body.call_reason, body.next_action, body.intent].map((v) => norm(v)).join(" ");
  if (/cancel|anular|reprogram|reschedul/.test(fields)) return true;
  const text = norm(`${body.summary || ""} ${body.message || ""}`);
  return /(cancel(ar|o|a|led|ation)|anular|reprogramar|reschedule)\b.*(reunion|cita|meeting|appointment|llamada)|(reunion|cita|meeting|appointment).*(cancel|anul)/.test(text)
    && !/(agend|book|schedul)(o|ar|ed)? (una|a) (nueva|new)/.test(text);
};

// ===== Cancelar (o reprogramar) =====
const handleCancel = async (res, body) => {
  const phone = cleanText(body.phone, 40);
  const email = cleanText(body.email, 200);
  const name = cleanText(body.name || body.caller_name, 100);
  if (!phone && !isEmail(email) && !name) return sendJson(res, 422, { ok: false, error: "phone_email_or_name_required" });

  const reason = cleanText(body.reason || body.cancel_reason, 300);
  const newTime = cleanText(body.new_time || body.reschedule_time || (/reprogram|reschedul/.test(norm(body.next_action)) ? body.preferred_time : ""), 120);

  const match = await findLead({ phone, email, name });
  let lead = match && match.lead;
  let created = false;
  if (!lead) {
    const saved = await insertLead({
      name: name || "Cliente (cancelación)", email: isEmail(email) ? email : "", phone: phone || null,
      company: cleanText(body.company, 200) || "—", service: "Llamada IA", plan: "Llamada IA",
      message: "Llamó para cancelar una reunión, pero no estaba registrado en el CRM.",
      source_page: "voice-agent (llamada IA)", source_demo: cleanText(body.call_id, 200) || null,
      status: "contacted", priority: "cold", ip_address: null, user_agent: "pittahaya-voice-agent",
      utm_source: "voice-agent", utm_medium: "phone", utm_campaign: null
    });
    lead = { id: saved && saved.id, name, email, phone, company: cleanText(body.company, 200) };
    created = true;
  }
  if (!lead || !lead.id) return sendJson(res, 500, { ok: false, error: "save_failed" });

  const tasks = await sb(`lead_tasks?select=id,title,completed,due_date&lead_id=eq.${encodeURIComponent(lead.id)}&completed=eq.false`);
  const meetings = (tasks || []).filter((t) => /reuni[oó]n|meeting|📅/i.test(t.title) && !/^❌/.test(t.title));
  const now = new Date().toISOString();
  for (const t of meetings) {
    await sb(`lead_tasks?id=eq.${encodeURIComponent(t.id)}`, {
      method: "PATCH", prefer: "return=minimal",
      body: { title: `❌ Cancelada — ${t.title.replace(/^📅\s*/, "")}`.slice(0, 300), completed: true, completed_at: now }
    });
  }
  const meetingLabel = meetings.map((t) => t.title.replace(/^📅\s*(Reuni[oó]n|Meeting)?:?\s*/i, "").replace(/\s*\(dijo:.*\)$/, "")).join(", ");

  let next = null;
  if (newTime) next = await scheduleMeeting(lead.id, newTime);
  else await sb(`leads?id=eq.${encodeURIComponent(lead.id)}`, { method: "PATCH", prefer: "return=minimal", body: { next_followup: null } }).catch(() => {});

  const note = [
    newTime ? "🔁 Reunión reprogramada por llamada (Recepcionista IA)" : "❌ Reunión cancelada por llamada (Recepcionista IA)",
    meetingLabel ? `Reunión: ${meetingLabel}` : "No tenía una reunión pendiente registrada.",
    reason && `Motivo: ${reason}`,
    next ? `Nueva fecha: ${next.label}` : "No pidió nueva fecha.",
    match && match.by === "phone" && match.nameMismatch && `⚠️ Llamó desde el número de ${lead.name} pero dijo llamarse ${name}.`,
    created && "El cliente no estaba en el CRM; se creó su ficha."
  ].filter(Boolean).join("\n");
  await addNote(lead.id, note);

  const title = newTime ? "🔁 Reunión reprogramada" : "❌ Reunión cancelada";
  const who = lead.name || name || phone;
  await Promise.allSettled([
    sendMail(`${title} — ${who}`, newTime ? "#1d4ed8" : "#b91c1c", `${title} por llamada`,
      [["Cliente", lead.name || name], ["Empresa", lead.company], ["Teléfono", lead.phone || phone], ["Correo", lead.email],
       ["Reunión", meetingLabel], ["Motivo", reason], ["Nueva fecha", next && next.label]], lead.id),
    telegram(`${title}\n👤 ${who}${lead.company && lead.company !== "—" ? " · " + lead.company : ""}\n📞 ${lead.phone || phone || "—"}` +
      `${meetingLabel ? `\n📅 Era: ${meetingLabel}` : ""}${reason ? `\n💬 Motivo: ${reason}` : ""}${next ? `\n🆕 Nueva: ${next.label}` : ""}\n\n${crmLink(lead.id)}`)
  ]);
  return sendJson(res, 200, { ok: true, id: lead.id, found: !created, matched_by: match ? match.by : null, cancelled: meetings.length, rescheduled: Boolean(next) });
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const ip = getClientIp(req);
  if (tooMany(hits, ip, MAX_PER_WINDOW)) {
    return sendJson(res, 429, { ok: false, error: "rate_limited" });
  }
  if (!secretOk(req)) {
    if (tooMany(fails, ip, MAX_FAILS)) return sendJson(res, 429, { ok: false, error: "rate_limited" });
    return sendJson(res, 401, { ok: false, error: "unauthorized" });
  }

  let raw;
  try {
    raw = await parseBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: "invalid_body" });
  }
  // Retell envía { name, args: {...}, call: {...} }; también aceptamos campos sueltos.
  raw = raw || {};
  const call = typeof raw.call === "object" && raw.call ? raw.call : {};
  const body = typeof raw.args === "object" && raw.args ? { ...raw.args } : { ...raw };
  if (!body.call_id) body.call_id = call.call_id;
  if (!body.phone) body.phone = call.from_number;
  if (!body.transcript && typeof call.transcript === "string") body.transcript = call.transcript;
  if (typeof body.privacy_consent === "string") body.privacy_consent = /^(true|yes|s[ií])$/i.test(body.privacy_consent);
  if (typeof body.send_confirmation === "string") body.send_confirmation = !/^(false|no)$/i.test(body.send_confirmation);
  try { body.action = body.action || new URL(req.url, "http://x").searchParams.get("action") || ""; } catch {}

  try {
    if (isCancelIntent(raw, body)) return await handleCancel(res, body);
  } catch (error) {
    console.error("Voice cancel failed", { code: error.message, details: error.details });
    return sendJson(res, 500, { ok: false, error: "cancel_failed" });
  }

  const name = cleanText(body.name || body.caller_name, 100);
  const phone = cleanText(body.phone, 40);
  const email = cleanText(body.email, 200);
  if (!name || (!phone && !isEmail(email))) {
    return sendJson(res, 422, { ok: false, error: "name_and_phone_or_email_required" });
  }

  const lang = String(body.language || "es").toLowerCase().startsWith("en") ? "en" : "es";
  const extra = [body.preferred_time && `Horario preferido: ${body.preferred_time}`, body.next_action && `Siguiente paso: ${body.next_action}`].filter(Boolean).join("\n");
  const summary = cleanMessage([body.summary || body.message, extra].filter(Boolean).join("\n"));
  const transcript = cleanMessage(body.transcript);
  const message = [summary, transcript && `— Transcripción —\n${transcript}`].filter(Boolean).join("\n\n").slice(0, 2000)
    || (lang === "en" ? "Lead from AI phone call" : "Lead de llamada con IA");
  const service = cleanText(body.service || body.project_type, 120) || (lang === "en" ? "AI phone call" : "Llamada IA");
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "warm";
  const wantsMeeting = /meeting|reuni|cita|appointment/i.test(`${body.next_action || ""} ${body.call_reason || ""}`) || Boolean(body.preferred_time);

  try {
    // ¿Ya es cliente? Entonces se suma a su ficha en vez de crear otro lead.
    const match = await findLead({ phone, email, name }).catch(() => null);
    if (match && !(match.by === "phone" && match.nameMismatch)) {
      const lead = match.lead;
      await addNote(lead.id, ["📞 Nueva llamada (Recepcionista IA)", summary].filter(Boolean).join("\n"));
      const fill = {};
      if (!lead.email && isEmail(email)) fill.email = email;
      if ((!lead.company || lead.company === "—") && body.company) fill.company = cleanText(body.company, 200);
      if (lead.status === "lost") fill.status = "contacted";
      if (Object.keys(fill).length) await sb(`leads?id=eq.${encodeURIComponent(lead.id)}`, { method: "PATCH", prefer: "return=minimal", body: fill }).catch(() => {});
      const mtg = wantsMeeting ? await scheduleMeeting(lead.id, body.preferred_time) : null;
      await Promise.allSettled([
        sendMail(`📞 Volvió a llamar — ${lead.name}`, "#111827", "📞 Cliente existente volvió a llamar",
          [["Cliente", lead.name], ["Empresa", lead.company], ["Teléfono", lead.phone || phone], ["Resumen", summary], ["Reunión", mtg && mtg.label]], lead.id),
        telegram(`📞 ${lead.name} volvió a llamar${mtg ? `\n📅 Reunión: ${mtg.label}` : ""}\n${summary ? "💬 " + summary.slice(0, 500) + "\n" : ""}\n${crmLink(lead.id)}`)
      ]);
      return sendJson(res, 200, { ok: true, id: lead.id, existing: true, meeting: mtg ? mtg.label : null });
    }

    const lead = {
      name,
      email: isEmail(email) ? email : "",
      phone: phone || null,
      company: cleanText(body.company, 200) || "—",
      service,
      plan: service,
      message,
      // El /en/ hace que la confirmación al cliente salga en inglés.
      source_page: lang === "en" ? "voice-agent /en/ (llamada IA)" : "voice-agent (llamada IA)",
      source_demo: cleanText(body.call_id, 200) || null,
      status: "new",
      priority,
      ip_address: ip,
      user_agent: "pittahaya-voice-agent",
      utm_source: "voice-agent",
      utm_medium: "phone",
      utm_campaign: null,
      // Consentimiento solo si el agente lo pidió explícitamente en la llamada.
      privacy_consent: body.privacy_consent === true,
      consent_at: body.privacy_consent === true ? new Date().toISOString() : null
    };
    const saved = await insertLead(lead);
    const id = (saved && saved.id) || null;
    const mtg = id && wantsMeeting ? await scheduleMeeting(id, body.preferred_time).catch(() => null) : null;
    await Promise.allSettled([
      sendAdminNotification(lead, id),
      body.send_confirmation === false ? Promise.resolve() : sendLeadConfirmation(lead),
      telegram(`🆕 Nuevo lead por llamada\n👤 ${name}${lead.company !== "—" ? " · " + lead.company : ""}\n📞 ${phone || "—"}${lead.email ? "\n✉️ " + lead.email : ""}\n🧩 ${service}` +
        `${mtg ? `\n📅 Reunión: ${mtg.label}` : ""}${summary ? "\n💬 " + summary.slice(0, 500) : ""}\n\n${crmLink(id)}`)
    ]);
    return sendJson(res, 200, { ok: true, id, existing: false, meeting: mtg ? mtg.label : null });
  } catch (error) {
    console.error("Voice lead failed", { code: error.message, status: error.status, details: error.details });
    return sendJson(res, 500, { ok: false, error: "save_failed" });
  }
};

module.exports._test = { findLead, isCancelIntent, nameScore };
