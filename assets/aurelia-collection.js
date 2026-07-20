/* AURELIA Private Estates — centralized property collection */
(function () {
  "use strict";

  var isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  var assetRoot = isEnglish ? "../assets/" : "assets/";
  var t = function (spanish, english) { return isEnglish ? english : spanish; };

  var properties = [
    {
      slug: "mare-alta",
      name: "Villa Mare Alta",
      region: "costa",
      location: t("Costa mediterránea", "Mediterranean coast"),
      type: t("Residencia costera", "Coastal residence"),
      image: assetRoot + "casas/mare-costa.jpg",
      focus: "50% 48%",
      interior: assetRoot + "casas/mare-interior.jpg",
      description: t("Una composición horizontal de piedra, madera y agua que desciende hacia el mar. La arquitectura protege la llegada y reserva el horizonte para el momento exacto de entrada.", "A horizontal composition of stone, timber, and water descending toward the sea. The architecture shelters the arrival and reserves the horizon for the precise moment of entry."),
      facts: [[t("Representación", "Representation"), t("Privada", "Private")], [t("Visitas", "Viewings"), t("Concertadas", "By appointment")], ["Dossier", t("Bajo consulta", "Upon request")]]
    },
    {
      slug: "solene",
      name: "Maison Solène",
      region: "costa",
      location: t("Litoral mediterráneo", "Mediterranean shoreline"),
      type: t("Villa contemporánea", "Contemporary villa"),
      image: assetRoot + "casas/solene-entrada.jpg",
      focus: "50% 50%",
      interior: assetRoot + "casas/solene-interior.jpg",
      description: t("Muros minerales, patios contenidos y una secuencia interior que conduce hacia la luz. Una residencia pensada para habitar el litoral con calma y privacidad.", "Mineral walls, sheltered courtyards, and an interior sequence leading toward the light. A residence conceived for coastal living with calm and privacy."),
      facts: [[t("Entorno", "Setting"), t("Costero", "Coastal")], [t("Arquitectura", "Architecture"), t("Contemporánea", "Contemporary")], [t("Precio", "Price"), t("Bajo consulta", "Upon request")]]
    },
    {
      slug: "solar",
      name: "Casa Solar",
      region: "desierto",
      location: t("Paisaje desértico", "Desert landscape"),
      type: t("Residencia arquitectónica", "Architectural residence"),
      image: assetRoot + "casas/casa-solar.jpg",
      focus: "50% 54%",
      interior: assetRoot + "casas/solar-interior.jpg",
      description: t("Una pieza de hormigón y sombra en diálogo con un paisaje abierto. Sus planos profundos, el agua y la vegetación construyen un refugio preciso frente al clima.", "A composition of concrete and shadow in dialogue with an open landscape. Deep planes, water, and vegetation create a precise refuge from the climate."),
      facts: [[t("Paisaje", "Landscape"), t("Desértico", "Desert")], [t("Carácter", "Character"), t("Arquitectónico", "Architectural")], [t("Acceso", "Access"), t("Por consulta", "By enquiry")]]
    },
    {
      slug: "aster",
      name: "Chalet Aster",
      region: "montana",
      location: t("Entorno alpino", "Alpine setting"),
      type: t("Chalet privado", "Private chalet"),
      image: assetRoot + "casas/chalet-aster.jpg",
      focus: "50% 52%",
      interior: assetRoot + "casas/aster-interior.jpg",
      description: t("Una interpretación contemporánea del refugio de montaña: piedra, madera oscura y grandes aperturas que equilibran protección, paisaje y vida interior.", "A contemporary interpretation of the mountain refuge: stone, dark timber, and generous openings balancing shelter, landscape, and interior life."),
      facts: [[t("Entorno", "Setting"), t("Alpino", "Alpine")], [t("Tipología", "Type"), "Chalet"], [t("Disponibilidad", "Availability"), t("Bajo consulta", "Upon request")]]
    },
    {
      slug: "lumen",
      name: "Villa Lumen",
      region: "montana",
      location: t("Bosque de montaña", "Mountain forest"),
      type: t("Villa contemporánea", "Contemporary villa"),
      image: assetRoot + "casas/villa-lumen.jpg",
      focus: "50% 48%",
      interior: assetRoot + "casas/lumen-interior.jpg",
      description: t("Cristal, roca y reflejos suspendidos entre la niebla. La vivienda se abre al bosque sin renunciar a una sensación protegida, íntima y deliberadamente silenciosa.", "Glass, rock, and reflections suspended in the mist. The residence opens to the forest without surrendering a sheltered, intimate, and deliberately quiet atmosphere."),
      facts: [[t("Paisaje", "Landscape"), t("Bosque", "Forest")], [t("Arquitectura", "Architecture"), t("Contemporánea", "Contemporary")], ["Dossier", t("Privado", "Private")]]
    }
  ];

  window.AURELIA_PROPERTIES = properties;

  var grid = document.querySelector("[data-property-grid]");
  var dialog = document.querySelector("[data-property-dialog]");
  var lastTrigger = null;
  var activeIndex = 0;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function openProperty(property, trigger) {
    if (!dialog) return;
    lastTrigger = trigger || null;
    var image = dialog.querySelector("[data-dialog-image]");
    var title = dialog.querySelector("[data-dialog-title]");
    var location = dialog.querySelector("[data-dialog-location]");
    var description = dialog.querySelector("[data-dialog-description]");
    var facts = dialog.querySelector("[data-dialog-facts]");
    var reference = dialog.querySelector("[data-dialog-reference]");
    var view = dialog.querySelector("[data-dialog-view]");

    activeIndex = properties.indexOf(property);

    image.onerror = function () {
      image.onerror = null;
      image.src = property.image;
    };
    image.src = property.interior || property.image;
    image.alt = t("Interior de ", "Interior of ") + property.name + " — " + property.location;
    title.textContent = property.name;
    location.textContent = property.type + " · " + property.location;
    description.textContent = property.description;
    if (reference) reference.textContent = "A/" + String(activeIndex + 1).padStart(2, "0");
    if (view) view.textContent = t("Vista interior", "Interior view") + " · A/" + String(activeIndex + 1).padStart(2, "0");
    facts.replaceChildren();
    property.facts.forEach(function (fact) {
      var row = element("div", "dialogFact");
      row.append(element("span", "", fact[0]), element("b", "", fact[1]));
      facts.append(row);
    });

    if (!dialog.hasAttribute("open")) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
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
      meta.append(eyebrow, element("h3", "", property.name), element("p", "", t("Ver ficha privada →", "View private details →")));

      var propertyIndex = element("span", "propertyIndex", "A/" + String(index + 1).padStart(2, "0"));
      var propertyStatus = element("span", "propertyStatus", t("Presentación privada", "Private presentation"));
      var propertyCursor = element("span", "propertyCursor", t("Explorar", "Explore"));

      var button = element("button", "propertyOpen", t("Abrir ficha de ", "Open details for ") + property.name);
      button.type = "button";
      button.addEventListener("click", function () { openProperty(property, button); });
      var preloadInterior = function () {
        if (!property.interior || property.__interiorPrimed) return;
        property.__interiorPrimed = true;
        var interiorImage = new Image();
        interiorImage.src = property.interior;
      };
      card.addEventListener("pointerenter", preloadInterior, { once: true });
      button.addEventListener("focus", preloadInterior, { once: true });
      card.append(image, propertyIndex, propertyStatus, meta, propertyCursor, button);
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
    var closeButton = dialog.querySelector("[data-dialog-close]");
    var previousButton = dialog.querySelector("[data-dialog-prev]");
    var nextButton = dialog.querySelector("[data-dialog-next]");
    if (closeButton) closeButton.addEventListener("click", closeProperty);
    if (previousButton) previousButton.addEventListener("click", function () {
      activeIndex = (activeIndex - 1 + properties.length) % properties.length;
      openProperty(properties[activeIndex], lastTrigger);
    });
    if (nextButton) nextButton.addEventListener("click", function () {
      activeIndex = (activeIndex + 1) % properties.length;
      openProperty(properties[activeIndex], lastTrigger);
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeProperty();
    });
    dialog.addEventListener("close", function () {
      document.documentElement.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
    });
    dialog.addEventListener("cancel", function () {
      document.documentElement.style.overflow = "";
    });
  }
})();
