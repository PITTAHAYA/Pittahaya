/* ATLAS · institutional interactions (CSP-safe, dependency-free) */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var isEnglish = /^en\b/i.test(root.lang || "");
  var t = function (spanish, english) { return isEnglish ? english : spanish; };
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var header = doc.querySelector("[data-header]");
  var progress = doc.querySelector("[data-progress]");
  var nav = doc.querySelector("[data-nav]");
  var navToggle = doc.querySelector("[data-nav-toggle]");
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav-link[href^="#"]'));
  var hero = doc.querySelector("[data-hero]");
  var bridge = doc.querySelector("[data-system-bridge]");
  var presence = doc.querySelector("[data-presence]");
  var sectors = Array.prototype.slice.call(doc.querySelectorAll("[data-sector]"));
  var scrollFrame = 0;
  var lastFocused = null;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function elementProgress(element) {
    if (!element) return 0;
    var rect = element.getBoundingClientRect();
    return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
  }

  function updateScrollState() {
    scrollFrame = 0;
    var scrollTop = window.scrollY || root.scrollTop || 0;
    var scrollRange = Math.max(1, root.scrollHeight - window.innerHeight);

    if (progress) progress.style.transform = "scaleX(" + clamp(scrollTop / scrollRange, 0, 1) + ")";
    if (header) header.classList.toggle("is-condensed", scrollTop > 34);

    if (reducedMotion.matches) return;

    if (hero) hero.style.setProperty("--hero-y", Math.min(scrollTop * 0.075, 58) + "px");

    sectors.forEach(function (sector) {
      var amount = elementProgress(sector);
      sector.style.setProperty("--sector-progress", amount.toFixed(3));
      sector.style.setProperty("--media-y", ((amount - 0.5) * 34).toFixed(2) + "px");
    });

    if (bridge) bridge.style.setProperty("--bridge-progress", elementProgress(bridge).toFixed(3));
    if (presence) presence.style.setProperty("--presence-progress", elementProgress(presence).toFixed(3));
  }

  function requestScrollUpdate() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  }

  function navigationIsOverlay() {
    return window.innerWidth <= 820;
  }

  function syncNavigationAvailability(open) {
    if (!nav) return;
    nav.inert = navigationIsOverlay() && !open;
  }

  function setNav(open, restoreFocus) {
    if (!nav || !navToggle) return;
    syncNavigationAvailability(open);
    nav.classList.toggle("is-open", open);
    body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open
      ? t("Cerrar navegación", "Close navigation")
      : t("Abrir navegación", "Open navigation"));

    if (open) {
      lastFocused = doc.activeElement;
      var firstLink = nav.querySelector("a");
      if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 80);
    } else if (restoreFocus && lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function onNavKeydown(event) {
    if (!nav || !nav.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setNav(false, true);
      return;
    }
    if (event.key !== "Tab") return;

    var focusable = Array.prototype.slice.call(nav.querySelectorAll("a, button:not([disabled])"));
    focusable.unshift(navToggle);
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initialiseNavigation() {
    if (!nav || !navToggle) return;
    syncNavigationAvailability(false);
    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true", true);
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false, true);
    });
    doc.addEventListener("keydown", onNavKeydown);
    window.addEventListener("resize", function () {
      var open = nav.classList.contains("is-open");
      if (!navigationIsOverlay()) setNav(false, false);
      else syncNavigationAvailability(open);
    }, { passive: true });
  }

  function initialiseReveals() {
    var revealItems = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));
    if (!revealItems.length) return;
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = ((index % 3) * 80) + "ms";
      observer.observe(item);
    });
  }

  function initialiseActiveNavigation() {
    if (!navLinks.length || !("IntersectionObserver" in window)) return;
    var linkById = {};
    navLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (doc.getElementById(id)) linkById[id] = link;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || !linkById[entry.target.id]) return;
        navLinks.forEach(function (link) {
          link.classList.remove("is-current");
          link.removeAttribute("aria-current");
        });
        linkById[entry.target.id].classList.add("is-current");
        linkById[entry.target.id].setAttribute("aria-current", "location");
      });
    }, { rootMargin: "-38% 0px -56% 0px", threshold: 0 });

    Object.keys(linkById).forEach(function (id) { observer.observe(doc.getElementById(id)); });
  }

  function makeTextElement(tagName, className, value) {
    var element = doc.createElement(tagName);
    element.className = className;
    element.textContent = value;
    return element;
  }

  function initialiseArchive() {
    var ledger = doc.querySelector("[data-archive-ledger]");
    var readout = doc.querySelector("[data-archive-readout]");
    var meta = doc.querySelector("[data-archive-meta]");
    var toggle = doc.querySelector("[data-archive-toggle]");
    var disclosure = doc.querySelector("[data-archive-disclosure]");
    var content = window.ATLAS_CONTENT;

    if (ledger && content && Array.isArray(content.companies)) {
      var fragment = doc.createDocumentFragment();
      var folios = [];
      var volumeNumerals = ["I", "II", "III", "IV"];
      var companies = content.companies.slice(0, 24);

      function normaliseValue(value, fallback) {
        return value == null || value === "" ? fallback : String(value);
      }

      function renderArchiveMeta(company) {
        if (!meta) return;

        var items = [
          ["Sector", normaliseValue(company.sector, t("Clasificacion reservada", "Reserved classification"))],
          [t("Region", "Region"), normaliseValue(company.region || company.country, t("Jurisdiccion reservada", "Reserved jurisdiction"))],
          [t("Entrada", "Entry"), normaliseValue(company.acquisitionYear, t("Bajo validacion", "Pending validation"))],
          [t("Tesis", "Thesis"), normaliseValue(company.assetType, t("Funcion esencial", "Essential function"))]
        ];

        meta.replaceChildren();
        items.forEach(function (item) {
          var row = doc.createElement("div");
          var term = doc.createElement("dt");
          var detail = doc.createElement("dd");

          term.textContent = item[0];
          detail.textContent = item[1];
          row.appendChild(term);
          row.appendChild(detail);
          meta.appendChild(row);
        });
      }

      function updateDisclosure(company) {
        if (!disclosure) return;

        var fields = disclosure.querySelectorAll("div");
        var values = [
          normaliseValue(company.sector, t("Clasificacion operativa", "Operating classification")),
          normaliseValue(company.region || company.country, t("Jurisdiccion", "Jurisdiction")),
          normaliseValue(company.acquisitionYear, t("Ano de entrada", "Entry year")),
          normaliseValue(company.assetType, t("Funcion esencial", "Essential function"))
        ];

        fields.forEach(function (field, fieldIndex) {
          var value = field.querySelector("b");
          if (value) value.textContent = values[fieldIndex] || t("Reservado", "Reserved");
        });

        var note = disclosure.querySelector("p");
        if (note) {
          note.textContent = normaliseValue(
            company.description,
            t(
              "Detalle operativo disponible despues de la validacion institucional.",
              "Operating detail available after institutional validation."
            )
          );
        }
      }

      function selectFolio(folio, company, index) {
        folios.forEach(function (item) {
          item.classList.remove("is-selected");
          item.setAttribute("aria-pressed", "false");
        });
        folio.classList.add("is-selected");
        folio.setAttribute("aria-pressed", "true");
        if (readout) {
          var number = String(index + 1).padStart(2, "0");
          var fallbackId = "FOLIO " + number;
          readout.textContent = normaliseValue(company.id, fallbackId) + " - " +
            normaliseValue(company.name, t("Registro privado", "Private record"));
        }
        renderArchiveMeta(company);
        updateDisclosure(company);
      }

      volumeNumerals.forEach(function (numeral, volumeIndex) {
        var start = volumeIndex * 6;
        var end = Math.min(start + 6, companies.length);
        if (start >= end) return;

        var volume = doc.createElement("section");
        var heading = doc.createElement("div");
        var rail = doc.createElement("div");

        volume.className = "archive-volume";
        heading.className = "archive-volume__label";
        rail.className = "archive-volume__rail";
        heading.appendChild(makeTextElement("span", "", t("Volumen ", "Volume ") + numeral));
        heading.appendChild(makeTextElement(
          "small",
          "",
          t("Folios ", "Folios ") + String(start + 1).padStart(2, "0") + "–" + String(end).padStart(2, "0")
        ));

        companies.slice(start, end).forEach(function (company, offset) {
          var index = start + offset;
          var number = String(index + 1).padStart(2, "0");
          var folio = doc.createElement("button");

          folio.className = "archive-folio-marker" + (index === 0 ? " is-selected" : "");
          folio.type = "button";
          folio.setAttribute("aria-label", t("Consultar ", "View ") +
            normaliseValue(company.id, "folio " + number) + " - " +
            normaliseValue(company.name, t("registro privado", "private record")));
          folio.setAttribute("aria-pressed", String(index === 0));
          folio.appendChild(makeTextElement("span", "archive-folio-marker__tick", ""));
          folio.appendChild(makeTextElement("b", "archive-folio-marker__number", number));

          function activate() {
            selectFolio(folio, company, index);
          }

          folio.addEventListener("click", activate);
          folio.addEventListener("focus", activate);
          folio.addEventListener("pointerenter", activate);
          folios.push(folio);
          rail.appendChild(folio);
        });

        volume.appendChild(heading);
        volume.appendChild(rail);
        fragment.appendChild(volume);
      });

      ledger.replaceChildren(fragment);
      if (folios[0] && companies[0]) {
        selectFolio(folios[0], companies[0], 0);
      }
    }

    if (!toggle || !disclosure) return;
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      disclosure.setAttribute("aria-hidden", String(!open));
      disclosure.classList.toggle("is-open", open);
      var marker = toggle.querySelector("span");
      if (marker) marker.textContent = open ? "−" : "+";
    });
  }

  var year = doc.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  initialiseNavigation();
  initialiseReveals();
  initialiseActiveNavigation();
  initialiseArchive();

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", requestScrollUpdate);
  requestScrollUpdate();
})();
