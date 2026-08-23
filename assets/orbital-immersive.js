/* ═══════════════════════════════════════════════════════════
   ORBITAL · motor de inmersión
   Copia corta en móvil, traspaso de enlace, decodificado de
   titulares, retícula y barridos. Un solo rAF, sólo para el
   puntero: todo lo demás es CSS o IntersectionObserver.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var movil = window.matchMedia("(max-width: 760px)");

  /* ---------------------------------------------------------- */
  /* 1. Menos palabras en el teléfono                           */
  /* ---------------------------------------------------------- */
  var cortos = doc.querySelectorAll("[data-corto]");

  function ajustarCopia() {
    Array.prototype.forEach.call(cortos, function (el) {
      if (movil.matches) {
        if (el.dataset.largo === undefined) el.dataset.largo = el.innerHTML;
        var corto = el.getAttribute("data-corto");
        if (el.textContent.trim() !== corto) el.textContent = corto;
      } else if (el.dataset.largo !== undefined && el.innerHTML !== el.dataset.largo) {
        el.innerHTML = el.dataset.largo;
      }
    });
  }

  if (cortos.length) {
    ajustarCopia();
    if (movil.addEventListener) movil.addEventListener("change", ajustarCopia);
    else if (movil.addListener) movil.addListener(ajustarCopia);
  }

  /* ---------------------------------------------------------- */
  /* 2. Traspaso de enlace entre páginas                        */
  /* ---------------------------------------------------------- */
  var ORBITALES = /^(demo-startup|orbital-constelacion|orbital-nodo|orbital-mision|orbital-compania)$/;
  var enlace = doc.querySelector("[data-obx-link]");
  var enlaceDestino = enlace && enlace.querySelector("[data-obx-dest]");

  if (enlace && !quieto) {
    window.setTimeout(function () { enlace.style.display = "none"; }, 1400);

    doc.addEventListener("click", function (ev) {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

      var a = ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|https?:)/i.test(href)) return;

      var destino = new URL(href, location.href);
      if (destino.origin !== location.origin) return;
      if (destino.pathname === location.pathname) return;

      var hoja = destino.pathname.split("/").pop().replace(/\.html$/, "");
      if (!ORBITALES.test(hoja)) return; // fuera de ORBITAL el corte se vería seco

      ev.preventDefault();
      if (enlaceDestino) enlaceDestino.textContent = (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
      enlace.style.display = "";
      enlace.classList.add("is-handoff");
      window.setTimeout(function () { location.href = destino.href; }, 620);
    });

    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { enlace.classList.remove("is-handoff"); enlace.style.display = "none"; }
    });
  }

  /* ---------------------------------------------------------- */
  /* 3. Titulares: palabras bajo máscara                        */
  /* ---------------------------------------------------------- */
  function partir(el) {
    if (el.dataset.obxSplit) return;
    el.dataset.obxSplit = "1";
    el.classList.add("obx-split");

    var trozos = [];
    (function recorrer(nodo) {
      for (var i = 0; i < nodo.childNodes.length; i++) {
        var n = nodo.childNodes[i];
        if (n.nodeType === 3) trozos.push({ padre: nodo, nodo: n });
        else if (n.nodeType === 1 && !n.classList.contains("obx-w")) recorrer(n);
      }
    })(el);

    var indice = 0;
    trozos.forEach(function (t) {
      var frag = doc.createDocumentFragment();
      t.nodo.nodeValue.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
        var caja = doc.createElement("span");
        caja.className = "obx-w";
        var dentro = doc.createElement("span");
        dentro.textContent = p;
        dentro.style.setProperty("--d", (indice * 58) + "ms");
        indice++;
        caja.appendChild(dentro);
        frag.appendChild(caja);
      });
      t.padre.replaceChild(frag, t.nodo);
    });
  }

  var titulares = doc.querySelectorAll(".hero h1, .phead .d1, .phead .d2, .sec-head .d2, .sec-head .d1, .split-copy h2, .thesis h2");

  /* ---------------------------------------------------------- */
  /* 4. Cintillos que se escriben como telemetría               */
  /* ---------------------------------------------------------- */
  function teclear(el) {
    if (el.dataset.obxType) return;
    el.dataset.obxType = "1";
    var texto = el.textContent;
    el.classList.add("obx-type");
    el.textContent = "";
    var i = 0;
    var reloj = window.setInterval(function () {
      i++;
      el.textContent = texto.slice(0, i);
      if (i >= texto.length) {
        window.clearInterval(reloj);
        el.classList.add("is-done");
      }
    }, 34);
  }

  /* ---------------------------------------------------------- */
  /* 5. Barridos, escalonados y observador único                */
  /* ---------------------------------------------------------- */
  var barridos = doc.querySelectorAll(".console, .card, .spec, .tracker, .manifest, .next > a");
  var grupos = doc.querySelectorAll(".figs, .next, .planes, .passes, .hero-hud, .ft-in nav");
  var cintillos = doc.querySelectorAll(".eyebrow");

  if (!quieto && "IntersectionObserver" in window) {
    Array.prototype.forEach.call(barridos, function (b) { b.classList.add("obx-sweep"); });
    Array.prototype.forEach.call(grupos, function (g) {
      g.classList.add("obx-stagger");
      Array.prototype.forEach.call(g.children, function (h, i) { h.style.setProperty("--sd", (i * 95) + "ms"); });
    });

    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        ojo.unobserve(e.target);
        if (e.target.classList.contains("eyebrow")) teclear(e.target);
        else e.target.classList.add("is-lit");
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

    Array.prototype.forEach.call(titulares, function (t) { partir(t); ojo.observe(t); });
    Array.prototype.forEach.call(barridos, function (b) { ojo.observe(b); });
    Array.prototype.forEach.call(grupos, function (g) { ojo.observe(g); });
    Array.prototype.forEach.call(cintillos, function (c) { ojo.observe(c); });
  } else {
    Array.prototype.forEach.call(titulares, function (t) { t.classList.add("is-lit"); });
    Array.prototype.forEach.call(grupos, function (g) { g.classList.add("is-lit"); });
  }

  /* ---------------------------------------------------------- */
  /* 6. Retícula de puntería                                    */
  /* ---------------------------------------------------------- */
  var mira = doc.querySelector("[data-obx-cross]");
  var raton = { x: -100, y: -100 };
  var suave = { x: -100, y: -100 };
  var viva = false;
  var girando = false;
  var reposo = 0;

  if (fino && !quieto && mira) {
    viva = true;
    doc.addEventListener("mousemove", function (e) {
      raton.x = e.clientX; raton.y = e.clientY;
      if (!root.classList.contains("obx-on")) root.classList.add("obx-on");
      arrancar();
    }, { passive: true });
    doc.addEventListener("mouseleave", function () { root.classList.remove("obx-on"); });
    doc.addEventListener("mouseover", function (e) {
      var t = e.target.closest ? e.target.closest("a, button, [role='button'], input, select, textarea, [data-node]") : null;
      root.classList.toggle("obx-hot", !!t);
    }, { passive: true });
  }

  function latido() {
    girando = true;
    var trabajo = false;
    if (viva) {
      suave.x += (raton.x - suave.x) * 0.22;
      suave.y += (raton.y - suave.y) * 0.22;
      mira.style.transform = "translate3d(" + suave.x.toFixed(1) + "px," + suave.y.toFixed(1) + "px,0)";
      if (Math.abs(raton.x - suave.x) > 0.4 || Math.abs(raton.y - suave.y) > 0.4) trabajo = true;
    }
    reposo = trabajo ? 0 : reposo + 1;
    if (reposo > 30) { girando = false; return; }
    requestAnimationFrame(latido);
  }
  function arrancar() { if (!girando) { reposo = 0; requestAnimationFrame(latido); } }

  /* ---------------------------------------------------------- */
  /* 7. Magnetismo del puntero                                  */
  /* ---------------------------------------------------------- */
  if (fino && !quieto) {
    Array.prototype.forEach.call(doc.querySelectorAll(".btn, .hero-cta a"), function (b) {
      b.addEventListener("mouseenter", function () { b.classList.add("obx-magnet-live"); });
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.24).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.34).toFixed(1) + "px");
      });
      b.addEventListener("mouseleave", function () {
        b.classList.remove("obx-magnet-live");
        b.style.setProperty("--mx", "0px");
        b.style.setProperty("--my", "0px");
      });
    });
  }
})();
