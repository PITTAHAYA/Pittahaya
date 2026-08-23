/* ═══════════════════════════════════════════════════════════
   Pittahaya · motor del carrete
   Encuentra las rejillas de tarjetas de la casa y, por debajo
   de 860 px, las convierte en carretes que se arrastran.
   Un solo rAF por scroll; sólo escribe variables CSS.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Rejilla → selector de sus tarjetas y acento de la sección.
     Se añaden las que existan en la página; el resto se ignora. */
  var REJILLAS = [
    { rejilla: ".grid-3",       tarjeta: ".card",           acento: "rgba(212,175,55,.55)" },
    { rejilla: ".ai-serv",      tarjeta: ".ai-card",        acento: "rgba(150,230,160,.5)" },
    { rejilla: ".ai-uses",      tarjeta: ".ai-use",         acento: "rgba(150,230,160,.5)" },
    { rejilla: ".casa-oficios", tarjeta: ".oficio",         acento: "rgba(198,255,106,.5)" },
    /* los planes entran al carrete ahora que su detalle se pliega:
       antes cada tarjeta medía 861 px y no cabía. */
    { rejilla: ".pricing",      tarjeta: ".card.price",     acento: "rgba(232,52,135,.5)" },
    { rejilla: ".bridge-map",   tarjeta: ".bridge-node",    acento: "rgba(210,177,118,.55)" },
    { rejilla: ".process-strip",tarjeta: "li",              acento: "rgba(232,52,135,.5)" }
  ];

  var carretes = [];

  REJILLAS.forEach(function (def) {
    Array.prototype.forEach.call(doc.querySelectorAll(def.rejilla), function (rejilla) {
      var tarjetas = rejilla.querySelectorAll(def.tarjeta);
      if (tarjetas.length < 3) return;      // con dos no hay carrete que valga

      rejilla.classList.add("crt-rail");
      rejilla.style.setProperty("--crt-acento", def.acento);

      Array.prototype.forEach.call(tarjetas, function (t, i) {
        t.classList.add("crt-card");
        if (!t.getAttribute("data-crt-n")) {
          t.setAttribute("data-crt-n", String(i + 1).padStart(2, "0"));
        }
      });

      var barra = doc.createElement("div");
      barra.className = "crt-bar";
      barra.setAttribute("aria-hidden", "true");
      barra.innerHTML = "<i></i>";
      rejilla.parentNode.insertBefore(barra, rejilla.nextSibling);

      carretes.push({ rejilla: rejilla, tarjetas: tarjetas, barra: barra, aguja: barra.firstChild });
    });
  });

  if (!carretes.length || quieto) return;

  var pendiente = false;

  function medir() {
    pendiente = false;

    carretes.forEach(function (c) {
      // fuera del carrete (escritorio) la rejilla no desborda: nada que medir
      if (c.rejilla.scrollWidth <= c.rejilla.clientWidth + 2) {
        c.barra.style.display = "none";
        return;
      }
      c.barra.style.display = "";

      var r = c.rejilla.getBoundingClientRect();
      var centro = r.left + r.width / 2;
      var cerca = null, dCerca = Infinity;

      for (var i = 0; i < c.tarjetas.length; i++) {
        var t = c.tarjetas[i];
        var b = t.getBoundingClientRect();
        var d = Math.abs(b.left + b.width / 2 - centro);
        var k = Math.max(0, 1 - d / (b.width * 1.5));
        t.style.setProperty("--k", k.toFixed(3));
        if (d < dCerca) { dCerca = d; cerca = t; }
      }

      for (var j = 0; j < c.tarjetas.length; j++) {
        c.tarjetas[j].classList.toggle("is-foco", c.tarjetas[j] === cerca);
      }

      var recorrido = c.rejilla.scrollWidth - c.rejilla.clientWidth;
      var avance = recorrido > 0 ? c.rejilla.scrollLeft / recorrido : 0;
      var ancho = 100 / c.tarjetas.length;
      c.aguja.style.setProperty("--w", ancho + "%");
      var libre = c.barra.clientWidth * (1 - ancho / 100);
      c.aguja.style.setProperty("--x", (avance * libre).toFixed(1) + "px");
    });
  }

  function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } }

  carretes.forEach(function (c) {
    c.rejilla.addEventListener("scroll", pedir, { passive: true });
  });
  window.addEventListener("resize", pedir, { passive: true });
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(pedir);
    carretes.forEach(function (c) { ro.observe(c.rejilla); });
  }

  requestAnimationFrame(medir);
})();
