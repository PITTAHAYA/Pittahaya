// Convierte lo que dijo el cliente ("el viernes a las 10", "tomorrow at 3 PM",
// "Nov 18, 2026 at 3 PM PT") en una fecha YYYY-MM-DD y una hora HH:MM, en la
// zona horaria del negocio. Si no se entiende, devuelve null y la reunión queda
// "por confirmar" (nunca se inventa una fecha).

const MONTHS = {
  ene: 0, enero: 0, jan: 0, january: 0, feb: 1, febrero: 1, february: 1, mar: 2, marzo: 2, march: 2,
  abr: 3, abril: 3, apr: 3, april: 3, may: 4, mayo: 4, jun: 5, junio: 5, june: 5, jul: 6, julio: 6, july: 6,
  ago: 7, agosto: 7, aug: 7, august: 7, sep: 8, sept: 8, septiembre: 8, september: 8, oct: 9, octubre: 9, october: 9,
  nov: 10, noviembre: 10, november: 10, dic: 11, diciembre: 11, dec: 11, december: 11
};
const WEEKDAYS = {
  domingo: 0, sunday: 0, lunes: 1, monday: 1, martes: 2, tuesday: 2, miercoles: 3, wednesday: 3,
  jueves: 4, thursday: 4, viernes: 5, friday: 5, sabado: 6, saturday: 6
};

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Fecha de "hoy" en la zona del negocio.
const todayIn = (tz, now = new Date()) => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [y, m, d] = p.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

const parseTime = (t) => {
  // "10:00 am", "3 pm", "3 p. m.", "15:30", "a las 3 de la tarde"
  // Solo cuenta como hora un número con ":mm", con am/pm, o justo después de
  // "a las" / "at" / "@" (así el "18" de "Nov 18" no se confunde con las 18:00).
  const re = /(a la|a las|at|@)?\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?|am|pm)?(?![\d/])/g;
  let m = null;
  for (const x of t.matchAll(re)) {
    const prev = t[x.index - 1];
    if (prev && /\d/.test(prev)) continue;
    if (x[1] || x[3] || x[4]) { m = x; break; }
  }
  if (!m) return null;
  let h = +m[2]; const min = m[3] ? +m[3] : 0;
  const ap = (m[4] || "").replace(/[\s.]/g, "");
  const tarde = /de la (tarde|noche)|in the (afternoon|evening)|tonight/.test(t);
  if (h > 23 || min > 59) return null;
  if ((ap === "pm" || tarde) && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

function parseWhen(text, { tz = "America/Vancouver", now = new Date() } = {}) {
  const t = norm(text);
  if (!t.trim()) return null;
  const today = todayIn(tz, now);
  let date = null;

  const iso = t.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (iso) date = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));

  if (!date) {
    // "nov 18, 2026" / "18 de noviembre" / "november 18th"
    const monthRe = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");
    const a = t.match(new RegExp(`\\b(${monthRe})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(20\\d{2}))?`));
    const b = t.match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${monthRe})(?:\\s+(?:de\\s+)?(20\\d{2}))?`));
    let mo, day, yr;
    if (a) { mo = MONTHS[a[1]]; day = +a[2]; yr = a[3] && +a[3]; }
    else if (b) { mo = MONTHS[b[2]]; day = +b[1]; yr = b[3] && +b[3]; }
    if (mo != null && day >= 1 && day <= 31) {
      yr = yr || today.getUTCFullYear();
      date = new Date(Date.UTC(yr, mo, day));
      if (!a?.[3] && !b?.[3] && date < today) date = new Date(Date.UTC(yr + 1, mo, day));
    }
  }

  if (!date) {
    if (/pasado manana|day after tomorrow/.test(t)) date = addDays(today, 2);
    else if (/\btomorrow\b/.test(t) || (/\bmanana\b/.test(t) && !/(la|en la|de la|por la|esta) manana/.test(t))) date = addDays(today, 1);
    else if (/\b(hoy|today|tonight|esta (tarde|noche))\b/.test(t)) date = today;
  }

  if (!date) {
    const wd = Object.keys(WEEKDAYS).find((w) => new RegExp(`\\b${w}\\b`).test(t));
    if (wd != null) {
      let diff = (WEEKDAYS[wd] - today.getUTCDay() + 7) % 7;
      if (diff === 0) diff = 7;
      if (/\b(proximo|next|siguiente)\b/.test(t) && diff < 7) diff += 0;
      date = addDays(today, diff);
    }
  }

  if (!date) return null;
  return { date: ymd(date), time: parseTime(t) };
}

module.exports = { parseWhen, norm };
