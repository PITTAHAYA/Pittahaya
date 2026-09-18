/* AURELIA Private Estates — la colección y la visita privada de cada residencia */
(function () {
  "use strict";

  var isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  var A = isEnglish ? "../assets/" : "assets/";
  var t = function (spanish, english) { return isEnglish ? english : spanish; };
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* cada residencia es una secuencia de láminas, no una foto */
  var properties = [
    {
      slug: "mare-alta", name: "Villa Mare Alta", region: "costa",
      location: t("Costa mediterránea", "Mediterranean coast"), type: t("Residencia costera", "Coastal residence"),
      image: A + "casas/mare-costa.jpg", focus: "50% 48%",
      description: t("Piedra, madera y agua que descienden hacia el mar. La llegada se protege; el horizonte se reserva para el momento exacto de entrar.", "Stone, timber, and water descending toward the sea. The arrival is sheltered; the horizon is saved for the exact moment of entry."),
      plates: [["casas/mare-costa.jpg", t("Frente al mar", "Sea front")], ["casas/mare-llegada.jpg", t("La llegada", "The arrival")], ["casas/mare-interior.jpg", t("Salón", "Salon")], ["mare/aerial.jpg", t("Desde el aire", "From the air")]],
      facts: [[t("Terreno", "Grounds"), "2,1 ha"], [t("Suites", "Suites"), "7"], [t("Frente de mar", "Sea frontage"), "180 m"]]
    },
    {
      slug: "levante", name: "Casa Levante", region: "costa",
      location: t("Riviera mediterránea", "Mediterranean riviera"), type: t("Villa en terrazas", "Terraced villa"),
      image: A + "aurelia/hero.jpg", focus: "50% 55%",
      description: t("Una villa en terrazas que sigue la curva de la ladera: cada nivel mira al mar y cada estancia recibe la última luz del día.", "A terraced villa following the curve of the hillside: every level faces the sea and every room receives the last light of day."),
      plates: [["aurelia/hero.jpg", t("Al atardecer", "At dusk")], ["aurelia/facade.jpg", t("Entrada", "Entrance")], ["aurelia/entrada.jpg", t("Planta abierta", "Open plan")], ["aurelia/interior.jpg", t("Salón", "Salon")], ["aurelia/kitchen.jpg", t("Cocina y comedor", "Kitchen and dining")], ["aurelia/suite.jpg", t("Suite principal", "Principal suite")], ["aurelia/pool.jpg", t("Piscina", "Pool")]],
      facts: [[t("Niveles", "Levels"), "4"], [t("Suites", "Suites"), "6"], [t("Orientación", "Orientation"), t("Poniente", "West")]]
    },
    {
      slug: "solene", name: "Maison Solène", region: "costa",
      location: t("Litoral mediterráneo", "Mediterranean shoreline"), type: t("Villa contemporánea", "Contemporary villa"),
      image: A + "casas/solene-entrada.jpg", focus: "50% 50%",
      description: t("Muros minerales y patios contenidos que conducen, paso a paso, hacia la luz.", "Mineral walls and sheltered courtyards leading, step by step, toward the light."),
      plates: [["casas/solene-entrada.jpg", t("Entrada", "Entrance")], ["casas/solene-interior.jpg", t("Interior", "Interior")]],
      facts: [[t("Entorno", "Setting"), t("Costero", "Coastal")], [t("Patios", "Courtyards"), "3"], [t("Precio", "Price"), t("Bajo consulta", "Upon request")]]
    },
    {
      slug: "solar", name: "Casa Solar", region: "desierto",
      location: t("Paisaje desértico", "Desert landscape"), type: t("Residencia arquitectónica", "Architectural residence"),
      image: A + "casas/casa-solar.jpg", focus: "50% 54%",
      description: t("Hormigón y sombra en diálogo con un paisaje abierto: un refugio preciso frente al clima.", "Concrete and shadow in dialogue with an open landscape: a precise refuge from the climate."),
      plates: [["casas/casa-solar.jpg", t("Exterior", "Exterior")], ["casas/solar-interior.jpg", t("Interior", "Interior")]],
      facts: [[t("Paisaje", "Landscape"), t("Desértico", "Desert")], [t("Carácter", "Character"), t("Arquitectónico", "Architectural")], [t("Acceso", "Access"), t("Por consulta", "By inquiry")]]
    },
    {
      slug: "aster", name: "Chalet Aster", region: "montana",
      location: t("Entorno alpino", "Alpine setting"), type: t("Chalet privado", "Private chalet"),
      image: A + "casas/chalet-aster.jpg", focus: "50% 52%",
      description: t("El refugio de montaña, reescrito: piedra, madera oscura y grandes aperturas a la nieve.", "The mountain refuge, rewritten: stone, dark timber, and generous openings onto the snow."),
      plates: [["casas/chalet-aster.jpg", t("Exterior", "Exterior")], ["casas/aster-interior.jpg", t("Interior", "Interior")]],
      facts: [[t("Entorno", "Setting"), t("Alpino", "Alpine")], [t("Tipología", "Type"), "Chalet"], [t("Disponibilidad", "Availability"), t("Bajo consulta", "Upon request")]]
    },
    {
      slug: "lumen", name: "Villa Lumen", region: "montana",
      location: t("Bosque de montaña", "Mountain forest"), type: t("Villa contemporánea", "Contemporary villa"),
      image: A + "casas/villa-lumen.jpg", focus: "50% 48%",
      description: t("Cristal, roca y reflejos suspendidos entre la niebla del bosque.", "Glass, rock, and reflections suspended in the forest mist."),
      plates: [["casas/villa-lumen.jpg", t("Exterior", "Exterior")], ["casas/lumen-interior.jpg", t("Interior", "Interior")]],
      facts: [[t("Paisaje", "Landscape"), t("Bosque", "Forest")], [t("Arquitectura", "Architecture"), t("Contemporánea", "Contemporary")], ["Dossier", t("Privado", "Private")]]
    }
  ];
  properties.forEach(function (p) { p.plates = p.plates.map(function (x) { return { src: A + x[0], name: x[1] }; }); });

  window.AURELIA_PROPERTIES = properties;

  var grid = document.querySelector("[data-property-grid]");
  var dialog = document.querySelector("[data-property-dialog]");
  var lastTrigger = null, activeIndex = 0, plateIndex = 0;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  var pad = function (n) { return String(n).padStart(2, "0"); };

  /* ── la visita privada ─────────────────────────────────── */
  var stage, plateLabel, thumbs;
  function showPlate(i) {
    var p = properties[activeIndex];
    plateIndex = (i + p.plates.length) % p.plates.length;
    var imgs = stage.querySelectorAll("img");
    imgs.forEach(function (img, n) { img.classList.toggle("on", n === plateIndex); });
    var cur = imgs[plateIndex];
    if (cur && !cur.src) cur.src = cur.getAttribute("data-src");
    var nxt = imgs[(plateIndex + 1) % imgs.length];
    if (nxt && !nxt.src) nxt.src = nxt.getAttribute("data-src");
    plateLabel.textContent = t("Lámina ", "Plate ") + pad(plateIndex + 1) + " / " + pad(p.plates.length) + " · " + p.plates[plateIndex].name;
    thumbs.querySelectorAll("button").forEach(function (b, n) { b.setAttribute("aria-current", n === plateIndex ? "true" : "false"); });
  }

  function openProperty(property, trigger) {
    if (!dialog) return;
    lastTrigger = trigger || lastTrigger;
    activeIndex = properties.indexOf(property);
    var title = dialog.querySelector("[data-dialog-title]");
    var location = dialog.querySelector("[data-dialog-location]");
    var description = dialog.querySelector("[data-dialog-description]");
    var facts = dialog.querySelector("[data-dialog-facts]");
    var reference = dialog.querySelector("[data-dialog-reference]");

    stage.replaceChildren();
    thumbs.replaceChildren();
    property.plates.forEach(function (pl, n) {
      var img = element("img");
      img.alt = property.name + " — " + pl.name;
      img.decoding = "async";
      img.setAttribute("data-src", pl.src);
      if (n === 0) img.src = pl.src;
      stage.appendChild(img);
      var b = element("button");
      b.type = "button";
      b.setAttribute("aria-label", pl.name);
      var th = element("img");
      th.src = pl.src; th.alt = ""; th.loading = "lazy";
      b.appendChild(th);
      b.addEventListener("click", function () { showPlate(n); });
      thumbs.appendChild(b);
    });
    dialog.classList.toggle("vw--single", property.plates.length < 2);

    title.textContent = property.name;
    location.textContent = property.type + " · " + property.location;
    description.textContent = property.description;
    if (reference) reference.textContent = "A/" + pad(activeIndex + 1) + " — " + pad(properties.length);
    facts.replaceChildren();
    property.facts.forEach(function (fact) {
      var row = element("div", "dialogFact");
      row.append(element("span", "", fact[0]), element("b", "", fact[1]));
      facts.append(row);
    });

    /* la visita se abre desde la tarjeta que se tocó */
    if (!dialog.hasAttribute("open")) {
      var r = trigger && trigger.getBoundingClientRect ? trigger.getBoundingClientRect() : null;
      if (r && !quieto) {
        dialog.style.setProperty("--ct", r.top + "px");
        dialog.style.setProperty("--cr", (innerWidth - r.right) + "px");
        dialog.style.setProperty("--cb", (innerHeight - r.bottom) + "px");
        dialog.style.setProperty("--cl", r.left + "px");
        dialog.classList.add("vw--from");
      }
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      requestAnimationFrame(function () { requestAnimationFrame(function () { dialog.classList.remove("vw--from"); }); });
    }
    dialog.scrollTop = 0;
    showPlate(0);
    document.documentElement.style.overflow = "hidden";
  }

  function closeProperty() {
    if (!dialog || !dialog.hasAttribute("open")) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function render() {
    if (!grid) return;
    var fragment = document.createDocumentFragment();
    properties.forEach(function (property, index) {
      var card = element("article", "propertyCard");
      card.dataset.region = property.region;
      card.dataset.slug = property.slug;
      card.style.setProperty("--focus", property.focus || "50% 50%");

      var image = element("img");
      image.src = property.image;
      image.alt = property.name + " — " + property.location;
      image.loading = "lazy";
      image.decoding = "async";

      var meta = element("div", "propertyMeta");
      var eyebrow = element("div", "eyebrow");
      eyebrow.append(element("span", "", property.type), element("span", "", property.location));
      meta.append(eyebrow, element("h3", "", property.name), element("p", "", pad(property.plates.length) + t(" láminas · abrir la visita →", " plates · open the viewing →")));

      var button = element("button", "propertyOpen", t("Abrir la visita de ", "Open the viewing of ") + property.name);
      button.type = "button";
      button.addEventListener("click", function () { openProperty(property, card); });
      var prime = function () {
        if (property.__primed) return;
        property.__primed = true;
        var im = new Image(); im.src = property.plates[Math.min(1, property.plates.length - 1)].src;
      };
      card.addEventListener("pointerenter", prime, { once: true });
      button.addEventListener("focus", prime, { once: true });
      card.append(image, element("span", "propertyIndex", "A/" + pad(index + 1)), meta, element("span", "propertyCursor", t("Visitar", "Visit")), button);
      fragment.append(card);
    });
    grid.replaceChildren(fragment);
  }

  render();

  document.querySelectorAll("[data-property-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.dataset.propertyFilter;
      document.querySelectorAll("[data-property-filter]").forEach(function (item) {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      document.querySelectorAll(".propertyCard").forEach(function (card) {
        card.hidden = filter !== "all" && card.dataset.region !== filter;
      });
    });
  });
  var initialFilter = document.querySelector("[data-property-filter].is-active");
  if (initialFilter) initialFilter.setAttribute("aria-pressed", "true");

  if (dialog) {
    stage = dialog.querySelector("[data-vw-stage]");
    plateLabel = dialog.querySelector("[data-vw-plate]");
    thumbs = dialog.querySelector("[data-vw-thumbs]");
    var q = function (s) { return dialog.querySelector(s); };
    q("[data-dialog-close]").addEventListener("click", closeProperty);
    q("[data-dialog-prev]").addEventListener("click", function () { openProperty(properties[(activeIndex - 1 + properties.length) % properties.length]); });
    q("[data-dialog-next]").addEventListener("click", function () { openProperty(properties[(activeIndex + 1) % properties.length]); });
    q("[data-vw-prev]").addEventListener("click", function () { showPlate(plateIndex - 1); });
    q("[data-vw-next]").addEventListener("click", function () { showPlate(plateIndex + 1); });

    /* deslizar la lámina con el dedo */
    var sx = 0, sy = 0;
    stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) showPlate(plateIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    dialog.addEventListener("close", function () {
      document.documentElement.style.overflow = "";
      if (lastTrigger) { var o = lastTrigger.querySelector && lastTrigger.querySelector(".propertyOpen"); (o || lastTrigger).focus({ preventScroll: true }); }
    });
    dialog.addEventListener("cancel", function () { document.documentElement.style.overflow = ""; });
    document.addEventListener("keydown", function (event) {
      if (!dialog.hasAttribute("open")) return;
      if (event.key === "Escape" || event.key === "Esc") closeProperty();
      else if (event.key === "ArrowRight") showPlate(plateIndex + 1);
      else if (event.key === "ArrowLeft") showPlate(plateIndex - 1);
    });
  }
})();
