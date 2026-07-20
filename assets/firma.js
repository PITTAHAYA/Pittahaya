/* ═══════════════════════════════════════════════════════════
   PITTAHAYA · MARCA & DISEÑO
   Rayos X, revelados por máscara, inclinación 3D y magnetismo.
   Sin canvas, sin librerías.

   Coste: todo son transformaciones CSS sobre custom properties.
   Los punteros se leen en el evento y se escriben en un único
   rAF, así nunca se dispara layout dentro del movimiento.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var isEnglish = /^en\b/i.test(doc.documentElement.lang || "");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── TELÓN DE ENTRADA ─────────────────────────────────── */
  var telon = doc.querySelector("[data-telon]");
  function abrirTelon() {
    if (!telon) return;
    telon.classList.add("fuera");
    body.classList.add("entrada");
    setTimeout(function () { if (telon && telon.parentNode) telon.parentNode.removeChild(telon); }, 1200);
  }
  if (telon) {
    if (reduce) abrirTelon();
    else {
      var listo = false;
      function soltar() { if (listo) return; listo = true; setTimeout(abrirTelon, 1500); }
      window.addEventListener("load", soltar);
      setTimeout(soltar, 2600);          // salvavidas si algo tarda
    }
  }

  /* ── RAYOS X ──────────────────────────────────────────── */
  var CLAVE = "pittahaya-xray";
  var switches = Array.prototype.slice.call(doc.querySelectorAll("[data-xray]"));
  var animBarrido = 0;

  function pintarSwitch(on) {
    switches.forEach(function (s) {
      s.setAttribute("aria-pressed", String(on));
      var t = s.querySelector("[data-xray-txt]");
      if (t) t.textContent = on
        ? (isEnglish ? "X-ray active" : "Rayos X activos")
        : (isEnglish ? "View the system" : "Ver el sistema");
    });
  }

  function setXray(on, recordar) {
    body.classList.toggle("xray", on);
    if (on && !reduce) {
      body.classList.remove("xray-anim");
      void body.offsetWidth;                 // reflow para relanzar el barrido
      body.classList.add("xray-anim");
      clearTimeout(animBarrido);
      animBarrido = setTimeout(function () { body.classList.remove("xray-anim"); }, 1000);
    }
    pintarSwitch(on);
    if (recordar) {
      try { sessionStorage.setItem(CLAVE, on ? "1" : "0"); } catch (e) { /* modo privado */ }
    }
  }

  switches.forEach(function (s) {
    s.addEventListener("click", function () {
      setXray(!body.classList.contains("xray"), true);
    });
  });

  doc.addEventListener("keydown", function (e) {
    if (e.key !== "x" && e.key !== "X") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    e.preventDefault();
    setXray(!body.classList.contains("xray"), true);
  });

  try {
    if (sessionStorage.getItem(CLAVE) === "1") setXray(true, false);
    else pintarSwitch(false);
  } catch (e) { pintarSwitch(false); }

  /* ── barra + progreso ─────────────────────────────────── */
  var barra = doc.querySelector("[data-barra]");
  var prog = doc.querySelector("[data-prog]");
  var pendiente = 0;

  function alScroll() {
    pendiente = 0;
    var y = window.scrollY || 0;
    var vh = window.innerHeight;
    var alcance = Math.max(1, doc.documentElement.scrollHeight - vh);
    if (prog) prog.style.transform = "scaleX(" + Math.min(1, y / alcance) + ")";
    if (barra) barra.classList.toggle("fija", y > 28);
  }
  function encolar() { if (!pendiente) pendiente = requestAnimationFrame(alScroll); }
  window.addEventListener("scroll", encolar, { passive: true });
  window.addEventListener("resize", encolar, { passive: true });

  /* ── revelados (incluye máscaras) ─────────────────────── */
  var revs = Array.prototype.slice.call(doc.querySelectorAll("[data-rev],.mask"));
  if (revs.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revs.forEach(function (r) { r.classList.add("vis"); });
    } else {
      var io = new IntersectionObserver(function (ent) {
        ent.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("vis");
          io.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      revs.forEach(function (r, i) {
        if (!r.classList.contains("mask")) r.style.transitionDelay = ((i % 4) * 80) + "ms";
        io.observe(r);
      });
    }
  }

  /* ═══════ puntero: un solo rAF para todo el movimiento ═══════ */
  var tareas = [];          // funciones que escriben estilos
  var frameP = 0;
  function encolarPuntero(fn) {
    tareas.push(fn);
    if (frameP) return;
    frameP = requestAnimationFrame(function () {
      frameP = 0;
      var t = tareas; tareas = [];
      for (var i = 0; i < t.length; i++) t[i]();
    });
  }

  var finoPuntero = window.matchMedia("(hover:hover)").matches && !reduce;

  /* ── héroe: foco que sigue al cursor ──────────────────── */
  var heroe = doc.querySelector(".heroe");
  var foco = doc.querySelector("[data-foco]");
  if (heroe && foco && finoPuntero) {
    heroe.addEventListener("pointermove", function (e) {
      var r = heroe.getBoundingClientRect();
      if (!r.width) return;
      var x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      var y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      encolarPuntero(function () {
        foco.style.setProperty("--fx", x + "%");
        foco.style.setProperty("--fy", y + "%");
      });
    }, { passive: true });
  }

  /* ── Semillero: inclinación 3D + brillo especular ─────── */
  var semillas = Array.prototype.slice.call(doc.querySelectorAll(".semilla"));
  if (semillas.length && finoPuntero) {
    semillas.forEach(function (c) {
      var brillo = c.querySelector(".semilla-brillo");
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var nx = (e.clientX - r.left) / r.width;
        var ny = (e.clientY - r.top) / r.height;
        var rotY = ((nx - 0.5) * 9).toFixed(2);      // grados
        var rotX = ((0.5 - ny) * 7).toFixed(2);
        var bx = (nx * 100).toFixed(1), by = (ny * 100).toFixed(1);
        encolarPuntero(function () {
          c.style.setProperty("--ty", rotY + "deg");
          c.style.setProperty("--tx", rotX + "deg");
          if (brillo) {
            brillo.style.setProperty("--bx", bx + "%");
            brillo.style.setProperty("--by", by + "%");
          }
        });
      }, { passive: true });
      c.addEventListener("pointerleave", function () {
        encolarPuntero(function () {
          c.style.setProperty("--ty", "0deg");
          c.style.setProperty("--tx", "0deg");
        });
      }, { passive: true });
    });
  }

  /* ── botones magnéticos ───────────────────────────────── */
  var botones = Array.prototype.slice.call(doc.querySelectorAll(".boton"));
  if (botones.length && finoPuntero) {
    botones.forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        if (!r.width) return;
        var dx = ((e.clientX - r.left) / r.width - 0.5) * 12;
        var dy = ((e.clientY - r.top) / r.height - 0.5) * 8;
        var bx = ((e.clientX - r.left) / r.width * 100).toFixed(1);
        var by = ((e.clientY - r.top) / r.height * 100).toFixed(1);
        encolarPuntero(function () {
          b.style.setProperty("--mx", dx.toFixed(1) + "px");
          b.style.setProperty("--my", dy.toFixed(1) + "px");
          b.style.setProperty("--bx", bx + "%");
          b.style.setProperty("--by", by + "%");
        });
      }, { passive: true });
      b.addEventListener("pointerleave", function () {
        encolarPuntero(function () {
          b.style.setProperty("--mx", "0px");
          b.style.setProperty("--my", "0px");
        });
      }, { passive: true });
    });
  }

  /* ── contadores ───────────────────────────────────────── */
  var cifras = Array.prototype.slice.call(doc.querySelectorAll("[data-cifra]"));
  if (cifras.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      cifras.forEach(function (c) { c.textContent = c.getAttribute("data-cifra"); });
    } else {
      var co = new IntersectionObserver(function (ent) {
        ent.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target; co.unobserve(el);
          var fin = parseFloat(el.getAttribute("data-cifra"));
          if (isNaN(fin)) { el.textContent = el.getAttribute("data-cifra"); return; }
          var sufijo = el.getAttribute("data-sufijo") || "";
          var t0 = performance.now(), dur = 1400;
          (function paso(now) {
            var p = Math.min(1, (now - t0) / dur);
            var e3 = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(fin * e3) + sufijo;
            if (p < 1) requestAnimationFrame(paso);
          })(t0);
        });
      }, { threshold: 0.5 });
      cifras.forEach(function (c) { co.observe(c); });
    }
  }

  /* ── héroe: foto → video cuando puede reproducirse ────── */
  var hi = doc.querySelector(".heroe-fondo img");
  if (hi) {
    if (hi.complete) hi.classList.add("lista");
    else hi.addEventListener("load", function () { hi.classList.add("lista"); });
  }
  var hv = doc.querySelector(".heroe-fondo video");
  if (hv && !reduce) {
    hv.addEventListener("canplay", function () {
      var cont = hv.parentElement;
      if (cont) cont.classList.add("con-video");
      hv.classList.add("lista");
      var p = hv.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: se queda la foto */ });
    }, { once: true });
    /* no gastar batería fuera de pantalla */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (ent) {
        ent.forEach(function (e) {
          if (e.isIntersecting) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); }
          else hv.pause();
        });
      }, { threshold: 0.05 }).observe(hv);
    }
  }

  var y = doc.querySelector("[data-anio]");
  if (y) y.textContent = new Date().getFullYear();

  alScroll();
})();
