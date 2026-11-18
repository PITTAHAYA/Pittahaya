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
const addTask = (leadId, title) =>
  sb("lead_tasks", { method: "POST", body: { lead_id: leadId, title: title.slice(0, 300), due_date: null } });

const digits = (v) => String(v || "").replace(/\D/g, "");
const samePhone = (a, b) => { const x = digits(a), y = digits(b); return x.length >= 7 && y.length >= 7 && x.slice(-10) === y.slice(-10); };

// Busca el lead más reciente por correo o teléfono.
const findLead = async (phone, email) => {
  if (isEmail(email)) {
    const byMail = await sb(`leads?select=id,name,email,phone,company,status&email=ilike.${encodeURIComponent(email)}&order=created_at.desc&limit=1`);
    if (byMail && byMail[0]) return byMail[0];
  }
  if (digits(phone).length >= 7) {
    const recent = await sb("leads?select=id,name,email,phone,company,status&phone=not.is.null&order=created_at.desc&limit=500");
    const hit = (recent || []).find((l) => samePhone(l.phone, phone));
    if (hit) return hit;
  }
  return null;
};

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const sendCancelEmail = async (lead, info) => {
  if (!process.env.RESEND_API_KEY) return;
  const to = process.env.LEAD_TO_EMAIL || "jfmcorp@jfmcorporation.com";
  const from = process.env.LEAD_FROM_EMAIL || "Pittahaya <hola@jfmcorporation.com>";
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pittahaya.com"}/crm/lead.html?id=${encodeURIComponent(lead.id)}`;
  const row = (k, v) => v ? `<tr><td style="padding:6px 0;color:#6b7280;width:140px">${k}</td><td style="padding:6px 0;color:#111;font-weight:600">${esc(v)}</td></tr>` : "";
  const html = `<div style="background:#f3f4f6;padding:24px;font-family:Arial,sans-serif"><div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#b91c1c;color:#fff;padding:16px 22px;font-size:17px;font-weight:700">❌ Reunión cancelada por llamada</div>
    <div style="padding:20px 22px"><table style="width:100%;font-size:14px;border-collapse:collapse">
    ${row("Cliente", lead.name)}${row("Empresa", lead.company)}${row("Teléfono", lead.phone || info.phone)}${row("Correo", lead.email)}
    ${row("Reunión", info.meeting)}${row("Motivo", info.reason)}${row("Nueva fecha", info.newTime)}</table>
    <a href="${url}" style="display:inline-block;margin-top:16px;background:#111;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">Abrir en el CRM</a></div></div></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: `❌ Reunión cancelada — ${lead.name || info.phone || "cliente"}`, html })
  }).catch(() => {});
};

// ===== Cancelar (o reprogramar) una reunión =====
const handleCancel = async (res, body) => {
  const phone = cleanText(body.phone, 40);
  const email = cleanText(body.email, 200);
  if (!phone && !isEmail(email)) return sendJson(res, 422, { ok: false, error: "phone_or_email_required" });

  const reason = cleanText(body.reason || body.cancel_reason, 300);
  const newTime = cleanText(body.new_time || body.reschedule_time, 120);
  const name = cleanText(body.name || body.caller_name, 100);

  let lead = await findLead(phone, email);
  let created = false;
  if (!lead) {
    // No existe: lo creamos para que la cancelación no se pierda.
    const saved = await insertLead({
      name: name || "Cliente (cancelación)", email: isEmail(email) ? email : "", phone: phone || null,
      company: cleanText(body.company, 200) || "—", service: "Llamada IA", plan: "Llamada IA",
      message: "Llamó para cancelar una reunión, pero no estaba registrado en el CRM.",
      source_page: "voice-agent (llamada IA)", source_demo: cleanText(body.call_id, 200) || null,
      status: "contacted", priority: "cold", ip_address: null, user_agent: "pittahaya-voice-agent",
      utm_source: "voice-agent", utm_medium: "phone", utm_campaign: null
    });
    lead = { id: saved?.id, name, email, phone, company: cleanText(body.company, 200) };
    created = true;
  }
  if (!lead || !lead.id) return sendJson(res, 500, { ok: false, error: "save_failed" });

  // Marca como canceladas las reuniones pendientes.
  const tasks = await sb(`lead_tasks?select=id,title,completed&lead_id=eq.${encodeURIComponent(lead.id)}&completed=eq.false`);
  const meetings = (tasks || []).filter((t) => /reuni[oó]n|meeting|📅/i.test(t.title) && !/^❌/.test(t.title));
  const now = new Date().toISOString();
  for (const t of meetings) {
    await sb(`lead_tasks?id=eq.${encodeURIComponent(t.id)}`, {
      method: "PATCH", prefer: "return=minimal",
      body: { title: `❌ Cancelada — ${t.title.replace(/^📅\s*/, "")}`.slice(0, 300), completed: true, completed_at: now }
    });
  }
  const meetingLabel = meetings.map((t) => t.title.replace(/^📅\s*(Reuni[oó]n|Meeting)?:?\s*/i, "")).join(", ") || cleanText(body.meeting_time, 120) || "";

  const note = [
    "❌ Reunión cancelada por llamada (Recepcionista IA)",
    meetingLabel && `Reunión: ${meetingLabel}`,
    reason && `Motivo: ${reason}`,
    newTime ? `Pidió nueva fecha: ${newTime}` : "No pidió nueva fecha.",
    created && "El cliente no estaba en el CRM; se creó su ficha."
  ].filter(Boolean).join("\n");
  await addNote(lead.id, note);
  if (newTime) await addTask(lead.id, `📅 Reunión: ${newTime}`);

  await sendCancelEmail(lead, { phone, reason, newTime, meeting: meetingLabel });
  return sendJson(res, 200, { ok: true, id: lead.id, found: !created, cancelled: meetings.length, rescheduled: Boolean(newTime) });
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
  const call = raw && typeof raw.call === "object" && raw.call ? raw.call : {};
  const body = raw && typeof raw.args === "object" && raw.args ? { ...raw.args } : { ...raw };
  if (!body.call_id) body.call_id = call.call_id;
  if (!body.phone) body.phone = call.from_number;
  if (!body.transcript && typeof call.transcript === "string") body.transcript = call.transcript;
  if (typeof body.privacy_consent === "string") body.privacy_consent = /^(true|yes|s[ií])$/i.test(body.privacy_consent);
  if (typeof body.send_confirmation === "string") body.send_confirmation = !/^(false|no)$/i.test(body.send_confirmation);

  // Acción: la función de Retell "cancel_meeting", ?action=cancel o body.action.
  let action = String(body.action || "").toLowerCase();
  try { action = action || new URL(req.url, "http://x").searchParams.get("action") || ""; } catch {}
  if (/cancel/.test(action) || /cancel/i.test(String(raw.name || ""))) {
    try { return await handleCancel(res, body); }
    catch (error) {
      console.error("Voice cancel failed", { code: error.message, details: error.details });
      return sendJson(res, 500, { ok: false, error: "cancel_failed" });
    }
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

  try {
    const saved = await insertLead(lead);
    const id = saved?.id || null;
    // Si agendó una reunión, queda como tarea visible en su ficha.
    const wantsMeeting = /meeting|reuni/i.test(String(body.next_action || body.call_reason || "")) || body.preferred_time;
    if (id && wantsMeeting) {
      await addTask(id, `📅 Reunión: ${cleanText(body.preferred_time, 120) || "por confirmar"}`).catch(() => {});
    }
    await Promise.allSettled([
      sendAdminNotification(lead, id),
      body.send_confirmation === false ? Promise.resolve() : sendLeadConfirmation(lead)
    ]);
    return sendJson(res, 200, { ok: true, id });
  } catch (error) {
    console.error("Voice lead failed", { code: error.message, status: error.status });
    return sendJson(res, 500, { ok: false, error: "save_failed" });
  }
};
