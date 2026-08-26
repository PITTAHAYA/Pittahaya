/* ═══════════════════════════════════════════════════════════
   Pittahaya · Página de oferta
   Archivo aparte y sin nada en línea: la CSP del sitio bloquea
   tanto <script> con código dentro como los onclick.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var quieto = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── El comparador ──────────────────────────────────────
     Va sobre un <input type="range">: así se arrastra con el
     dedo, con el ratón y con las flechas del teclado sin que
     tengamos que escribir ni una línea de accesibilidad. */
  var cmp = doc.querySelector("[data-cmp]");
  if (cmp) {
    var rango = cmp.querySelector("[data-cmp-rango]");
    var pintar = function () {
      cmp.style.setProperty("--x", rango.value + "%");
    };
    rango.addEventListener("input", pintar);
    pintar();

    /* Una sola insinuación al entrar en cuadro: el eje se abre
       desde el centro para que se entienda que se arrastra.
       Después no vuelve a moverse solo. */
    if (!quieto && "IntersectionObserver" in window) {
      var guiñado = false;
      var ojoCmp = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting || guiñado) return;
          guiñado = true;
          ojoCmp.disconnect();
          var t0 = 0;
          var paso = function (t) {
            if (!t0) t0 = t;
            var k = Math.min(1, (t - t0) / 1400);
            var e2 = 1 - Math.pow(1 - k, 3);
            /* 50 → 78 → 50 */
            var v = 50 + Math.sin(e2 * Math.PI) * 28;
            rango.value = String(v);
            pintar();
            if (k < 1) requestAnimationFrame(paso);
          };
          requestAnimationFrame(paso);
        });
      }, { threshold: 0.55 });
      ojoCmp.observe(cmp);
    }
  }

  /* ── Entradas al hacer scroll ───────────────────────────── */
  if ("IntersectionObserver" in window) {
    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-vivo");
        ojo.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(doc.querySelectorAll(".of-rev"), function (n, i) {
      n.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
      ojo.observe(n);
    });
  } else {
    Array.prototype.forEach.call(doc.querySelectorAll(".of-rev"), function (n) {
      n.classList.add("is-vivo");
    });
  }

  /* ── La barra fija aparece cuando el botón del héroe se va ─ */
  var fija = doc.querySelector("[data-fija]");
  var ancla = doc.querySelector("[data-heroe-cta]");
  if (fija && ancla && "IntersectionObserver" in window) {
    var ojoCta = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        fija.classList.toggle("is-visible", !e.isIntersecting);
      });
    }, { threshold: 0 });
    ojoCta.observe(ancla);
  }

  /* ── La barra de arriba se separa del fondo al bajar ────── */
  var barra = doc.querySelector("[data-barra]");
  if (barra) {
    var centinela = doc.createElement("div");
    centinela.setAttribute("aria-hidden", "true");
    barra.parentNode.insertBefore(centinela, barra);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        barra.classList.toggle("is-pegada", !entradas[0].isIntersecting);
      }, { threshold: 0 }).observe(centinela);
    }
  }

  /* ── El mensaje que Instagram no deja rellenar ──────────
     WhatsApp acepta ?text= en el enlace; Instagram no tiene
     equivalente. Lo más cerca que se puede llegar es dejar el
     texto en el portapapeles antes de saltar a la app, y
     avisarlo en el propio botón para que no parezca magia. */
  Array.prototype.forEach.call(doc.querySelectorAll("[data-copiar]"), function (a) {
    var etiqueta = a.querySelector("[data-copiar-txt]");
    if (!etiqueta) return;
    var original = etiqueta.textContent;
    var reloj = null;

    a.addEventListener("click", function () {
      var texto = a.getAttribute("data-copiar");
      /* Nunca se bloquea el enlace: si copiar falla, la app abre igual
         y la persona escribe lo que quiera. */
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).then(avisar, function () {});
        }
      } catch (e) { /* sin portapapeles: se sigue de largo */ }
    });

    function avisar() {
      etiqueta.textContent = a.getAttribute("data-copiado") || "Mensaje copiado";
      a.classList.add("is-copiado");
      if (reloj) clearTimeout(reloj);
      reloj = setTimeout(function () {
        etiqueta.textContent = original;
        a.classList.remove("is-copiado");
      }, 2600);
    }
  });

  /* ── Conversiones ───────────────────────────────────────
     El sitio ya trae window.track(); aquí sólo se nombra
     desde dónde salió el clic, para saber qué parte vende. */
  var marcar = function (nombre, sitio) {
    if (typeof window.track === "function") window.track(nombre, { origen: sitio });
  };
  Array.prototype.forEach.call(doc.querySelectorAll("[data-conv]"), function (a) {
    a.addEventListener("click", function () {
      marcar(a.getAttribute("data-conv"), a.getAttribute("data-sitio") || "oferta");
    });
  });
})();
