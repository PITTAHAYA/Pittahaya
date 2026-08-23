/* ═══════════════════════════════════════════════════════════
   Pittahaya · motor Vivo
   Un IntersectionObserver para todo lo que entra en cuadro y un
   solo rAF para lo que sigue al puntero. Nada por cuadro que no
   sea transform u opacity.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (quieto || !("IntersectionObserver" in window)) return;

  /* ---------------------------------------------------------- */
  /* 0. Menos palabras en el teléfono                           */
  /* ---------------------------------------------------------- */
  var movil = window.matchMedia("(max-width: 760px)");
  var cortos = doc.querySelectorAll("[data-corto]");

  function ajustarCopia() {
    Array.prototype.forEach.call(cortos, function (n) {
      if (movil.matches) {
        if (n.dataset.largo === undefined) n.dataset.largo = n.innerHTML;
        var c = n.getAttribute("data-corto");
        if (n.textContent.trim() !== c) n.textContent = c;
      } else if (n.dataset.largo !== undefined && n.innerHTML !== n.dataset.largo) {
        n.innerHTML = n.dataset.largo;
      }
    });
  }

  if (cortos.length) {
    ajustarCopia();
    if (movil.addEventListener) movil.addEventListener("change", ajustarCopia);
    else if (movil.addListener) movil.addListener(ajustarCopia);
  }


  /* ---------------------------------------------------------- */
  /* 1. Titulares partidos en palabras                          */
  /* ---------------------------------------------------------- */
  function partir(el) {
    if (el.dataset.vv) return;
    el.dataset.vv = "1";
    el.classList.add("vv-split");

    var trozos = [];
    (function recorrer(n) {
      for (var i = 0; i < n.childNodes.length; i++) {
        var c = n.childNodes[i];
        if (c.nodeType === 3) trozos.push({ padre: n, nodo: c });
        else if (c.nodeType === 1 && !c.classList.contains("vv-w") && c.tagName !== "BR") recorrer(c);
      }
    })(el);

    var k = 0;
    trozos.forEach(function (tr) {
      var frag = doc.createDocumentFragment();
      tr.nodo.nodeValue.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
        var caja = doc.createElement("span");
        caja.className = "vv-w";
        var dentro = doc.createElement("span");
        dentro.textContent = p;
        dentro.style.setProperty("--d", (k * 54) + "ms");
        k++;
        caja.appendChild(dentro);
        frag.appendChild(caja);
      });
      tr.padre.replaceChild(frag, tr.nodo);
    });
  }

  /* Titulares grandes de la casa. Se evita lo que ya anima otra capa. */
  var TITULARES = ".casa-disp, .section-title, .ai-head h2, .process-title, " +
                  ".sel__title, h1.display, .plans-title, .hero-title, .casa-manif h2";
  var titulares = [];
  Array.prototype.forEach.call(doc.querySelectorAll(TITULARES), function (h) {
    if (h.closest(".sel") && !h.classList.contains("sel__title")) return;
    if (h.querySelector(".vv-w")) return;
    titulares.push(h);
  });

  /* ---------------------------------------------------------- */
  /* 2. Fotos que se descubren                                  */
  /* ---------------------------------------------------------- */
  var FOTOS = ".vitrina-mayor img, .about-photo img, .ai-shot img, .case-shot img, .foto img";
  var fotos = [];
  Array.prototype.forEach.call(doc.querySelectorAll(FOTOS), function (img) {
    var marco = img.parentElement;
    if (!marco || marco.classList.contains("vv-foto")) return;
    marco.classList.add("vv-foto");
    fotos.push(marco);
  });

  /* ---------------------------------------------------------- */
  /* 3. Bloques que entran escalonados                          */
  /* ---------------------------------------------------------- */
  var BLOQUES = ".plan-features li, .sel__q, .process-strip li, .ai-num, " +
                ".vitrina-fila, .faq-item, .foot-cols > div";
  var bloques = [];
  Array.prototype.forEach.call(doc.querySelectorAll(BLOQUES), function (b) {
    if (b.classList.contains("vv-in")) return;
    b.classList.add("vv-in");
    bloques.push(b);
  });
  /* el retardo se cuenta dentro de cada grupo, no en toda la página */
  var vistos = {};
  bloques.forEach(function (b) {
    var madre = b.parentElement;
    var id = madre.className || "x";
    vistos[id] = (vistos[id] || 0);
    b.style.setProperty("--d", Math.min(vistos[id] * 60, 420) + "ms");
    vistos[id]++;
  });

  /* ---------------------------------------------------------- */
  /* 4. Un solo observador para las tres cosas                  */
  /* ---------------------------------------------------------- */
  var ojo = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-vivo");
      ojo.unobserve(e.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -7% 0px" });

  titulares.forEach(function (h) { partir(h); ojo.observe(h); });
  fotos.forEach(function (f) { ojo.observe(f); });
  bloques.forEach(function (b) { ojo.observe(b); });

  /* ---------------------------------------------------------- */
  /* 5. Enlaces con subrayado que se dibuja                     */
  /* ---------------------------------------------------------- */
  Array.prototype.forEach.call(
    doc.querySelectorAll(".foot-cols a, .ft-in nav a, .nav-link, .footer-links a"),
    function (a) { a.classList.add("vv-sub"); }
  );

  /* ---------------------------------------------------------- */
  /* 6. Botones magnéticos y relleno desde el puntero           */
  /* ---------------------------------------------------------- */
  if (!fino) return;

  Array.prototype.forEach.call(doc.querySelectorAll(".btn, .btn2, .boton, .sel__go"), function (b) {
    b.addEventListener("mouseenter", function () { b.classList.add("vv-iman"); });
    b.addEventListener("mousemove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty("--px", (e.clientX - r.left) + "px");
      b.style.setProperty("--py", (e.clientY - r.top) + "px");
      b.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + "px");
      b.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.26).toFixed(1) + "px");
    });
    b.addEventListener("mouseleave", function () {
      b.classList.remove("vv-iman");
      b.style.setProperty("--bx", "0px");
      b.style.setProperty("--by", "0px");
    });
  });
})();
