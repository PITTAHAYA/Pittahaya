/* AURELIA · la luz de su hora, el plano de la villa y el mar (CSP-safe) */
(function () {
  "use strict";

  var d = document, root = d.documentElement;
  var en = /^en\b/i.test(root.lang || "");
  var T = function (es, e) { return en ? e : es; };
  var pad = function (n) { return String(n).padStart(2, "0"); };

  /* ── 1. la luz sigue la hora de quien visita ───────────── */
  var LIGHTS = [
    { id: "alba", name: T("Luz de alba", "Dawn light"), line: T("la casa despierta en luz fría.", "the house wakes in cool light.") },
    { id: "dia", name: T("Luz de día", "Daylight"), line: T("la casa a pleno sol.", "the house in full sun.") },
    { id: "oro", name: T("Hora dorada", "Golden hour"), line: T("la casa a la luz de oro.", "the house in golden light.") },
    { id: "noche", name: T("Noche", "Night"), line: T("la casa con las luces encendidas.", "the house with its lights on.") }
  ];
  var byHour = function (h) { return h >= 5 && h < 9 ? 0 : h >= 9 && h < 17 ? 1 : h >= 17 && h < 20 ? 2 : 3; };
  var now = new Date();
  var hh = pad(now.getHours()) + ":" + pad(now.getMinutes());
  var li = byHour(now.getHours());
  var chip = d.querySelector("[data-aw-hour]");
  var chipT = d.querySelector("[data-aw-hour-t]");
  var line = d.querySelector("[data-aw-light]");
  var setLight = function (i, own) {
    li = i;
    var L = LIGHTS[i];
    root.setAttribute("data-light", L.id);
    if (chipT) chipT.textContent = (own ? hh + " · " : "") + L.name;
    if (chip) chip.setAttribute("aria-label", T("Luz de la página: ", "Page light: ") + L.name + T(". Toque para cambiar.", ". Tap to change."));
    if (line) {
      line.replaceChildren();
      var b = d.createElement("b");
      b.textContent = own ? T("Su hora, ", "Your hour, ") + hh : L.name;
      line.append(b, d.createTextNode(" — " + L.line));
    }
  };
  setLight(li, true);
  if (chip) chip.addEventListener("click", function () { setLight((li + 1) % LIGHTS.length, false); });

  /* ── 2. el plano de la villa: cada sección es una estancia ── */
  var plan = d.querySelector("[data-aw-plan]");
  var th = d.querySelector("[data-th]");
  if (plan) {
    var ROOMS = [
      { sel: ".reveal", name: T("Vestíbulo", "Hall"), r: [8, 58, 50, 58] },
      { sel: "[data-ax-tour]", name: T("Galería", "Gallery"), r: [58, 58, 70, 58] },
      { sel: "#coleccion", name: T("Colección", "Collection"), r: [8, 8, 70, 50] },
      { sel: "#representacion", name: T("Biblioteca", "Library"), r: [78, 8, 50, 50] },
      { sel: "[data-ax-land]", name: T("Terraza", "Terrace"), r: [128, 8, 64, 72] },
      { sel: "#espacios", name: T("Mirador", "Lookout"), r: [128, 80, 64, 36] },
      { sel: "#acceso", name: T("Estudio", "Study"), r: [8, 116, 184, 22] }
    ].filter(function (r) { return d.querySelector(r.sel); });
    var NS = "http://www.w3.org/2000/svg";
    var mk = function (tag, attrs) { var e = d.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; };
    var svg = mk("svg", { viewBox: "0 0 216 146", role: "img", "aria-label": T("Plano de Villa Mare Alta", "Plan of Villa Mare Alta") });
    ROOMS.forEach(function (R, i) {
      var g = mk("g", {});
      R.el = mk("rect", { x: R.r[0], y: R.r[1], width: R.r[2], height: R.r[3], class: "room" });
      R.tx = mk("text", { x: R.r[0] + 4, y: R.r[1] + 9, class: "rn" });
      R.tx.textContent = pad(i + 1) + " " + R.name;
      R.el.addEventListener("click", function () {
        var s = d.querySelector(R.sel);
        scrollTo({ top: s.getBoundingClientRect().top + scrollY - 70, behavior: "smooth" });
        plan.classList.remove("open");
      });
      g.append(R.el, R.tx);
      svg.appendChild(g);
    });
    /* el mar, al poniente de la casa */
    svg.appendChild(mk("path", { class: "sea", d: "M200 10 q4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12" }));
    var you = mk("circle", { r: 2.2, class: "you" });
    var ring = mk("circle", { r: 2.2, class: "you-ring" });
    svg.append(ring, you);

    var top = d.createElement("div");
    top.className = "aw-plan__top";
    top.innerHTML = "<span>Villa Mare Alta</span><span>" + T("Planta · 1:500", "Plan · 1:500") + "</span>";
    var nowBox = d.createElement("div");
    nowBox.className = "aw-plan__now";
    var nowN = d.createElement("small"), nowB = d.createElement("b");
    nowBox.append(nowN, nowB);
    var sheet = d.createElement("div");
    sheet.className = "aw-plan__sheet";
    sheet.append(top, svg, nowBox);
    var toggle = d.createElement("button");
    toggle.type = "button";
    toggle.className = "aw-plan__toggle";
    toggle.setAttribute("aria-expanded", "false");
    var tN = d.createElement("small"), tB = d.createElement("b");
    toggle.append(tN, tB);
    toggle.addEventListener("click", function () {
      var o = plan.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(o));
    });
    plan.append(toggle, sheet);

    var cur = -1;
    var pick = function (i) {
      if (i === cur || i < 0) return;
      cur = i;
      var R = ROOMS[i];
      ROOMS.forEach(function (x, n) { x.el.classList.toggle("on", n === i); x.tx.classList.toggle("on", n === i); });
      var cx = R.r[0] + R.r[2] / 2, cy = R.r[1] + R.r[3] / 2 + 3;
      [you, ring].forEach(function (c) { c.setAttribute("cx", cx); c.setAttribute("cy", cy); });
      nowN.textContent = tN.textContent = pad(i + 1);
      nowB.textContent = tB.textContent = R.name;
    };
    var tick = 0;
    var track = function () {
      tick = 0;
      var past = !th || th.getBoundingClientRect().bottom <= innerHeight * 0.6;
      plan.classList.toggle("on", past);
      if (!past) { plan.classList.remove("open"); return; }
      var mid = innerHeight * 0.45, best = -1;
      ROOMS.forEach(function (R, n) {
        var r = d.querySelector(R.sel).getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) best = n;
      });
      if (best < 0) {
        var last = d.querySelector(ROOMS[ROOMS.length - 1].sel).getBoundingClientRect();
        if (last.top < mid) best = ROOMS.length - 1;
      }
      pick(best < 0 ? 0 : best);
    };
    addEventListener("scroll", function () { if (!tick) tick = requestAnimationFrame(track); }, { passive: true });
    addEventListener("resize", track, { passive: true });
    track();
  }

  /* ── 3. el mar, si se pide: ruido filtrado que respira como olas ── */
  var snd = d.querySelector("[data-aw-sound]");
  var AC = window.AudioContext || window.webkitAudioContext;
  if (snd && AC) {
    var ctx = null, master = null;
    var build = function () {
      ctx = new AC();
      var len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var c = 0; c < 2; c++) {
        var data = buf.getChannelData(c), last = 0;
        for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.5; }
      }
      var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
      var swell = ctx.createGain(); swell.gain.value = 0.5;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
      var depth = ctx.createGain(); depth.gain.value = 0.42;
      lfo.connect(depth); depth.connect(swell.gain);
      var lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.07;
      var depth2 = ctx.createGain(); depth2.gain.value = 380;
      lfo2.connect(depth2); depth2.connect(lp.frequency);
      master = ctx.createGain(); master.gain.value = 0;
      src.connect(lp); lp.connect(swell); swell.connect(master); master.connect(ctx.destination);
      src.start(); lfo.start(); lfo2.start();
    };
    snd.addEventListener("click", function () {
      var on = snd.getAttribute("aria-pressed") !== "true";
      if (!ctx) build();
      if (ctx.state === "suspended") ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.22 : 0, ctx.currentTime, on ? 1.2 : 0.4);
      snd.setAttribute("aria-pressed", String(on));
    });
    d.addEventListener("visibilitychange", function () {
      if (!ctx) return;
      if (d.hidden) ctx.suspend(); else if (snd.getAttribute("aria-pressed") === "true") ctx.resume();
    });
  } else if (snd) snd.hidden = true;
})();
