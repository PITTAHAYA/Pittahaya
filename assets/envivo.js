/* Pittahaya · IA: la conversación avanza con el scroll */
(function () {
  var pista = document.querySelector(".ev-pista");
  if (!pista) return;
  var escena = pista.querySelector(".ev-escena");
  var caps = [].slice.call(pista.querySelectorAll(".ev-cap"));
  var pasos = [].slice.call(pista.querySelectorAll(".ev-paso"));
  var reloj = pista.querySelector(".ev-reloj b");
  var horas = (pista.getAttribute("data-horas") || "").split(",");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var n = caps.length, actual = -1;

  function muestra(i) {
    if (i === actual) return;
    actual = i;
    caps.forEach(function (c, j) { c.classList.toggle("on", j === i); });
    pasos.forEach(function (p) { p.classList.toggle("on", +p.getAttribute("data-p") <= i); });
    if (horas[i]) reloj.textContent = horas[i];
  }
  if (reduce) { muestra(n - 1); return; }

  var pend = false;
  function pinta() {
    pend = false;
    var r = pista.getBoundingClientRect(), h = innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / (r.height - h)));
    escena.style.setProperty("--ep", p.toFixed(3));
    pista.classList.toggle("lejos", p > .04);
    muestra(Math.min(n - 1, Math.floor(p * n * 1.0001)));
  }
  addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(pinta); } }, { passive: true });
  addEventListener("resize", pinta);
  pinta();
})();
