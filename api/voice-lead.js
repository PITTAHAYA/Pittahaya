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

const secretOk = (req) => {
  const secret = process.env.VOICE_AGENT_SECRET || "";
  if (secret.length < 24) return false; // sin clave fuerte configurada, se rechaza todo
  const auth = String(req.headers.authorization || "");
  const given = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
};

const PRIORITIES = ["hot", "warm", "cold"];

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

  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: "invalid_body" });
  }

  const name = cleanText(body.name, 100);
  const phone = cleanText(body.phone, 40);
  const email = cleanText(body.email, 200);
  if (!name || (!phone && !isEmail(email))) {
    return sendJson(res, 422, { ok: false, error: "name_and_phone_or_email_required" });
  }

  const lang = String(body.language || "es").toLowerCase().startsWith("en") ? "en" : "es";
  const summary = cleanMessage(body.summary || body.message);
  const transcript = cleanMessage(body.transcript);
  const message = [summary, transcript && `— Transcripción —\n${transcript}`].filter(Boolean).join("\n\n").slice(0, 2000)
    || (lang === "en" ? "Lead from AI phone call" : "Lead de llamada con IA");
  const service = cleanText(body.service, 120) || (lang === "en" ? "AI phone call" : "Llamada IA");
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
