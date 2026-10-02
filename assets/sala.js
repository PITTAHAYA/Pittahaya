/* Pittahaya · Portafolio: la sala de mundos */
(function () {
  var doc = document, sala = doc.querySelector(".sala");
  if (!sala) return;
  var mundos = [].slice.call(sala.querySelectorAll(".sala-mundo"));
  var puntos = [].slice.call(sala.querySelectorAll(".sala-indice i"));
  var indice = sala.querySelector(".sala-indice");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var movil = matchMedia("(max-width: 820px)");

  [].slice.call(sala.querySelectorAll(".phead-mask")).forEach(function (m) {
    requestAnimationFrame(function () { m.classList.add("vis"); });
  });

  function activo(i) {
    puntos.forEach(function (p, j) { p.classList.toggle("on", j === i); });
  }

  var io = new IntersectionObserver(function (ent) {
    ent.forEach(function (e) {
      var m = e.target, v = m.querySelector("video");
      if (e.isIntersecting) {
        m.classList.add("vis");
        activo(+m.getAttribute("data-i"));
        if (v && !reduce) {
          if (!v.src) v.src = v.getAttribute("data-src");
          var p = v.play();
          if (p && p.then) p.then(function () { v.classList.add("on"); }, function () {});
        }
      } else if (v) { v.pause(); }
    });
  }, { threshold: 0.55 });
  mundos.forEach(function (m) { io.observe(m); });

  /* el mundo anterior se hunde mientras el siguiente lo cubre */
  var pend = false;
  function pinta() {
    pend = false;
    var h = innerHeight, pista = sala.querySelector(".sala-pista").getBoundingClientRect();
    if (indice) indice.classList.toggle("on", pista.top < h * .5 && pista.bottom > h * .5);
    if (movil.matches || reduce) return;
    mundos.forEach(function (m, i) {
      var sig = mundos[i + 1];
      if (!sig) return;
      var t = sig.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, 1 - t / h));
      m.style.setProperty("--p", p.toFixed(3));
    });
  }
  addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(pinta); } }, { passive: true });
  addEventListener("resize", pinta);
  pinta();
})();
