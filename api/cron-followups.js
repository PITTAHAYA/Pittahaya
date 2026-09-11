// api/cron-followups.js
// ============================================================
// Corre el piloto automático de seguimiento. Lo dispara Vercel Cron
// (ver vercel.json → crons) una vez al día. También se puede llamar a mano
// con el header Authorization: Bearer <CRON_SECRET>.
//
// Seguridad: exige CRON_SECRET. Vercel lo envía solo cuando la variable
// CRON_SECRET existe en el proyecto. Sin CRON_SECRET NO envía nada (evita
// que alguien dispare correos públicamente).
// ============================================================

const { runAutoFollowups } = require("../lib/followup");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Aún no configurado: no enviamos nada, pero respondemos OK para no romper el cron.
    return res.status(200).json({ ok: true, skipped: true, reason: "CRON_SECRET no configurado — el auto-envío está en pausa." });
  }

  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${secret}`) {
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
