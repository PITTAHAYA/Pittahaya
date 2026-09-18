/* AURELIA · el recorrido horizontal y la lectura del terreno (CSP-safe) */
(function () {
  "use strict";

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var movil = window.matchMedia("(max-width: 760px)");
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ── el recorrido: el scroll vertical camina por las estancias ── */
  var tour = document.querySelector("[data-ax-tour]");
  if (tour) {
    var track = tour.querySelector("[data-ax-track]");
    var rooms = [].slice.call(track.children);
    var out = tour.querySelector("[data-ax-n]");
    var bar = tour.querySelector("[data-ax-bar]");
    var pend = 0, cur = -1;
    tour.style.setProperty("--n", rooms.length);

    var light = function (i) {
      if (i === cur) return;
      cur = i;
      rooms.forEach(function (r, n) { r.classList.toggle("is-on", n === i); });
      if (out) out.textContent = String(i + 1).padStart(2, "0");
    };
    var paint = function () {
      pend = 0;
      if (movil.matches) return;
      var travel = Math.max(1, tour.offsetHeight - innerHeight);
      var p = clamp(-tour.getBoundingClientRect().top / travel, 0, 1);
      var span = Math.max(0, track.scrollWidth - innerWidth);
      if (!quieto) track.style.transform = "translate3d(" + (-p * span).toFixed(1) + "px,0,0)";
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      light(Math.min(rooms.length - 1, Math.round(p * (rooms.length - 1))));
    };
    addEventListener("scroll", function () { if (!pend) pend = requestAnimationFrame(paint); }, { passive: true });
    addEventListener("resize", paint, { passive: true });
    paint();

    /* en el teléfono el recorrido se desliza: se ilumina la estancia visible */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (!movil.matches) return;
        es.forEach(function (e) { if (e.isIntersecting) light(rooms.indexOf(e.target)); });
      }, { root: track, threshold: 0.6 });
      rooms.forEach(function (r) { io.observe(r); });
    }
    if (movil.matches) light(0);
  }

  /* ── lectura del terreno: cada punto abre su ficha ── */
  var land = document.querySelector("[data-ax-land]");
  if (land) {
    var map = land.querySelector(".ax-map");
    var card = land.querySelector("[data-ax-card]");
    var pts = [].slice.call(land.querySelectorAll(".ax-pt"));
    var legend = [].slice.call(land.querySelectorAll("[data-ax-legend] button"));
    var show = function (i) {
      var p = pts[i];
      pts.forEach(function (x, n) { x.setAttribute("aria-pressed", String(n === i)); });
      legend.forEach(function (x, n) { x.setAttribute("aria-pressed", String(n === i)); });
      card.style.setProperty("--x", p.style.getPropertyValue("--x"));
      card.style.setProperty("--y", p.style.getPropertyValue("--y"));
      card.querySelector("small").textContent = p.getAttribute("data-k");
      card.querySelector("b").textContent = p.getAttribute("data-t");
      card.querySelector("span").textContent = p.getAttribute("data-v");
      card.classList.remove("on");
      void card.offsetWidth;
      card.classList.add("on");
    };
    pts.forEach(function (p, i) {
      p.addEventListener("click", function () { show(i); });
      p.addEventListener("mouseenter", function () { show(i); });
    });
    legend.forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { seen.disconnect(); map.classList.add("in"); show(0); }
      }, { threshold: 0.35 });
      seen.observe(map);
    } else { map.classList.add("in"); show(0); }
  }
})();
