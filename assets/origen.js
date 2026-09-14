/* ═══════════════════════════════════════════════════════════
   ORIGEN 0° — motor de la tienda (CSP-safe, sin dependencias)
   La colección con sus fincas y lotes, la bolsa que sobrevive a
   la navegación, el envío en frío, la caja de degustación y la
   API (window.ORIGEN) que usa la boutique para su ficha.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var isEnglish = /^en\b/i.test(doc.documentElement.lang || "");
  var locale = isEnglish ? "en-US" : "es-EC";
  var assetRoot = isEnglish ? "../assets/origen/" : "assets/origen/";
  var t = function (spanish, english) { return isEnglish ? english : spanish; };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var money = function (n) { return "$" + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, ""); };
  var num = function (n) { return Number(n).toLocaleString(locale); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var FREE_SHIP = 90;   /* envío en frío sin costo desde aquí */
  var SHIP_COST = 9;
  var TRIO_OFF = 0.9;   /* el estuche de tres cuesta un 10% menos */

  /* las coordenadas se guardan en inglés (W) y se leen en el idioma de la página */
  var coord = function (s) { return isEnglish ? s : s.replace(/ W$/, " O"); };

  /* ── la colección: seis fincas, seis familias, seis lotes ── */
  var PRODUCTS = [
    { id: "nube", name: "Nube de Leche", pct: "58%", price: 24, img: assetRoot + "cloud-milk.jpg",
      origin: "Manabí", place: "Jama, Manabí", farm: "Finca La Esperanza", family: t("familia Zambrano", "the Zambrano family"),
      coord: coord("0°12′ S · 80°16′ W"), alt: "40 m", lot: "NL-2605", lotTotal: 1800, lotLeft: 640,
      intensity: 2, kind: "milk", light: true,
      ing: t("Cacao, leche entera, panela", "Cacao, whole milk, panela"),
      notes: t("Leche tostada · panela · vainilla", "Toasted milk · panela · vanilla"),
      copy: t("Una barra de leche que todavía sabe a cacao. Endulzada con panela de la misma costa, sin vainillina ni emulsionantes.",
              "A milk bar that still tastes of cacao. Sweetened with panela from the same coast, with no vanillin and no emulsifiers."),
      melt: [[t("Al entrar", "First"), t("Leche tostada", "Toasted milk")], [t("A los 20 s", "At 20 s"), t("Caramelo de panela", "Panela caramel")], [t("Al final", "Finish"), t("Vainilla y cacao suave", "Vanilla and soft cacao")]],
      pair: t("Café de Loja con leche, o un moscatel frío.", "Loja coffee with milk, or a chilled moscatel."),
      rating: 4.8, count: 212,
      reviews: [
        { n: "Carolina M.", c: "Guayaquil", x: t("Mis hijos la piden por su nombre. Yo también, a escondidas.", "My kids ask for it by name. So do I, secretly.") },
        { n: "Tom H.", c: "Toronto", x: t("La primera leche que no me empalaga a la tercera pieza.", "The first milk bar that doesn't cloy by the third piece.") }
      ] },
    { id: "latitud", name: "Latitud Cero", pct: "72%", price: 28, img: assetRoot + "latitude-zero.jpg",
      origin: "Los Ríos", place: "Vinces, Los Ríos", farm: "Finca El Paraíso", family: t("familia Cedeño", "the Cedeño family"),
      coord: coord("1°33′ S · 79°45′ W"), alt: "60 m", lot: "LC-2614", lotTotal: 1240, lotLeft: 212,
      intensity: 3, kind: "dark", feature: true,
      ing: t("Cacao, azúcar de caña", "Cacao, cane sugar"),
      notes: t("Frambuesa · cacao tostado · jazmín", "Raspberry · roasted cacao · jasmine"),
      copy: t("La primera barra que hicimos y la que más se pide. Grano Nacional de la familia Cedeño: abre con frambuesa, se asienta en cacao tostado y termina en jazmín.",
              "The first bar we made and still the most ordered. Nacional beans from the Cedeño family: it opens with raspberry, settles into roasted cacao, and finishes on jasmine."),
      melt: [[t("Al entrar", "First"), t("Frambuesa", "Raspberry")], [t("A los 20 s", "At 20 s"), t("Cacao tostado", "Roasted cacao")], [t("Al final", "Finish"), t("Jazmín, largo", "Jasmine, long")]],
      pair: t("Café de Loja filtrado, o un pinot noir ligero.", "Filter coffee from Loja, or a light pinot noir."),
      rating: 4.9, count: 486,
      reviews: [
        { n: "Andrés V.", c: "Quito", x: t("Pedí una para probar. Ahora me llega cada mes con la Sociedad.", "I ordered one to try. Now it arrives every month with the Society.") },
        { n: "Claire D.", c: "Montréal", x: t("El jazmín del final es real. No lo creí hasta probarla.", "The jasmine at the end is real. I didn't believe it until I tasted it.") }
      ] },
    { id: "tierra", name: "Tierra Negra", pct: "85%", price: 30, img: assetRoot + "tierra-negra.jpg",
      origin: "Esmeraldas", place: "Quinindé, Esmeraldas", farm: "Finca Las Delicias", family: t("familia Quiñónez", "the Quiñónez family"),
      coord: coord("0°19′ N · 79°28′ W"), alt: "140 m", lot: "TN-2608", lotTotal: 860, lotLeft: 97,
      intensity: 4, kind: "intense",
      ing: t("Cacao, azúcar de caña", "Cacao, cane sugar"),
      notes: t("Nuez · ciruela negra · mineral", "Walnut · black plum · mineral"),
      copy: t("Suelo volcánico y lluvia todo el año. Un 85% que no amarga: seco, mineral y con un final de ciruela que dura casi un minuto.",
              "Volcanic soil and rain all year. An 85% that isn't bitter: dry, mineral, with a black-plum finish that lasts almost a minute."),
      melt: [[t("Al entrar", "First"), t("Tierra húmeda y nuez", "Damp earth and walnut")], [t("A los 20 s", "At 20 s"), t("Ciruela negra", "Black plum")], [t("Al final", "Finish"), t("Mineral, seco", "Mineral, dry")]],
      pair: t("Un espresso corto, o un whisky ahumado.", "A short espresso, or a smoky whisky."),
      rating: 4.8, count: 158,
      reviews: [
        { n: "Javier R.", c: "Cuenca", x: t("Pensé que un 85% iba a ser castigo. Es la más redonda de todas.", "I thought an 85% would be punishment. It's the roundest of them all.") },
        { n: "Sofia L.", c: "Milano", x: t("La como con el café de la mañana. Un cuadrado basta.", "I have it with my morning coffee. One square is enough.") }
      ] },
    { id: "altitud", name: "Altitud Pura", pct: "92%", price: 32, img: assetRoot + "pure-altitude.jpg",
      origin: t("Amazonía", "Amazonia"), place: "Archidona, Napo", farm: "Finca Yaku", family: t("familia Grefa", "the Grefa family"),
      coord: coord("0°55′ S · 77°48′ W"), alt: "620 m", lot: "AP-2602", lotTotal: 520, lotLeft: 58,
      intensity: 5, kind: "intense",
      ing: t("Cacao, azúcar de caña", "Cacao, cane sugar"),
      notes: t("Espresso · cedro · cacao puro", "Espresso · cedar · pure cacao"),
      copy: t("Árboles de más de cuarenta años bajo el dosel amazónico. Un 92% con apenas un 8% de azúcar: para quien ya toma el café sin nada.",
              "Trees over forty years old beneath the Amazon canopy. A 92% with barely 8% sugar: for those who already drink their coffee black."),
      melt: [[t("Al entrar", "First"), "Espresso"], [t("A los 20 s", "At 20 s"), t("Cedro", "Cedar")], [t("Al final", "Finish"), t("Cacao puro, sin dulzor", "Pure cacao, no sweetness")]],
      pair: t("Agua con gas. Nada más.", "Sparkling water. Nothing else."),
      rating: 4.7, count: 94,
      reviews: [
        { n: "Daniel P.", c: "Madrid", x: t("Intensa, pero limpia. Ni rastro de la acidez de otros 90%.", "Intense but clean. None of the sourness other 90% bars have.") },
        { n: "María José A.", c: "Quito", x: t("La única oscura que mi padre, diabético, puede disfrutar en un cuadrado.", "The only dark bar my diabetic father can enjoy, one square at a time.") }
      ] },
    { id: "rosa", name: "Rosa & Cacao", pct: "70%", price: 34, img: assetRoot + "rose-cacao.jpg",
      origin: "Manabí", place: "Chone, Manabí", farm: "Finca San Jacinto", family: t("familia Mendoza", "the Mendoza family"),
      coord: coord("0°41′ S · 80°06′ W"), alt: "320 m", lot: "RC-2611", lotTotal: 640, lotLeft: 31,
      intensity: 3, kind: "dark", limited: true,
      ing: t("Cacao, azúcar de caña, pétalos de rosa", "Cacao, cane sugar, rose petals"),
      notes: t("Pétalo de rosa · frutos rojos · final floral", "Rose petal · red berries · floral finish"),
      copy: t("Pétalos de rosa de Cayambe sobre un 70% de fermentación corta. 640 barras numeradas, y no vamos a repetir el lote.",
              "Rose petals from Cayambe over a short-fermented 70%. 640 numbered bars, and we won't repeat the lot."),
      melt: [[t("Al entrar", "First"), t("Pétalo seco", "Dried petal")], [t("A los 20 s", "At 20 s"), t("Frutos rojos", "Red berries")], [t("Al final", "Finish"), t("Rosa, persistente", "Rose, lingering")]],
      pair: t("Un espumante rosado, o té de hibisco frío.", "A rosé sparkling wine, or cold hibiscus tea."),
      rating: 4.9, count: 67,
      reviews: [
        { n: "Valentina C.", c: "Guayaquil", x: t("La regalé en un aniversario. Me pidieron el nombre de la tienda antes que el mío.", "I gave it for an anniversary. They asked for the shop's name before mine.") },
        { n: "Hannah K.", c: "London", x: t("Floral sin parecer jabón, que es lo difícil.", "Floral without tasting like soap, which is the hard part.") }
      ] },
    { id: "sal", name: "Sal Amazónica", pct: "75%", price: 29, img: assetRoot + "amazonian-salt.jpg",
      origin: t("Amazonía", "Amazonia"), place: "Tena, Napo", farm: "Finca Sumak", family: t("familia Tanguila", "the Tanguila family"),
      coord: coord("0°59′ S · 77°49′ W"), alt: "510 m", lot: "SA-2609", lotTotal: 900, lotLeft: 305,
      intensity: 4, kind: "dark",
      ing: t("Cacao, azúcar de caña, sal de manantial", "Cacao, cane sugar, spring salt"),
      notes: t("Sal de manantial · maracuyá · cacao redondo", "Spring salt · passion fruit · round cacao"),
      copy: t("Sal cristalizada de un manantial salino del Napo sobre un 75% de cuerpo tropical. La sal llega primero; el cacao, después.",
              "Salt crystallised from a saline spring in Napo over a full, tropical 75%. The salt arrives first; the cacao follows."),
      melt: [[t("Al entrar", "First"), t("Sal en cristal", "Salt crystal")], [t("A los 20 s", "At 20 s"), t("Maracuyá", "Passion fruit")], [t("Al final", "Finish"), t("Cacao redondo", "Round cacao")]],
      pair: t("Ron añejo, o una cerveza stout.", "Aged rum, or a stout."),
      rating: 4.8, count: 131,
      reviews: [
        { n: "Felipe G.", c: "Loja", x: t("La sal no tapa: despierta. Terminé la barra de pie en la cocina.", "The salt doesn't mask, it wakes things up. I finished the bar standing in the kitchen.") },
        { n: "Emma S.", c: "Amsterdam", x: t("Crujiente, tropical y nada salada en exceso.", "Crunchy, tropical, never too salty.") }
      ] }
  ];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var EXTRA = {
    "soc-descubrimiento": { name: t("Sociedad · Descubrimiento", "Society · Discovery"), price: 34, sub: t("Suscripción mensual · 2 barras", "Monthly subscription · 2 bars"), img: assetRoot + "latitude-zero.jpg" },
    "soc-oscura":         { name: t("Sociedad · Colección Oscura", "Society · Dark Collection"), price: 52, sub: t("Suscripción mensual · 3 barras oscuras", "Monthly subscription · 3 dark bars"), img: assetRoot + "tierra-negra.jpg" },
    "soc-raros":          { name: t("Sociedad · Orígenes Raros", "Society · Rare Origins"), price: 88, sub: t("Suscripción mensual · microlote", "Monthly subscription · microlot"), img: assetRoot + "rose-cacao.jpg" }
  };

  var trioPrice = function (p) { return Math.round(p.price * 3 * TRIO_OFF); };
  var lotText = function (p) {
    return t("Lote ", "Lot ") + p.lot + " · " + t("quedan ", "") + num(p.lotLeft) + t(" de ", " of ") + num(p.lotTotal) + t("", " left");
  };

  /* ── cuándo sale y cuándo llega: corte a las 14:00, lunes a viernes ── */
  var DIAS = isEnglish ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  var MESES = isEnglish ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                        : ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var fmtDay = function (d) {
    return isEnglish ? DIAS[d.getDay()] + ", " + MESES[d.getMonth()] + " " + d.getDate()
                     : DIAS[d.getDay()] + " " + d.getDate() + " " + MESES[d.getMonth()];
  };
  var workday = function (d) { return d.getDay() !== 0 && d.getDay() !== 6; };
  function shipping() {
    var now = new Date();
    var ship = new Date(now);
    if (now.getHours() >= 14 || !workday(now)) ship.setDate(ship.getDate() + 1);
    while (!workday(ship)) ship.setDate(ship.getDate() + 1);
    var arrive = new Date(ship), n = 0;
    while (n < 2) { arrive.setDate(arrive.getDate() + 1); if (workday(arrive)) n++; }
    return { ship: ship, arrive: arrive, today: ship.toDateString() === now.toDateString() };
  }
  function etaText() {
    var s = shipping();
    return s.today
      ? t("Pida antes de las 14:00 y sale hoy de Quito · llega el ", "Order before 2 pm and it leaves Quito today · arrives ") + fmtDay(s.arrive)
      : t("Sale de Quito el ", "Leaves Quito on ") + fmtDay(s.ship) + t(" · llega el ", " · arrives ") + fmtDay(s.arrive);
  }
  function paintEta() {
    Array.prototype.forEach.call(doc.querySelectorAll("[data-eta]"), function (n) { n.textContent = etaText(); });
  }

  /* ── la bolsa y la confirmación viven en todas las páginas ── */
  if (!doc.querySelector("[data-cart]")) {
    var shell = doc.createElement("div");
    shell.innerHTML =
      '<div class="cart-scrim" data-cart-scrim aria-hidden="true"></div>' +
      '<aside class="cart" data-cart role="dialog" aria-modal="true" aria-label="' + t("Bolsa de compra", "Shopping bag") + '" aria-hidden="true">' +
        '<div class="cart-head"><b class="serif">' + t("Su bolsa", "Your bag") + ' <span class="cart-n" data-cart-n></span></b>' +
        '<button class="cart-close" type="button" data-cart-close aria-label="' + t("Cerrar bolsa", "Close bag") + '">×</button></div>' +
        '<div class="cart-free" data-free><p data-free-msg></p><div class="free-bar" aria-hidden="true"><i data-free-bar></i></div></div>' +
        '<div class="cart-body" data-cart-body></div>' +
        '<div class="cart-x" data-cart-x hidden></div>' +
        '<div class="cart-foot">' +
          '<div class="cart-line"><span>' + t("Subtotal", "Subtotal") + '</span><span data-cart-sub>$0</span></div>' +
          '<div class="cart-line"><span>' + t("Envío en frío", "Cold shipping") + '</span><span data-cart-ship>—</span></div>' +
          '<div class="cart-total"><span>' + t("Total", "Total") + '</span><b class="serif" data-cart-total>$0</b></div>' +
          '<p class="cart-eta" data-eta></p>' +
          '<button class="btn btn--solid" type="button" data-checkout disabled>' + t("Pagar", "Pay") + '</button>' +
          '<p class="cart-safe">' + t("Pago cifrado · demo: no se cobra nada", "Encrypted payment · demo: nothing is charged") + '</p>' +
        '</div>' +
      '</aside>' +
      '<div class="confirm" data-confirm role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-hidden="true"><div class="confirm-in">' +
        '<p class="eyebrow">' + t("Pedido ", "Order ") + '<span data-order-no></span></p>' +
        '<h2 class="serif" id="confirm-title" data-confirm-title></h2>' +
        '<ol class="confirm-steps">' +
          '<li><b>' + t("Hoy", "Today") + '</b><span>' + t("Templamos, numeramos y empacamos en frío en el obrador.", "We temper, number, and cold-pack your order in the workshop.") + '</span></li>' +
          '<li><b data-step-ship></b><span>' + t("Sale de Quito en transporte refrigerado.", "It leaves Quito in refrigerated transport.") + '</span></li>' +
          '<li><b data-step-arrive></b><span>' + t("Llega a su puerta. Guárdelo entre 16 y 20 °C, lejos de la nevera.", "It reaches your door. Keep it at 16–20 °C, away from the fridge.") + '</span></li>' +
        '</ol>' +
        '<p class="confirm-total">' + t("Total pagado", "Total paid") + ' <b class="serif" data-order-total></b></p>' +
        '<button class="btn btn--solid" type="button" data-confirm-close>' + t("Seguir en la tienda", "Keep browsing") + '</button>' +
        '<p class="confirm-note">' + t("Demo conceptual de Pittahaya: no se procesó ningún pago.", "Pittahaya concept demo: no payment was processed.") + '</p>' +
      '</div></div>';
    while (shell.firstChild) doc.body.appendChild(shell.firstChild);
  }

  /* ── cabecera + progreso ── */
  var header = doc.querySelector("[data-header]");
  var progress = doc.querySelector("[data-progress]");
  var hero = doc.querySelector("[data-hero]");
  var frame = 0;

  function onScroll() {
    frame = 0;
    var top = scrollY || 0;
    var range = Math.max(1, doc.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.transform = "scaleX(" + clamp(top / range, 0, 1) + ")";
    if (header) header.classList.toggle("is-condensed", top > 40);
    if (hero && !reduced.matches) hero.style.setProperty("--hero-y", Math.min(top * 0.08, 60) + "px");

    /* las líneas de la mazorca se encienden en orden */
    var rev = doc.querySelector("[data-reveal-section]");
    if (rev && !reduced.matches) {
      var r = rev.getBoundingClientRect();
      var p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      rev.style.setProperty("--reveal-progress", p.toFixed(3));
      var lines = rev.querySelectorAll("[data-line]");
      for (var i = 0; i < lines.length; i++) lines[i].classList.toggle("is-lit", p > 0.22 + i * 0.16);
    }
  }
  function requestScroll() { if (!frame) frame = requestAnimationFrame(onScroll); }
  addEventListener("scroll", requestScroll, { passive: true });
  addEventListener("resize", requestScroll, { passive: true });

  /* ── navegación ── */
  var nav = doc.querySelector("[data-nav]");
  var navToggle = doc.querySelector("[data-nav-toggle]");
  if (nav && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") !== "true";
      nav.classList.toggle("is-open", open);
      doc.body.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        doc.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── revelado al desplazar ── */
  var reveals = [].slice.call(doc.querySelectorAll("[data-reveal]"));
  if (reveals.length) {
    if (reduced.matches || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          rio.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      reveals.forEach(function (el, i) {
        el.style.transitionDelay = ((i % 3) * 90) + "ms";
        rio.observe(el);
      });
    }
  }

  /* ── la colección (la boutique la convierte en sala) ── */
  var collectionMount = doc.querySelector("[data-collection]");
  if (collectionMount) {
    PRODUCTS.forEach(function (p, i) {
      var art = doc.createElement("article");
      art.className = "product" + (p.light ? " product--light" : "");
      art.setAttribute("data-product", p.id);

      var media = doc.createElement("div");
      media.className = "product-media";
      var img = doc.createElement("img");
      img.src = p.img; img.alt = p.name + " " + p.pct; img.loading = "lazy"; img.decoding = "async";
      media.appendChild(img);

      var inner = doc.createElement("div");
      inner.className = "product-inner";
      var num2 = doc.createElement("span");
      num2.className = "product-num";
      num2.textContent = String(i + 1).padStart(2, "0");
      var h3 = doc.createElement("h3");
      h3.className = "product-name serif";
      h3.textContent = p.name;
      var pct = doc.createElement("p");
      pct.className = "product-pct";
      pct.textContent = p.pct + " cacao · " + p.origin + (p.limited ? t(" · edición limitada", " · limited edition") : "");
      var notes = doc.createElement("p");
      notes.className = "product-notes";
      notes.textContent = p.notes;
      var price = doc.createElement("span");
      price.className = "product-price serif";
      price.textContent = money(p.price);
      var meter = doc.createElement("div");
      meter.className = "intensity";
      for (var k = 0; k < 5; k++) {
        var s = doc.createElement("span");
        if (k < p.intensity) s.className = "on";
        meter.appendChild(s);
      }
      var add = doc.createElement("button");
      add.className = "btn btn--solid";
      add.type = "button";
      add.setAttribute("data-add", p.id);
      add.textContent = t("Añadir a la bolsa", "Add to bag");

      inner.appendChild(num2); inner.appendChild(h3); inner.appendChild(pct); inner.appendChild(notes);
      inner.appendChild(price); inner.appendChild(meter); inner.appendChild(add);
      art.appendChild(media); art.appendChild(inner);
      collectionMount.appendChild(art);
    });
  }

  /* ── cómo se funde Latitud Cero, en sesenta segundos ── */
  var NOTES = [
    { t: t("Cacao tostado", "Roasted cacao"), c: t("La base. Aparece al primer contacto y se queda debajo de todo lo demás: tostado, sin amargor.", "The base. It appears at first contact and stays beneath everything else: roasted, never bitter."), m: 4, x: 30, y: 40 },
    { t: t("Frambuesa", "Raspberry"), c: t("A los diez segundos, cuando la barra empieza a ceder. Viene de los seis días de fermentación, no de ningún añadido.", "At ten seconds, as the bar starts to give. It comes from six days of fermentation, not from anything added."), m: 3, x: 70, y: 30 },
    { t: t("Caramelo", "Caramel"), c: t("Hacia los veinte segundos. Es el tueste lento, 32 minutos a 118 °C, trabajando a su favor.", "Around twenty seconds. That's the slow roast, 32 minutes at 118 °C, working in your favour."), m: 3, x: 40, y: 62 },
    { t: t("Nuez tostada", "Toasted walnut"), c: t("El cuerpo, a mitad de la fusión: seco y cálido, deja la boca limpia para lo que viene.", "The body, halfway through the melt: dry and warm, it clears the palate for what comes next."), m: 3, x: 66, y: 70 },
    { t: t("Jazmín", "Jasmine"), c: t("El final. Tarda casi un minuto en llegar y es la firma del cacao Nacional fino de aroma, el que casi desaparece en los años noventa.", "The finish. It takes almost a minute and it's the signature of fine-flavour Nacional cacao, the variety that almost vanished in the nineties."), m: 2, x: 50, y: 22 }
  ];
  var flavour = doc.querySelector("[data-flavour]");
  if (flavour) {
    var noteBtns = [].slice.call(flavour.querySelectorAll("[data-note]"));
    var nTitle = flavour.querySelector("[data-note-title]");
    var nCopy = flavour.querySelector("[data-note-copy]");
    var nMeter = flavour.querySelector("[data-note-meter]");
    noteBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var n = NOTES[+btn.getAttribute("data-note")];
        if (!n) return;
        noteBtns.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("is-active"); btn.setAttribute("aria-selected", "true");
        nTitle.textContent = n.t;
        nCopy.textContent = n.c;
        flavour.style.setProperty("--fx", n.x + "%");
        flavour.style.setProperty("--fy", n.y + "%");
        var spans = nMeter.children;
        for (var i = 0; i < spans.length; i++) spans[i].className = i < n.m ? "on" : "";
      });
    });
  }

  /* ── las fincas ── */
  var REGIONS = [
    { n: "Manabí", coord: coord("0°41′ S · 80°06′ W") + " · 320 m", profile: t("Frutos rojos, rosa, caramelo", "Red berries, rose, caramel"), harvest: t("Marzo – junio", "March – June"),
      c: t("Colinas secas y brisa del Pacífico. En Finca San Jacinto, la familia Mendoza fermenta solo cinco días para no perder lo floral: de ahí sale Rosa & Cacao. La leche de Nube viene de la misma costa, en Jama.",
           "Dry hills and a Pacific breeze. At Finca San Jacinto, the Mendoza family ferments for only five days to keep the florals: that's where Rosa & Cacao comes from. The milk for Nube comes from the same coast, in Jama."),
      p: "Rosa & Cacao 70%", id: "rosa", img: "farm-hands.jpg" },
    { n: "Esmeraldas", coord: coord("0°19′ N · 79°28′ W") + " · 140 m", profile: t("Ciruela negra, nuez, mineral", "Black plum, walnut, mineral"), harvest: t("Todo el año", "Year-round"),
      c: t("La única de nuestras fincas al norte de la línea. Lluvia constante y suelo volcánico: los Quiñónez fermentan siete días y controlan la temperatura del cajón cada seis horas.",
           "The only one of our farms north of the line. Constant rain and volcanic soil: the Quiñónez family ferments for seven days and checks the box temperature every six hours."),
      p: "Tierra Negra 85%", id: "tierra", img: "fermentacion.jpg" },
    { n: "Los Ríos", coord: coord("1°33′ S · 79°45′ W") + " · 60 m", profile: t("Frambuesa, cacao tostado, jazmín", "Raspberry, roasted cacao, jasmine"), harvest: t("Abril – septiembre", "April – September"),
      c: t("Vinces, tierra de río y cuna del cacao fino de aroma. La familia Cedeño conserva árboles Nacional que plantó el abuelo; de ellos sale Latitud Cero, la barra de la casa.",
           "Vinces, river country and the cradle of Ecuador's fine-flavour cacao. The Cedeño family keeps Nacional trees their grandfather planted; they give us Latitud Cero, the house bar."),
      p: "Latitud Cero 72%", id: "latitud", img: "origin-farm.jpg" },
    { n: t("Amazonía", "Amazonia"), coord: coord("0°55′ S · 77°48′ W") + " · 620 m", profile: t("Espresso, cedro, sal mineral", "Espresso, cedar, mineral salt"), harvest: t("Enero – mayo", "January – May"),
      c: t("Chacras bajo el dosel en Archidona y Tena, cultivadas junto a guayusa y yuca. Rendimientos bajos y grano pequeño e intenso: Altitud Pura y Sal Amazónica.",
           "Forest gardens beneath the canopy in Archidona and Tena, grown alongside guayusa and cassava. Low yields and a small, intense bean: Altitud Pura and Sal Amazónica."),
      p: "Altitud Pura 92%", id: "altitud", img: "pod-open.jpg" }
  ];
  var regions = doc.querySelector("[data-regions]");
  if (regions) {
    var rBtns = [].slice.call(regions.querySelectorAll("[data-region]"));
    var rName = regions.querySelector("[data-region-name]");
    var rCoord = regions.querySelector("[data-region-climate]");
    var rProfile = regions.querySelector("[data-region-profile]");
    var rHarvest = regions.querySelector("[data-region-harvest]");
    var rCopy = regions.querySelector("[data-region-copy]");
    var rProduct = regions.querySelector("[data-region-product]");
    var showRegion = function (r) {
      rName.textContent = r.n;
      rCoord.textContent = r.coord;
      rProfile.textContent = r.profile;
      rHarvest.textContent = r.harvest;
      rCopy.textContent = r.c;
      rProduct.textContent = t("Ver ", "View ") + r.p + " →";
      rProduct.setAttribute("href", "origen-coleccion.html#" + r.id);
      /* la foto de la región entra con un fundido; la anterior se queda debajo */
      var fig = regions.querySelector("[data-region-photo]");
      if (fig && r.img) {
        var capa = doc.createElement("img");
        capa.src = assetRoot + r.img; capa.alt = ""; capa.decoding = "async";
        fig.appendChild(capa);
        requestAnimationFrame(function () { capa.classList.add("is-on"); });
        while (fig.querySelectorAll("img").length > 2) fig.removeChild(fig.querySelector("img"));
        var tag = fig.querySelector("figcaption");
        if (tag) { tag.textContent = r.n; fig.appendChild(tag); }
      }
    };
    rBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var r = REGIONS[+btn.getAttribute("data-region")];
        if (!r) return;
        rBtns.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("is-active"); btn.setAttribute("aria-selected", "true");
        showRegion(r);
      });
    });
    showRegion(REGIONS[0]);
  }

  /* ── lote a la vista: «quedan 212 de 1.240» ── */
  Array.prototype.forEach.call(doc.querySelectorAll("[data-stock]"), function (n) {
    var p = byId[n.getAttribute("data-stock")];
    if (!p) return;
    n.textContent = "";
    var txt = doc.createElement("span");
    txt.textContent = lotText(p);
    var bar = doc.createElement("i");
    bar.setAttribute("aria-hidden", "true");
    bar.style.setProperty("--p", (p.lotLeft / p.lotTotal).toFixed(3));
    n.appendChild(txt); n.appendChild(bar);
    if (p.lotLeft < 100) n.classList.add("is-low");
  });

  /* ═══ BOLSA (persiste entre páginas) ═══ */
  var STORE = isEnglish ? "origen0-bag-en" : "origen0-bag";
  var cart = [];
  try {
    var saved = sessionStorage.getItem(STORE);
    if (saved) cart = JSON.parse(saved) || [];
  } catch (e) { cart = []; }
  function persist() {
    try { sessionStorage.setItem(STORE, JSON.stringify(cart)); } catch (e) {}
  }
  var cartEl = doc.querySelector("[data-cart]");
  var scrim = doc.querySelector("[data-cart-scrim]");
  var cartBody = doc.querySelector("[data-cart-body]");
  var cartX = doc.querySelector("[data-cart-x]");
  var bagCount = doc.querySelector("[data-bag-count]");
  var cartN = doc.querySelector("[data-cart-n]");
  var subEl = doc.querySelector("[data-cart-sub]");
  var shipEl = doc.querySelector("[data-cart-ship]");
  var totalEl = doc.querySelector("[data-cart-total]");
  var freeMsg = doc.querySelector("[data-free-msg]");
  var freeBar = doc.querySelector("[data-free-bar]");
  var checkoutBtn = doc.querySelector("[data-checkout]");

  function cartCount() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function cartSub() { return cart.reduce(function (n, l) { return n + l.price * l.qty; }, 0); }
  function shipCost(sub) { return sub === 0 || sub >= FREE_SHIP ? 0 : SHIP_COST; }

  function openCart(open) {
    if (!cartEl) return;
    cartEl.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    cartEl.setAttribute("aria-hidden", String(!open));
    doc.body.classList.toggle("no-scroll", open);
  }

  function lineThumb(line) {
    if (line.bars && line.bars.length) {
      var stack = doc.createElement("div");
      stack.className = "cart-thumb cart-thumb--box";
      line.bars.slice(0, 6).forEach(function (src) {
        var strip = doc.createElement("i");
        var si = doc.createElement("img");
        si.src = src; si.alt = ""; si.loading = "lazy";
        strip.appendChild(si);
        stack.appendChild(strip);
      });
      return stack;
    }
    var im = doc.createElement(line.img ? "img" : "div");
    im.className = "cart-thumb";
    if (line.img) { im.src = line.img; im.alt = ""; im.loading = "lazy"; }
    return im;
  }

  /* la barra que falta: se sugiere una sola, la primera que no está en la bolsa */
  function renderCross() {
    if (!cartX) return;
    cartX.textContent = "";
    var inBag = {};
    cart.forEach(function (l) { inBag[(l.key || "").split(":")[0]] = true; });
    var order = ["latitud", "tierra", "rosa", "nube", "sal", "altitud"];
    var pick = null;
    for (var i = 0; i < order.length && cart.length; i++) if (!inBag[order[i]]) { pick = byId[order[i]]; break; }
    cartX.hidden = !pick;
    if (!pick) return;
    var lab = doc.createElement("p");
    lab.className = "cart-x__lab";
    lab.textContent = t("Suele ir con su pedido", "Often ordered with yours");
    var row = doc.createElement("div");
    row.className = "cart-x__row";
    var im = doc.createElement("img"); im.src = pick.img; im.alt = ""; im.loading = "lazy";
    var mid = doc.createElement("div");
    var b = doc.createElement("b"); b.className = "serif"; b.textContent = pick.name;
    var s = doc.createElement("span"); s.textContent = pick.pct + " · " + pick.notes;
    mid.appendChild(b); mid.appendChild(s);
    var btn = doc.createElement("button");
    btn.type = "button"; btn.className = "cart-x__add";
    btn.textContent = "+ " + money(pick.price);
    btn.setAttribute("aria-label", t("Añadir ", "Add ") + pick.name + " · " + money(pick.price));
    btn.addEventListener("click", function () { add(pick.id, "bar", 1, true); });
    row.appendChild(im); row.appendChild(mid); row.appendChild(btn);
    cartX.appendChild(lab); cartX.appendChild(row);
  }

  function renderCart() {
    if (!cartBody) return;
    cartBody.textContent = "";
    if (!cart.length) {
      var empty = doc.createElement("div");
      empty.className = "cart-empty";
      var ep = doc.createElement("p");
      ep.textContent = t("Su bolsa está vacía. Si no sabe por dónde empezar, empiece por la barra de la casa.",
                         "Your bag is empty. If you don't know where to start, start with the house bar.");
      var eb = doc.createElement("button");
      eb.type = "button"; eb.className = "btn btn--solid";
      eb.textContent = t("Añadir Latitud Cero 72% · $28", "Add Latitud Cero 72% · $28");
      eb.addEventListener("click", function () { add("latitud", "bar", 1, true); });
      empty.appendChild(ep); empty.appendChild(eb);
      cartBody.appendChild(empty);
    } else {
      cart.forEach(function (line, idx) {
        var row = doc.createElement("div");
        row.className = "cart-item";
        row.appendChild(lineThumb(line));

        var mid = doc.createElement("div");
        var b = doc.createElement("b"); b.className = "serif"; b.textContent = line.name;
        var sp = doc.createElement("span"); sp.textContent = line.sub || "";
        mid.appendChild(b); mid.appendChild(sp);
        if (line.note) {
          var nt = doc.createElement("div");
          nt.className = "ci-note";
          nt.textContent = "“" + line.note + "”";
          mid.appendChild(nt);
        }
        var q = doc.createElement("div");
        q.className = "ci-qty";
        var minus = doc.createElement("button"); minus.type = "button"; minus.textContent = "−";
        minus.setAttribute("aria-label", t("Quitar uno", "Remove one"));
        var val = doc.createElement("span"); val.textContent = line.qty;
        var plus = doc.createElement("button"); plus.type = "button"; plus.textContent = "+";
        plus.setAttribute("aria-label", t("Añadir uno", "Add one"));
        minus.addEventListener("click", function () { changeQty(idx, -1); });
        plus.addEventListener("click", function () { changeQty(idx, 1); });
        q.appendChild(minus); q.appendChild(val); q.appendChild(plus);
        mid.appendChild(q);
        row.appendChild(mid);

        var right = doc.createElement("div");
        var pr = doc.createElement("div"); pr.className = "ci-price serif";
        pr.textContent = money(line.price * line.qty);
        var rm = doc.createElement("button"); rm.className = "ci-remove"; rm.type = "button";
        rm.textContent = t("Quitar", "Remove");
        rm.addEventListener("click", function () { removeLine(idx); });
        right.appendChild(pr); right.appendChild(rm);
        row.appendChild(right);
        cartBody.appendChild(row);
      });
    }

    var sub = cartSub();
    var ship = shipCost(sub);
    if (subEl) subEl.textContent = money(sub);
    if (shipEl) shipEl.textContent = !sub ? "—" : ship ? money(ship) : t("Sin costo", "Free");
    if (totalEl) totalEl.textContent = money(sub + ship);
    if (bagCount) bagCount.textContent = cartCount();
    if (cartN) cartN.textContent = cart.length ? "(" + cartCount() + ")" : "";
    if (checkoutBtn) {
      checkoutBtn.disabled = !cart.length;
      checkoutBtn.textContent = cart.length ? t("Pagar ", "Pay ") + money(sub + ship) : t("Pagar", "Pay");
    }
    if (freeMsg && freeBar) {
      var falta = FREE_SHIP - sub;
      freeMsg.textContent = !sub
        ? t("Envío en frío sin costo desde $90.", "Free cold shipping from $90.")
        : falta > 0
          ? t("Le faltan ", "") + money(falta) + t(" para el envío en frío sin costo.", " away from free cold shipping.")
          : t("Su envío en frío va sin costo.", "Your cold shipping is on us.");
      freeBar.style.setProperty("--p", clamp(sub / FREE_SHIP, 0, 1).toFixed(3));
      freeBar.parentNode.parentNode.classList.toggle("is-done", sub >= FREE_SHIP);
    }
    renderCross();
    persist();
  }
  function changeQty(i, d) {
    if (!cart[i]) return;
    cart[i].qty += d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    renderCart();
  }
  function removeLine(i) { cart.splice(i, 1); renderCart(); }

  function addToCart(item, stayClosed) {
    var existing = null;
    if (!item.unique) existing = cart.filter(function (l) { return l.key === item.key; })[0];
    if (existing) existing.qty += item.qty || 1;
    else cart.push({ key: item.key, name: item.name, sub: item.sub, price: item.price, qty: item.qty || 1, img: item.img, note: item.note, unique: item.unique, bars: item.bars });
    renderCart();
    if (!stayClosed) openCart(true);
  }

  /* una barra suelta o el estuche de tres */
  function add(id, format, qty, stayOpen) {
    var p = byId[id];
    if (p) {
      var trio = format === "trio";
      addToCart({
        key: id + ":" + (trio ? "trio" : "bar"),
        name: p.name + (trio ? t(" · estuche de 3", " · box of 3") : ""),
        sub: p.pct + " cacao · " + (trio ? "3 × 70 g" : "70 g") + " · " + t("lote ", "lot ") + p.lot,
        price: trio ? trioPrice(p) : p.price,
        qty: qty || 1,
        img: p.img
      }, !stayOpen && stayOpen !== undefined);
      if (stayOpen) openCart(true);
      return true;
    }
    if (EXTRA[id]) {
      addToCart({ key: id, name: EXTRA[id].name, sub: EXTRA[id].sub, price: EXTRA[id].price, img: EXTRA[id].img });
      return true;
    }
    return false;
  }

  doc.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      add(addBtn.getAttribute("data-add"), addBtn.getAttribute("data-format") || "bar", +(addBtn.getAttribute("data-qty") || 1), true);
      return;
    }
    if (e.target.closest("[data-cart-open]")) { openCart(true); return; }
    if (e.target.closest("[data-cart-close]") || e.target.closest("[data-cart-scrim]")) { openCart(false); return; }
  });
  addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cartEl && cartEl.classList.contains("is-open")) openCart(false);
  });

  /* ── pagar → confirmación con número y calendario ── */
  var confirmEl = doc.querySelector("[data-confirm]");
  function closeConfirm() {
    if (!confirmEl) return;
    confirmEl.classList.remove("is-open");
    confirmEl.setAttribute("aria-hidden", "true");
    doc.body.classList.remove("no-scroll");
  }
  if (checkoutBtn && confirmEl) {
    checkoutBtn.addEventListener("click", function () {
      var sub = cartSub();
      var s = shipping();
      confirmEl.querySelector("[data-order-no]").textContent = "O0-" + new Date().getFullYear() + "-" + String(Math.floor(10000 + Math.random() * 89999));
      confirmEl.querySelector("[data-order-total]").textContent = money(sub + shipCost(sub));
      confirmEl.querySelector("[data-step-ship]").textContent = s.today ? t("Hoy, 17:00", "Today, 5 pm") : fmtDay(s.ship);
      confirmEl.querySelector("[data-step-arrive]").textContent = fmtDay(s.arrive);
      var title = confirmEl.querySelector("[data-confirm-title]");
      title.textContent = t("Su pedido sale de Quito ", "Your order leaves Quito ");
      var em = doc.createElement("em");
      em.textContent = s.today ? t("hoy.", "today.") : t("el ", "on ") + fmtDay(s.ship) + ".";
      title.appendChild(em);
      openCart(false);
      confirmEl.classList.add("is-open");
      confirmEl.setAttribute("aria-hidden", "false");
      doc.body.classList.add("no-scroll");
      cart = [];
      renderCart();
      var closeBtn = confirmEl.querySelector("[data-confirm-close]");
      if (closeBtn) closeBtn.focus();
    });
    confirmEl.addEventListener("click", function (e) {
      if (e.target === confirmEl || e.target.closest("[data-confirm-close]")) closeConfirm();
    });
    addEventListener("keydown", function (e) {
      if (e.key === "Escape" && confirmEl.classList.contains("is-open")) closeConfirm();
    });
  }

  /* ═══ CAJA DE DEGUSTACIÓN ═══ */
  var builder = doc.querySelector("[data-builder]");
  if (builder) {
    var capacity = 3, basePrice = 78, mini = false;
    var picks = {};
    var picker = builder.querySelector("[data-picker]");
    var stage = builder.querySelector("[data-box-stage]");
    var visual = builder.querySelector("[data-box-visual]");
    var countEl = builder.querySelector("[data-box-count]");
    var formatEl = builder.querySelector("[data-box-format]");
    var totalBox = builder.querySelector("[data-box-total]");
    var statusEl = builder.querySelector("[data-box-status]");
    var addBoxBtn = builder.querySelector("[data-box-add]");
    var giftNote = builder.querySelector("[data-gift-note]");
    var wrapChk = builder.querySelector('[data-extra="wrap"]');
    var cardChk = builder.querySelector('[data-extra="card"]');

    var picked = function () { return Object.keys(picks).reduce(function (n, k) { return n + picks[k]; }, 0); };
    var boxPrice = function () { return basePrice + (wrapChk && wrapChk.checked ? 6 : 0); };

    function renderPicker() {
      picker.textContent = "";
      PRODUCTS.forEach(function (p) {
        var row = doc.createElement("div");
        row.className = "pick";
        var left = doc.createElement("div");
        var b = doc.createElement("b"); b.className = "serif"; b.textContent = p.name;
        var s = doc.createElement("span"); s.textContent = p.pct + " · " + p.origin;
        left.appendChild(b); left.appendChild(s);

        var q = doc.createElement("div"); q.className = "pick-qty";
        var minus = doc.createElement("button"); minus.className = "qbtn"; minus.type = "button";
        minus.textContent = "−"; minus.setAttribute("aria-label", t("Quitar ", "Remove ") + p.name);
        var val = doc.createElement("span"); val.className = "qval"; val.textContent = picks[p.id] || 0;
        var plus = doc.createElement("button"); plus.className = "qbtn"; plus.type = "button";
        plus.textContent = "+"; plus.setAttribute("aria-label", t("Añadir ", "Add ") + p.name);
        if (!picks[p.id]) minus.disabled = true;
        if (picked() >= capacity) plus.disabled = true;
        minus.addEventListener("click", function () { setPick(p.id, -1); });
        plus.addEventListener("click", function () { setPick(p.id, 1); });
        q.appendChild(minus); q.appendChild(val); q.appendChild(plus);

        row.appendChild(left); row.appendChild(q);
        picker.appendChild(row);
      });
    }
    function renderBox() {
      var n = picked();
      var chosen = [];
      PRODUCTS.forEach(function (p) { for (var c = 0; c < (picks[p.id] || 0); c++) chosen.push(p); });

      visual.textContent = "";
      var bars = doc.createElement("div");
      bars.className = "box-bars";
      bars.style.gridTemplateRows = "repeat(" + capacity + ",1fr)";
      for (var i = 0; i < capacity; i++) {
        var slot = doc.createElement("div");
        slot.className = "box-slot" + (i < n ? " filled" : "");
        slot.style.transitionDelay = (i * 60) + "ms";
        if (chosen[i]) {
          var bimg = doc.createElement("img");
          bimg.src = chosen[i].img; bimg.alt = ""; bimg.loading = "lazy";
          var label = doc.createElement("b");
          label.textContent = chosen[i].name;
          slot.appendChild(bimg); slot.appendChild(label);
        }
        bars.appendChild(slot);
      }
      visual.appendChild(bars);
      var lid = doc.createElement("div"); lid.className = "box-lid";
      visual.appendChild(lid);
      countEl.textContent = isEnglish ? n + " of " + capacity + " spaces" : n + " de " + capacity + " espacios";
      formatEl.textContent = mini ? t("Miniaturas de 20 g", "20 g miniatures") : t("Barras de 70 g", "70 g bars");
      totalBox.textContent = money(boxPrice());
      stage.classList.toggle("is-full", n === capacity);
      if (n === capacity) {
        statusEl.textContent = t("Su caja está completa. La cerramos con cinta de algodón.", "Your box is complete. We'll tie it with cotton ribbon.");
        addBoxBtn.disabled = false;
      } else {
        var remaining = capacity - n;
        var mas = n > 0;
        statusEl.textContent = isEnglish
          ? "Choose " + remaining + (mas ? " more " : " ") + (remaining === 1 ? "bar" : "bars") + " to complete the box."
          : "Elija " + remaining + " " + (remaining === 1 ? "barra" : "barras") + (mas ? " más" : "") + " para completar la caja.";
        addBoxBtn.disabled = true;
      }
    }
    function setPick(id, d) {
      var cur = picks[id] || 0;
      var next = cur + d;
      if (next < 0) return;
      if (d > 0 && picked() >= capacity) return;
      if (next === 0) delete picks[id]; else picks[id] = next;
      renderPicker(); renderBox();
    }
    function setFormat(btn) {
      builder.querySelectorAll("[data-format]").forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      capacity = +btn.getAttribute("data-format");
      basePrice = +btn.getAttribute("data-price");
      mini = capacity === 12;
      picks = {};
    }

    [].slice.call(builder.querySelectorAll("[data-format]")).forEach(function (btn) {
      btn.addEventListener("click", function () { setFormat(btn); renderPicker(); renderBox(); });
    });

    /* cajas ya pensadas: rellenan el formato y las barras de un toque */
    function applyPreset(el, scroll) {
      var fmtBtn = builder.querySelector('[data-format="' + el.getAttribute("data-preset-format") + '"]');
      if (fmtBtn) setFormat(fmtBtn);
      el.getAttribute("data-preset").split(",").forEach(function (id) {
        id = id.trim();
        if (byId[id] && picked() < capacity) picks[id] = (picks[id] || 0) + 1;
      });
      renderPicker(); renderBox();
      doc.querySelectorAll("[data-preset]").forEach(function (b) { b.classList.toggle("is-active", b === el); });
      if (scroll) builder.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
    }
    doc.querySelectorAll("[data-preset]").forEach(function (el) {
      el.addEventListener("click", function () { applyPreset(el, true); });
    });

    if (wrapChk) wrapChk.addEventListener("change", renderBox);
    if (cardChk && giftNote) cardChk.addEventListener("change", function () {
      giftNote.hidden = !cardChk.checked;
      if (cardChk.checked) giftNote.focus();
    });
    if (addBoxBtn) addBoxBtn.addEventListener("click", function () {
      var names = Object.keys(picks).map(function (k) { return byId[k].name + (picks[k] > 1 ? " ×" + picks[k] : ""); }).join(", ");
      var barImgs = [];
      PRODUCTS.forEach(function (p) { for (var c = 0; c < (picks[p.id] || 0); c++) barImgs.push(p.img); });
      addToCart({
        key: "box-" + Date.now(),
        name: t("Caja de degustación", "Tasting box") + " · " + capacity + (mini ? t(" miniaturas", " miniatures") : t(" barras", " bars")),
        sub: names + (wrapChk && wrapChk.checked ? t(" · envuelta en lino", " · linen-wrapped") : ""),
        price: boxPrice(),
        bars: barImgs,
        note: (cardChk && cardChk.checked && giftNote && giftNote.value.trim()) ? giftNote.value.trim() : "",
        unique: true
      });
      picks = {};
      renderPicker(); renderBox();
    });

    renderPicker(); renderBox();
    /* por #completa: un ?preset= se pierde si el servidor redirige a la URL limpia */
    var wanted = location.hash.slice(1) || new URLSearchParams(location.search).get("preset");
    var presetEl = wanted && doc.querySelector('[data-preset-name="' + wanted.replace(/[^a-z-]/g, "") + '"]');
    if (presetEl) applyPreset(presetEl, false);
  }

  /* ── la vitrina de la portada: foto, nombre, precio ── */
  var shelf = doc.querySelector("[data-shelf]");
  if (shelf) {
    PRODUCTS.forEach(function (p) {
      var a = doc.createElement("a");
      a.className = "lx-tile";
      a.href = "origen-coleccion.html#" + p.id;
      var fig = doc.createElement("span");
      fig.className = "lx-tile__img";
      var im = doc.createElement("img");
      im.src = p.img; im.alt = p.name + " " + p.pct; im.loading = "lazy"; im.decoding = "async";
      fig.appendChild(im);
      if (p.limited) {
        var tag = doc.createElement("i");
        tag.textContent = t("Edición limitada", "Limited edition");
        fig.appendChild(tag);
      }
      var nm = doc.createElement("b"); nm.className = "serif"; nm.textContent = p.name;
      var meta = doc.createElement("span"); meta.textContent = p.pct + " · " + p.origin;
      var pr = doc.createElement("em"); pr.textContent = money(p.price);
      a.appendChild(fig); a.appendChild(nm); a.appendChild(meta); a.appendChild(pr);
      shelf.appendChild(a);
    });
    doc.querySelectorAll("[data-shelf-go]").forEach(function (b) {
      b.addEventListener("click", function () {
        var first = shelf.firstElementChild;
        var step = first ? first.getBoundingClientRect().width + 20 : 300;
        shelf.scrollBy({ left: step * 2 * +b.getAttribute("data-shelf-go"), behavior: reduced.matches ? "auto" : "smooth" });
      });
    });
  }

  /* ── la secuencia fijada al scroll: una escena por tramo ── */
  var seq = doc.querySelector("[data-seq]");
  if (seq) {
    var frames = [].slice.call(seq.querySelectorAll(".lx-seq__frame"));
    var cap = seq.querySelector(".lx-seq__cap");
    var sN = seq.querySelector("[data-seq-n]");
    var sW = seq.querySelector("[data-seq-word]");
    var sS = seq.querySelector("[data-seq-sub]");
    var rail = seq.querySelector("[data-seq-bar]");
    var cur = -1, pendSeq = 0;
    seq.style.setProperty("--n", frames.length);
    var paintSeq = function () {
      pendSeq = 0;
      var travel = Math.max(1, seq.offsetHeight - innerHeight);
      var p = clamp(-seq.getBoundingClientRect().top / travel, 0, 0.9999);
      if (rail) rail.style.transform = "scaleY(" + p.toFixed(4) + ")";
      var i = Math.floor(p * frames.length);
      if (i === cur) return;
      cur = i;
      frames.forEach(function (f, n) {
        f.classList.toggle("is-on", n === i);
        f.classList.toggle("is-past", n < i);
      });
      cap.classList.remove("is-in");
      void cap.offsetWidth;
      sN.textContent = String(i + 1).padStart(2, "0") + " / " + String(frames.length).padStart(2, "0");
      sW.textContent = frames[i].getAttribute("data-word");
      sS.textContent = frames[i].getAttribute("data-sub");
      cap.classList.add("is-in");
    };
    var askSeq = function () { if (!pendSeq) pendSeq = requestAnimationFrame(paintSeq); };
    addEventListener("scroll", askSeq, { passive: true });
    addEventListener("resize", askSeq, { passive: true });
    paintSeq();
  }

  /* ── botones principales magnéticos: un gesto de lujo, sólo con ratón ── */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced.matches) {
    doc.addEventListener("pointermove", function (e) {
      var b = e.target.closest && e.target.closest(".btn--solid, .lx-go");
      if (!b) return;
      var r = b.getBoundingClientRect();
      b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px)";
    }, { passive: true });
    doc.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest(".btn--solid, .lx-go");
      if (b && !b.contains(e.relatedTarget)) b.style.transform = "";
    }, { passive: true });
  }

  /* ── API para la boutique ── */
  window.ORIGEN = {
    PRODUCTS: PRODUCTS, byId: byId, t: t, money: money, num: num,
    trioPrice: trioPrice, lotText: lotText, etaText: etaText, add: add
  };

  var y = doc.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  paintEta();
  renderCart();
  requestScroll();
})();
