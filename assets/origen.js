/* ═══════════════════════════════════════════════════════════
   ORIGEN 0° — commerce interactions (CSP-safe, dependency-free)
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var isEnglish = /^en\b/i.test(doc.documentElement.lang || "");
  var assetRoot = isEnglish ? "../assets/origen/" : "assets/origen/";
  var t = function (spanish, english) { return isEnglish ? english : spanish; };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var money = function (n) { return "$" + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, ""); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ── the collection ── */
  var PRODUCTS = [
    { id: "nube",     name: "Nube de Leche",  pct: "58%", price: 24, img: assetRoot + "cloud-milk.jpg",
      notes: t("Caramelo · vainilla · leche tostada", "Caramel · vanilla · toasted milk"), origin: "Manabí", intensity: 2, light: true,
      copy: t("Leche suave y elegante, sin el empalago habitual. El cacao sigue presente.", "Soft, elegant milk without the usual cloying sweetness. The cacao remains present.") },
    { id: "latitud",  name: "Latitud Cero",   pct: "72%", price: 28, img: assetRoot + "latitude-zero.jpg",
      notes: t("Cacao profundo · fruta roja · jazmín", "Deep cacao · red fruit · jasmine"), origin: "Los Ríos", intensity: 3, feature: true,
      copy: t("Floral, profundo y naturalmente complejo. La barra que define la casa.", "Floral, deep, and naturally complex. The bar that defines the house.") },
    { id: "tierra",   name: "Tierra Negra",   pct: "85%", price: 30, img: assetRoot + "tierra-negra.jpg",
      notes: t("Cacao tostado · nuez · fruta oscura", "Roasted cacao · walnut · dark fruit"), origin: "Esmeraldas", intensity: 4,
      copy: t("Estructurado, mineral y elegante. Un final largo que se sostiene solo.", "Structured, mineral, and elegant. A long finish that stands on its own.") },
    { id: "altitud",  name: "Altitud Pura",   pct: "92%", price: 32, img: assetRoot + "pure-altitude.jpg",
      notes: t("Cacao puro · espresso · cedro", "Pure cacao · espresso · cedar"), origin: t("Amazonía", "Amazonia"), intensity: 5,
      copy: t("Intenso y sin concesiones. Para quien ya no busca dulzor.", "Intense and uncompromising. For those no longer seeking sweetness.") },
    { id: "rosa",     name: "Rosa & Cacao",   pct: "70%", price: 34, img: assetRoot + "rose-cacao.jpg",
      notes: t("Rosa · frutos rojos · final floral", "Rose · red berries · floral finish"), origin: "Los Ríos", intensity: 3, limited: true,
      copy: t("Pétalos de rosa ecuatoriana sobre cacao oscuro. Edición limitada.", "Ecuadorian rose petals over dark cacao. Limited edition.") },
    { id: "sal",      name: "Sal Amazónica",  pct: "75%", price: 29, img: assetRoot + "amazonian-salt.jpg",
      notes: t("Cacao · sal mineral · fruta tropical", "Cacao · mineral salt · tropical fruit"), origin: t("Amazonía", "Amazonia"), intensity: 4,
      copy: t("Sal mineral de la cuenca amazónica sobre un cacao de cuerpo tropical.", "Mineral salt from the Amazon basin over a full-bodied tropical cacao.") }
  ];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var EXTRA = {
    "soc-descubrimiento": { name: t("Sociedad · Descubrimiento", "Society · Discovery"), price: 34, sub: t("Suscripción mensual", "Monthly subscription"), img: assetRoot + "latitude-zero.jpg" },
    "soc-oscura":         { name: t("Sociedad · Colección Oscura", "Society · Dark Collection"), price: 52, sub: t("Suscripción mensual", "Monthly subscription"), img: assetRoot + "tierra-negra.jpg" },
    "soc-raros":          { name: t("Sociedad · Orígenes Raros", "Society · Rare Origins"), price: 88, sub: t("Suscripción mensual", "Monthly subscription"), img: assetRoot + "rose-cacao.jpg" }
  };

  /* ── the bag drawer + confirmation live on every page: inject once ── */
  if (!doc.querySelector("[data-cart]")) {
    var shell = doc.createElement("div");
    shell.innerHTML =
      '<div class="cart-scrim" data-cart-scrim aria-hidden="true"></div>' +
      '<aside class="cart" data-cart role="dialog" aria-modal="true" aria-label="' + t("Bolsa de compra", "Shopping bag") + '" aria-hidden="true">' +
        '<div class="cart-head"><b class="serif">' + t("Su bolsa", "Your bag") + '</b>' +
        '<button class="cart-close" type="button" data-cart-close aria-label="' + t("Cerrar bolsa", "Close bag") + '">×</button></div>' +
        '<div class="cart-body" data-cart-body></div>' +
        '<div class="cart-foot">' +
          '<div class="cart-line"><span>' + t("Subtotal", "Subtotal") + '</span><span data-cart-sub>$0</span></div>' +
          '<div class="cart-total"><span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--faint)">' + t("Total", "Total") + '</span><b class="serif" data-cart-total>$0</b></div>' +
          '<p class="cart-ship">' + t("Envío gratuito en pedidos superiores a $90. Empaque isotérmico incluido de mayo a septiembre.", "Complimentary shipping on orders over $90. Insulated packaging included from May through September.") + '</p>' +
          '<button class="btn btn--solid" type="button" data-checkout disabled>' + t("Finalizar compra", "Checkout") + '</button>' +
        '</div>' +
      '</aside>' +
      '<div class="confirm" data-confirm aria-hidden="true"><div>' +
        '<h2 class="serif">' + t("Su viaje empieza en Ecuador.", "Your journey begins in Ecuador.") + '</h2>' +
        '<p>' + t("Pedido confirmado", "Order confirmed") + '</p>' +
        '<div><a class="btn" href="origen-coleccion.html">' + t("Volver a la colección", "Return to the collection") + '</a></div>' +
      '</div></div>';
    while (shell.firstChild) doc.body.appendChild(shell.firstChild);
  }

  /* ── header + progress ── */
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

    /* cacao reveal lines light up in sequence */
    var rev = doc.querySelector("[data-reveal-section]");
    if (rev && !reduced.matches) {
      var r = rev.getBoundingClientRect();
      var p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      rev.style.setProperty("--reveal-progress", p.toFixed(3));
      var lines = rev.querySelectorAll("[data-line]");
      for (var i = 0; i < lines.length; i++) {
        lines[i].classList.toggle("is-lit", p > 0.22 + i * 0.16);
      }
    }
    /* product media parallax */
    var prods = doc.querySelectorAll(".product");
    for (var j = 0; j < prods.length; j++) {
      if (reduced.matches) break;
      var pr = prods[j].getBoundingClientRect();
      if (pr.bottom < -200 || pr.top > innerHeight + 200) continue;
      var amt = clamp((innerHeight - pr.top) / (innerHeight + pr.height), 0, 1);
      prods[j].style.setProperty("--media-y", ((amt - 0.5) * 30).toFixed(2) + "px");
    }
  }
  function requestScroll() { if (!frame) frame = requestAnimationFrame(onScroll); }
  addEventListener("scroll", requestScroll, { passive: true });
  addEventListener("resize", requestScroll, { passive: true });

  /* ── nav ── */
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

  /* ── reveal on scroll ── */
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

  /* ── build the collection ── */
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

      var shade = doc.createElement("div");
      shade.className = "product-shade";

      var inner = doc.createElement("div");
      inner.className = "product-inner";

      var num = doc.createElement("span");
      num.className = "product-num";
      num.textContent = String(i + 1).padStart(2, "0");

      var mid = doc.createElement("div");
      var h3 = doc.createElement("h3");
      h3.className = "product-name serif";
      h3.textContent = p.name;
      var pct = doc.createElement("p");
      pct.className = "product-pct";
      pct.textContent = p.pct + " cacao · " + p.origin + (p.limited ? t(" · edición limitada", " · limited edition") : "");
      var notes = doc.createElement("p");
      notes.className = "product-notes";
      notes.textContent = p.copy + " " + p.notes + ".";
      mid.appendChild(h3); mid.appendChild(pct); mid.appendChild(notes);

      var buy = doc.createElement("div");
      buy.className = "product-buy";
      var price = doc.createElement("span");
      price.className = "product-price serif";
      price.textContent = money(p.price);
      var meter = doc.createElement("div");
      meter.className = "intensity";
      meter.setAttribute("aria-label", t("Intensidad ", "Intensity ") + p.intensity + t(" de 5", " out of 5"));
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
      buy.appendChild(price); buy.appendChild(meter); buy.appendChild(add);

      inner.appendChild(num); inner.appendChild(mid); inner.appendChild(buy);
      art.appendChild(media); art.appendChild(shade); art.appendChild(inner);
      collectionMount.appendChild(art);
    });
  }

  /* ── flavour explorer ── */
  var NOTES = [
    { t: t("Cacao profundo", "Deep cacao"), c: t("La estructura sobre la que todo lo demás se apoya. Tostado sin amargor, largo y limpio.", "The structure supporting everything else. Roasted without bitterness, long and clean."), m: 4, x: 30, y: 40 },
    { t: t("Fruta roja", "Red fruit"),     c: t("Un ataque brillante de grosella y cereza que aparece en los primeros segundos y se retira.", "A bright opening of redcurrant and cherry that appears in the first seconds, then recedes."), m: 3, x: 70, y: 30 },
    { t: t("Jazmín", "Jasmine"),         c: t("Un final floral delicado, desarrollado de forma natural por el cacao fino de aroma.", "A delicate floral finish developed naturally by fine-flavour cacao."), m: 2, x: 50, y: 22 },
    { t: t("Caramelo", "Caramel"),       c: t("El cuerpo dulce que aparece a media fusión, resultado del tueste lento y bajo.", "The sweet body emerging midway through the melt, created by a slow, low roast."), m: 3, x: 40, y: 62 },
    { t: t("Nuez tostada", "Toasted walnut"),   c: t("El cierre seco y cálido que deja la barra limpia y pide el siguiente trozo.", "The dry, warm close that leaves a clean palate and invites the next piece."), m: 3, x: 66, y: 70 }
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

  /* ── origins explorer ── */
  var REGIONS = [
    { n: "Manabí", climate: t("Seco, con brisa marina", "Dry, with a sea breeze"), profile: t("Nuez, caramelo, cuerpo firme", "Walnut, caramel, firm body"), harvest: t("Marzo – junio", "March – June"),
      c: t("Suelo arenoso y menos lluvia obligan al árbol a concentrar. El resultado es un cacao de cuerpo firme y dulzor tostado, con poca acidez.", "Sandy soil and lower rainfall force the tree to concentrate. The result is a firm-bodied cacao with roasted sweetness and low acidity."),
      p: "Nube de Leche 58%" },
    { n: "Esmeraldas", climate: t("Trópico húmedo, lluvia constante", "Humid tropics, constant rainfall"), profile: t("Fruta oscura, mineral, final largo", "Dark fruit, mineral, long finish"), harvest: t("Todo el año", "Year-round"),
      c: t("La humedad permanente y el suelo volcánico dan un grano denso y mineral. Fermenta rápido y exige control estricto de temperatura.", "Persistent humidity and volcanic soil produce a dense, mineral bean. It ferments quickly and demands strict temperature control."),
      p: "Tierra Negra 85%" },
    { n: "Los Ríos", climate: t("Valle fluvial, cálido y estable", "Warm, stable river valley"), profile: t("Floral, fruta roja, jazmín", "Floral, red fruit, jasmine"), harvest: t("Abril – septiembre", "April – September"),
      c: t("El corazón del cacao fino de aroma. El agua del río modera la temperatura y permite fermentaciones largas que revelan lo floral.", "The heartland of fine-flavour cacao. River water moderates the temperature and enables long fermentations that reveal floral notes."),
      p: "Latitud Cero 72%" },
    { n: t("Amazonía", "Amazonia"), climate: t("Selva alta, húmeda y sombreada", "High rainforest, humid and shaded"), profile: t("Cacao puro, cedro, especia", "Pure cacao, cedar, spice"), harvest: t("Enero – mayo", "January – May"),
      c: t("Cultivo bajo dosel, con árboles antiguos y rendimientos bajos. Grano pequeño, intenso y de una profundidad que no admite azúcar.", "Grown beneath the canopy among old trees with low yields. A small, intense bean of such depth that it needs no sugar."),
      p: "Altitud Pura 92%" }
  ];
  var regions = doc.querySelector("[data-regions]");
  if (regions) {
    var rBtns = [].slice.call(regions.querySelectorAll("[data-region]"));
    var rName = regions.querySelector("[data-region-name]");
    var rClimate = regions.querySelector("[data-region-climate]");
    var rProfile = regions.querySelector("[data-region-profile]");
    var rHarvest = regions.querySelector("[data-region-harvest]");
    var rCopy = regions.querySelector("[data-region-copy]");
    var rProduct = regions.querySelector("[data-region-product]");
    rBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var r = REGIONS[+btn.getAttribute("data-region")];
        if (!r) return;
        rBtns.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("is-active"); btn.setAttribute("aria-selected", "true");
        rName.textContent = r.n;
        rClimate.textContent = r.climate;
        rProfile.textContent = r.profile;
        rHarvest.textContent = r.harvest;
        rCopy.textContent = r.c;
        rProduct.textContent = t("Ver ", "View ") + r.p + " →";
      });
    });
  }

  /* ═══ CART (persists across pages) ═══ */
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
  var bagCount = doc.querySelector("[data-bag-count]");
  var subEl = doc.querySelector("[data-cart-sub]");
  var totalEl = doc.querySelector("[data-cart-total]");
  var checkoutBtn = doc.querySelector("[data-checkout]");

  function cartCount() {
    return cart.reduce(function (n, l) { return n + l.qty; }, 0);
  }
  function cartTotal() {
    return cart.reduce(function (n, l) { return n + l.price * l.qty; }, 0);
  }
  function openCart(open) {
    if (!cartEl) return;
    cartEl.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    cartEl.setAttribute("aria-hidden", String(!open));
    doc.body.classList.toggle("no-scroll", open);
  }
  function renderCart() {
    if (!cartBody) return;
    cartBody.textContent = "";
    if (!cart.length) {
      var empty = doc.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = t(
        "Su bolsa está vacía. Empiece por Latitud Cero 72% — o componga una caja de degustación.",
        "Your bag is empty. Begin with Latitud Cero 72% — or compose a tasting box."
      );
      cartBody.appendChild(empty);
    } else {
      cart.forEach(function (line, idx) {
        var row = doc.createElement("div");
        row.className = "cart-item";

        if (line.bars && line.bars.length) {
          /* a tasting box: show the chosen bars stacked inside the lid */
          var stack = doc.createElement("div");
          stack.className = "cart-thumb cart-thumb--box";
          line.bars.slice(0, 6).forEach(function (src) {
            var strip = doc.createElement("i");
            var si = doc.createElement("img");
            si.src = src; si.alt = ""; si.loading = "lazy";
            strip.appendChild(si);
            stack.appendChild(strip);
          });
          row.appendChild(stack);
        } else if (line.img) {
          var im = doc.createElement("img");
          im.className = "cart-thumb"; im.src = line.img; im.alt = ""; im.loading = "lazy";
          row.appendChild(im);
        } else {
          var ph = doc.createElement("div");
          ph.className = "cart-thumb";
          row.appendChild(ph);
        }

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
    var t = cartTotal();
    if (subEl) subEl.textContent = money(t);
    if (totalEl) totalEl.textContent = money(t);
    if (bagCount) bagCount.textContent = cartCount();
    if (checkoutBtn) checkoutBtn.disabled = !cart.length;
    persist();
  }
  function changeQty(i, d) {
    if (!cart[i]) return;
    cart[i].qty += d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    renderCart();
  }
  function removeLine(i) { cart.splice(i, 1); renderCart(); }

  function addToCart(item) {
    var existing = null;
    if (!item.unique) {
      existing = cart.filter(function (l) { return l.key === item.key; })[0];
    }
    if (existing) existing.qty += item.qty || 1;
    else cart.push({ key: item.key, name: item.name, sub: item.sub, price: item.price, qty: item.qty || 1, img: item.img, note: item.note, unique: item.unique, bars: item.bars });
    renderCart();
    openCart(true);
  }

  doc.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      var id = addBtn.getAttribute("data-add");
      var p = byId[id];
      if (p) {
        addToCart({ key: p.id, name: p.name, sub: p.pct + " cacao · 70 g", price: p.price, img: p.img });
      } else if (EXTRA[id]) {
        addToCart({ key: id, name: EXTRA[id].name, sub: EXTRA[id].sub, price: EXTRA[id].price, img: EXTRA[id].img });
      }
      return;
    }
    if (e.target.closest("[data-cart-open]")) { openCart(true); return; }
    if (e.target.closest("[data-cart-close]") || e.target.closest("[data-cart-scrim]")) { openCart(false); return; }
  });
  addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cartEl && cartEl.classList.contains("is-open")) openCart(false);
  });

  /* ── checkout → confirmation ── */
  var confirmEl = doc.querySelector("[data-confirm]");
  if (checkoutBtn && confirmEl) {
    checkoutBtn.addEventListener("click", function () {
      openCart(false);
      confirmEl.classList.add("is-open");
      confirmEl.setAttribute("aria-hidden", "false");
      doc.body.classList.add("no-scroll");
      cart = [];
      renderCart();
    });
  }

  /* ═══ TASTING BOX BUILDER ═══ */
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

    function picked() {
      return Object.keys(picks).reduce(function (n, k) { return n + picks[k]; }, 0);
    }
    function boxPrice() {
      return basePrice + (wrapChk && wrapChk.checked ? 6 : 0);
    }
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
      /* the chosen bars, expanded one entry per unit, in collection order */
      var chosen = [];
      PRODUCTS.forEach(function (p) {
        for (var c = 0; c < (picks[p.id] || 0); c++) chosen.push(p);
      });

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
      countEl.textContent = isEnglish
        ? n + " of " + capacity + " spaces"
        : n + " de " + capacity + " espacios";
      formatEl.textContent = mini
        ? t("Miniaturas de cata", "Tasting miniatures")
        : t("Tamaño completo", "Full size");
      totalBox.textContent = money(boxPrice());
      stage.classList.toggle("is-full", n === capacity);
      if (n === capacity) {
        statusEl.textContent = t("Su colección está lista.", "Your collection is ready.");
        addBoxBtn.disabled = false;
      } else {
        var remaining = capacity - n;
        statusEl.textContent = isEnglish
          ? "Select " + remaining + " more " + (remaining === 1 ? "bar" : "bars") + " to complete the box."
          : "Seleccione " + remaining + " " + (remaining === 1 ? "barra más" : "barras más") + " para completar la caja.";
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

    [].slice.call(builder.querySelectorAll("[data-format]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        builder.querySelectorAll("[data-format]").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        capacity = +btn.getAttribute("data-format");
        basePrice = +btn.getAttribute("data-price");
        mini = capacity === 12;
        picks = {};
        renderPicker(); renderBox();
      });
    });
    if (wrapChk) wrapChk.addEventListener("change", renderBox);
    if (cardChk && giftNote) cardChk.addEventListener("change", function () {
      giftNote.hidden = !cardChk.checked;
      if (cardChk.checked) giftNote.focus();
    });
    if (addBoxBtn) addBoxBtn.addEventListener("click", function () {
      var names = Object.keys(picks).map(function (k) {
        return byId[k].name + (picks[k] > 1 ? " ×" + picks[k] : "");
      }).join(", ");
      var barImgs = [];
      PRODUCTS.forEach(function (p) {
        for (var c = 0; c < (picks[p.id] || 0); c++) barImgs.push(p.img);
      });
      addToCart({
        key: "box-" + Date.now(),
        name: t("Caja de degustación", "Tasting box") + " · " + capacity + (mini ? t(" miniaturas", " miniatures") : t(" barras", " bars")),
        sub: names,
        price: boxPrice(),
        bars: barImgs,
        note: (cardChk && cardChk.checked && giftNote && giftNote.value.trim()) ? giftNote.value.trim() : "",
        unique: true
      });
      picks = {};
      renderPicker(); renderBox();
    });

    renderPicker(); renderBox();
  }

  /* ── year ── */
  var y = doc.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  renderCart();
  requestScroll();
})();
