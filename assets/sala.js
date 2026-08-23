/* ═══════════════════════════════════════════════════════════
   Pittahaya · motor de la sala
   Sustituye el muro de tarjetas por un escenario de tres actos.
   Las tarjetas originales no se pierden: se mudan a la hoja de
   comparación, que se abre sólo si el cliente la pide.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var vitrinas = doc.querySelectorAll(".pricing");
  if (!vitrinas.length) return;

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EN = doc.documentElement.lang === "en";
  function t(es, en) { return EN ? en : es; }
  function el(tag, cls, txt) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }

  /* ── Los actos ───────────────────────────────────────────── */
  var ACTOS = [
    { id: "que", p: t("¿Qué tiene que hacer tu web?", "What does your site have to do?"), o: [
        { v: 0, b: t("Existir bien", "Exist, properly"),
                s: t("Que te encuentren y te crean.", "So people find you and believe you.") },
        { v: 1, b: t("Convencer", "Convince"),
                s: t("Mostrar servicios, prueba y precio.", "Show services, proof and price.") },
        { v: 2, b: t("Vender sola", "Sell on its own"),
                s: t("Todo el negocio, en línea.", "The whole business, online.") }
      ] },
    { id: "solo", p: t("¿Y cuando tú no estés?", "And when you’re not there?"), o: [
        { v: 0, b: t("Yo respondo", "I answer"),
                s: t("Prefiero atender en persona.", "I’d rather reply myself.") },
        { v: 1, b: t("Que conteste", "Let it reply"),
                s: t("Respuestas al instante, 24/7.", "Instant answers, 24/7.") },
        { v: 2, b: t("Que cierre", "Let it close"),
                s: t("Agenda, cotiza y da seguimiento.", "Books, quotes and follows up.") }
      ] },
    { id: "cuando", p: t("¿Cuánto puedes esperar?", "How long can you wait?"), o: [
        { v: 0, b: t("Lo que haga falta", "As long as it takes"),
                s: t("Prefiero que salga perfecta.", "I’d rather it come out perfect.") },
        { v: 1, b: t("Un mes", "A month"),
                s: t("Tengo una fecha en mente.", "I have a date in mind.") },
        { v: 2, b: t("Ya", "Now"),
                s: t("Lo necesitaba ayer.", "I needed it yesterday.") }
      ] }
  ];

  /* ── Los veredictos ──────────────────────────────────────── */
  var FIN = {
    basico: {
      nombre: t("Plan Básico", "Starter Plan"),
      linea: t("Una página que trabaja. Sin adornos, sin plantillas y sin nada que sobre.",
               "One page that works. No decoration, no templates, nothing to spare."),
      da: [t("Diseñada a medida para tu marca", "Designed around your brand"),
           t("Formulario y WhatsApp directo", "Contact form and direct WhatsApp"),
           t("Dominio conectado y publicada", "Domain connected and published")],
      cifra: "1", unidad: t("semana", "week"),
      luzA: "rgba(232,52,135,.14)", luzB: "rgba(198,255,106,.08)", luzX: "18%",
      ancla: "plan-basico"
    },
    negocio: {
      nombre: t("Plan Negocio", "Business Plan"),
      linea: t("Cinco páginas para contar lo que haces, probarlo y llevar a la cotización.",
               "Five pages to show what you do, prove it, and lead to the quote."),
      da: [t("Servicios, prueba y proceso", "Services, proof and process"),
           t("Estructura pensada para convertir", "Structure built to convert"),
           t("Dos rondas de cambios", "Two rounds of revisions")],
      cifra: "2", unidad: t("semanas", "weeks"),
      luzA: "rgba(232,52,135,.2)", luzB: "rgba(198,255,106,.12)", luzX: "42%",
      ancla: "plan-negocio"
    },
    premium: {
      nombre: t("Plan Premium", "Premium Plan"),
      linea: t("Todo el negocio en línea: arquitectura, dirección visual y un sistema propio.",
               "The whole business online: architecture, art direction and a system of your own."),
      da: [t("Páginas sin límite", "Unlimited pages"),
           t("Dirección visual completa", "Full art direction"),
           t("Sesenta días de soporte", "Sixty days of support")],
      cifra: "4", unidad: t("semanas", "weeks"),
      luzA: "rgba(212,175,55,.22)", luzB: "rgba(232,52,135,.12)", luzX: "62%",
      ancla: "plan-premium"
    },
    sistema: {
      nombre: t("Sistema Completo", "Complete System"),
      linea: t("La web premium y la máquina detrás: atiende, agenda y da seguimiento sin ti.",
               "The premium site and the machine behind it: it answers, books and follows up without you."),
      da: [t("Web premium + agentes de IA", "Premium site + AI agents"),
           t("Agenda y seguimiento automáticos", "Automatic booking and follow-up"),
           t("Conectado a tus herramientas", "Wired into your tools")],
      cifra: "6", unidad: t("semanas", "weeks"),
      luzA: "rgba(198,255,106,.2)", luzB: "rgba(232,52,135,.16)", luzX: "80%",
      ancla: "plan-sistema"
    }
  };

  function decidir(r) {
    if (r.solo >= 2) return "sistema";
    if (r.que >= 2) return "premium";
    if (r.que >= 1 || r.solo >= 1) return "negocio";
    return "basico";
  }

  /* ── Montar la sala ──────────────────────────────────────── */
  var sala = el("section", "sala");
  sala.setAttribute("aria-label", t("Elegir plan", "Choose a plan"));
  sala.innerHTML =
    '<div class="sala__aire" aria-hidden="true"></div>' +
    '<div class="sala__wrap"><div class="sala__compas">' +
      '<i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>' +
      '<span class="sala__paso" data-paso></span>' +
      '<div class="sala__plano" data-plano aria-hidden="true">' +
        '<b style="--h:26%;--sd:0ms"></b><b style="--h:52%;--sd:90ms"></b>' +
        '<b style="--h:76%;--sd:180ms"></b><b style="--h:100%;--sd:270ms"></b>' +
      '</div>' +
    '</div></div>' +
    '<div class="sala__wrap"><div class="sala__acto" data-acto aria-live="polite"></div></div>' +
    '<div class="sala__wrap"><div class="sala__pie">' +
      '<button class="sala__volver" type="button" data-volver hidden>← ' + t("Cambiar respuesta", "Change answer") + '</button>' +
    '</div></div>';

  var primera = vitrinas[0];
  var padre = primera.parentNode;
  padre.insertBefore(sala, primera);

  /* ── La hoja de comparación se queda con las tarjetas ────── */
  var hoja = el("aside", "hoja");
  hoja.setAttribute("role", "dialog");
  hoja.setAttribute("aria-modal", "true");
  hoja.setAttribute("aria-hidden", "true");
  hoja.innerHTML =
    '<div class="hoja__barra">' +
      '<h2 class="hoja__tit">' + t("Todos los planes, al detalle", "Every plan, in detail") + '</h2>' +
      '<button class="hoja__x" type="button" data-hoja-x aria-label="' + t("Cerrar", "Close") + '">×</button>' +
    '</div><div class="hoja__cuerpo" data-hoja-cuerpo></div>';
  doc.body.appendChild(hoja);

  var cuerpo = hoja.querySelector("[data-hoja-cuerpo]");
  var ROTULOS = [t("Diseño web", "Web design"), t("Automatización con IA", "AI automation")];

  /* La bajada que presentaba cada bloque se muda con él: fuera de la
     hoja quedaba huérfana, hablando de tarjetas que ya no están. */
  Array.prototype.forEach.call(vitrinas, function (v, i) {
    var lead = v.previousElementSibling;
    while (lead && !lead.classList.contains("section-lead")) lead = lead.previousElementSibling;
    cuerpo.appendChild(el("p", "hoja__grupo", ROTULOS[i] || ""));
    if (lead && i > 0) { lead.classList.add("hoja__lead"); cuerpo.appendChild(lead); }

    /* dentro de la hoja el carrete estorba: aquí se viene a comparar,
       y comparar se hace en vertical, sin nada recortado a los lados */
    v.classList.remove("crt-rail");
    v.removeAttribute("style");
    Array.prototype.forEach.call(v.querySelectorAll(".crt-card"), function (c) {
      c.classList.remove("crt-card", "is-foco");
      c.removeAttribute("data-crt-n");
      c.style.removeProperty("--k");
    });
    var barra = v.nextElementSibling;
    if (barra && barra.classList.contains("crt-bar")) barra.remove();

    /* cada tarjeta se queda con su titular y su resumen; la lista
       completa se abre a pedido. Seis listas abiertas son 3.400 px. */
    Array.prototype.forEach.call(v.querySelectorAll(".card.price"), function (c) {
      var lista = c.querySelector(".plan-features");
      if (!lista || lista.dataset.pleg) return;
      lista.dataset.pleg = "1";

      var caja = el("div", "plan-detalle");
      lista.parentNode.insertBefore(caja, lista);
      caja.appendChild(lista);
      caja.id = (c.id || "plan") + "-detalle";

      var abre = el("button", "plan-abre");
      abre.type = "button";
      abre.setAttribute("aria-expanded", "false");
      abre.setAttribute("aria-controls", caja.id);
      abre.innerHTML = "<span>" + t("Ver qué incluye", "See what’s included") + "</span><i aria-hidden='true'></i>";
      caja.parentNode.insertBefore(abre, caja);

      abre.addEventListener("click", function () {
        var ab = abre.getAttribute("aria-expanded") === "true";
        abre.setAttribute("aria-expanded", String(!ab));
        c.classList.toggle("is-abierta", !ab);
        abre.querySelector("span").textContent = !ab
          ? t("Ocultar detalle", "Hide detail")
          : t("Ver qué incluye", "See what’s included");
      });
    });

    cuerpo.appendChild(v);
  });

  /* separadores y barras de carrete que ya no acompañan a nada */
  Array.prototype.forEach.call(padre.querySelectorAll(".plans-divider"), function (d) { d.remove(); });
  Array.prototype.forEach.call(padre.querySelectorAll(".crt-bar"), function (b) {
    var prev = b.previousElementSibling;
    if (!prev || !prev.classList.contains("crt-rail")) b.remove();
  });

  function abrirHoja(abrir) {
    hoja.classList.toggle("is-open", abrir);
    hoja.setAttribute("aria-hidden", String(!abrir));
    doc.body.classList.toggle("no-scroll", abrir);
    if (abrir) {
      cuerpo.scrollTop = 0;
      hoja.querySelector("[data-hoja-x]").focus();
    }
  }
  hoja.addEventListener("click", function (e) {
    if (e.target.closest("[data-hoja-x]")) abrirHoja(false);
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && hoja.classList.contains("is-open")) abrirHoja(false);
  });

  /* ── El guion ────────────────────────────────────────────── */
  var acto = sala.querySelector("[data-acto]");
  var paso = sala.querySelector("[data-paso]");
  var compas = sala.querySelectorAll(".sala__compas i");
  var volver = sala.querySelector("[data-volver]");
  var barras = sala.querySelectorAll("[data-plano] b");

  var respuestas = {};
  var enActo = 0;

  function levantar(n) {
    Array.prototype.forEach.call(barras, function (b, i) {
      b.classList.toggle("is-alza", i < n);
    });
  }

  function marcarCompas() {
    Array.prototype.forEach.call(compas, function (c, i) {
      c.classList.toggle("is-hecho", i < enActo || enActo >= ACTOS.length);
      c.classList.toggle("is-aqui", i === enActo);
    });
    /* al final el rótulo ya lo lleva el sello del veredicto */
    paso.textContent = enActo < ACTOS.length ? (enActo + 1) + " / " + ACTOS.length : "";
    volver.hidden = enActo === 0;
  }

  var ROMANOS = ["I", "II", "III"];

  function pintarActo() {
    var a = ACTOS[enActo];
    acto.textContent = "";
    acto.classList.remove("sala__acto--ancho");
    acto.setAttribute("data-romano", ROMANOS[enActo] || "");

    var izq = el("div");
    var h = el("h2", "sala__preg");
    h.innerHTML = a.p;
    izq.appendChild(h);
    acto.appendChild(izq);

    var ops = el("div", "sala__ops");
    a.o.forEach(function (o, i) {
      var b = el("button", "sala__op");
      b.type = "button";
      b.setAttribute("data-v", String(o.v));
      b.setAttribute("aria-pressed", String(respuestas[a.id] === o.v));
      /* el número es la tecla que la elige, no un adorno */
      b.appendChild(el("i", "", String(i + 1)));
      b.appendChild(el("b", "", o.b));
      b.appendChild(el("span", "", o.s));
      ops.appendChild(b);
    });
    acto.appendChild(ops);
    /* en el mismo cuadro el carrete aún mide 0 y el ajuste no prende:
       el motor de snap acababa enganchado en la segunda tarjeta */
    window.setTimeout(function () { ops.scrollLeft = 0; }, 0);
    levantar(enActo + 1);           // el plano nunca es una banda vacía
    marcarCompas();
  }

  function armando(luego) {
    acto.removeAttribute("data-romano");
    acto.classList.add("sala__acto--ancho");
    acto.textContent = "";
    var caja = el("div", "sala__armando");
    caja.appendChild(el("p", "", t("Armando tu plan", "Building your plan")));
    var pulso = el("div", "sala__pulso");
    pulso.innerHTML = "<i></i><i></i><i></i>";
    caja.appendChild(pulso);
    acto.appendChild(caja);
    levantar(4);
    window.setTimeout(luego, 950);
  }

  function pintarFin() {
    var pl = FIN[decidir(respuestas)];
    acto.removeAttribute("data-romano");
    acto.classList.add("sala__acto--ancho");
    acto.textContent = "";

    var caja = el("div", "sala__fin");
    var izq = el("div");
    izq.appendChild(el("p", "sala__sello", t("Tu plan", "Your plan")));
    izq.appendChild(el("h2", "sala__nombre", pl.nombre));
    izq.appendChild(el("p", "sala__linea", pl.linea));

    var ul = el("ul", "sala__da");
    pl.da.forEach(function (linea, i) {
      var li = el("li", "", linea);
      li.style.setProperty("--sd", (i * 110 + 120) + "ms");
      ul.appendChild(li);
      window.setTimeout(function () { li.classList.add("is-in"); }, 30);
    });
    izq.appendChild(ul);

    var actos = el("div", "sala__actos");
    var ir = el("a", "sala__cta");
    ir.href = t("contacto.html", "contact.html");
    ir.appendChild(el("span", "", t("Empezar mi proyecto", "Start my project")));
    ir.appendChild(el("i", "", "→"));
    actos.appendChild(ir);

    var ver = el("button", "sala__leve", t("Ver todos los planes", "See every plan"));
    ver.type = "button";
    ver.setAttribute("data-ver", "1");
    actos.appendChild(ver);
    izq.appendChild(actos);

    var der = el("div", "sala__tiempo");
    der.appendChild(el("span", "sala__cifra", pl.cifra));
    der.appendChild(el("span", "sala__unidad", pl.unidad + " " + t("de trabajo", "of work")));

    caja.appendChild(izq);
    caja.appendChild(der);
    acto.appendChild(caja);

    sala.style.setProperty("--luz-a", pl.luzA);
    sala.style.setProperty("--luz-b", pl.luzB);
    sala.style.setProperty("--luz-x", pl.luzX);

    levantar(4);
    marcarCompas();

    var meta = doc.getElementById(pl.ancla);
    if (meta) {
      Array.prototype.forEach.call(doc.querySelectorAll(".card.price"), function (c) {
        c.classList.toggle("is-elegida", c === meta);
      });
    }
  }

  function ir(delta) {
    if (quieto) { enActo += delta; enActo <= ACTOS.length - 1 ? pintarActo() : pintarFin(); return; }
    sala.classList.add(delta > 0 ? "is-yendo" : "is-viniendo");
    window.setTimeout(function () {
      enActo += delta;
      if (enActo < 0) enActo = 0;
      if (enActo > ACTOS.length) enActo = ACTOS.length;
      if (enActo <= ACTOS.length - 1) pintarActo();
      else if (delta > 0) { marcarCompas(); armando(pintarFin); }
      else pintarFin();
      sala.classList.remove("is-yendo", "is-viniendo");
      sala.classList.add(delta > 0 ? "is-viniendo" : "is-yendo");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { sala.classList.remove("is-yendo", "is-viniendo"); });
      });
    }, 260);
  }

  sala.addEventListener("click", function (e) {
    if (e.target.closest("[data-ver]")) { abrirHoja(true); return; }
    if (e.target.closest("[data-volver]")) { ir(-1); return; }
    var op = e.target.closest(".sala__op");
    if (!op) return;
    respuestas[ACTOS[enActo].id] = parseInt(op.getAttribute("data-v"), 10);
    Array.prototype.forEach.call(op.parentNode.children, function (o) {
      o.setAttribute("aria-pressed", String(o === op));
    });
    window.setTimeout(function () { ir(1); }, 220);
  });

  /* Se puede responder sin soltar el teclado: 1, 2 o 3 elige;
     la flecha izquierda corrige la anterior. */
  doc.addEventListener("keydown", function (e) {
    if (hoja.classList.contains("is-open")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var dentro = sala.getBoundingClientRect();
    if (dentro.bottom < 0 || dentro.top > window.innerHeight) return;

    if (e.key === "ArrowLeft" && enActo > 0) { ir(-1); e.preventDefault(); return; }
    if (enActo > ACTOS.length - 1) return;
    var n = parseInt(e.key, 10);
    if (!(n >= 1 && n <= 3)) return;
    var op = sala.querySelectorAll(".sala__op")[n - 1];
    if (op) { op.click(); e.preventDefault(); }
  });

  pintarActo();
})();
