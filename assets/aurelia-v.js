/* AURELIA · la casa sigue: el titular, las puertas y la linterna (CSP-safe) */
(function () {
  "use strict";

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var movil = window.matchMedia("(max-width: 760px)");
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  var jobs = [], pend = 0;
  var run = function () { pend = 0; jobs.forEach(function (j) { j(); }); };
  var ask = function () { if (!pend) pend = requestAnimationFrame(run); };
  addEventListener("scroll", ask, { passive: true });
  addEventListener("resize", ask, { passive: true });

  /* ── el titular: la imagen respira al salir ── */
  var open = document.querySelector("[data-aw-open]");
  if (open && !quieto) jobs.push(function () {
    var r = open.getBoundingClientRect();
    open.style.setProperty("--o", clamp(-r.top / innerHeight, 0, 1).toFixed(3));
  });

  /* ── las puertas ── */
  var doors = function () {
    var list = [].slice.call(document.querySelectorAll(".dr"));
    if (!list.length) return false;
    if (quieto) { list.forEach(function (d) { d.style.setProperty("--p", 1); }); return true; }
    jobs.push(function () {
      list.forEach(function (d) {
        var r = d.getBoundingClientRect();
        if (movil.matches) {
          /* teléfono: se abre la puerta que está en el centro del carril */
          var shown = r.top < innerHeight * .75 && r.bottom > innerHeight * .2 && r.left > -r.width * .5 && r.left < innerWidth * .5;
          d.style.setProperty("--p", shown ? 1 : 0);
          return;
        }
        if (r.bottom < 0 || r.top > innerHeight) return;
        /* cerrada al llegar arriba; se abre en el primer 60% del tramo fijo */
        d.style.setProperty("--p", ease(clamp((innerHeight * .05 - r.top) / (innerHeight * .75), 0, 1)).toFixed(4));
      });
    });
    var track = document.querySelector(".dr-track");
    if (track) track.addEventListener("scroll", ask, { passive: true });
    ask();
    return true;
  };
  if (!doors()) document.addEventListener("DOMContentLoaded", doors);

  /* ── la linterna: el cursor ilumina la presentación ── */
  var man = document.querySelector(".manifesto");
  var lamp = man && man.querySelector(".aw-lamp");
  if (man && lamp) {
    var tx = 62, ty = 42, x = 62, y = 42, live = false, t0 = 0;
    var fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fino) man.addEventListener("mousemove", function (e) {
      var r = man.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 100;
      ty = (e.clientY - r.top) / r.height * 100;
    });
    var loop = function (ts) {
      if (!live) return;
      if (!fino || quieto) {
        if (!t0) t0 = ts;
        var k = (ts - t0) / 1000;
        tx = 50 + Math.sin(k * .35) * 28; ty = 44 + Math.sin(k * .52) * 16;
      }
      x += (tx - x) * .08; y += (ty - y) * .08;
      man.style.setProperty("--lx", x.toFixed(2) + "%");
      man.style.setProperty("--ly", y.toFixed(2) + "%");
      requestAnimationFrame(loop);
    };
    man.style.setProperty("--lr", (fino ? 320 : 220) + "px");
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      if (on && !live) { live = true; requestAnimationFrame(loop); } else if (!on) live = false;
    }).observe(man);
  }

  ask();
})();
