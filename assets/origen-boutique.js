/* ═══════════════════════════════════════════════════════════
   ORIGEN 0° · motor de la boutique
   Toma la colección que dibuja origen.js y la convierte en una
   sala de exhibición: rejilla sobre marfil, vista rápida a
   pantalla completa y una tableta que vuela hasta la bolsa.
   Los botones conservan [data-add], así que la bolsa original
   sigue siendo la que manda.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var EN = doc.documentElement.lang === "en";
  function t(es, en) { return EN ? en : es; }

  /* ---------------------------------------------------------- */
  /* 1. Leer la colección ya dibujada                           */
  /* ---------------------------------------------------------- */
  var monte = doc.querySelector("[data-collection]");
  var fichas = [];

  if (monte) {
    Array.prototype.forEach.call(monte.querySelectorAll("[data-product]"), function (art, i) {
      var img = art.querySelector(".product-media img");
      var boton = art.querySelector("[data-add]");
      var meta = (art.querySelector(".product-pct") || {}).textContent || "";
      var medidor = art.querySelectorAll(".intensity span.on").length;
      fichas.push({
        id: art.getAttribute("data-product"),
        n: String(i + 1).padStart(2, "0"),
        nombre: (art.querySelector(".product-name") || {}).textContent || "",
        meta: meta.trim(),
        notas: ((art.querySelector(".product-notes") || {}).textContent || "").trim(),
        precio: ((art.querySelector(".product-price") || {}).textContent || "").trim(),
        img: img ? img.getAttribute("src") : "",
        alt: img ? img.getAttribute("alt") : "",
        fuerza: medidor,
        add: boton ? boton.getAttribute("data-add") : null,
        limitada: /limitad|limited/i.test(meta),
        insignia: art.getAttribute("data-product") === "latitud"
      });
    });
  }

  if (!fichas.length) return; // sin colección esta página no necesita boutique

  /* ---------------------------------------------------------- */
  /* 2. Levantar la sala                                        */
  /* ---------------------------------------------------------- */
  function el(tag, cls, txt) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }

  var piso = el("div", "bq-floor");

  /* Si la página ya se presentó con su propio titular, la sala no repite
     el discurso: sólo pone el rótulo de la vitrina. */
  var yaPresentada = !!doc.querySelector(".page-head .display");

  var cabeza = el("div", "bq-floor__head" + (yaPresentada ? " bq-floor__head--slim" : ""));
  var izq = el("div");
  izq.appendChild(el("p", "eyebrow", t("La sala", "The room")));
  if (!yaPresentada) {
    var h2 = el("h2");
    h2.innerHTML = t("Seis tabletas. <em>Elija la suya.</em>", "Six bars. <em>Choose yours.</em>");
    izq.appendChild(h2);
  }
  cabeza.appendChild(izq);
  cabeza.appendChild(el("p", "bq-floor__count",
    fichas.length + t(" ediciones · 58% – 92% cacao", " editions · 58% – 92% cacao")));
  piso.appendChild(cabeza);

  var rejilla = el("div", "bq-grid");

  fichas.forEach(function (f, i) {
    var tarjeta = el("article", "bq-card");
    tarjeta.setAttribute("data-bq", String(i));
    tarjeta.style.transitionDelay = (i * 70) + "ms";

    var numeral = el("span", "bq-card__num", f.n);
    numeral.setAttribute("aria-hidden", "true"); // filigrana decorativa
    tarjeta.appendChild(numeral);
    if (f.limitada) tarjeta.appendChild(el("span", "bq-card__flag", t("Edición limitada", "Limited edition")));
    else if (f.insignia) tarjeta.appendChild(el("span", "bq-card__flag bq-card__flag--house", t("La insignia", "The signature")));

    var peana = el("div", "bq-card__stage");
    var im = doc.createElement("img");
    im.src = f.img; im.alt = f.alt; im.loading = i < 3 ? "eager" : "lazy"; im.decoding = "async";
    peana.appendChild(im);
    tarjeta.appendChild(peana);

    var col = el("div", "bq-card__col");
    col.appendChild(el("h3", "bq-card__name", f.nombre));
    col.appendChild(el("p", "bq-card__meta", f.meta));
    col.appendChild(el("p", "bq-card__notes", f.notas));

    var medidor = el("div", "bq-meter");
    medidor.setAttribute("aria-label", t("Intensidad ", "Intensity ") + f.fuerza + t(" de 5", " of 5"));
    for (var k = 0; k < 5; k++) {
      var s = el("span", k < f.fuerza ? "on" : "");
      s.style.setProperty("--md", (i * 70 + k * 80 + 180) + "ms");
      medidor.appendChild(s);
    }
    col.appendChild(medidor);

    var pie = el("div", "bq-card__foot");
    pie.appendChild(el("span", "bq-card__price", f.precio));
    var actos = el("div", "bq-card__acts");

    var ver = el("button", "bq-look", t("Ver", "View"));
    ver.type = "button";
    ver.setAttribute("data-bq-look", String(i));
    ver.setAttribute("aria-label", t("Ver ", "View ") + f.nombre);
    actos.appendChild(ver);

    var mas = el("button", "bq-add");
    mas.type = "button";
    if (f.add) mas.setAttribute("data-add", f.add);
    mas.setAttribute("aria-label", t("Añadir ", "Add ") + f.nombre + t(" a la bolsa", " to the bag"));
    actos.appendChild(mas);

    pie.appendChild(actos);
    col.appendChild(pie);
    tarjeta.appendChild(col);

    rejilla.appendChild(tarjeta);
  });

  piso.appendChild(rejilla);

  monte.innerHTML = "";
  monte.appendChild(piso);


  /* ---------------------------------------------------------- */
  /* 2 bis. EL DIAL: la tienda entera en un gesto               */
  /* ---------------------------------------------------------- */
  var escala = fichas.map(function (f, i) {
    var m = (f.meta || "").match(/(\d+)\s*%/);
    return { i: i, pct: m ? parseInt(m[1], 10) : 0 };
  }).filter(function (x) { return x.pct; })
    .sort(function (a, b) { return a.pct - b.pct; });

  if (escala.length > 2) {
    var MIN = escala[0].pct;
    var MAX = escala[escala.length - 1].pct;

    /* La sala se oscurece a medida que sube el cacao, pero por la rampa
       cálida de la casa: de la leche al cacao negro. Un degradado lineal
       entre marfil y negro pasaría por el gris, y el gris no es chocolate. */
    var RAMPA = [
      [0.00, [240, 231, 215]],
      [0.25, [217, 191, 156]],
      [0.50, [140,  95,  60]],
      [0.75, [ 61,  37,  25]],
      [1.00, [ 10,   7,   5]]
    ];
    function tono(k) {
      for (var i = 1; i < RAMPA.length; i++) {
        if (k <= RAMPA[i][0]) {
          var a = RAMPA[i - 1], b = RAMPA[i];
          var u = (k - a[0]) / (b[0] - a[0]);
          return "rgb(" +
            Math.round(a[1][0] + (b[1][0] - a[1][0]) * u) + "," +
            Math.round(a[1][1] + (b[1][1] - a[1][1]) * u) + "," +
            Math.round(a[1][2] + (b[1][2] - a[1][2]) * u) + ")";
        }
      }
      return "rgb(10,7,5)";
    }

    var dial = el("section", "bq-dial");
    dial.setAttribute("aria-label", t("Elegir por intensidad", "Choose by intensity"));
    dial.innerHTML =
      '<div class="bq-dial__in">' +
        '<p class="bq-dial__eyebrow">' + t("Elija su intensidad", "Choose your intensity") + '</p>' +
        '<div class="bq-dial__stage" data-dial-stage></div>' +
        '<div>' +
          '<p class="bq-dial__pct"><span data-dial-pct>' + MIN + '</span><sup>%</sup></p>' +
          '<h3 class="bq-dial__name" data-dial-name></h3>' +
          '<p class="bq-dial__notes" data-dial-notes></p>' +
          '<div class="bq-dial__scale" data-dial-scale tabindex="0" role="slider" ' +
               'aria-valuemin="' + MIN + '" aria-valuemax="' + MAX + '" aria-valuenow="' + MIN + '" ' +
               'aria-label="' + t("Intensidad de cacao", "Cacao intensity") + '">' +
            '<div class="bq-dial__rail">' +
              '<div class="bq-dial__fill" data-dial-fill></div>' +
              '<div class="bq-dial__knob" data-dial-knob></div>' +
            '</div>' +
            '<div class="bq-dial__ends"><span>' + MIN + '%</span><span>' + MAX + '%</span></div>' +
          '</div>' +
          '<div class="bq-dial__buy">' +
            '<span class="bq-dial__price" data-dial-price></span>' +
            '<button class="bq-dial__cta" type="button" data-dial-add>' + t("Añadir a la bolsa", "Add to bag") + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var dStage = dial.querySelector("[data-dial-stage]");
    var dPct = dial.querySelector("[data-dial-pct]");
    var dName = dial.querySelector("[data-dial-name]");
    var dNotes = dial.querySelector("[data-dial-notes]");
    var dPrice = dial.querySelector("[data-dial-price]");
    var dFill = dial.querySelector("[data-dial-fill]");
    var dKnob = dial.querySelector("[data-dial-knob]");
    var dScale = dial.querySelector("[data-dial-scale]");
    var dRail = dial.querySelector(".bq-dial__rail");
    var dAdd = dial.querySelector("[data-dial-add]");

    escala.forEach(function (x) {
      var im = doc.createElement("img");
      im.src = fichas[x.i].img;
      im.alt = fichas[x.i].alt;
      im.loading = "lazy";
      im.decoding = "async";
      dStage.appendChild(im);

      var tk = el("i", "bq-dial__tick");
      tk.style.left = (((x.pct - MIN) / (MAX - MIN)) * 100) + "%";
      dRail.appendChild(tk);
    });

    var puesto = -1;

    function marcar(j, silencio) {
      if (j === puesto) return;
      puesto = j;
      var x = escala[j];
      var f = fichas[x.i];
      var k = (x.pct - MIN) / (MAX - MIN);

      Array.prototype.forEach.call(dStage.children, function (im, n) {
        im.classList.toggle("is-on", n === j);
      });

      dPct.textContent = x.pct;
      dName.textContent = f.nombre;
      dNotes.textContent = f.notas;
      dPrice.textContent = f.precio;

      dFill.style.setProperty("--p", k.toFixed(4));
      dKnob.style.left = (k * 100) + "%";
      dKnob.style.transform = "none";
      dScale.setAttribute("aria-valuenow", String(x.pct));
      dScale.setAttribute("aria-valuetext", x.pct + "% · " + f.nombre);

      var claro = k < 0.42; // por encima de ese punto la sala ya es oscura
      dial.style.setProperty("--dial-bg", tono(k));
      dial.style.setProperty("--dial-ink", claro ? "#1a120c" : "#f6f1e8");
      dial.style.setProperty("--dial-dim", claro ? "rgba(26,18,12,.66)" : "rgba(246,241,232,.68)");
      dial.style.setProperty("--dial-faint", claro ? "rgba(26,18,12,.42)" : "rgba(246,241,232,.46)");
      dial.style.setProperty("--dial-hair", claro ? "rgba(26,18,12,.22)" : "rgba(246,241,232,.26)");
      /* Sobre los tonos medios de la rampa (~72%) el cobre caía a 2:1.
         El acento sale ahora de la tinta: siempre por encima de 4.5:1
         y el color lo pone la sala, no el control. */
      dial.style.setProperty("--dial-accent", claro ? "#1a120c" : "#f6f1e8");
      dial.classList.toggle("bq-dial--oscuro", !claro);

      dAdd.classList.remove("is-done");
      if (!silencio) dAdd.textContent = t("Añadir a la bolsa", "Add to bag");
    }

    /* el punto más cercano al gesto: nada de valores intermedios falsos */
    function desdeX(clientX) {
      var r = dRail.getBoundingClientRect();
      var k = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      var objetivo = MIN + k * (MAX - MIN);
      var mejor = 0, dist = Infinity;
      escala.forEach(function (x, j) {
        var d = Math.abs(x.pct - objetivo);
        if (d < dist) { dist = d; mejor = j; }
      });
      marcar(mejor);
    }

    var arrastrando = false;
    dScale.addEventListener("pointerdown", function (e) {
      arrastrando = true;
      try { dScale.setPointerCapture(e.pointerId); } catch (_) {}
      desdeX(e.clientX);
    });
    dScale.addEventListener("pointermove", function (e) { if (arrastrando) desdeX(e.clientX); });
    dScale.addEventListener("pointerup", function () { arrastrando = false; });
    dScale.addEventListener("pointercancel", function () { arrastrando = false; });
    dScale.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { marcar(Math.min(puesto + 1, escala.length - 1)); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { marcar(Math.max(puesto - 1, 0)); e.preventDefault(); }
      else if (e.key === "Home") { marcar(0); e.preventDefault(); }
      else if (e.key === "End") { marcar(escala.length - 1); e.preventDefault(); }
    });

    /* deslizar sobre la tableta también recorre la escala */
    var tx = null;
    dStage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    dStage.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var d = e.changedTouches[0].clientX - tx;
      if (Math.abs(d) > 50) marcar(Math.max(0, Math.min(escala.length - 1, puesto + (d < 0 ? 1 : -1))));
      tx = null;
    }, { passive: true });

    dAdd.addEventListener("click", function () {
      var f = fichas[escala[puesto].i];
      if (!f.add) return;
      var puente = doc.createElement("button");
      puente.setAttribute("data-add", f.add);
      puente.style.display = "none";
      doc.body.appendChild(puente);
      puente.click();
      doc.body.removeChild(puente);
      dAdd.classList.add("is-done");
      dAdd.textContent = t("Añadida ✓", "Added ✓");
      celebrar(f, dStage.querySelector("img.is-on"));
    });

    /* la insignia de la casa es el punto de partida natural */
    var arranque = 0;
    escala.forEach(function (x, j) { if (fichas[x.i].insignia) arranque = j; });

    monte.insertBefore(dial, piso); // el dial es la portada de la tienda
    marcar(arranque, true);
  }

  /* ---------------------------------------------------------- */
  /* 3. Vista rápida                                            */
  /* ---------------------------------------------------------- */
  var hoja = el("aside", "bq-sheet");
  hoja.setAttribute("role", "dialog");
  hoja.setAttribute("aria-modal", "true");
  hoja.setAttribute("aria-hidden", "true");
  hoja.innerHTML =
    '<div class="bq-sheet__media">' +
      '<img alt="" data-bq-img />' +
      '<button class="bq-sheet__step bq-sheet__step--prev" type="button" data-bq-prev aria-label="' + t("Anterior", "Previous") + '">‹</button>' +
      '<button class="bq-sheet__step bq-sheet__step--next" type="button" data-bq-next aria-label="' + t("Siguiente", "Next") + '">›</button>' +
    '</div>' +
    '<div class="bq-sheet__body"><div class="bq-sheet__in">' +
      '<p class="bq-sheet__eyebrow" data-bq-eyebrow></p>' +
      '<h2 class="bq-sheet__name" data-bq-name></h2>' +
      '<p class="bq-sheet__meta" data-bq-meta></p>' +
      '<p class="bq-sheet__copy" data-bq-copy></p>' +
      '<dl class="bq-spec">' +
        '<div><dt>' + t("Intensidad", "Intensity") + '</dt><dd data-bq-int></dd></div>' +
        '<div><dt>' + t("Formato", "Format") + '</dt><dd>70 g</dd></div>' +
      '</dl>' +
      '<div class="bq-sheet__buy">' +
        '<span class="bq-sheet__price" data-bq-price></span>' +
        '<button class="bq-sheet__cta" type="button" data-bq-add>' + t("Añadir a la bolsa", "Add to bag") + '</button>' +
      '</div>' +
    '</div></div>' +
    '<button class="bq-sheet__close" type="button" data-bq-close aria-label="' + t("Cerrar", "Close") + '">×</button>';
  doc.body.appendChild(hoja);

  var sImg = hoja.querySelector("[data-bq-img]");
  var sEye = hoja.querySelector("[data-bq-eyebrow]");
  var sName = hoja.querySelector("[data-bq-name]");
  var sMeta = hoja.querySelector("[data-bq-meta]");
  var sCopy = hoja.querySelector("[data-bq-copy]");
  var sInt = hoja.querySelector("[data-bq-int]");
  var sPrice = hoja.querySelector("[data-bq-price]");
  var sAdd = hoja.querySelector("[data-bq-add]");
  var abierta = -1;
  var devolverFoco = null;

  Array.prototype.forEach.call(hoja.querySelectorAll(".bq-sheet__in > *"), function (n, i) {
    n.style.setProperty("--sd", (140 + i * 70) + "ms");
  });

  function pintar(i) {
    var f = fichas[i];
    abierta = i;
    sImg.src = f.img; sImg.alt = f.alt;
    sEye.textContent = t("Edición ", "Edition ") + f.n + (f.limitada ? t(" · limitada", " · limited") : "");
    sName.textContent = f.nombre;
    sMeta.textContent = f.meta;
    sCopy.textContent = f.notas;
    sInt.textContent = f.fuerza + " / 5";
    sPrice.textContent = f.precio;
    sAdd.classList.remove("is-done");
    sAdd.textContent = t("Añadir a la bolsa", "Add to bag");
    if (f.add) sAdd.setAttribute("data-bq-for", f.add);
  }

  function abrir(i, origen) {
    devolverFoco = origen || null;
    pintar(i);
    hoja.classList.add("is-open");
    hoja.setAttribute("aria-hidden", "false");
    doc.body.classList.add("no-scroll");
    root.classList.add("bq-looking");
    window.setTimeout(function () { hoja.querySelector("[data-bq-close]").focus(); }, 60);
  }

  function cerrar() {
    hoja.classList.remove("is-open");
    hoja.setAttribute("aria-hidden", "true");
    doc.body.classList.remove("no-scroll");
    root.classList.remove("bq-looking");
    abierta = -1;
    if (devolverFoco) { devolverFoco.focus(); devolverFoco = null; }
  }

  function pasar(d) {
    if (abierta < 0) return;
    pintar((abierta + d + fichas.length) % fichas.length);
  }

  /* ---------------------------------------------------------- */
  /* 4. La tableta vuela hasta la bolsa                         */
  /* ---------------------------------------------------------- */
  var bolsa = doc.querySelector(".bag-btn");
  var cuenta = doc.querySelector("[data-bag-count]");

  var brindis = el("div", "bq-toast");
  brindis.setAttribute("role", "status");
  brindis.innerHTML = '<img alt="" data-bq-toast-img /><div><span>' +
    t("Añadido a la bolsa", "Added to the bag") + '</span><b data-bq-toast-name></b></div>';
  doc.body.appendChild(brindis);
  var bImg = brindis.querySelector("[data-bq-toast-img]");
  var bName = brindis.querySelector("[data-bq-toast-name]");
  var relojBrindis;

  /* origen.js abre el cajón en cada añadido. Aquí sobra: el brindis y el
     salto del contador ya avisan, y en la vista rápida el cajón quedaría
     atrapado debajo. Lo devolvemos a su sitio sin tocar origen.js. */
  var cajon = doc.querySelector("[data-cart]");
  var velo = doc.querySelector("[data-cart-scrim]");

  function silenciarCajon() {
    if (!cajon) return;
    cajon.classList.remove("is-open");
    cajon.setAttribute("aria-hidden", "true");
    if (velo) velo.classList.remove("is-open");
    doc.body.classList.toggle("no-scroll", abierta >= 0);
  }

  function celebrar(f, desde) {
    silenciarCajon();
    if (bolsa) {
      bolsa.classList.remove("is-pop");
      void bolsa.offsetWidth;
      bolsa.classList.add("is-pop");
    }
    if (cuenta) {
      cuenta.classList.remove("is-pop");
      void cuenta.offsetWidth;
      cuenta.classList.add("is-pop");
    }

    bImg.src = f.img;
    bName.textContent = f.nombre;
    brindis.classList.add("is-on");
    window.clearTimeout(relojBrindis);
    relojBrindis = window.setTimeout(function () { brindis.classList.remove("is-on"); }, 2600);

    if (quieto || !desde || !bolsa) return;

    var a = desde.getBoundingClientRect();
    var b = bolsa.getBoundingClientRect();
    var vuelo = doc.createElement("img");
    vuelo.className = "bq-fly";
    vuelo.src = f.img;
    vuelo.alt = "";
    vuelo.style.width = a.width + "px";
    vuelo.style.height = a.height + "px";
    vuelo.style.left = a.left + "px";
    vuelo.style.top = a.top + "px";
    doc.body.appendChild(vuelo);

    var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    var dy = (b.top + b.height / 2) - (a.top + a.height / 2);

    requestAnimationFrame(function () {
      vuelo.style.transition = "transform .85s cubic-bezier(.5,0,.2,1), opacity .3s .55s ease";
      vuelo.style.transform = "translate3d(" + dx + "px," + dy + "px,0) scale(.08) rotate(14deg)";
      vuelo.style.opacity = "0";
    });
    window.setTimeout(function () { if (vuelo.parentNode) vuelo.parentNode.removeChild(vuelo); }, 1000);
  }

  /* ---------------------------------------------------------- */
  /* 5. Un solo oyente para toda la sala                        */
  /* ---------------------------------------------------------- */
  doc.addEventListener("click", function (e) {
    var ver = e.target.closest ? e.target.closest("[data-bq-look]") : null;
    if (ver) { abrir(parseInt(ver.getAttribute("data-bq-look"), 10), ver); return; }

    if (e.target.closest("[data-bq-close]")) { cerrar(); return; }
    if (e.target.closest("[data-bq-prev]")) { pasar(-1); return; }
    if (e.target.closest("[data-bq-next]")) { pasar(1); return; }

    // el botón redondo de la tarjeta: origen.js ya lo metió en la bolsa
    var mas = e.target.closest(".bq-add[data-add]");
    if (mas) {
      var tarjeta = mas.closest(".bq-card");
      var idx = tarjeta ? parseInt(tarjeta.getAttribute("data-bq"), 10) : -1;
      if (idx >= 0) {
        mas.classList.add("is-done");
        window.setTimeout(function () { mas.classList.remove("is-done"); }, 1500);
        celebrar(fichas[idx], tarjeta.querySelector(".bq-card__stage img"));
      }
      return;
    }

    // el botón grande de la vista rápida
    if (e.target.closest("[data-bq-add]") && abierta >= 0) {
      var f = fichas[abierta];
      sAdd.classList.add("is-done");
      sAdd.textContent = t("Añadida ✓", "Added ✓");
      celebrar(f, sImg);
      return;
    }
  });

  // en la vista rápida el botón no lleva [data-add]: se lo pasamos a origen.js
  sAdd.addEventListener("click", function () {
    if (abierta < 0) return;
    var id = fichas[abierta].add;
    if (!id) return;
    var puente = doc.createElement("button");
    puente.setAttribute("data-add", id);
    puente.style.display = "none";
    doc.body.appendChild(puente);
    puente.click();
    doc.body.removeChild(puente);
  });

  doc.addEventListener("keydown", function (e) {
    if (abierta < 0) return;
    if (e.key === "Escape") cerrar();
    else if (e.key === "ArrowLeft") pasar(-1);
    else if (e.key === "ArrowRight") pasar(1);
  });

  /* deslizar entre tabletas en el teléfono */
  var x0 = null;
  hoja.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  hoja.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 56) pasar(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });

  /* ---------------------------------------------------------- */
  /* 6. Entrada de las tarjetas                                 */
  /* ---------------------------------------------------------- */
  var tarjetas = rejilla.querySelectorAll(".bq-card");
  if (quieto || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(tarjetas, function (c) { c.classList.add("is-in"); });
  } else {
    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        ojo.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(tarjetas, function (c) { ojo.observe(c); });
  }

  /* ---------------------------------------------------------- */
  /* 7. Cursor de sala                                          */
  /* ---------------------------------------------------------- */
  if (fino && !quieto) {
    var cursor = el("div", "bq-cursor");
    cursor.setAttribute("aria-hidden", "true");
    cursor.appendChild(el("span", "", t("Ver", "View")));
    doc.body.appendChild(cursor);

    var raton = { x: -100, y: -100 };
    var suave = { x: -100, y: -100 };
    var girando = false, reposo = 0;

    doc.addEventListener("mousemove", function (e) {
      raton.x = e.clientX; raton.y = e.clientY;
      if (!root.classList.contains("bq-cur-on")) root.classList.add("bq-cur-on");
      arrancar();
    }, { passive: true });
    doc.addEventListener("mouseleave", function () { root.classList.remove("bq-cur-on"); });
    doc.addEventListener("mouseover", function (e) {
      var sobre = e.target.closest ? e.target.closest(".bq-card__stage, .bq-sheet__media") : null;
      root.classList.toggle("bq-cur-look", !!sobre);
    }, { passive: true });

    var latido = function () {
      girando = true;
      suave.x += (raton.x - suave.x) * 0.2;
      suave.y += (raton.y - suave.y) * 0.2;
      cursor.style.transform = "translate3d(" + suave.x.toFixed(1) + "px," + suave.y.toFixed(1) + "px,0)";
      var quieta = Math.abs(raton.x - suave.x) < 0.4 && Math.abs(raton.y - suave.y) < 0.4;
      reposo = quieta ? reposo + 1 : 0;
      if (reposo > 30) { girando = false; return; }
      requestAnimationFrame(latido);
    };
    var arrancar = function () { if (!girando) { reposo = 0; requestAnimationFrame(latido); } };
  }

  /* En el teléfono el botón «Ver» no cabe, así que la tarjeta entera abre
     la vista rápida. Todo menos el botón de añadir, que tiene lo suyo. */
  Array.prototype.forEach.call(tarjetas, function (c) {
    c.addEventListener("click", function (e) {
      if (e.target.closest(".bq-add") || e.target.closest(".bq-look")) return;
      abrir(parseInt(c.getAttribute("data-bq"), 10), c.querySelector(".bq-look") || c.querySelector(".bq-add"));
    });
  });
})();

/* ═══════════════════════════════════════════════════════════
   ORIGEN 0° · inmersión de casa
   Vive fuera del bloque anterior para que también actúe en las
   páginas que no tienen colección.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 0. Menos palabras en el teléfono ─────────────────────── */
  var movil = window.matchMedia("(max-width: 640px)");
  var cortos = doc.querySelectorAll("[data-corto]");

  function ajustarCopia() {
    Array.prototype.forEach.call(cortos, function (n) {
      if (movil.matches) {
        if (n.dataset.largo === undefined) n.dataset.largo = n.innerHTML;
        var corto = n.getAttribute("data-corto");
        if (n.textContent.trim() !== corto) n.textContent = corto;
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

  /* ── 1. Envoltura entre páginas ───────────────────────────── */
  var PAGS = /^(demo-servicios|origen-coleccion|origen-caja|origen-origenes|origen-sociedad)$/;
  var envoltura = doc.querySelector("[data-bq-wrapper]");
  var sello = envoltura && envoltura.querySelector("[data-bq-seal]");

  if (envoltura && !quieto) {
    window.setTimeout(function () { envoltura.style.display = "none"; }, 1300);

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
      if (!PAGS.test(hoja)) return;

      ev.preventDefault();
      if (sello) sello.textContent = (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30);
      envoltura.style.display = "";
      envoltura.classList.add("is-wrapping");
      window.setTimeout(function () { location.href = destino.href; }, 640);
    });

    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { envoltura.classList.remove("is-wrapping"); envoltura.style.display = "none"; }
    });
  }

  /* ---------------------------------------------------------- */
  /* 3. El carrete de la elaboración                            */
  /* ---------------------------------------------------------- */
  var carrete = doc.querySelector(".process-track");
  var pasos = carrete ? carrete.querySelectorAll(".process-step") : [];

  if (carrete && pasos.length && !quieto) {
    var barra = doc.createElement("div");
    barra.className = "process-rail";
    barra.setAttribute("aria-hidden", "true");
    barra.innerHTML = "<i></i>";
    carrete.parentNode.insertBefore(barra, carrete.nextSibling);
    var aguja = barra.firstChild;

    var pendiente = false;

    function medir() {
      pendiente = false;
      if (!carrete.offsetParent) return;          // oculto: nada que medir
      var r = carrete.getBoundingClientRect();
      var centro = r.left + r.width / 2;
      var cerca = null, dCerca = Infinity;

      for (var i = 0; i < pasos.length; i++) {
        var p = pasos[i];
        var b = p.getBoundingClientRect();
        var d = Math.abs(b.left + b.width / 2 - centro);
        // 1 en el centro, 0 a una tarjeta y media de distancia
        var k = Math.max(0, 1 - d / (b.width * 1.5));
        p.style.setProperty("--k", k.toFixed(3));
        if (d < dCerca) { dCerca = d; cerca = p; }
      }

      for (var j = 0; j < pasos.length; j++) pasos[j].classList.toggle("is-foco", pasos[j] === cerca);

      var recorrido = carrete.scrollWidth - carrete.clientWidth;
      var avance = recorrido > 0 ? carrete.scrollLeft / recorrido : 0;
      var anchoAguja = aguja.getBoundingClientRect().width || 1;
      aguja.style.setProperty("--w", (100 / pasos.length) + "%");
      aguja.style.setProperty("--x", (avance * (barra.clientWidth - anchoAguja)).toFixed(1) + "px");
    }

    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } }

    carrete.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(pedir).observe(carrete);
    requestAnimationFrame(medir);
  }
  /* ── 2. Titulares palabra a palabra ───────────────────────── */
  if (quieto || !("IntersectionObserver" in window)) return;

  function partir(el) {
    if (el.dataset.bqSplit) return;
    el.dataset.bqSplit = "1";
    el.classList.add("bq-split");

    var trozos = [];
    (function recorrer(n) {
      for (var i = 0; i < n.childNodes.length; i++) {
        var c = n.childNodes[i];
        if (c.nodeType === 3) trozos.push({ padre: n, nodo: c });
        else if (c.nodeType === 1 && !c.classList.contains("bq-w")) recorrer(c);
      }
    })(el);

    var k = 0;
    trozos.forEach(function (tr) {
      var frag = doc.createDocumentFragment();
      tr.nodo.nodeValue.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
        var caja = doc.createElement("span");
        caja.className = "bq-w";
        var dentro = doc.createElement("span");
        dentro.textContent = p;
        dentro.style.setProperty("--d", (k * 60) + "ms");
        k++;
        caja.appendChild(dentro);
        frag.appendChild(caja);
      });
      tr.padre.replaceChild(frag, tr.nodo);
    });
  }

  var titulares = doc.querySelectorAll(".page-head .display, .hero .display, .section .display, .bq-floor__head h2");
  var ojo = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-lit");
      ojo.unobserve(e.target);
    });
  }, { threshold: 0.24, rootMargin: "0px 0px -6% 0px" });

  Array.prototype.forEach.call(titulares, function (h) { partir(h); ojo.observe(h); });
})();
