/* ORBITAL · estimador de capacidad (precios de demostración) */
(function () {
  "use strict";

  var root = document.querySelector("[data-cap-calc]");
  if (!root) return;

  var isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  var locale = isEnglish ? "en-US" : "es";
  var t = function (es, en) { return isEnglish ? en : es; };

  var PF_PER_NODE = 1.2;
  var NODE_MONTH = 46000;              /* USD por nodo dedicado al mes */
  var WATER_PER_NODE = 22.4;           /* millones de litros/año que un equivalente terrestre evapora */

  var REGIONS = [
    { name: "Quito", orb: 11 },
    { name: "São Paulo", orb: 14 },
    { name: "Virginia", orb: 13 },
    { name: t("Londres", "London"), orb: 12 },
    { name: t("Singapur", "Singapore"), orb: 15 },
    { name: "Nairobi", orb: 16 }
  ];
  var TERMS = [
    { name: t("Bajo demanda", "On demand"), off: 0 },
    { name: t("1 año", "1 year"), off: 0.22 },
    { name: t("3 años", "3 years"), off: 0.38 }
  ];

  var range = root.querySelector("[data-cap-pf]");
  var pfOut = root.querySelector("[data-cap-pf-out]");
  var regionBox = root.querySelector("[data-cap-region]");
  var termBox = root.querySelector("[data-cap-term]");
  var priceEl = root.querySelector("[data-cap-price]");
  var saveEl = root.querySelector("[data-cap-save]");
  var nodesEl = root.querySelector("[data-cap-nodes]");
  var latEl = root.querySelector("[data-cap-lat]");
  var waterEl = root.querySelector("[data-cap-water]");
  var state = { region: 0, term: 1 };

  var num = function (n, dec) {
    return n.toLocaleString(locale, { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  };
  var money = function (n) { return (isEnglish ? "$" : "US$ ") + num(Math.round(n)); };

  var segment = function (box, items, key, label) {
    items.forEach(function (item, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = item.name;
      if (item.off) {
        var s = document.createElement("small");
        s.textContent = "−" + Math.round(item.off * 100) + "%";
        b.appendChild(s);
      }
      b.setAttribute("aria-pressed", String(i === state[key]));
      b.addEventListener("click", function () {
        state[key] = i;
        Array.prototype.forEach.call(box.children, function (c, n) { c.setAttribute("aria-pressed", String(n === i)); });
        render();
      });
      box.appendChild(b);
    });
    box.setAttribute("aria-label", label);
  };

  var render = function () {
    var nodes = parseInt(range.value, 10) || 1;
    var term = TERMS[state.term];
    var monthly = nodes * NODE_MONTH * (1 - term.off);
    var full = nodes * NODE_MONTH;
    pfOut.textContent = num(nodes * PF_PER_NODE, 1) + " PFLOP";
    range.setAttribute("aria-valuetext", pfOut.textContent + " · " + nodes + t(" nodos", " nodes"));
    priceEl.textContent = money(monthly);
    saveEl.textContent = term.off
      ? t("Ahorra ", "Save ") + money(full - monthly) + t(" al mes frente a bajo demanda", " a month versus on demand")
      : t("Sin permanencia · se factura por hora", "No commitment · billed hourly");
    nodesEl.textContent = nodes;
    latEl.textContent = REGIONS[state.region].orb + " ms";
    waterEl.textContent = num(nodes * WATER_PER_NODE, 1) + t(" M L/año", "M L/yr");
  };

  segment(regionBox, REGIONS, "region", t("Región de consumo", "Consumption region"));
  segment(termBox, TERMS, "term", t("Compromiso", "Commitment"));
  range.addEventListener("input", render);
  render();
})();
