/* ORIGEN 0° · trazabilidad por lote — cada barra, de la finca al templado */
(function () {
  "use strict";

  var form = document.querySelector("[data-lot-form]");
  var card = document.querySelector("[data-lot-card]");
  if (!form || !card) return;

  var isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  var locale = isEnglish ? "en-US" : "es";
  var t = function (es, en) { return isEnglish ? en : es; };
  var input = form.querySelector("[data-lot-input]");

  var LOTS = {
    "LC-2614": {
      edition: "Latitud Cero 72%", farm: "Finca El Paraíso", grower: t("Familia Cedeño", "The Cedeño family"),
      region: "Los Ríos · 60 m", variety: t("Nacional fino de aroma", "Nacional fine-flavor"), bars: 1240,
      path: [
        ["2026-02-14", t("Cosecha a mano", "Hand harvest"), t("Mazorcas maduras, abiertas el mismo día", "Ripe pods, opened the same day")],
        ["2026-02-15", t("Fermentación", "Fermentation"), t("6 días en cajón de laurel", "6 days in laurel-wood boxes")],
        ["2026-02-21", t("Secado", "Drying"), t("8 días al sol, girado a mano", "8 days in the sun, turned by hand")],
        ["2026-03-18", t("Tueste", "Roast"), "118 °C · 32 min"],
        ["2026-03-26", t("Conchado", "Conching"), "72 h"],
        ["2026-04-02", t("Templado y sellado", "Tempering and sealing"), t("Barra numerada a mano", "Hand-numbered bar")]
      ]
    },
    "TN-2608": {
      edition: "Tierra Negra 85%", farm: "Finca Las Delicias", grower: t("Familia Quiñónez", "The Quiñónez family"),
      region: "Esmeraldas · 140 m", variety: "Nacional × Trinitario", bars: 860,
      path: [
        ["2025-12-03", t("Cosecha a mano", "Hand harvest"), t("Final de la cosecha principal", "End of the main harvest")],
        ["2025-12-04", t("Fermentación", "Fermentation"), t("7 días bajo hoja de plátano", "7 days under banana leaves")],
        ["2025-12-11", t("Secado", "Drying"), t("10 días al sol", "10 days in the sun")],
        ["2026-01-20", t("Tueste", "Roast"), "124 °C · 28 min"],
        ["2026-01-29", t("Conchado", "Conching"), "80 h"],
        ["2026-02-06", t("Templado y sellado", "Tempering and sealing"), t("Barra numerada a mano", "Hand-numbered bar")]
      ]
    },
    "RC-2611": {
      edition: "Rosa & Cacao 70%", farm: "Finca San Jacinto", grower: t("Familia Mendoza", "The Mendoza family"),
      region: "Manabí · 320 m", variety: t("Nacional fino de aroma", "Nacional fine-flavor"), bars: 640,
      path: [
        ["2026-01-09", t("Cosecha a mano", "Hand harvest"), t("Selección de mazorcas por color", "Pods selected by color")],
        ["2026-01-10", t("Fermentación", "Fermentation"), t("5 días, fermentación corta para lo floral", "5 days, a short ferment to keep it floral")],
        ["2026-01-15", t("Secado", "Drying"), t("9 días al sol", "9 days in the sun")],
        ["2026-02-16", t("Tueste", "Roast"), "112 °C · 36 min"],
        ["2026-02-24", t("Conchado", "Conching"), t("64 h con pétalos de rosa", "64 h with rose petals")],
        ["2026-03-04", t("Templado y sellado", "Tempering and sealing"), t("Barra numerada a mano", "Hand-numbered bar")]
      ]
    },
    "NL-2605": {
      edition: "Nube de Leche 58%", farm: "Finca La Esperanza", grower: t("Familia Zambrano", "The Zambrano family"),
      region: "Manabí · 40 m", variety: t("Nacional fino de aroma", "Nacional fine-flavor"), bars: 1800,
      path: [
        ["2025-11-18", t("Cosecha a mano", "Hand harvest"), t("Mazorcas de la costa de Jama", "Pods from the Jama coast")],
        ["2025-11-19", t("Fermentación", "Fermentation"), t("5 días bajo hoja de plátano", "5 days under banana leaves")],
        ["2025-11-24", t("Secado", "Drying"), t("8 días al sol", "8 days in the sun")],
        ["2025-12-22", t("Tueste", "Roast"), "110 °C · 30 min"],
        ["2026-01-05", t("Conchado", "Conching"), t("60 h con leche entera y panela", "60 h with whole milk and panela")],
        ["2026-01-12", t("Templado y sellado", "Tempering and sealing"), t("Barra numerada a mano", "Hand-numbered bar")]
      ]
    },
    "AP-2602": {
      edition: "Altitud Pura 92%", farm: "Finca Yaku", grower: t("Familia Grefa", "The Grefa family"),
      region: t("Napo · 620 m", "Napo · 620 m"), variety: t("Nacional amazónico", "Amazonian Nacional"), bars: 520,
      path: [
        ["2026-01-22", t("Cosecha a mano", "Hand harvest"), t("Árboles de más de cuarenta años", "Trees over forty years old")],
        ["2026-01-23", t("Fermentación", "Fermentation"), t("7 días en cajón de laurel", "7 days in laurel-wood boxes")],
        ["2026-01-30", t("Secado", "Drying"), t("12 días bajo techo ventilado", "12 days under a ventilated roof")],
        ["2026-03-02", t("Tueste", "Roast"), "122 °C · 30 min"],
        ["2026-03-10", t("Conchado", "Conching"), "84 h"],
        ["2026-03-19", t("Templado y sellado", "Tempering and sealing"), t("Barra numerada a mano", "Hand-numbered bar")]
      ]
    },
    "SA-2609": {
      edition: "Sal Amazónica 75%", farm: "Finca Sumak", grower: t("Familia Tanguila", "The Tanguila family"),
      region: t("Napo · 510 m", "Napo · 510 m"), variety: t("Nacional amazónico", "Amazonian Nacional"), bars: 900,
      path: [
        ["2026-02-03", t("Cosecha a mano", "Hand harvest"), t("Chacra junto a guayusa y yuca", "Forest garden beside guayusa and cassava")],
        ["2026-02-04", t("Fermentación", "Fermentation"), t("6 días en cajón de laurel", "6 days in laurel-wood boxes")],
        ["2026-02-10", t("Secado", "Drying"), t("10 días al sol", "10 days in the sun")],
        ["2026-03-12", t("Tueste", "Roast"), "116 °C · 32 min"],
        ["2026-03-20", t("Conchado", "Conching"), "70 h"],
        ["2026-03-28", t("Templado y sellado", "Tempering and sealing"), t("Sal de manantial espolvoreada a mano", "Spring salt scattered by hand")]
      ]
    }
  };

  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  var date = function (iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  };
  var normalise = function (raw) {
    var v = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return v.length > 2 ? v.slice(0, 2) + "-" + v.slice(2) : v;
  };

  var render = function (code) {
    var lot = LOTS[code];
    card.replaceChildren();
    card.classList.remove("is-fresh");
    void card.offsetWidth;
    card.classList.add("is-fresh");

    if (!lot) {
      var miss = el("div", "lot-miss");
      miss.append(
        el("small", "", t("Lote no encontrado", "Lot not found")),
        el("h3", "serif", t("No encontramos «" + (code || "—") + "».", "We couldn't find “" + (code || "—") + "”.")),
        el("p", "", t("El código tiene dos letras y cuatro números, y está impreso en el reverso de la barra. Pruebe con LC-2614.",
          "The code has two letters and four digits, and is printed on the back of the bar. Try LC-2614."))
      );
      card.append(miss);
      return;
    }

    var head = el("div", "lot-head");
    head.append(
      el("small", "", t("Lote ", "Lot ") + code),
      el("h3", "serif", lot.edition),
      el("p", "", lot.farm + " · " + lot.grower)
    );

    var facts = el("dl", "lot-facts");
    [
      [t("Región · altitud", "Region · altitude"), lot.region],
      [t("Variedad", "Variety"), lot.variety],
      [t("Barras en el lote", "Bars in this lot"), lot.bars.toLocaleString(locale)],
      [t("Del árbol a la barra", "Tree to bar"), Math.round((new Date(lot.path[lot.path.length - 1][0]) - new Date(lot.path[0][0])) / 864e5) + t(" días", " days")]
    ].forEach(function (f) {
      var d = el("div");
      d.append(el("dt", "", f[0]), el("dd", "serif", f[1]));
      facts.append(d);
    });

    var path = el("ol", "lot-path");
    lot.path.forEach(function (step) {
      var li = el("li");
      var time = el("time", "", date(step[0]));
      time.dateTime = step[0];
      var body = el("span");
      body.append(el("b", "", step[1]), el("i", "lot-det", " · " + step[2]));
      li.append(time, body);
      path.append(li);
    });

    card.append(head, facts, path);
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = normalise(input.value);
    input.value = code;
    render(code);
  });
  form.querySelectorAll("[data-lot-try]").forEach(function (b) {
    b.addEventListener("click", function () {
      input.value = b.getAttribute("data-lot-try");
      render(input.value);
    });
  });

  /* la ficha de producto enlaza con #lote=LC-2614 (el hash sobrevive a la
     redirección a URL limpia; un ?lot= no) */
  var desdeHash = (location.hash.match(/lote=([A-Za-z0-9-]+)/) || [])[1];
  var fromUrl = desdeHash || new URLSearchParams(location.search).get("lot");
  var first = fromUrl ? normalise(fromUrl) : "LC-2614";
  input.value = first;
  render(first);
  if (desdeHash) {
    var seccion = document.getElementById("trazabilidad");
    if (seccion) window.setTimeout(function () { seccion.scrollIntoView({ block: "start" }); }, 350);
  }
})();
