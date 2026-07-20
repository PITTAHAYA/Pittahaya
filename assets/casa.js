/* ═══════════════════════════════════════════════════════════
   PITTAHAYA · PORTADA
   Revelados, inclinación 3D, botones magnéticos y contadores.
   Sin canvas, sin librerías. Todo el movimiento se escribe en
   un único rAF compartido para no disparar layout.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  /* El ámbito es .casa en la portada; en las páginas interiores
     solo existe .phead. Antes se salía aquí y dejaba la imagen del
     héroe en opacity:0 y el h1 enmascarado sin revelar. */
  var casa = doc.querySelector(".casa") || doc;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── entrada de página interior ───────────────────────── */
  var pheadImg = doc.querySelector(".phead-bg img");
  if (pheadImg) {
    if (pheadImg.complete) pheadImg.classList.add("lista");
    else pheadImg.addEventListener("load", function () { pheadImg.classList.add("lista"); });
  }
  Array.prototype.slice.call(doc.querySelectorAll(".phead-mask")).forEach(function (m) {
    m.classList.add("vis");
  });

  /* ── revelados y máscaras ─────────────────────────────── */
  var revs = Array.prototype.slice.call(casa.querySelectorAll("[data-rev],.mask"));
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

  /* ── un solo rAF para todo el movimiento del puntero ──── */
  var tareas = [], frameP = 0;
  function encolar(fn) {
    tareas.push(fn);
    if (frameP) return;
    frameP = requestAnimationFrame(function () {
      frameP = 0;
      var t = tareas; tareas = [];
      for (var i = 0; i < t.length; i++) t[i]();
    });
  }
  var fino = window.matchMedia("(hover:hover)").matches && !reduce;

  /* ── héroe: foco que sigue al cursor ──────────────────── */
  var heroe = casa.querySelector(".casa-heroe");
  var foco = casa.querySelector("[data-foco]");
  if (heroe && foco && fino) {
    heroe.addEventListener("pointermove", function (e) {
      var r = heroe.getBoundingClientRect();
      if (!r.width) return;
      var x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      var y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      encolar(function () {
        foco.style.setProperty("--fx", x + "%");
        foco.style.setProperty("--fy", y + "%");
      });
    }, { passive: true });
  }

  /* ── mundos: inclinación 3D + brillo ──────────────────── */
  var mundos = Array.prototype.slice.call(casa.querySelectorAll(".mundo"));
  if (mundos.length && fino) {
    mundos.forEach(function (c) {
      var brillo = c.querySelector(".mundo-brillo");
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var nx = (e.clientX - r.left) / r.width;
        var ny = (e.clientY - r.top) / r.height;
        var rotY = ((nx - 0.5) * 7).toFixed(2);
        var rotX = ((0.5 - ny) * 5).toFixed(2);
        var bx = (nx * 100).toFixed(1), by = (ny * 100).toFixed(1);
        encolar(function () {
          c.style.setProperty("--ty", rotY + "deg");
          c.style.setProperty("--tx", rotX + "deg");
          if (brillo) {
            brillo.style.setProperty("--bx", bx + "%");
            brillo.style.setProperty("--by", by + "%");
          }
        });
      }, { passive: true });
      c.addEventListener("pointerleave", function () {
        encolar(function () {
          c.style.setProperty("--ty", "0deg");
          c.style.setProperty("--tx", "0deg");
        });
      }, { passive: true });
    });
  }

  /* ── botones magnéticos ───────────────────────────────── */
  var botones = Array.prototype.slice.call(casa.querySelectorAll(".btn2"));
  if (botones.length && fino) {
    botones.forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        if (!r.width) return;
        var dx = ((e.clientX - r.left) / r.width - 0.5) * 12;
        var dy = ((e.clientY - r.top) / r.height - 0.5) * 8;
        var bx = ((e.clientX - r.left) / r.width * 100).toFixed(1);
        var by = ((e.clientY - r.top) / r.height * 100).toFixed(1);
        encolar(function () {
          b.style.setProperty("--mx", dx.toFixed(1) + "px");
          b.style.setProperty("--my", dy.toFixed(1) + "px");
          b.style.setProperty("--bx", bx + "%");
          b.style.setProperty("--by", by + "%");
        });
      }, { passive: true });
      b.addEventListener("pointerleave", function () {
        encolar(function () {
          b.style.setProperty("--mx", "0px");
          b.style.setProperty("--my", "0px");
        });
      }, { passive: true });
    });
  }

  /* ── contadores ───────────────────────────────────────── */
  var cifras = Array.prototype.slice.call(casa.querySelectorAll("[data-cifra]"));
  if (cifras.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      cifras.forEach(function (c) { c.textContent = c.getAttribute("data-cifra"); });
    } else {
      var co = new IntersectionObserver(function (ent) {
        ent.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target; co.unobserve(el);
          var fin = parseFloat(el.getAttribute("data-cifra"));
          if (isNaN(fin)) return;
          var t0 = performance.now(), dur = 1400;
          (function paso(now) {
            var p = Math.min(1, (now - t0) / dur);
            el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(paso);
          })(t0);
        });
      }, { threshold: 0.5 });
      cifras.forEach(function (c) { co.observe(c); });
    }
  }

  /* ── héroe: la foto cede al video cuando puede ────────── */
  var img = casa.querySelector(".casa-heroe-fondo img");
  if (img) {
    if (img.complete) img.classList.add("lista");
    else img.addEventListener("load", function () { img.classList.add("lista"); });
  }
  var vid = casa.querySelector(".casa-heroe-fondo video");
  if (vid && !reduce) {
    /* se carga solo cuando el héroe está a la vista */
    var arrancado = false;
    function arrancar() {
      if (arrancado) return;
      arrancado = true;
      vid.preload = "auto";
      vid.addEventListener("canplay", function () {
        var cont = vid.parentElement;
        if (cont) cont.classList.add("con-video");
        vid.classList.add("lista");
        var p = vid.play();
        if (p && p.catch) p.catch(function () { /* autoplay bloqueado: queda la foto */ });
      }, { once: true });
      vid.load();
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (ent) {
        ent.forEach(function (e) {
          if (e.isIntersecting) { arrancar(); var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
          else vid.pause();
        });
      }, { threshold: 0.05 }).observe(vid);
    } else { arrancar(); }
  }
})();
