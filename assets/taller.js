/* Pittahaya · Servicios: el taller */
(function () {
  var t = document.querySelector(".taller");
  if (!t) return;
  var caps = [].slice.call(t.querySelectorAll(".tl-cap"));
  var capas = [].slice.call(t.querySelectorAll(".tl-capa"));
  var prog = t.querySelector(".tl-prog");
  var obra = t.querySelector(".tl-obra");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  [].slice.call(t.querySelectorAll(".phead-mask")).forEach(function (m) {
    requestAnimationFrame(function () { m.classList.add("vis"); });
  });

  function activa(i) {
    caps.forEach(function (c, j) { c.classList.toggle("on", j === i); });
    capas.forEach(function (c, j) {
      var on = j === i, v = c.querySelector("video");
      c.classList.toggle("on", on);
      if (!v || reduce) return;
      if (on) {
        v.muted = true;
        if (!v.src) v.src = v.getAttribute("data-src");
        var p = v.play();
        if (p && p.catch) p.catch(function () {
          v.addEventListener("canplay", function () { if (c.classList.contains("on")) v.play().catch(function () {}); }, { once: true });
        });
      } else v.pause();
    });
  }
  var actual = -1;
  function elige() {
    var mejor = 0;
    if (innerWidth <= 860) {
      /* teléfono/tablet: el avance dentro de la obra decide el capítulo */
      var r = obra.getBoundingClientRect();
      var p = Math.min(.999, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      mejor = Math.floor(p * caps.length);
    } else {
      var mitad = innerHeight / 2, dist = 1e9;
      caps.forEach(function (c, j) {
        var b = c.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mitad);
        if (d < dist) { dist = d; mejor = j; }
      });
    }
    if (mejor !== actual) { actual = mejor; activa(mejor); }
  }
  elige();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { actual = -1; pinta(); } });

  var pend = false;
  function pinta() {
    pend = false;
    elige();
    var cv = capas[actual] && capas[actual].querySelector("video");
    if (cv && cv.src && cv.paused && !reduce) { var q = cv.play(); if (q && q.catch) q.catch(function () {}); }
    if (!prog) return;
    var r = obra.getBoundingClientRect(), h = innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / (r.height - h)));
    prog.style.setProperty("--tp", p.toFixed(3));
  }
  addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(pinta); } }, { passive: true });
  addEventListener("resize", function () { actual = -1; pinta(); });
  pinta();
})();

/* teléfono y tablet: cada capítulo reproduce su video solo mientras se ve */
(function () {
  var vids = [].slice.call(document.querySelectorAll(".tl-movil video"));
  if (!vids.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var io = new IntersectionObserver(function (ent) {
    ent.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && innerWidth <= 860) {
        v.muted = true;
        if (!v.src) v.src = v.getAttribute("data-src");
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else v.pause();
    });
  }, { threshold: 0.35 });
  vids.forEach(function (v) { io.observe(v); });
})();
