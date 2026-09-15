/* ATLAS · la secuencia de sectores y la hora de cada oficina (CSP-safe) */
(function () {
  "use strict";

  var doc = document;
  var isEnglish = /^en\b/i.test(doc.documentElement.lang || "");
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ── cuatro sectores, una escena por tramo de scroll ── */
  var seq = doc.querySelector("[data-ax-seq]");
  if (seq) {
    var frames = [].slice.call(seq.querySelectorAll(".ax-seq__frame"));
    var items = [].slice.call(seq.querySelectorAll(".ax-seq__index li"));
    var cap = seq.querySelector(".ax-seq__cap");
    var sN = seq.querySelector("[data-ax-n]");
    var sW = seq.querySelector("[data-ax-word]");
    var sS = seq.querySelector("[data-ax-sub]");
    var sGo = seq.querySelector("[data-ax-go]");
    var cur = -1, pend = 0;
    seq.style.setProperty("--n", frames.length);

    var paint = function () {
      pend = 0;
      var travel = Math.max(1, seq.offsetHeight - innerHeight);
      var p = clamp(-seq.getBoundingClientRect().top / travel, 0, 0.9999);
      var i = Math.floor(p * frames.length);
      if (i === cur) return;
      cur = i;
      frames.forEach(function (f, n) {
        f.classList.toggle("is-on", n === i);
        f.classList.toggle("is-past", n < i);
      });
      items.forEach(function (li, n) { li.classList.toggle("is-on", n === i); });
      var f = frames[i];
      cap.classList.remove("is-in");
      void cap.offsetWidth;
      sN.textContent = f.getAttribute("data-n") + " / " + String(frames.length).padStart(2, "0") + " · " + f.getAttribute("data-verb");
      sW.textContent = f.getAttribute("data-word");
      sS.textContent = f.getAttribute("data-sub");
      if (sGo) sGo.setAttribute("href", f.getAttribute("data-href"));
      cap.classList.add("is-in");
    };
    var ask = function () { if (!pend) pend = requestAnimationFrame(paint); };
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", ask, { passive: true });
    paint();
  }

  /* ── la hora de cada oficina, y si está abierta ahora ── */
  var offices = [].slice.call(doc.querySelectorAll("[data-tz]"));
  if (offices.length && window.Intl) {
    var tick = function () {
      var now = new Date();
      offices.forEach(function (li) {
        var tz = li.getAttribute("data-tz");
        var parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(now);
        var get = function (type) { for (var k = 0; k < parts.length; k++) if (parts[k].type === type) return parts[k].value; return ""; };
        var hour = parseInt(get("hour"), 10) % 24;
        var weekend = get("weekday") === "Sat" || get("weekday") === "Sun";
        var open = !weekend && hour >= 8 && hour < 18;
        var clock = li.querySelector("[data-clock]");
        if (clock) {
          clock.textContent = String(hour).padStart(2, "0") + ":" + get("minute");
          clock.setAttribute("datetime", now.toISOString());
        }
        var status = li.querySelector("[data-status]");
        if (status) status.textContent = open ? (isEnglish ? "Open now" : "Abierta ahora") : (isEnglish ? "Closed" : "Cerrada");
        li.classList.toggle("is-open", open);
      });
    };
    tick();
    setInterval(tick, 15000);
  }
})();
