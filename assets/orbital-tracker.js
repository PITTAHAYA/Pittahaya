/* ═══════════════════════════════════════════════════════════
   ORBITAL · rastreador de constelación
   Propagación circular kepleriana simplificada, proyección 3D→2D.
   Sin dependencias. CSP-safe.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var stage = document.querySelector("[data-tracker]");
  if (!stage) return;

  var canvas = stage.querySelector("canvas");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  var locale = isEnglish ? "en-US" : "es";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── salidas laterales ── */
  var outId = document.querySelector("[data-sat-id]");
  var outState = document.querySelector("[data-sat-state]");
  var outAlt = document.querySelector("[data-sat-alt]");
  var outVel = document.querySelector("[data-sat-vel]");
  var outLat = document.querySelector("[data-sat-lat]");
  var outTemp = document.querySelector("[data-sat-temp]");
  var outPwr = document.querySelector("[data-sat-pwr]");
  var outLoadBar = document.querySelector("[data-sat-load]");
  var outLoadTxt = document.querySelector("[data-sat-loadtxt]");
  var hudCount = document.querySelector("[data-hud-count]");
  var hudSun = document.querySelector("[data-hud-sun]");
  var hudTime = document.querySelector("[data-hud-time]");

  /* ── constelación: 3 planos, 8 nodos cada uno ── */
  /* `alt` es el radio de DIBUJO (radios terrestres) — separado de la altitud
     física `altKm`, para que la constelación sea legible en pantalla sin
     mentir en la telemetría. Los km coinciden con el manifiesto de misiones. */
  var PLANES = [
    { name: "ECU-1", inc: 0.06, raan: 0.0, color: "#6fd6e8", alt: 1.34, altKm: 520 },
    { name: "POL-1", inc: 1.52, raan: 1.05, color: "#ff9d4d", alt: 1.44, altKm: 610 },
    { name: "SSO-1", inc: 1.72, raan: 2.30, color: "#8b93ff", alt: 1.28, altKm: 480 }
  ];
  var RE = 6371; /* radio terrestre medio, km */
  var PER_PLANE = 8;

  var sats = [];
  PLANES.forEach(function (plane, pi) {
    for (var k = 0; k < PER_PLANE; k++) {
      sats.push({
        plane: plane,
        pi: pi,
        idx: k,
        id: plane.name + "-" + String(k + 1).padStart(2, "0"),
        nu0: (k / PER_PLANE) * Math.PI * 2 + pi * 0.31,
        /* velocidad angular ∝ 1/T, con T = 2π√(r³/μ): la órbita más baja va más rápido */
        rate: 0.00058 / Math.pow((6371 + plane.altKm) / 6371, 1.5),
        load: 0.42 + ((pi * 7 + k * 13) % 47) / 100,
        x: 0, y: 0, z: 0, sx: 0, sy: 0, lit: true, behind: false
      });
    }
  });

  /* ── estaciones terrestres (lat, lon en grados) ── */
  var STATIONS = [
    { name: "Quito", lat: -0.18, lon: -78.47 },
    { name: isEnglish ? "Singapore" : "Singapur", lat: 1.35, lon: 103.82 },
    { name: "Nairobi", lat: -1.29, lon: 36.82 },
    { name: "Svalbard", lat: 78.22, lon: 15.65 }
  ];

  var selected = 0;
  var hover = -1;
  var t = 0;
  var dpr = 1;
  var W = 0, H = 0, cx = 0, cy = 0, R = 0;
  var SUN = { x: -0.82, y: 0.34, z: 0.46 };

  function resize() {
    var rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.235;
    return true;
  }

  /* posición 3D de un satélite en el instante `time` */
  function propagate(s, time) {
    var nu = s.nu0 + time * s.rate;
    var r = s.plane.alt;
    var ci = Math.cos(s.plane.inc), si = Math.sin(s.plane.inc);
    var cO = Math.cos(s.plane.raan), sO = Math.sin(s.plane.raan);
    var cn = Math.cos(nu), sn = Math.sin(nu);
    s.x = r * (cO * cn - sO * sn * ci);
    s.y = r * (sO * cn + cO * sn * ci);
    s.z = r * (sn * si);
    /* proyección: cámara sobre el eje +Y, X→derecha, Z→arriba */
    s.sx = cx + s.x * R;
    s.sy = cy - s.z * R;
    s.behind = s.y < 0 && Math.sqrt(s.x * s.x + s.z * s.z) < 1;
    /* iluminación: producto punto con el vector solar */
    var dot = (s.x * SUN.x + s.y * SUN.y + s.z * SUN.z) / r;
    s.lit = dot > -0.28;
    s.nu = nu;
    return s;
  }

  function stationPos(st, time) {
    var lat = st.lat * Math.PI / 180;
    var lon = st.lon * Math.PI / 180 + time * 0.00016;
    var x = Math.cos(lat) * Math.cos(lon);
    var y = Math.cos(lat) * Math.sin(lon);
    var z = Math.sin(lat);
    return { x: x, y: y, z: z, sx: cx + x * R, sy: cy - z * R, front: y >= 0 };
  }

  /* ── dibujo ── */
  function drawEarth(time) {
    /* halo atmosférico */
    var glow = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.24);
    glow.addColorStop(0, "rgba(111,214,232,.20)");
    glow.addColorStop(1, "rgba(111,214,232,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.24, 0, Math.PI * 2); ctx.fill();

    /* disco */
    var disc = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    disc.addColorStop(0, "#0d1a2b");
    disc.addColorStop(0.55, "#080f1a");
    disc.addColorStop(1, "#05080e");
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    /* retícula de meridianos y paralelos, rotando */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.lineWidth = 1;

    /* paralelos */
    for (var la = -60; la <= 60; la += 30) {
      var rad = la * Math.PI / 180;
      var rr = Math.cos(rad) * R;
      var yy = cy - Math.sin(rad) * R;
      ctx.strokeStyle = la === 0 ? "rgba(111,214,232,.30)" : "rgba(180,205,240,.09)";
      ctx.beginPath();
      ctx.ellipse(cx, yy, rr, rr * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    /* meridianos */
    var spin = (time * 0.00016) % (Math.PI * 2);
    for (var m = 0; m < 12; m++) {
      var ang = spin + (m / 12) * Math.PI * 2;
      var w = Math.cos(ang) * R;
      ctx.strokeStyle = "rgba(180,205,240," + (0.04 + Math.abs(Math.sin(ang)) * 0.05).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(w), R, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* terminador día/noche */
    var termShift = SUN.x * R;
    var night = ctx.createLinearGradient(cx + termShift - R * 0.5, cy, cx + termShift + R * 1.1, cy);
    night.addColorStop(0, "rgba(4,6,10,0)");
    night.addColorStop(0.45, "rgba(4,6,10,.55)");
    night.addColorStop(1, "rgba(4,6,10,.88)");
    ctx.fillStyle = night;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();

    /* borde */
    ctx.strokeStyle = "rgba(111,214,232,.34)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  }

  function drawOrbitPath(plane) {
    ctx.strokeStyle = plane.color;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i <= 128; i++) {
      var nu = (i / 128) * Math.PI * 2;
      var r = plane.alt;
      var ci = Math.cos(plane.inc), si = Math.sin(plane.inc);
      var cO = Math.cos(plane.raan), sO = Math.sin(plane.raan);
      var x = r * (cO * Math.cos(nu) - sO * Math.sin(nu) * ci);
      var z = r * (Math.sin(nu) * si);
      var px = cx + x * R, py = cy - z * R;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawStations(time) {
    STATIONS.forEach(function (st) {
      var p = stationPos(st, time);
      if (!p.front) return;
      ctx.fillStyle = "rgba(255,157,77,.9)";
      ctx.beginPath(); ctx.arc(p.sx, p.sy, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,157,77,.3)";
      ctx.beginPath(); ctx.arc(p.sx, p.sy, 5.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(233,239,248,.42)";
      ctx.font = "9px ui-monospace,Menlo,monospace";
      ctx.fillText(st.name.toUpperCase(), p.sx + 9, p.sy + 3);
    });
  }

  function drawLinks(time) {
    var sel = sats[selected];
    if (!sel) return;
    STATIONS.forEach(function (st) {
      var p = stationPos(st, time);
      if (!p.front) return;
      var dx = sel.x - p.x, dy = sel.y - p.y, dz = sel.z - p.z;
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > 0.95) return;
      var a = (1 - d / 0.95) * 0.65;
      ctx.strokeStyle = "rgba(255,157,77," + a.toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy); ctx.lineTo(sel.sx, sel.sy);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function drawSat(s, i) {
    var isSel = i === selected;
    var isHov = i === hover;
    var alpha = s.behind ? 0.2 : 1;
    var size = isSel ? 4.6 : (isHov ? 3.8 : 2.7);

    if (isSel && !s.behind) {
      ctx.strokeStyle = s.plane.color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(s.sx, s.sy, 11 + Math.sin(t * 0.004) * 2.5, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.16;
      ctx.beginPath(); ctx.arc(s.sx, s.sy, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = alpha;
    if (!s.lit) {
      ctx.strokeStyle = s.plane.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(s.sx, s.sy, size, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = s.plane.color;
      ctx.shadowColor = s.plane.color;
      ctx.shadowBlur = isSel ? 14 : 7;
      ctx.beginPath(); ctx.arc(s.sx, s.sy, size, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    if (isSel || isHov) {
      ctx.fillStyle = "rgba(233,239,248,.9)";
      ctx.font = "9.5px ui-monospace,Menlo,monospace";
      ctx.fillText(s.id, s.sx + 13, s.sy - 8);
    }
  }

  /* ── panel lateral ── */
  var lastPush = -1;
  function pushTelemetry() {
    var s = sats[selected];
    if (!s) return;
    if (outId) outId.textContent = s.id;
    if (outState) {
      var eclipse = !s.lit;
      outState.classList.toggle("is-eclipse", eclipse);
      var label = outState.querySelector("span");
      if (label) label.textContent = eclipse
        ? (isEnglish ? "Eclipse · battery" : "Eclipse · batería")
        : (isEnglish ? "Solar · nominal" : "Solar · nominal");
    }
    /* velocidad orbital circular: v = √(μ/r), μ = 398 600 km³/s² */
    var altKm = s.plane.altKm;
    var velKm = Math.sqrt(398600 / (RE + altKm)).toFixed(2);
    if (outAlt) outAlt.textContent = altKm.toLocaleString(locale) + " km";
    if (outVel) outVel.textContent = velKm + " km/s";
    if (outLat) outLat.textContent = (Math.asin(Math.max(-1, Math.min(1, s.z / s.plane.alt))) * 180 / Math.PI).toFixed(1) + "°";
    if (outTemp) outTemp.textContent = (s.lit ? 41 + (s.idx % 5) : -18 - (s.idx % 7)) + " °C";
    if (outPwr) outPwr.textContent = (s.lit ? (18.4 + (s.idx % 4) * 0.6).toFixed(1) : (0).toFixed(1)) + " kW";
    var load = Math.max(0.08, Math.min(0.99, s.load + Math.sin(t * 0.0009 + s.idx) * 0.09));
    if (outLoadBar) outLoadBar.style.width = (load * 100).toFixed(0) + "%";
    if (outLoadTxt) outLoadTxt.textContent = (load * 100).toFixed(0) + "%";
  }

  function pushHud() {
    var litCount = 0;
    sats.forEach(function (s) { if (s.lit) litCount++; });
    if (hudCount) hudCount.textContent = sats.length + (isEnglish ? " nodes · 3 planes" : " nodos · 3 planos");
    if (hudSun) hudSun.textContent = isEnglish
      ? litCount + " in sunlight · " + (sats.length - litCount) + " in eclipse"
      : litCount + " en sol · " + (sats.length - litCount) + " en eclipse";
    if (hudTime) {
      var d = new Date();
      hudTime.textContent = String(d.getUTCHours()).padStart(2, "0") + ":" +
        String(d.getUTCMinutes()).padStart(2, "0") + ":" +
        String(d.getUTCSeconds()).padStart(2, "0") + " UTC";
    }
  }

  /* ── bucle ── */
  var running = true;
  function frame() {
    if (!running) return;
    if (W > 0 && H > 0) {
      ctx.clearRect(0, 0, W, H);
      sats.forEach(function (s) { propagate(s, t); });

      /* órbitas detrás */
      PLANES.forEach(drawOrbitPath);
      /* satélites ocultos por la Tierra */
      sats.forEach(function (s, i) { if (s.behind) drawSat(s, i); });
      drawEarth(t);
      drawStations(t);
      drawLinks(t);
      sats.forEach(function (s, i) { if (!s.behind) drawSat(s, i); });

      /* el refresco del panel va contra el reloj real: con "reduced motion"
         `t` no avanza, pero la telemetría debe seguir siendo legible */
      var now = performance.now();
      if (lastPush < 0 || now - lastPush > 260) { lastPush = now; pushTelemetry(); pushHud(); }
      t += reduce ? 0 : 16;
    }
    requestAnimationFrame(frame);
  }

  /* ── interacción ── */
  function pick(ev) {
    var rect = canvas.getBoundingClientRect();
    var mx = ev.clientX - rect.left;
    var my = ev.clientY - rect.top;
    var best = -1, bestD = 22;
    sats.forEach(function (s, i) {
      var d = Math.hypot(s.sx - mx, s.sy - my);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  canvas.addEventListener("pointermove", function (ev) {
    var i = pick(ev);
    hover = i;
    canvas.style.cursor = i >= 0 ? "pointer" : "default";
  });
  canvas.addEventListener("pointerleave", function () { hover = -1; });
  canvas.addEventListener("click", function (ev) {
    var i = pick(ev);
    if (i >= 0) { selected = i; lastPush = -1; }
  });
  canvas.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
      ev.preventDefault(); selected = (selected + 1) % sats.length; lastPush = -1;
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
      ev.preventDefault(); selected = (selected - 1 + sats.length) % sats.length; lastPush = -1;
    }
  });
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", isEnglish
    ? "Constellation tracker. Use the arrow keys to move through the nodes."
    : "Rastreador de constelación. Usa las flechas para recorrer los nodos.");

  window.addEventListener("resize", resize, { passive: true });

  /* pausa cuando no está a la vista */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { running = e.isIntersecting; if (running) frame(); });
    }, { threshold: 0.02 }).observe(stage);
  }
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) frame();
  });

  if (!resize()) {
    var tries = 0;
    var wait = setInterval(function () {
      if (resize() || ++tries > 40) clearInterval(wait);
    }, 120);
  }
  frame();
})();
