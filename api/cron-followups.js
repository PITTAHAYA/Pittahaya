// api/cron-followups.js
// ============================================================
// Corre el piloto automático de seguimiento. Lo dispara Vercel Cron
// (ver vercel.json → crons) una vez al día. También se puede llamar a mano
// con el header Authorization: Bearer <CRON_SECRET>.
//
// Seguridad: exige CRON_SECRET. Vercel lo envía solo cuando la variable
// CRON_SECRET existe en el proyecto. Sin CRON_SECRET NO envía nada (evita
// que alguien dispare correos públicamente). La comparación del secreto es
// tiempo-constante (crypto.timingSafeEqual) para no filtrar información por
// tiempos de respuesta.
// ============================================================

const crypto = require("crypto");
const { runAutoFollowups } = require("../lib/followup");

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

// Compara dos cadenas en tiempo constante (evita timing attacks).
function safeEqual(a, b) {
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ba.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ba, bb); } catch { return false; }
}

module.exports = async function handler(req, res) {
  Object.entries(responseHeaders).forEach(([k, v]) => res.setHeader(k, v));

  // Vercel Cron usa GET; permitimos también POST para pruebas manuales.
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Aún no configurado: no enviamos nada, pero respondemos OK para no romper el cron.
    return res.status(200).json({ ok: true, skipped: true, reason: "CRON_SECRET no configurado — el auto-envío está en pausa." });
  }

  const header = req.headers.authorization || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !safeEqual(provided, secret)) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }

  try {
    const result = await runAutoFollowups({});
    return res.status(200).json(result);
  } catch (err) {
    console.error("cron-followups error", String(err && err.message || err));
    return res.status(500).json({ ok: false, error: String(err && err.message || err).slice(0, 300) });
  }
};
