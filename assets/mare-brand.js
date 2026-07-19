/* ═══════════════════════════════════════════════════════════
   PITTAHAYA · BRAND IN MOTION — motor de identidad
   Partículas-semilla que convergen en el monograma (muestreado
   del PNG real). Orquestación por scroll. CSP-safe, sin librerías.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MARK_SRC = "assets/pitahaya-mark.png";

  /* ── muestreo del monograma (una sola vez, cacheado) ──── */
  var markPoints = null;      // [{x,y,c}]  x,y en 0..1, c = color
  var markCallbacks = [];

  function loadMark() {
    var img = new Image();
    img.onload = function () {
      var N = 220;
      var off = doc.createElement("canvas");
      off.width = N; off.height = N;
      var g = off.getContext("2d", { willReadFrequently: true });
      /* encajar preservando proporción */
      var ratio = Math.min(N / img.width, N / img.height);
      var w = img.width * ratio, h = img.height * ratio;
      g.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
      var data = g.getImageData(0, 0, N, N).data;
      var pts = [];
      var step = 2;
      for (var y = 0; y < N; y += step) {
        for (var x = 0; x < N; x += step) {
          var i = (y * N + x) * 4;
          var a = data[i + 3];
          if (a < 120) continue;
          var r = data[i], gg = data[i + 1], b = data[i + 2];
          /* clasificar color: verde escama vs magenta cuerpo */
          var c = (gg > r && gg > b) ? "lime" : "fruit";
          if (Math.random() > 0.62) continue; // adelgazar la nube
          pts.push({ x: x / N - 0.5, y: y / N - 0.5, c: c });
        }
      }
      markPoints = pts;
      markCallbacks.forEach(function (cb) { cb(pts); });
      markCallbacks = [];
    };
    img.onerror = function () { markPoints = []; markCallbacks.forEach(function (cb) { cb([]); }); };
    img.src = MARK_SRC;
  }

  function onMark(cb) {
    if (markPoints) cb(markPoints);
    else markCallbacks.push(cb);
  }

  /* ── campo de partículas ──────────────────────────────── */
  function Field(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var host = canvas.parentElement;
    var dpr = 1, W = 0, H = 0, scale = 1, cx = 0, cy = 0;
    var parts = [];
    var progress = opts.progress || 0;   // 0 disperso · 1 formado
    var target = progress;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var running = false, raf = 0, t = 0;
    var glow = opts.glow || 0;
    var colorMode = opts.color || "brand"; // brand | ivory | champ
    var self = this;

    function palette(c) {
      if (colorMode === "ivory") return "#f4efe6";
      if (colorMode === "champ") return Math.random() > 0.5 ? "#d9c3a0" : "#c9a24b";
      return c === "lime" ? "#9fce3a" : "#e0357b";
    }

    function build(points) {
      parts = points.map(function (p) {
        var ang = Math.random() * Math.PI * 2;
        var rad = 0.6 + Math.random() * 0.9;
        return {
          hx: p.x, hy: p.y,                       // destino (home)
          sx: Math.cos(ang) * rad, sy: Math.sin(ang) * rad, // origen disperso
          x: 0, y: 0,
          size: 0.6 + Math.random() * 1.5,
          col: palette(p.c),
          ph: Math.random() * Math.PI * 2,
          spd: 0.4 + Math.random() * 0.8
        };
      });
    }

    function resize() {
      var r = host.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
      scale = Math.min(W, H) * (opts.fit || 0.62);
      return true;
    }

    function frame() {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (W <= 0) return;
      t += 1;
      progress += (target - progress) * 0.06;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      var p = reduce ? target : progress;
      var ease = p * p * (3 - 2 * p);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      var px = pointer.x * (opts.parallax || 26);
      var py = pointer.y * (opts.parallax || 26);

      for (var k = 0; k < parts.length; k++) {
        var a = parts[k];
        var drift = reduce ? 0 : Math.sin(t * 0.012 * a.spd + a.ph) * 0.012;
        var hx = a.hx + drift, hy = a.hy + drift * 0.6;
        var x = a.sx + (hx - a.sx) * ease;
        var y = a.sy + (hy - a.sy) * ease;
        a.x = cx + x * scale + px * (a.size / 2);
        a.y = cy + y * scale + py * (a.size / 2);
        var alpha = 0.25 + ease * 0.6;
        var sz = a.size * (0.7 + ease * 0.6);
        if (glow) {
          ctx.shadowColor = a.col;
          ctx.shadowBlur = glow * (0.4 + ease);
        }
        ctx.fillStyle = a.col;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(a.x, a.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    }

    this.setProgress = function (v) { target = Math.max(0, Math.min(1, v)); };
    this.setColor = function (m) { colorMode = m; if (markPoints) build(markPoints); };
    this.pointer = function (nx, ny) { pointer.tx = nx; pointer.ty = ny; };
    this.start = function () { if (running) return; running = true; frame(); };
    this.stop = function () { running = false; if (raf) cancelAnimationFrame(raf); };

    onMark(function (pts) { build(pts); });
    if (!resize()) {
      var tries = 0, w = setInterval(function () { if (resize() || ++tries > 40) clearInterval(w); }, 120);
    }
    window.addEventListener("resize", resize, { passive: true });

    /* pausa fuera de pantalla */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        e.forEach(function (en) { en.isIntersecting ? self.start() : self.stop(); });
      }, { threshold: 0.01 }).observe(host);
    } else { self.start(); }
  }

  /* ═══════════════ inicialización ═══════════════ */
  loadMark();

  /* ── HERO: monograma escultórico, formado, con parallax ── */
  var heroCanvas = doc.querySelector("[data-hero-mark]");
  var heroField = null;
  if (heroCanvas) {
    heroField = new Field(heroCanvas, { progress: 1, glow: 10, fit: 0.5, parallax: 34 });
    heroField.setProgress(1);
    var hero = doc.querySelector(".hero");
    if (hero && !reduce) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        heroField.pointer((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
      });
      hero.addEventListener("pointerleave", function () { heroField.pointer(0, 0); });
    }
  }

  /* ── 01 SPARK: scatter→form conducido por scroll ──────── */
  var sparkCanvas = doc.querySelector("[data-spark-mark]");
  var sparkField = null, sparkStage = null;
  if (sparkCanvas) {
    sparkField = new Field(sparkCanvas, { progress: 0, glow: 14, fit: 0.46, parallax: 12 });
    sparkStage = doc.querySelector("[data-spark-stage]");
  }

  /* ── 02 IDENTITY: interactivo ─────────────────────────── */
  var idCanvas = doc.querySelector("[data-id-mark]");
  var idField = null;
  if (idCanvas) {
    idField = new Field(idCanvas, { progress: 1, glow: 8, fit: 0.56, parallax: 18 });
    idField.setProgress(1);
    var idc = idCanvas.parentElement;
    if (idc && !reduce) {
      idc.addEventListener("pointermove", function (e) {
        var r = idc.getBoundingClientRect();
        idField.pointer((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
      });
      idc.addEventListener("pointerleave", function () { idField.pointer(0, 0); });
    }
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

  /* ── 06 UNIVERSE: monograma-corazón latente ───────────── */
  var uniCanvas = doc.querySelector("[data-uni-mark]");
  if (uniCanvas) {
    var uf = new Field(uniCanvas, { progress: 1, glow: 16, fit: 0.32, parallax: 20 });
    uf.setProgress(1);
    var uni = doc.querySelector(".universe");
    if (uni && !reduce) {
      uni.addEventListener("pointermove", function (e) {
        var r = uni.getBoundingClientRect();
        uf.pointer((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
      });
    }
  }

  /* ── 03 patrón generativo (crece desde semillas) ──────── */
  var patCanvas = doc.querySelector("[data-pattern]");
  if (patCanvas && !reduce) {
    var pg = patCanvas.getContext("2d");
    var ph = patCanvas.parentElement, pw = 0, phh = 0, pdpr = 1, seeds = [], pt = 0, prun = false, praf = 0;
    function presize() {
      var r = ph.getBoundingClientRect(); if (r.width <= 0) return false;
      pdpr = Math.min(window.devicePixelRatio || 1, 2); pw = r.width; phh = r.height;
      patCanvas.width = pw * pdpr; patCanvas.height = phh * pdpr; pg.setTransform(pdpr, 0, 0, pdpr, 0, 0);
      seeds = []; var n = Math.round(pw * phh / 5400);
      for (var i = 0; i < n; i++) seeds.push({ x: Math.random() * pw, y: Math.random() * phh, ph: Math.random() * 6.28, r: 1 + Math.random() * 1.6 });
      return true;
    }
    function pframe() {
      if (!prun) return; praf = requestAnimationFrame(pframe); if (pw <= 0) return; pt += 1;
      pg.clearRect(0, 0, pw, phh);
      for (var i = 0; i < seeds.length; i++) {
        var s = seeds[i];
        for (var j = i + 1; j < seeds.length; j++) {
          var o = seeds[j], dx = s.x - o.x, dy = s.y - o.y, d = Math.hypot(dx, dy);
          if (d < 66) { pg.strokeStyle = "rgba(224,53,123," + (0.14 * (1 - d / 66)).toFixed(3) + ")"; pg.lineWidth = 0.6; pg.beginPath(); pg.moveTo(s.x, s.y); pg.lineTo(o.x, o.y); pg.stroke(); }
        }
      }
      for (var k = 0; k < seeds.length; k++) {
        var q = seeds[k]; var pu = 0.5 + Math.sin(pt * 0.02 + q.ph) * 0.5;
        pg.fillStyle = "rgba(217,195,160," + (0.3 + pu * 0.5).toFixed(2) + ")";
        pg.beginPath(); pg.arc(q.x, q.y, q.r * (0.7 + pu * 0.6), 0, 6.29); pg.fill();
      }
    }
    if (presize()) { }
    window.addEventListener("resize", presize, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { e.forEach(function (en) { prun = en.isIntersecting; if (prun) pframe(); else if (praf) cancelAnimationFrame(praf); }); }, { threshold: 0.01 }).observe(ph);
    } else { prun = true; pframe(); }
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
    var range = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
    if (tick) tick.style.transform = "scaleX(" + Math.min(1, y / range) + ")";
    if (hdr) hdr.classList.toggle("stuck", y > 30);
    if (reduce || window.innerHeight <= 0) return;

    /* spark: progreso según recorrido de la sección */
    if (sparkField && sparkStage) {
      var r = sparkStage.getBoundingClientRect();
      var vh = window.innerHeight;
      var prog = (vh - r.top) / (vh + r.height);
      sparkField.setProgress(Math.max(0, Math.min(1, (prog - 0.15) * 1.9)));
    }

    /* parallax de imágenes */
    plates.forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var prog = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      var img = p.querySelector("img");
      if (img) img.style.setProperty("--py", ((prog - 0.5) * -60).toFixed(1) + "px");
    });

    /* tipografía que gana peso al entrar en foco */
    weightEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var prog = 1 - Math.min(1, Math.max(0, Math.abs(r.top + r.height / 2 - vh / 2) / (vh / 2)));
      var wght = Math.round(200 + prog * 500);
      var ls = (0.02 - prog * 0.07).toFixed(3);
      el.style.fontVariationSettings = '"wght" ' + wght + ',"opsz" 144';
      el.style.letterSpacing = ls + "em";
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
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
      revs.forEach(function (r) { io.observe(r); });
    }
  }

  /* ── navegación de capítulos (scroll-spy) ─────────────── */
  var chapBtns = Array.prototype.slice.call(doc.querySelectorAll("[data-chap]"));
  var sections = chapBtns.map(function (b) { return doc.getElementById(b.getAttribute("data-chap")); });
  chapBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var el = doc.getElementById(b.getAttribute("data-chap"));
      if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });
  if ("IntersectionObserver" in window && sections.length) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var idx = sections.indexOf(e.target);
        chapBtns.forEach(function (b, i) { b.classList.toggle("on", i === idx); });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { if (s) so.observe(s); });
  }

  /* ── hero: imagen de fondo lista ──────────────────────── */
  var heroImg = doc.querySelector(".hero-bg img");
  if (heroImg) {
    if (heroImg.complete) heroImg.classList.add("ready");
    else heroImg.addEventListener("load", function () { heroImg.classList.add("ready"); });
  }

  /* ── hero: posicionar objetos del ecosistema en órbita ── */
  var orbitObjs = Array.prototype.slice.call(doc.querySelectorAll(".orbit-obj"));
  if (orbitObjs.length) {
    orbitObjs.forEach(function (o, i) {
      var ang = parseFloat(o.getAttribute("data-ang")) * Math.PI / 180;
      var rad = parseFloat(o.getAttribute("data-rad"));
      o.style.left = (50 + Math.cos(ang) * rad) + "%";
      o.style.top = (50 + Math.sin(ang) * rad * 0.9) + "%";
      o.dataset.bx = Math.cos(ang);
      o.dataset.by = Math.sin(ang);
    });
    var heroEl = doc.querySelector(".hero");
    if (heroEl && !reduce) {
      heroEl.addEventListener("pointermove", function (e) {
        var r = heroEl.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        orbitObjs.forEach(function (o) {
          var depth = parseFloat(o.getAttribute("data-rad")) / 40;
          o.style.transform = "translate(-50%,-50%) translate(" + (nx * 30 * depth).toFixed(1) + "px," + (ny * 30 * depth).toFixed(1) + "px)";
        });
      });
    }
  }

  /* ── morph arrows animan al entrar ────────────────────── */
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
