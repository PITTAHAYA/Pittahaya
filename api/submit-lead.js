const RESEND_ENDPOINT = "https://api.resend.com/emails";
const { randomUUID } = require("crypto");
const MAX_BODY_BYTES = 10000;
const MAX_TEXT_LENGTH = 2000;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const recentRequests = new Map();

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

const cleanText = (value, maxLength = 220) =>
  String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const cleanMessage = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").toLowerCase());

const parseJsonSafe = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const normalizeSupabaseUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(?:rest|auth)\/v1$/, "");

const sendJson = (res, status, body) => {
  Object.entries(responseHeaders).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(status).json(body);
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
};

const isSameOrigin = (req) => {
  const origin  = req.headers.origin;
  const referer = req.headers.referer || req.headers.referrer;
  const host    = req.headers.host;

  // Browsers always send Origin OR Referer for non-trivial POSTs.
  // Missing both = curl/scripted request → reject.
  if (!origin && !referer) return false;

  try {
    if (origin)  return new URL(origin).host === host;
    if (referer) return new URL(referer).host === host;
  } catch { return false; }

  return false;
};

const isRateLimited = (ip) => {
  const now = Date.now();
  const requests = (recentRequests.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  requests.push(now);
  recentRequests.set(ip, requests);
  return requests.length > MAX_REQUESTS_PER_WINDOW;
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    if (req.body.length > MAX_BODY_BYTES) throw new Error("payload_too_large");
    try {
      return JSON.parse(req.body);
    } catch {
      return Object.fromEntries(new URLSearchParams(req.body));
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (rawBody.length > MAX_BODY_BYTES) throw new Error("payload_too_large");
  if (!rawBody) return {};

  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) return JSON.parse(rawBody);
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }
  throw new Error("unsupported_content_type");
};

const mapLead = (body, req) => {
  const service = cleanText(body.service || body.servicio || body.plan || body.need, 120);
  const plan = cleanText(body.crm_plan || body.selected_plan || body.package || "", 120);
  const message = cleanMessage(body.message || body.mensaje);

  let priority = "cold";
  if (message.length > 120 || /premium|rediseño|landing|empresa|web/i.test(service)) priority = "warm";
  if (/urgente|cotizar|precio|premium|alta gama|empresa/i.test(message)) priority = "hot";
  if (["cold", "warm", "hot"].includes(body.priority)) priority = body.priority;

  return {
    name: cleanText(body.name || body.nombre, 100),
    email: cleanText(body.email || body.correo, 200),
    phone: cleanText(body.phone || body.telefono, 40) || null,
    company: cleanText(body.company || body.negocio || body.brand, 200),
    service,
    plan,
    message,
    source_page: cleanText(body.source_page || body.source || req.headers.referer, 500),
    source_demo: cleanText(body.source_demo || body.demo, 200) || null,
    status: "new",
    priority,
    ip_address: getClientIp(req),
    user_agent: cleanText(req.headers["user-agent"], 300),
    utm_source: cleanText(body.utm_source, 100) || null,
    utm_medium: cleanText(body.utm_medium, 100) || null,
    utm_campaign: cleanText(body.utm_campaign, 100) || null
  };
};

const insertLead = async (lead) => {
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("missing_supabase_config");
  }

  let endpoint;
  try {
    endpoint = new URL("/rest/v1/leads?select=id", supabaseUrl.replace(/\/$/, ""));
  } catch {
    throw new Error("invalid_supabase_url");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(lead)
  });

  const text = await response.text();
  if (!response.ok) {
    const supabaseError = parseJsonSafe(text) || {};
    const error = new Error("supabase_insert_failed");
    error.status = response.status;
    error.supabaseCode = supabaseError.code || "";
    error.details = String(supabaseError.message || text || "").slice(0, 500);

    if (response.status === 401 || response.status === 403 || error.details.includes("JWT")) {
      error.message = "supabase_auth_failed";
    } else if (error.supabaseCode === "42P01" || error.details.toLowerCase().includes("relation") || error.details.toLowerCase().includes("does not exist")) {
      error.message = "supabase_table_missing";
    } else if (error.supabaseCode === "PGRST204" || error.details.toLowerCase().includes("column")) {
      error.message = "supabase_schema_mismatch";
    }

    console.error("Supabase insert failed", {
      status: error.status,
      code: error.supabaseCode,
      message: error.message,
      details: error.details
    });
    throw error;
  }

  const data = text ? JSON.parse(text) : [];
  return Array.isArray(data) ? data[0] : data;
};

const sendAdminNotification = async (lead, leadId) => {
  if (!process.env.RESEND_API_KEY) return;

  const toEmail = process.env.LEAD_TO_EMAIL || "jfmcorp@jfmcorporation.com";
  const fromEmail = process.env.LEAD_FROM_EMAIL || "Pittahaya <noreply@jfmcorporation.com>";
  const crmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pittahaya.com"}/crm/lead.html?id=${encodeURIComponent(leadId || "")}`;
  const priorityLabel = { hot: "Hot", warm: "Warm", cold: "Cold" }[lead.priority] || "Cold";

  const safe = Object.fromEntries(Object.entries(lead).map(([key, value]) => [key, escapeHtml(value)]));
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#151515">
      <h2 style="margin:0 0 12px;color:#e83487">Nuevo lead guardado en Pittahaya CRM</h2>
      <p><strong>Nombre:</strong> ${safe.name}</p>
      <p><strong>Correo:</strong> <a href="mailto:${safe.email}">${safe.email}</a></p>
      <p><strong>Negocio o marca:</strong> ${safe.company || "—"}</p>
      <p><strong>Servicio:</strong> ${safe.service || "—"}</p>
      <p><strong>Prioridad:</strong> ${escapeHtml(priorityLabel)}</p>
      <p><strong>Fuente:</strong> ${safe.source_page || "—"}</p>
      <p><strong>Mensaje:</strong><br>${escapeHtml(lead.message).replace(/\n/g, "<br>")}</p>
      ${leadId ? `<p><a href="${escapeHtml(crmUrl)}">Ver lead en CRM</a></p>` : ""}
    </div>
  `;

  const text = [
    "Nuevo lead guardado en Pittahaya CRM",
    "",
    `Nombre: ${lead.name}`,
    `Correo: ${lead.email}`,
    `Negocio o marca: ${lead.company || "—"}`,
    `Servicio: ${lead.service || "—"}`,
    `Prioridad: ${priorityLabel}`,
    `Fuente: ${lead.source_page || "—"}`,
    "",
    "Mensaje:",
    lead.message
  ].join("\n");

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
      "User-Agent": "pittahaya-crm-lead-form/1.0"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: lead.email,
      subject: `Nuevo lead CRM de ${lead.name}`,
      html,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Resend notification failed", response.status, errorText.slice(0, 500));
  }
};

// ── Auto-confirmation email sent to the LEAD (the customer) ──────
// Branded, bilingual (ES/EN by source page), reply-to = company inbox so
// any reply lands in Gmail. Never throws — a mail failure must not break
// the lead save or the success response.
const sendLeadConfirmation = async (lead) => {
  if (!process.env.RESEND_API_KEY) return;
  if (!isEmail(lead.email)) return;

  const fromEmail = process.env.LEAD_FROM_EMAIL || "Pittahaya <noreply@jfmcorporation.com>";
  const replyTo   = process.env.LEAD_TO_EMAIL || "jfmcorp@jfmcorporation.com";
  const inEn      = /\/en\//.test(lead.source_page || "");
  const firstName = (lead.name || "").trim().split(/\s+/)[0] || "";
  const safeName  = escapeHtml(firstName);
  const safeService = escapeHtml(lead.service || "");

  const t = inEn ? {
    subject: "We got your message — Pittahaya",
    hi: safeName ? `Hi ${safeName} 👋` : "Hi there 👋",
    p1: "Thanks for reaching out to Pittahaya. We've received your request and a real person on our team will reply within 24 hours.",
    p2: safeService ? `What you told us you need: <strong>${safeService}</strong>.` : "",
    p3: "In the meantime, feel free to reply to this email with anything you'd like to add — it comes straight to us.",
    cta: "While you wait, take a look at our work:",
    ctaLabel: "See our demos",
    ctaUrl: "https://www.pittahaya.com/en/portfolio.html",
    sign: "— The Pittahaya team",
    foot: "Premium websites & AI automation · pittahaya.com"
  } : {
    subject: "Recibimos tu mensaje — Pittahaya",
    hi: safeName ? `¡Hola ${safeName}! 👋` : "¡Hola! 👋",
    p1: "Gracias por escribir a Pittahaya. Recibimos tu solicitud y una persona real de nuestro equipo te responderá en menos de 24 horas.",
    p2: safeService ? `Lo que nos contaste que necesitas: <strong>${safeService}</strong>.` : "",
    p3: "Mientras tanto, puedes responder a este correo con cualquier detalle que quieras agregar — nos llega directo.",
    cta: "Mientras esperas, mira nuestro trabajo:",
    ctaLabel: "Ver nuestros demos",
    ctaUrl: "https://www.pittahaya.com/portafolio.html",
    sign: "— El equipo de Pittahaya",
    foot: "Webs premium y automatización con IA · pittahaya.com"
  };

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#0c0d12;border:1px solid #1e2030;border-radius:14px;overflow:hidden">
      <div style="height:4px;background:linear-gradient(90deg,#e6bf74,#e83487)"></div>
      <div style="padding:28px 26px">
        <h2 style="margin:0 0 14px;font-size:20px;color:#f6efe2">${t.hi}</h2>
        <p style="margin:0 0 14px;line-height:1.6;color:#c7ccd8">${t.p1}</p>
        ${t.p2 ? `<p style="margin:0 0 14px;line-height:1.6;color:#c7ccd8">${t.p2}</p>` : ""}
        <p style="margin:0 0 22px;line-height:1.6;color:#c7ccd8">${t.p3}</p>
        <p style="margin:0 0 10px;line-height:1.6;color:#9aa1b2;font-size:14px">${t.cta}</p>
        <a href="${t.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#e6bf74,#e83487);color:#0a0a0a;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:8px;font-size:14px">${t.ctaLabel}</a>
        <p style="margin:26px 0 0;color:#f6efe2;font-weight:600">${t.sign}</p>
      </div>
      <div style="padding:14px 26px;background:#080910;color:#5f6678;font-size:12px;border-top:1px solid #1e2030">${t.foot}</div>
    </div>
  `;

  const text = [
    t.hi.replace(/[👋]/g, "").trim(),
    "",
    t.p1,
    t.p2 ? t.p2.replace(/<[^>]+>/g, "") : "",
    t.p3,
    "",
    t.sign,
    "pittahaya.com"
  ].filter(Boolean).join("\n");

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
        "User-Agent": "pittahaya-crm-lead-confirm/1.0"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [lead.email],
        reply_to: replyTo,
        subject: t.subject,
        html,
        text
      })
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Resend lead confirmation failed", response.status, errorText.slice(0, 300));
    }
  } catch (err) {
    console.error("Resend lead confirmation error", String(err && err.message || err).slice(0, 200));
  }
};

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    Object.entries(responseHeaders).forEach(([key, value]) => res.setHeader(key, value));
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false, ok: false, error: "Metodo no permitido." });
  }

  if (!isSameOrigin(req)) {
    return sendJson(res, 403, { success: false, ok: false, error: "Origen no autorizado." });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return sendJson(res, 429, { success: false, ok: false, error: "Demasiadas solicitudes. Intenta nuevamente en un minuto." });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendJson(res, 400, { success: false, ok: false, error: "La solicitud no tiene un formato valido." });
  }

  if (cleanText(body.website, 120)) {
    return sendJson(res, 200, { success: true, ok: true, message: "Solicitud recibida." });
  }

  const lead = mapLead(body, req);
  if (!lead.name || !isEmail(lead.email) || !lead.company || !lead.service || !lead.message) {
    return sendJson(res, 422, { success: false, ok: false, error: "Completa todos los campos antes de enviar." });
  }

  try {
    const savedLead = await insertLead(lead);
    const leadId = savedLead?.id || null;
    // Notify you, and auto-confirm to the customer. Both are best-effort and
    // run in parallel; neither can break the lead save (errors are caught).
    await Promise.allSettled([
      sendAdminNotification(lead, leadId),
      sendLeadConfirmation(lead)
    ]);

    return sendJson(res, 200, {
      success: true,
      ok: true,
      id: leadId,
      message: "Solicitud guardada en el CRM. Te responderemos muy pronto."
    });
  } catch (error) {
    // Log full details server-side only; never leak to the client.
    console.error("Lead submission failed", {
      code: error.message,
      status: error.status,
      details: (error.details || "").slice(0, 500)
    });

    // Generic public message — no internal hints, no stack info, no env names.
    return sendJson(res, 500, {
      success: false,
      ok: false,
      error: "No se pudo guardar la solicitud en este momento. Por favor intenta de nuevo en unos minutos."
    });
  }
};
