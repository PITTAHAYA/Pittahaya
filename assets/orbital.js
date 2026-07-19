/* ═══════════════════════════════════════════════════════════
   ORBITAL · interacciones (CSP-safe, sin dependencias)
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ── cabecera + progreso ───────────────────────────── */
  var hdr = doc.querySelector("[data-hdr]");
  var tick = doc.querySelector("[data-tick]");
  var plates = Array.prototype.slice.call(doc.querySelectorAll("[data-plate]"));
  var frame = 0;

  function onScroll() {
    frame = 0;
    var y = window.scrollY || doc.documentElement.scrollTop || 0;
    var range = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
    if (tick) tick.style.transform = "scaleX(" + Math.min(1, Math.max(0, y / range)) + ")";
    if (hdr) hdr.classList.toggle("is-stuck", y > 24);
    if (reduce.matches || window.innerHeight <= 0) return;
    plates.forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var prog = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      var img = p.querySelector("img");
      if (img) img.style.setProperty("--py", ((prog - 0.5) * -56).toFixed(1) + "px");
    });
  }
  function queue() { if (!frame) frame = requestAnimationFrame(onScroll); }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });

  /* ── navegación móvil ──────────────────────────────── */
  var burger = doc.querySelector("[data-burger]");
  var nav = doc.querySelector("[data-nav]");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Cerrar navegación" : "Abrir navegación");
      nav.classList.toggle("is-open", open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.focus();
      }
    });
  }

  /* ── revelado ──────────────────────────────────────── */
  var items = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));
  if (items.length) {
    if (reduce.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
      items.forEach(function (i, n) {
        i.style.transitionDelay = ((n % 4) * 90) + "ms";
        io.observe(i);
      });
    }
  }

  /* ── hero: imagen lista ────────────────────────────── */
  var heroImg = doc.querySelector(".hero-bg img");
  if (heroImg) {
    if (heroImg.complete) heroImg.classList.add("is-ready");
    else heroImg.addEventListener("load", function () { heroImg.classList.add("is-ready"); });
  }

  /* ── contadores ────────────────────────────────────── */
  var counters = Array.prototype.slice.call(doc.querySelectorAll("[data-count]"));
  if (counters.length && "IntersectionObserver" in window && !reduce.matches) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        cio.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
        var start = performance.now();
        var dur = 1500;
        (function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toLocaleString("es", {
            minimumFractionDigits: dec, maximumFractionDigits: dec
          });
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) {
      var dec = parseInt(c.getAttribute("data-dec") || "0", 10);
      c.textContent = parseFloat(c.getAttribute("data-count")).toLocaleString("es", {
        minimumFractionDigits: dec, maximumFractionDigits: dec
      });
    });
  }

  /* ── calculadora de latencia ───────────────────────── */
  /* Latencia orbital: ida y vuelta al nodo más cercano + conmutación.
     Terrestre: ruta por fibra al hub regional (con desvíos reales). */
  var CITIES = [
    { id: "uio", name: "Quito", gs: "ECU-1", orb: 11, fib: 96 },
    { id: "gru", name: "São Paulo", gs: "ECU-1", orb: 14, fib: 128 },
    { id: "iad", name: "Virginia", gs: "POL-1", orb: 13, fib: 74 },
    { id: "lhr", name: "Londres", gs: "POL-1", orb: 12, fib: 88 },
    { id: "sin", name: "Singapur", gs: "SSO-1", orb: 15, fib: 214 },
    { id: "nbo", name: "Nairobi", gs: "SSO-1", orb: 16, fib: 246 }
  ];

  var latList = doc.querySelector("[data-lat-list]");
  if (latList) {
    var latBig = doc.querySelector("[data-lat-value]");
    var barUs = doc.querySelector("[data-lat-bar-us]");
    var barThem = doc.querySelector("[data-lat-bar-them]");
    var valUs = doc.querySelector("[data-lat-us]");
    var valThem = doc.querySelector("[data-lat-them]");
    var latNote = doc.querySelector("[data-lat-note]");
    var maxScale = 260;

    CITIES.forEach(function (c, i) {
      var b = doc.createElement("button");
      b.type = "button";
      b.className = "lat-city" + (i === 0 ? " is-on" : "");
      b.setAttribute("aria-pressed", String(i === 0));
      var n = doc.createElement("em");
      n.style.fontStyle = "normal";
      n.textContent = c.name;
      var g = doc.createElement("span");
      g.textContent = c.gs;
      b.appendChild(n);
      b.appendChild(g);
      b.addEventListener("click", function () { select(c, b); });
      latList.appendChild(b);
    });

    function select(city, btn) {
      Array.prototype.forEach.call(latList.children, function (el) {
        el.classList.remove("is-on");
        el.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-on");
      btn.setAttribute("aria-pressed", "true");
      if (latBig) latBig.textContent = city.orb;
      if (valUs) valUs.textContent = city.orb + " ms";
      if (valThem) valThem.textContent = city.fib + " ms";
      if (barUs) barUs.style.width = Math.min(100, (city.orb / maxScale) * 100) + "%";
      if (barThem) barThem.style.width = Math.min(100, (city.fib / maxScale) * 100) + "%";
      if (latNote) {
        var factor = (city.fib / city.orb).toFixed(1);
        latNote.textContent = "Desde " + city.name + ", el enlace óptico al plano " + city.gs +
          " resuelve " + factor + "× más rápido que la ruta terrestre al centro de datos más cercano. " +
          "La luz viaja un 47% más rápido en el vacío que en fibra de sílice.";
      }
    }
    select(CITIES[0], latList.children[0]);
  }

  /* ── consola de misión: telemetría en vivo ─────────── */
  var stream = doc.querySelector("[data-stream]");
  if (stream && !reduce.matches) {
    var EVENTS = [
      ["ok", "ECU-1-04 · lote de inferencia completado · 8.4 PFLOP"],
      ["ic", "POL-1-02 · enlace óptico establecido con SSO-1-07"],
      ["ok", "Svalbard · ventana de contacto abierta · 11 min"],
      ["ic", "ECU-1-01 · entrando en zona de sol · radiadores replegados"],
      ["ok", "Quito · 2.1 TB descargados · integridad verificada"],
      ["wn", "POL-1-06 · eclipse en 90 s · migrando carga a POL-1-07"],
      ["ok", "SSO-1-03 · corrección de órbita · Δv 0.4 m/s"],
      ["ic", "Nairobi · handover completado sin pérdida de paquetes"],
      ["ok", "Constelación · 24/24 nodos nominales"],
      ["ic", "ECU-1-08 · temperatura de núcleo 39 °C · dentro de margen"],
      ["wn", "Detección de escombros · maniobra evasiva programada T-14 min"],
      ["ok", "Singapur · sincronización de modelo · 640 GB"]
    ];
    var n = 0;
    function emit() {
      var ev = EVENTS[n % EVENTS.length];
      n++;
      var d = new Date();
      var p = doc.createElement("p");
      var time = doc.createElement("span");
      time.className = "t";
      time.textContent = String(d.getUTCHours()).padStart(2, "0") + ":" +
        String(d.getUTCMinutes()).padStart(2, "0") + ":" +
        String(d.getUTCSeconds()).padStart(2, "0") + "Z ";
      var body = doc.createElement("span");
      body.className = ev[0];
      body.textContent = ev[1];
      p.appendChild(time);
      p.appendChild(body);
      stream.insertBefore(p, stream.firstChild);
      while (stream.children.length > 9) stream.removeChild(stream.lastChild);
    }
    for (var pre = 0; pre < 6; pre++) emit();
    var streamTimer = setInterval(emit, 2600);
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) { clearInterval(streamTimer); streamTimer = 0; }
      else if (!streamTimer) streamTimer = setInterval(emit, 2600);
    });
  }

  /* ── barras de carga cómputo ───────────────────────── */
  var bars = doc.querySelector("[data-bars]");
  if (bars && !reduce.matches) {
    var cells = Array.prototype.slice.call(bars.children);
    setInterval(function () {
      if (doc.hidden) return;
      cells.forEach(function (c, i) {
        var base = 40 + Math.sin(Date.now() * 0.0004 + i * 0.6) * 26 + Math.random() * 16;
        var v = Math.max(12, Math.min(98, base));
        c.style.setProperty("--h", v.toFixed(0) + "%");
        c.classList.toggle("hot", v > 84);
      });
    }, 1400);
  }

  /* ── ventanas de contacto ──────────────────────────── */
  var passes = Array.prototype.slice.call(doc.querySelectorAll("[data-pass]"));
  if (passes.length) {
    passes.forEach(function (p, i) {
      var bar = p.querySelector("i");
      var out = p.querySelector("b");
      var span = 42 + i * 17;
      var at = (i * 11) % span;
      /* pintar el estado inicial en el primer frame, sin esperar al tick */
      function paint() {
        if (bar) bar.style.setProperty("--w", ((at / span) * 100).toFixed(0) + "%");
        if (out) out.textContent = "T−" + String(span - at).padStart(2, "0") + " min";
      }
      paint();
      if (reduce.matches) return;
      setInterval(function () {
        if (doc.hidden) return;
        at = (at + 1) % span;
        if (bar) bar.style.setProperty("--w", ((at / span) * 100).toFixed(0) + "%");
        if (out) out.textContent = "T−" + String(span - at).padStart(2, "0") + " min";
      }, 1000);
    });
  }

  var y = doc.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  onScroll();
})();
