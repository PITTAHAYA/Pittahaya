/* ═══════════════════════════════════════════════════════════
   Pittahaya · motor del selector de plan
   Tres preguntas → un veredicto. Sin cifras de dinero: la lista
   se escalona y la tarjeta recomendada se enciende abajo.
   Se dibuja solo: no hay que tocar el HTML de planes.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var vitrina = doc.querySelector(".pricing");
  if (!vitrina) return;

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EN = doc.documentElement.lang === "en";
  function t(es, en) { return EN ? en : es; }

  /* ── Las preguntas ───────────────────────────────────────── */
  var PREGUNTAS = [
    { id: "alcance", p: t("¿Qué necesitas mostrar?", "What do you need to show?"), o: [
        { v: 0, l: t("Una sola idea", "One single idea") },
        { v: 1, l: t("Servicios y prueba", "Services and proof") },
        { v: 2, l: t("Todo el negocio", "The whole business") }
      ] },
    { id: "ia", p: t("¿Quieres que atienda sin ti?", "Should it answer without you?"), o: [
        { v: 0, l: t("Todavía no", "Not yet") },
        { v: 1, l: t("Que responda", "Just answer") },
        { v: 2, l: t("Que venda y agende", "Sell and book") }
      ] },
    { id: "prisa", p: t("¿Para cuándo?", "By when?"), o: [
        { v: 0, l: t("Sin apuro", "No rush") },
        { v: 1, l: t("Este mes", "This month") },
        { v: 2, l: t("Ya mismo", "Right away") }
      ] }
  ];

  /* ── Los veredictos ──────────────────────────────────────── */
  var PLANES = {
    basico: {
      nombre: t("Plan Básico", "Starter Plan"),
      cifra: "1", unidad: t("semana", "week"),
      nota: t("Una página a medida", "One custom page"),
      por: t("Con una sola idea que contar, una página bien hecha vende más que cinco a medias.",
             "With one idea to tell, a single page done right sells more than five half-done."),
      da: [t("Landing a medida, sin plantillas", "Custom landing, no templates"),
           t("Formulario y WhatsApp directo", "Contact form and direct WhatsApp"),
           t("SEO base y dominio publicado", "Base SEO and domain published")],
      ir: "#plan-basico"
    },
    negocio: {
      nombre: t("Plan Negocio", "Business Plan"),
      cifra: "2", unidad: t("semanas", "weeks"),
      nota: t("Cinco páginas", "Five pages"),
      por: t("Necesitas espacio para servicios, prueba y una ruta clara a la cotización.",
             "You need room for services, proof, and a clear path to the quote."),
      da: [t("Cinco páginas y dos rondas de cambios", "Five pages and two revision rounds"),
           t("Estructura pensada para convertir", "Structure built to convert"),
           t("Treinta días de soporte", "Thirty days of support")],
      ir: "#plan-negocio"
    },
    premium: {
      nombre: t("Plan Premium", "Premium Plan"),
      cifra: "4", unidad: t("semanas", "weeks"),
      nota: t("Páginas sin límite", "Unlimited pages"),
      por: t("Todo el negocio en línea pide arquitectura, no páginas sueltas.",
             "A whole business online needs architecture, not loose pages."),
      da: [t("Páginas sin límite y dirección visual", "Unlimited pages and art direction"),
           t("Sistema completo, hecho a mano", "A complete system, built by hand"),
           t("Sesenta días de soporte", "Sixty days of support")],
      ir: "#plan-premium"
    },
    sistema: {
      nombre: t("Sistema Completo", "Complete System"),
      cifra: "6", unidad: t("semanas", "weeks"),
      nota: t("Web + automatización", "Web + automation"),
      por: t("Quieres que además de verse bien, atienda, agende y dé seguimiento solo.",
             "You want it to look right and also answer, book, and follow up on its own."),
      da: [t("Web premium + agentes de IA", "Premium site + AI agents"),
           t("Agenda y seguimiento automáticos", "Automatic booking and follow-up"),
           t("Integrado con tus herramientas", "Wired into your tools")],
      ir: "#plan-sistema"
    }
  };

  function decidir(r) {
    if (r.ia >= 2) return "sistema";
    if (r.alcance >= 2) return "premium";
    if (r.alcance >= 1 || r.ia >= 1) return "negocio";
    return "basico";
  }


  /* ---------------------------------------------------------- */
  /* Las tarjetas se pliegan: el selector ya decidió             */
  /* ---------------------------------------------------------- */
  /* Con el selector arriba, las tres tarjetas ya no tienen que
     gritar su lista completa: en el teléfono medían 861 px cada
     una. Se quedan con el titular y el resumen, y el detalle se
     abre a pedido. */
  Array.prototype.forEach.call(doc.querySelectorAll(".card.price"), function (c) {
    var lista = c.querySelector(".plan-features");
    if (!lista || lista.dataset.pleg) return;
    lista.dataset.pleg = "1";

    /* grid-template-rows:0fr sólo colapsa un único hijo de rejilla; con
       seis <li> cada uno recibe su fila. Va envuelto. */
    var caja = doc.createElement("div");
    caja.className = "plan-detalle";
    lista.parentNode.insertBefore(caja, lista);
    caja.appendChild(lista);

    var id = (c.id || "plan") + "-detalle";
    caja.id = id;

    var abre = doc.createElement("button");
    abre.type = "button";
    abre.className = "plan-abre";
    abre.setAttribute("aria-expanded", "false");
    abre.setAttribute("aria-controls", id);
    abre.innerHTML = '<span>' + t("Ver qué incluye", "See what’s included") + '</span><i aria-hidden="true"></i>';
    caja.parentNode.insertBefore(abre, caja);

    abre.addEventListener("click", function () {
      var abierto = abre.getAttribute("aria-expanded") === "true";
      abre.setAttribute("aria-expanded", String(!abierto));
      c.classList.toggle("is-abierta", !abierto);
      abre.querySelector("span").textContent = !abierto
        ? t("Ocultar detalle", "Hide detail")
        : t("Ver qué incluye", "See what’s included");
    });
  });

  /* ── El panel ────────────────────────────────────────────── */
  var sel = doc.createElement("section");
  sel.className = "sel";
  sel.setAttribute("aria-label", t("Selector de plan", "Plan selector"));

  var preguntasHTML = PREGUNTAS.map(function (q) {
    return '<div class="sel__q"><p id="sel-' + q.id + '">' + q.p + '</p>' +
      '<div class="sel__opts" role="group" aria-labelledby="sel-' + q.id + '">' +
      q.o.map(function (o, i) {
        return '<button class="sel__opt" type="button" data-q="' + q.id + '" data-v="' + o.v +
               '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + o.l + '</button>';
      }).join("") + "</div></div>";
  }).join("");

  sel.innerHTML =
    '<div class="sel__head">' +
      '<span class="sel__kicker">' + t("Antes de elegir", "Before you choose") + '</span>' +
      '<h3 class="sel__title">' + t("Responde tres cosas y <em>te decimos cuál.</em>",
                                    "Answer three things and <em>we’ll tell you which.</em>") + '</h3>' +
    '</div>' +
    preguntasHTML +
    '<div class="sel__out">' +
      '<div>' +
        '<p class="sel__plan" data-sel-plan></p>' +
        '<p class="sel__why" data-sel-why></p>' +
        '<ul class="sel__incluye" data-sel-da></ul>' +
      '</div>' +
      '<div class="sel__side">' +
        '<span class="sel__price"><span data-sel-cifra></span><sup data-sel-unidad></sup></span>' +
        '<span class="sel__nota" data-sel-nota></span>' +
        '<a class="sel__go" data-sel-go href="#"><span>' + t("Ver este plan", "See this plan") + '</span><i>→</i></a>' +
      '</div>' +
    '</div>';

  vitrina.parentNode.insertBefore(sel, vitrina);

  var elPlan = sel.querySelector("[data-sel-plan]");
  var elPor = sel.querySelector("[data-sel-why]");
  var elDa = sel.querySelector("[data-sel-da]");
  var elCifra = sel.querySelector("[data-sel-cifra]");
  var elUnidad = sel.querySelector("[data-sel-unidad]");
  var elNota = sel.querySelector("[data-sel-nota]");
  var elIr = sel.querySelector("[data-sel-go]");

  var respuestas = { alcance: 0, ia: 0, prisa: 0 };
  var actual = null;

  function pintar(clave, primera) {
    if (clave === actual) return;
    actual = clave;
    var pl = PLANES[clave];

    function escribir() {
      elPlan.textContent = pl.nombre;
      elPor.textContent = pl.por;
      elNota.textContent = pl.nota;
      elIr.setAttribute("href", pl.ir);

      elDa.textContent = "";
      pl.da.forEach(function (linea, i) {
        var li = doc.createElement("li");
        li.textContent = linea;
        li.style.setProperty("--sd", (i * 90) + "ms");
        elDa.appendChild(li);
        window.setTimeout(function () { li.classList.add("is-in"); }, 20);
      });

      elCifra.textContent = pl.cifra;
      elUnidad.textContent = pl.unidad;
      sel.classList.remove("is-morphing");
      encender(clave);
    }

    if (primera || quieto) { escribir(); return; }
    sel.classList.add("is-morphing");
    window.setTimeout(escribir, 220);
  }

  /* la tarjeta correspondiente se enciende y las demás bajan */
  var ANCLA = { basico: "plan-basico", negocio: "plan-negocio",
                premium: "plan-premium", sistema: "plan-sistema" };
  var todas = doc.querySelectorAll(".card.price");

  function encender(clave) {
    var meta = doc.getElementById(ANCLA[clave]);
    vitrina.classList.add("is-decidido");
    Array.prototype.forEach.call(todas, function (c) {
      c.classList.toggle("is-elegida", c === meta);
    });
    // el bloque de IA sólo se atenúa cuando el veredicto vive allí
    var vitrinas = doc.querySelectorAll(".pricing");
    Array.prototype.forEach.call(vitrinas, function (v) {
      v.classList.toggle("is-decidido", !!(meta && v.contains(meta)));
    });
  }

  sel.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".sel__opt") : null;
    if (!b) return;
    var q = b.getAttribute("data-q");
    Array.prototype.forEach.call(sel.querySelectorAll('.sel__opt[data-q="' + q + '"]'), function (o) {
      o.setAttribute("aria-pressed", String(o === b));
    });
    respuestas[q] = parseInt(b.getAttribute("data-v"), 10);
    pintar(decidir(respuestas));
  });

  /* el halo sigue al puntero */
  if (!quieto && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var pide = false;
    sel.addEventListener("mousemove", function (e) {
      if (pide) return;
      pide = true;
      requestAnimationFrame(function () {
        pide = false;
        var r = sel.getBoundingClientRect();
        sel.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        sel.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
      });
    }, { passive: true });
  }

  pintar("basico", true);
})();
