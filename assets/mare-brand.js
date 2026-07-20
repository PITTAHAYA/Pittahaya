/* ═══════════════════════════════════════════════════════════
   PITTAHAYA · BRAND IN MOTION — motor de identidad
   Partículas-semilla que convergen en el monograma (muestreado
   del PNG real). Orquestación por scroll. CSP-safe, sin librerías.

   RENDIMIENTO — reglas que no se rompen:
   · El resplandor se pre-renderiza UNA vez por color en un sprite.
     Nunca se usa ctx.shadowBlur dentro del bucle de dibujo: con
     miles de partículas satura la GPU y cuelga el compositor.
   · Un solo bucle rAF global reparte el trabajo entre los campos
     visibles; los no visibles no consumen nada.
   · Presupuesto duro de partículas y tope de densidad de píxel.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MARK_SRC = "assets/pitahaya-mark.png";

  var MAX_PARTICLES = 900;   // presupuesto por campo
  var MAX_DPR = 1.5;         // tope de densidad de píxel
  var TARGET_FPS = 40;       // deja margen al resto del sistema
  var FRAME_MS = 1000 / TARGET_FPS;

  var COLORS = { fruit: "#e0357b", lime: "#9fce3a", ivory: "#f4efe6", champ: "#d9c3a0" };

  /* ── sprites de resplandor: se dibujan una sola vez ───── */
  var spriteCache = {};
  function sprite(hex) {
    if (spriteCache[hex]) return spriteCache[hex];
    var R = 16;                       // radio del sprite en px
    var c = doc.createElement("canvas");
    c.width = c.height = R * 2;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(R, R, 0, R, R, R);
    grad.addColorStop(0, hex);
    grad.addColorStop(0.28, hex);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 1;
    g.fillStyle = grad;
    g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.fill();
    spriteCache[hex] = c;
    return c;
  }

  /* ── muestreo del monograma (una sola vez, cacheado) ──── */
  var markPoints = null;
  var markCallbacks = [];

  function loadMark() {
    var img = new Image();
    img.onload = function () {
      var N = 200;
      var off = doc.createElement("canvas");
      off.width = N; off.height = N;
      var g = off.getContext("2d", { willReadFrequently: true });
      var ratio = Math.min(N / img.width, N / img.height);
      var w = img.width * ratio, h = img.height * ratio;
      g.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
      var data = g.getImageData(0, 0, N, N).data;

      /* primero recogemos todos los candidatos… */
      var all = [];
      for (var y = 0; y < N; y += 3) {
        for (var x = 0; x < N; x += 3) {
          var i = (y * N + x) * 4;
          if (data[i + 3] < 120) continue;
          var r = data[i], gg = data[i + 1], b = data[i + 2];
          all.push({ x: x / N - 0.5, y: y / N - 0.5, c: (gg > r && gg > b) ? "lime" : "fruit" });
        }
      }
      /* …y los recortamos a un presupuesto fijo, muestreando
         de forma uniforme para no deformar la silueta */
      var pts = all;
      if (all.length > MAX_PARTICLES) {
        pts = [];
        var stride = all.length / MAX_PARTICLES;
        for (var k = 0; k < MAX_PARTICLES; k++) pts.push(all[Math.floor(k * stride)]);
      }
      markPoints = pts;
      markCallbacks.forEach(function (cb) { cb(pts); });
      markCallbacks = [];
    };
    img.onerror = function () {
      markPoints = [];
      markCallbacks.forEach(function (cb) { cb([]); });
      markCallbacks = [];
    };
    img.src = MARK_SRC;
  }

  function onMark(cb) {
    if (markPoints) cb(markPoints);
    else markCallbacks.push(cb);
  }

  /* ── registro global de campos + un único bucle rAF ───── */
  var fields = [];
  var looping = false;
  var lastFrame = 0;

  /* Guardián adaptativo: si los frames salen caros, se recorta el
     trabajo y, si aun así no rinde, se congela el sistema en su
     estado final. Ningún equipo debe atascarse por una animación
     decorativa. */
  var quality = 1;        // 1 · 0.6 · 0.35 · 0 (detenido)
  var slowRun = 0;

  function governor(cost) {
    if (cost > 26) {
      if (++slowRun >= 6) {
        slowRun = 0;
        if (quality > 0.6) quality = 0.6;
        else if (quality > 0.35) quality = 0.35;
        else {
          quality = 0;
          for (var i = 0; i < fields.length; i++) fields[i].settle();
          stopLoop();
        }
      }
    } else if (slowRun > 0) { slowRun--; }
  }

  function loop(now) {
    if (!looping) return;
    requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_MS) return;   // limitar fps
    lastFrame = now;
    var t0 = performance.now();
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].visible) fields[i].draw(quality);
    }
    governor(performance.now() - t0);
  }
  function startLoop() {
    if (looping || doc.hidden) return;
    looping = true; lastFrame = 0;
    requestAnimationFrame(loop);
  }
  function stopLoop() { looping = false; }

  function anyVisible() {
    for (var i = 0; i < fields.length; i++) if (fields[i].visible) return true;
    return false;
  }
  function sync() {
    if (!doc.hidden && anyVisible()) startLoop(); else stopLoop();
  }
  doc.addEventListener("visibilitychange", sync);

  /* ── campo de partículas ──────────────────────────────── */
  function Field(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var host = canvas.parentElement;
    var W = 0, H = 0, cx = 0, cy = 0, scale = 1;
    var parts = [];
    var progress = opts.progress || 0;
    var target = progress;
    var pxr = 0, pyr = 0, ptx = 0, pty = 0;
    var t = 0;
    var glowScale = opts.glow || 1;
    var colorMode = opts.color || "brand";
    var self = this;

    this.visible = false;

    function tone(c) {
      if (colorMode === "ivory") return COLORS.ivory;
      if (colorMode === "champ") return COLORS.champ;
      return c === "lime" ? COLORS.lime : COLORS.fruit;
    }

    function build(points) {
      parts = points.map(function (p) {
        var ang = Math.random() * Math.PI * 2;
        var rad = 0.6 + Math.random() * 0.9;
        return {
          hx: p.x, hy: p.y,
          sx: Math.cos(ang) * rad, sy: Math.sin(ang) * rad,
          base: p.c,
          size: 0.55 + Math.random() * 0.9,
          ph: Math.random() * Math.PI * 2,
          spd: 0.4 + Math.random() * 0.8
        };
      });
    }

    function resize() {
      var r = host.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
      scale = Math.min(W, H) * (opts.fit || 0.62);
      return true;
    }

    /* Dibuja el estado final una sola vez y no vuelve a animarse.
       Lo usa el guardián cuando el equipo no da más. */
    this.settle = function () {
      target = opts.progress || target;
      progress = target;
      ptx = pty = pxr = pyr = 0;
      self.draw(1, true);
    };

    /* un frame — sin shadowBlur, solo copias de sprite */
    this.draw = function (quality, force) {
      if (W <= 0 || !parts.length) return;
      var q = force ? 1 : (quality == null ? 1 : quality);
      if (q <= 0) return;
      t += 1;
      progress += (target - progress) * 0.06;
      pxr += (ptx - pxr) * 0.05;
      pyr += (pty - pyr) * 0.05;

      var p = reduce ? target : progress;
      var ease = p * p * (3 - 2 * p);
      var par = opts.parallax || 20;
      var ox = pxr * par, oy = pyr * par;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      /* al bajar la calidad se dibuja 1 de cada N partículas */
      var step = q >= 1 ? 1 : Math.max(1, Math.round(1 / q));
      for (var k = 0; k < parts.length; k += step) {
        var a = parts[k];
        var drift = reduce ? 0 : Math.sin(t * 0.012 * a.spd + a.ph) * 0.012;
        var x = a.sx + (a.hx + drift - a.sx) * ease;
        var y = a.sy + (a.hy + drift * 0.6 - a.sy) * ease;
        var px = cx + x * scale + ox * a.size;
        var py = cy + y * scale + oy * a.size;

        var img = sprite(tone(a.base));
        var d = a.size * glowScale * (2.2 + ease * 2.4);  // diámetro dibujado
        ctx.globalAlpha = 0.22 + ease * 0.55;
        ctx.drawImage(img, px - d / 2, py - d / 2, d, d);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    this.setProgress = function (v) { target = Math.max(0, Math.min(1, v)); };
    this.setColor = function (m) { colorMode = m; };
    this.pointer = function (nx, ny) { ptx = nx; pty = ny; };

    onMark(build);
    if (!resize()) {
      var tries = 0;
      var w = setInterval(function () { if (resize() || ++tries > 40) clearInterval(w); }, 150);
    }
    window.addEventListener("resize", function () { resize(); }, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        e.forEach(function (en) { self.visible = en.isIntersecting; });
        sync();
      }, { threshold: 0.01 }).observe(host);
    } else {
      self.visible = true;
    }

    fields.push(this);
    sync();
  }

  /* ═══════════════ inicialización ═══════════════ */
  loadMark();

  function attachPointer(scopeSel, field) {
    var el = doc.querySelector(scopeSel);
    if (!el || reduce) return;
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      field.pointer((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    }, { passive: true });
    el.addEventListener("pointerleave", function () { field.pointer(0, 0); }, { passive: true });
  }

  var heroCanvas = doc.querySelector("[data-hero-mark]");
  if (heroCanvas) {
    var heroField = new Field(heroCanvas, { progress: 1, glow: 1.15, fit: 0.5, parallax: 30 });
    heroField.setProgress(1);
    attachPointer(".hero", heroField);
  }

  var sparkCanvas = doc.querySelector("[data-spark-mark]");
  var sparkField = null;
  var sparkStage = doc.querySelector("[data-spark-stage]");
  if (sparkCanvas) {
    sparkField = new Field(sparkCanvas, { progress: 0, glow: 1.3, fit: 0.46, parallax: 12 });
  }

  var idCanvas = doc.querySelector("[data-id-mark]");
  if (idCanvas) {
    var idField = new Field(idCanvas, { progress: 1, glow: 1, fit: 0.56, parallax: 16 });
    idField.setProgress(1);
    attachPointer(".id-canvas", idField);
    var idBtns = Array.prototype.slice.call(doc.querySelectorAll("[data-id-mode]"));
    idBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        idBtns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        var mode = b.getAttribute("data-id-mode");
        if (mode === "scatter") { idField.setProgress(0); }
        else if (mode === "brand") { idField.setColor("brand"); idField.setProgress(1); }
        else if (mode === "mono") { idField.setColor("ivory"); idField.setProgress(1); }
        else if (mode === "champ") { idField.setColor("champ"); idField.setProgress(1); }
      });
    });
  }

  var uniCanvas = doc.querySelector("[data-uni-mark]");
  if (uniCanvas) {
    var uniField = new Field(uniCanvas, { progress: 1, glow: 1.4, fit: 0.32, parallax: 18 });
    uniField.setProgress(1);
    attachPointer(".universe", uniField);
  }

  /* ── patrón generativo · coste acotado ────────────────── */
  var patCanvas = doc.querySelector("[data-pattern]");
  if (patCanvas && !reduce) {
    var pg = patCanvas.getContext("2d");
    var ph = patCanvas.parentElement;
    var pw = 0, phh = 0, seeds = [], pt = 0, pvis = false, praf = 0, plast = 0;
    var MAX_SEEDS = 34;   // el enlazado es O(n²): mantenerlo pequeño

    function presize() {
      var r = ph.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      pw = r.width; phh = r.height;
      patCanvas.width = Math.round(pw * dpr); patCanvas.height = Math.round(phh * dpr);
      pg.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(MAX_SEEDS, Math.round(pw * phh / 6400));
      seeds = [];
      for (var i = 0; i < n; i++) {
        seeds.push({ x: Math.random() * pw, y: Math.random() * phh, ph: Math.random() * 6.28, r: 1 + Math.random() * 1.5 });
      }
      return true;
    }
    function pframe(now) {
      if (!pvis) return;
      praf = requestAnimationFrame(pframe);
      if (now - plast < FRAME_MS) return;
      plast = now;
      if (pw <= 0) return;
      pt += 1;
      pg.clearRect(0, 0, pw, phh);
      pg.lineWidth = 0.6;
      for (var i = 0; i < seeds.length; i++) {
        var s = seeds[i];
        for (var j = i + 1; j < seeds.length; j++) {
          var o = seeds[j], dx = s.x - o.x, dy = s.y - o.y;
          var d2 = dx * dx + dy * dy;
          if (d2 > 4356) continue;                    // 66px al cuadrado
          var d = Math.sqrt(d2);
          pg.strokeStyle = "rgba(224,53,123," + (0.14 * (1 - d / 66)).toFixed(3) + ")";
          pg.beginPath(); pg.moveTo(s.x, s.y); pg.lineTo(o.x, o.y); pg.stroke();
        }
      }
      for (var k = 0; k < seeds.length; k++) {
        var q = seeds[k];
        var pu = 0.5 + Math.sin(pt * 0.02 + q.ph) * 0.5;
        pg.fillStyle = "rgba(217,195,160," + (0.3 + pu * 0.5).toFixed(2) + ")";
        pg.beginPath(); pg.arc(q.x, q.y, q.r * (0.7 + pu * 0.6), 0, 6.29); pg.fill();
      }
    }
    presize();
    window.addEventListener("resize", presize, { passive: true });
    function pSync() {
      if (pvis && !doc.hidden) { if (!praf) { plast = 0; praf = requestAnimationFrame(pframe); } }
      else if (praf) { cancelAnimationFrame(praf); praf = 0; }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        e.forEach(function (en) { pvis = en.isIntersecting; });
        pSync();
      }, { threshold: 0.01 }).observe(ph);
    } else { pvis = true; pSync(); }
    doc.addEventListener("visibilitychange", pSync);
  }

  /* ═══════════════ orquestación de scroll ═══════════════ */
  var hdr = doc.querySelector("[data-hdr]");
  var tick = doc.querySelector("[data-tick]");
  var plates = Array.prototype.slice.call(doc.querySelectorAll("[data-parallax]"));
  var weightEls = Array.prototype.slice.call(doc.querySelectorAll("[data-weight]"));
  var scheduled = 0;

  function onScroll() {
    scheduled = 0;
    var y = window.scrollY || 0;
    var vh = window.innerHeight;
    var range = Math.max(1, doc.documentElement.scrollHeight - vh);
    if (tick) tick.style.transform = "scaleX(" + Math.min(1, y / range) + ")";
    if (hdr) hdr.classList.toggle("stuck", y > 30);
    if (reduce || vh <= 0) return;

    if (sparkField && sparkStage) {
      var rs = sparkStage.getBoundingClientRect();
      var prog = (vh - rs.top) / (vh + rs.height);
      sparkField.setProgress(Math.max(0, Math.min(1, (prog - 0.15) * 1.9)));
    }

    plates.forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var pr = (vh - r.top) / (vh + r.height);
      var img = p.querySelector("img");
      if (img) img.style.setProperty("--py", ((pr - 0.5) * -60).toFixed(1) + "px");
    });

    weightEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var pr = 1 - Math.min(1, Math.abs(r.top + r.height / 2 - vh / 2) / (vh / 2));
      el.style.fontVariationSettings = '"wght" ' + Math.round(200 + pr * 500) + ',"opsz" 144';
      el.style.letterSpacing = (0.02 - pr * 0.07).toFixed(3) + "em";
    });
  }
  function queue() { if (!scheduled) scheduled = requestAnimationFrame(onScroll); }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });

  /* ── revelados ────────────────────────────────────────── */
  var revs = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal],.stagger"));
  if (revs.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revs.forEach(function (r) { r.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
      revs.forEach(function (r) { io.observe(r); });
    }
  }

  /* ── navegación de capítulos ──────────────────────────── */
  var chapBtns = Array.prototype.slice.call(doc.querySelectorAll("[data-chap]"));
  var chapSecs = chapBtns.map(function (b) { return doc.getElementById(b.getAttribute("data-chap")); });
  chapBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var el = doc.getElementById(b.getAttribute("data-chap"));
      if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });
  if ("IntersectionObserver" in window && chapSecs.length) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var idx = chapSecs.indexOf(e.target);
        chapBtns.forEach(function (b, i) { b.classList.toggle("on", i === idx); });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    chapSecs.forEach(function (s) { if (s) so.observe(s); });
  }

  /* ── hero: fondo listo ────────────────────────────────── */
  var heroImg = doc.querySelector(".hero-bg img");
  if (heroImg) {
    if (heroImg.complete) heroImg.classList.add("ready");
    else heroImg.addEventListener("load", function () { heroImg.classList.add("ready"); });
  }

  /* ── hero: objetos en órbita ──────────────────────────── */
  var orbitObjs = Array.prototype.slice.call(doc.querySelectorAll(".orbit-obj"));
  if (orbitObjs.length) {
    orbitObjs.forEach(function (o) {
      var ang = parseFloat(o.getAttribute("data-ang")) * Math.PI / 180;
      var rad = parseFloat(o.getAttribute("data-rad"));
      o.style.left = (50 + Math.cos(ang) * rad) + "%";
      o.style.top = (50 + Math.sin(ang) * rad * 0.9) + "%";
    });
    var heroEl = doc.querySelector(".hero");
    if (heroEl && !reduce) {
      var oScheduled = 0, onx = 0, ony = 0;
      heroEl.addEventListener("pointermove", function (e) {
        var r = heroEl.getBoundingClientRect();
        if (!r.width) return;
        onx = (e.clientX - r.left) / r.width - 0.5;
        ony = (e.clientY - r.top) / r.height - 0.5;
        if (oScheduled) return;
        oScheduled = requestAnimationFrame(function () {
          oScheduled = 0;
          orbitObjs.forEach(function (o) {
            var depth = parseFloat(o.getAttribute("data-rad")) / 40;
            o.style.transform = "translate(-50%,-50%) translate(" +
              (onx * 26 * depth).toFixed(1) + "px," + (ony * 26 * depth).toFixed(1) + "px)";
          });
        });
      }, { passive: true });
    }
  }

  /* ── flechas de transformación ────────────────────────── */
  var arrows = Array.prototype.slice.call(doc.querySelectorAll(".morph-arrow"));
  if (arrows.length && "IntersectionObserver" in window && !reduce) {
    var ao = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle("run", e.isIntersecting); });
    }, { threshold: 0.5 });
    arrows.forEach(function (a) { ao.observe(a); });
  }

  var yr = doc.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  onScroll();
})();
