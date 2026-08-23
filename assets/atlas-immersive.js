/* ============================================================
   ATLAS · motor de inmersión
   Un solo rAF para todo lo ligado al scroll y al puntero.
   Nada de canvas, nada de sombras: sólo transform y opacity.
   ============================================================ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------- */
  /* 1. Telón entre folios                                      */
  /* ---------------------------------------------------------- */
  var velo = doc.querySelector("[data-veil]");
  var veloMarca = velo && velo.querySelector("[data-veil-title]");
  var veloFolio = velo && velo.querySelector("[data-veil-folio]");

  if (velo && !quieto) {
    // el telón sólo estorba mientras se abre; después deja pasar el ratón
    window.setTimeout(function () { velo.style.display = "none"; }, 1500);

    doc.addEventListener("click", function (ev) {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

      var a = ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|https?:)/i.test(href)) return;

      var destino = new URL(href, location.href);
      if (destino.origin !== location.origin) return;
      if (destino.pathname === location.pathname) return; // misma página: deja el ancla

      // el telón sólo tiene sentido entre folios de ATLAS: fuera de ellos
      // la página de destino no lo tiene y el corte se vería seco
      var hoja = destino.pathname.split("/").pop().replace(/\.html$/, "");
      if (!/^(demo-corporativa|atlas-cartera|atlas-registro|atlas-presencia)$/.test(hoja)) return;

      ev.preventDefault();
      if (veloMarca) veloMarca.textContent = a.getAttribute("data-veil-name") || (a.textContent || "").trim();
      if (veloFolio) veloFolio.textContent = a.getAttribute("data-veil-folio") || "ATLAS";
      velo.style.display = "";
      // reinicia las animaciones de entrada antes de reproducir la salida
      velo.classList.add("is-leaving");
      window.setTimeout(function () { location.href = destino.href; }, 660);
    });

    // volver con el botón atrás no debe dejar el telón cerrado
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { velo.classList.remove("is-leaving"); velo.style.display = "none"; }
    });
  }

  /* ---------------------------------------------------------- */
  /* 2. Revelado tipográfico por palabra                        */
  /* ---------------------------------------------------------- */
  function partir(el) {
    if (el.dataset.atxSplit) return;
    el.dataset.atxSplit = "1";
    el.classList.add("atx-split");

    var trozos = [];
    (function recorrer(nodo) {
      for (var i = 0; i < nodo.childNodes.length; i++) {
        var n = nodo.childNodes[i];
        if (n.nodeType === 3) trozos.push({ padre: nodo, nodo: n });
        else if (n.nodeType === 1 && !n.classList.contains("atx-w")) recorrer(n);
      }
    })(el);

    var indice = 0;
    trozos.forEach(function (t) {
      var frag = doc.createDocumentFragment();
      var palabras = t.nodo.nodeValue.split(/(\s+)/);
      palabras.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
        var caja = doc.createElement("span");
        caja.className = "atx-w";
        var dentro = doc.createElement("span");
        dentro.textContent = p;
        dentro.style.setProperty("--d", (indice * 62) + "ms");
        indice++;
        caja.appendChild(dentro);
        frag.appendChild(caja);
      });
      t.padre.replaceChild(frag, t.nodo);
    });
  }

  var titulares = doc.querySelectorAll(
    ".hero-inner h1, .page-head .display, .section-head .display, .bridge-head .display, " +
    ".presence-head .display, .contact-inner .display, .holdings-intro .display, .thesis-inner h2, .sector-inner h3"
  );

  if (!quieto && "IntersectionObserver" in window) {
    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-lit");
        ojo.unobserve(e.target);
      });
    }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });

    Array.prototype.forEach.call(titulares, function (t) { partir(t); ojo.observe(t); });
  } else {
    Array.prototype.forEach.call(titulares, function (t) { t.classList.add("is-lit"); });
  }

  /* ---------------------------------------------------------- */
  /* 3. Cifras que se cuentan                                   */
  /* ---------------------------------------------------------- */
  function contar(el) {
    var crudo = el.textContent;
    var m = crudo.match(/-?[\d.,]+/);
    if (!m) return;
    var texto = m[0];
    var decimales = (texto.split(".")[1] || "").length;
    var meta = parseFloat(texto.replace(/,/g, ""));
    if (!isFinite(meta)) return;

    var antes = crudo.slice(0, m.index);
    var despues = crudo.slice(m.index + texto.length);
    var t0 = 0;

    function paso(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.firstChild.nodeValue = antes + (meta * e).toFixed(decimales) + despues;
      if (p < 1) requestAnimationFrame(paso);
    }
    el.firstChild.nodeValue = antes + (0).toFixed(decimales) + despues;
    requestAnimationFrame(paso);
  }

  var cifras = doc.querySelectorAll(".figure strong");
  if (cifras.length && !quieto && "IntersectionObserver" in window) {
    var ojoCifras = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        ojoCifras.unobserve(e.target);
        contar(e.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(cifras, function (c) { ojoCifras.observe(c); });
  }

  /* ---------------------------------------------------------- */
  /* 4. Cursor de precisión (el parálaje ya vive en atlas.js)    */
  /* ---------------------------------------------------------- */
  var raton = { x: -100, y: -100 };
  var anillo = { x: -100, y: -100 };
  var punto = doc.querySelector("[data-atx-dot]");
  var aro = doc.querySelector("[data-atx-ring]");
  var cursorVivo = false;

  if (fino && !quieto && punto && aro) {
    cursorVivo = true;
    doc.addEventListener("mousemove", function (e) {
      raton.x = e.clientX;
      raton.y = e.clientY;
      if (!root.classList.contains("atx-on")) root.classList.add("atx-on");
      arrancar();
    }, { passive: true });
    doc.addEventListener("mouseleave", function () { root.classList.remove("atx-on"); });
    doc.addEventListener("mouseover", function (e) {
      var t = e.target.closest ? e.target.closest("a, button, [role='button'], input, textarea, select") : null;
      root.classList.toggle("atx-hot", !!t);
    }, { passive: true });
  }

  var girando = false;
  var reposo = 0;

  function latido() {
    girando = true;
    var trabajo = false;

    if (cursorVivo) {
      anillo.x += (raton.x - anillo.x) * 0.16;
      anillo.y += (raton.y - anillo.y) * 0.16;
      punto.style.transform = "translate3d(" + raton.x + "px," + raton.y + "px,0)";
      aro.style.transform = "translate3d(" + anillo.x.toFixed(1) + "px," + anillo.y.toFixed(1) + "px,0)";
      if (Math.abs(raton.x - anillo.x) > 0.4 || Math.abs(raton.y - anillo.y) > 0.4) trabajo = true;
    }

    // sin nada que mover, el bucle se apaga solo a los ~30 fotogramas
    reposo = trabajo ? 0 : reposo + 1;
    if (reposo > 30) { girando = false; return; }
    requestAnimationFrame(latido);
  }

  function arrancar() { if (!girando) { reposo = 0; requestAnimationFrame(latido); } }


  /* ---------------------------------------------------------- */
  /* 6. Entradas escalonadas                                    */
  /* ---------------------------------------------------------- */
  var grupos = [];
  Array.prototype.forEach.call(doc.querySelectorAll(".sector-inner"), function (g) { g.classList.add("atx-stagger"); grupos.push(g); });
  Array.prototype.forEach.call(doc.querySelectorAll(".presence-route, .footer-columns, .fig-grid"), function (g) { grupos.push(g); });

  if (grupos.length && !quieto && "IntersectionObserver" in window) {
    grupos.forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (h, i) { h.style.setProperty("--sd", (i * 105) + "ms"); });
    });
    var ojoGrupos = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-lit");
        ojoGrupos.unobserve(e.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    grupos.forEach(function (g) { ojoGrupos.observe(g); });
  } else {
    grupos.forEach(function (g) { g.classList.add("is-lit"); });
  }

  /* ---------------------------------------------------------- */
  /* 7. Magnetismo del puntero                                  */
  /* ---------------------------------------------------------- */
  if (fino && !quieto) {
    Array.prototype.forEach.call(doc.querySelectorAll(".button, .hero-scroll"), function (b) {
      b.addEventListener("mouseenter", function () { b.classList.add("atx-magnet-live"); });
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.26).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.36).toFixed(1) + "px");
      });
      b.addEventListener("mouseleave", function () {
        b.classList.remove("atx-magnet-live");
        b.style.setProperty("--mx", "0px");
        b.style.setProperty("--my", "0px");
      });
    });
  }

  /* ---------------------------------------------------------- */
  /* 8. Inercia del scroll                                      */
  /* ---------------------------------------------------------- */
  var marcos = doc.querySelectorAll(".sector-media, .contact-media");
  if (marcos.length && !quieto) {
    var yAnterior = window.pageYOffset;
    var pendiente = false;
    window.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () {
        var y = window.pageYOffset;
        var v = Math.max(-1.4, Math.min(1.4, (y - yAnterior) / 26));
        yAnterior = y;
        pendiente = false;
        for (var i = 0; i < marcos.length; i++) marcos[i].style.setProperty("--atx-skew", v.toFixed(2) + "deg");
      });
    }, { passive: true });
  }
  /* ---------------------------------------------------------- */
  /* 5. Raíl de capítulos: marca el folio abierto               */
  /* ---------------------------------------------------------- */
  var aqui = location.pathname.split("/").pop() || "demo-corporativa.html";
  Array.prototype.forEach.call(doc.querySelectorAll(".atx-rail a"), function (a) {
    var suyo = a.getAttribute("href").split("/").pop();
    if (suyo === aqui || suyo.replace(/\.html$/, "") === aqui.replace(/\.html$/, "")) {
      a.setAttribute("aria-current", "page");
    }
  });
})();
