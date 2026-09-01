/* ═══════════════════════════════════════════════════════════
   Pittahaya · Presentación (tarjeta con QR)
   Archivo aparte y sin nada en línea: la CSP del sitio bloquea
   los <script> con código dentro y los onclick.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;

  /* Marca de que el guion arrancó. Todo lo que empieza escondido
     —el sello, las entradas, las burbujas— cuelga de esta clase,
     así que si este archivo no carga la página se ve entera y
     estática en vez de quedarse en negro. */
  doc.documentElement.classList.add("js-vivo");

  var quieto = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── El QR puede traer a quién visitamos ────────────────
     La tarjeta de cada cliente lleva su propio QR:
       presentacion.html?para=Panadería%20Lucía&demo=demo-servicios.html
     Así la página los saluda por su nombre y enlaza la demo
     que ya les enseñamos. Es lo que convierte esto en una
     continuación de la visita y no en un folleto más. */
  var params = new URLSearchParams(location.search);

  function limpio(v, max) {
    if (!v) return "";
    /* Texto que viene de la URL: se recorta y se trata como
       texto, nunca como HTML. */
    return String(v).replace(/[<>]/g, "").trim().slice(0, max || 60);
  }

  var paraQuien = limpio(params.get("para"), 48);
  if (paraQuien) {
    Array.prototype.forEach.call(doc.querySelectorAll("[data-para]"), function (n) {
      n.textContent = paraQuien;
      n.hidden = false;
    });
    var conNombre = doc.querySelector("[data-con-nombre]");
    if (conNombre) conNombre.hidden = false;
  }

  /* El enlace a su demo sólo puede apuntar dentro del sitio:
     si llega una dirección de fuera, se ignora. */
  var suDemo = limpio(params.get("demo"), 80);
  if (suDemo && /^[\w-]+\.html$/.test(suDemo)) {
    var botonDemo = doc.querySelector("[data-demo-boton]");
    if (botonDemo) {
      botonDemo.setAttribute("href", suDemo);
      botonDemo.hidden = false;
      var caja = doc.querySelector("[data-demo-caja]");
      if (caja) caja.hidden = false;
    }
  }

  /* ── El sello se abre solo, o al tocarlo ────────────────
     Escanean y miran: esperar un toque sobra. Pero el botón
     está ahí para quien no quiera esperar. */
  var sello = doc.querySelector("[data-sello]");
  if (sello) {
    var abierto = false;
    var abrir = function () {
      if (abierto) return;
      abierto = true;
      sello.classList.add("se-fue");
      doc.body.style.removeProperty("overflow");
      /* deja de robar el foco una vez fuera de pantalla */
      window.setTimeout(function () { sello.hidden = true; }, 650);
    };
    doc.body.style.overflow = "hidden";
    var boton = sello.querySelector("[data-abrir]");
    if (boton) boton.addEventListener("click", abrir);
    sello.addEventListener("click", abrir);
    window.setTimeout(abrir, quieto ? 900 : 2600);
  }

  /* ── Entradas escalonadas ───────────────────────────────── */
  if ("IntersectionObserver" in window) {
    /* Umbral cero: basta con que asome un píxel. Con un umbral alto,
       un dedo rápido en el teléfono cruza la sección antes de que el
       observador la dé por vista, y el cliente ve un hueco negro. */
    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-vivo");
        ojo.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -4% 0px" });

    var porVer = Array.prototype.slice.call(doc.querySelectorAll(".pr-rev"));
    porVer.forEach(function (n, i) {
      n.style.setProperty("--d", Math.min(i % 4, 3) * 70 + "ms");
      ojo.observe(n);
    });
    var chat = doc.querySelector(".pr__chat");
    if (chat) ojo.observe(chat);

    /* Red de seguridad. Nada puede quedarse invisible: si por lo que
       sea el observador se saltó algo, a los cinco segundos se muestra
       igual. Esta página se enseña delante de un cliente. */
    window.setTimeout(function () {
      porVer.forEach(function (n) { n.classList.add("is-vivo"); });
      if (chat) chat.classList.add("is-vivo");
    }, 5000);
  } else {
    Array.prototype.forEach.call(doc.querySelectorAll(".pr-rev"), function (n) {
      n.classList.add("is-vivo");
    });
    var c = doc.querySelector(".pr__chat");
    if (c) c.classList.add("is-vivo");
  }

  /* ── El hilo de arriba mide cuánto queda del relato ──────
     Un solo rAF y sólo se escribe una variable CSS: nada de
     tocar el layout por cuadro. */
  var hilo = doc.querySelector("[data-hilo]");
  if (hilo && !quieto) {
    var pedido = false;
    var pintar = function () {
      pedido = false;
      var alto = doc.documentElement.scrollHeight - window.innerHeight;
      var p = alto > 0 ? window.scrollY / alto : 0;
      hilo.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
    };
    window.addEventListener("scroll", function () {
      if (pedido) return;
      pedido = true;
      window.requestAnimationFrame(pintar);
    }, { passive: true });
    pintar();
  }

  /* ── Las fichas del problema se voltean ─────────────────── */
  Array.prototype.forEach.call(doc.querySelectorAll("[data-ficha]"), function (f) {
    f.addEventListener("click", function () {
      var abierta = f.getAttribute("aria-pressed") === "true";
      f.setAttribute("aria-pressed", abierta ? "false" : "true");
    });
  });

  /* ── Conversiones ───────────────────────────────────────── */
  Array.prototype.forEach.call(doc.querySelectorAll("[data-conv]"), function (a) {
    a.addEventListener("click", function () {
      if (typeof window.track !== "function") return;
      window.track(a.getAttribute("data-conv"), {
        origen: a.getAttribute("data-sitio") || "presentacion",
        empresa: paraQuien || "(sin nombre)"
      });
    });
  });
})();
