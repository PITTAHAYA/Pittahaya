/* AURELIA Private Estates — centralized property collection */
(function () {
  "use strict";

  var properties = [
    {
      slug: "mare-alta",
      name: "Villa Mare Alta",
      region: "costa",
      location: "Costa mediterránea",
      type: "Residencia costera",
      image: "assets/casas/mare-costa.jpg",
      focus: "50% 48%",
      interior: "assets/casas/mare-interior.jpg",
      description: "Una composición horizontal de piedra, madera y agua que desciende hacia el mar. La arquitectura protege la llegada y reserva el horizonte para el momento exacto de entrada.",
      facts: [["Representación", "Privada"], ["Visitas", "Concertadas"], ["Dossier", "Bajo consulta"]]
    },
    {
      slug: "solene",
      name: "Maison Solène",
      region: "costa",
      location: "Litoral mediterráneo",
      type: "Villa contemporánea",
      image: "assets/casas/solene-entrada.jpg",
      focus: "50% 50%",
      interior: "assets/casas/solene-interior.jpg",
      description: "Muros minerales, patios contenidos y una secuencia interior que conduce hacia la luz. Una residencia pensada para habitar el litoral con calma y privacidad.",
      facts: [["Entorno", "Costero"], ["Arquitectura", "Contemporánea"], ["Precio", "Bajo consulta"]]
    },
    {
      slug: "solar",
      name: "Casa Solar",
      region: "desierto",
      location: "Paisaje desértico",
      type: "Residencia arquitectónica",
      image: "assets/casas/casa-solar.jpg",
      focus: "50% 54%",
      interior: "assets/casas/solar-interior.jpg",
      description: "Una pieza de hormigón y sombra en diálogo con un paisaje abierto. Sus planos profundos, el agua y la vegetación construyen un refugio preciso frente al clima.",
      facts: [["Paisaje", "Desértico"], ["Carácter", "Arquitectónico"], ["Acceso", "Por consulta"]]
    },
    {
      slug: "aster",
      name: "Chalet Aster",
      region: "montana",
      location: "Entorno alpino",
      type: "Chalet privado",
      image: "assets/casas/chalet-aster.jpg",
      focus: "50% 52%",
      interior: "assets/casas/aster-interior.jpg",
      description: "Una interpretación contemporánea del refugio de montaña: piedra, madera oscura y grandes aperturas que equilibran protección, paisaje y vida interior.",
      facts: [["Entorno", "Alpino"], ["Tipología", "Chalet"], ["Disponibilidad", "Bajo consulta"]]
    },
    {
      slug: "lumen",
      name: "Villa Lumen",
      region: "montana",
      location: "Bosque de montaña",
      type: "Villa contemporánea",
      image: "assets/casas/villa-lumen.jpg",
      focus: "50% 48%",
      interior: "assets/casas/lumen-interior.jpg",
      description: "Cristal, roca y reflejos suspendidos entre la niebla. La vivienda se abre al bosque sin renunciar a una sensación protegida, íntima y deliberadamente silenciosa.",
      facts: [["Paisaje", "Bosque"], ["Arquitectura", "Contemporánea"], ["Dossier", "Privado"]]
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
    image.alt = "Interior de " + property.name + " — " + property.location;
    title.textContent = property.name;
    location.textContent = property.type + " · " + property.location;
    description.textContent = property.description;
    if (reference) reference.textContent = "A/" + String(activeIndex + 1).padStart(2, "0");
    if (view) view.textContent = "Vista interior · A/" + String(activeIndex + 1).padStart(2, "0");
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
      meta.append(eyebrow, element("h3", "", property.name), element("p", "", "Ver ficha privada →"));

      var propertyIndex = element("span", "propertyIndex", "A/" + String(index + 1).padStart(2, "0"));
      var propertyStatus = element("span", "propertyStatus", "Presentación privada");
      var propertyCursor = element("span", "propertyCursor", "Explorar");

      var button = element("button", "propertyOpen", "Abrir ficha de " + property.name);
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
