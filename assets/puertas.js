/* ═══════════════════════════════════════════════════════════
   Pittahaya · motor de las tres puertas
   La oferta se ve entera desde el primer segundo. Se abre una,
   se lee qué incluye, se entra. Sin cuestionario de por medio.
   Las tarjetas originales se guardan en la hoja de detalle.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var vitrinas = doc.querySelectorAll(".pricing");
  if (!vitrinas.length) return;

  var EN = doc.documentElement.lang === "en";
  function t(es, en) { return EN ? en : es; }
  function el(tag, cls, txt) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }
  var CONTACTO = t("contacto.html", "contact.html");

  /* ── Las tres puertas ────────────────────────────────────── */
  var PUERTAS = [
    {
      nombre: t("Plan Básico", "Starter Plan"),
      frase: t("Que te encuentren y te crean.", "So people find you and believe you."),
      cifra: "1", unidad: t("semana", "week"),
      da: "plan-basico",
      tono: "rgba(232,52,135,.2)", borde: "rgba(232,52,135,.5)", trazo: "rgba(232,52,135,.9)",
      luzA: "rgba(232,52,135,.16)", luzB: "rgba(198,255,106,.08)", luzX: "18%"
    },
    {
      marca: t("El más pedido", "Most chosen"),
      nombre: t("Plan Negocio", "Business Plan"),
      frase: t("Que explique, convenza y traiga clientes.", "That explains, convinces and brings clients."),
      cifra: "2", unidad: t("semanas", "weeks"),
      da: "plan-negocio",
      tono: "rgba(212,175,55,.22)", borde: "rgba(212,175,55,.55)", trazo: "rgba(224,190,110,.95)",
      luzA: "rgba(212,175,55,.2)", luzB: "rgba(232,52,135,.1)", luzX: "50%"
    },
    {
      nombre: t("Plan Premium", "Premium Plan"),
      frase: t("Que además atienda y venda sin ti.", "And that answers and sells without you."),
      cifra: "6", unidad: t("semanas", "weeks"),
      da: ["plan-premium", "plan-sistema"],
      tono: "rgba(198,255,106,.2)", borde: "rgba(198,255,106,.5)", trazo: "rgba(198,255,106,.9)",
      luzA: "rgba(198,255,106,.19)", luzB: "rgba(232,52,135,.14)", luzX: "82%"
    }
  ];


  /* Cada nivel se dibuja en lugar de describirse: un punto, una
     estructura, una red. El trazo se completa al abrir la puerta. */
  var SENALES = [
    '<svg class="pt__senal" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="lleno" cx="60" cy="60" r="4"/>' +
      '<circle class="dibuja" cx="60" cy="60" r="26" style="--largo:164;--sd:120ms"/>' +
      '<circle class="dibuja" cx="60" cy="60" r="44" style="--largo:277;--sd:260ms"/>' +
    '</svg>',
    '<svg class="pt__senal" viewBox="0 0 120 120" aria-hidden="true">' +
      '<path class="dibuja" d="M22 92 L48 58 L74 74 L98 30" style="--largo:150;--sd:100ms"/>' +
      '<circle class="lleno late" cx="22" cy="92" r="3.4" style="--sd:0ms"/>' +
      '<circle class="lleno late" cx="48" cy="58" r="3.4" style="--sd:200ms"/>' +
      '<circle class="lleno late" cx="74" cy="74" r="3.4" style="--sd:400ms"/>' +
      '<circle class="lleno late" cx="98" cy="30" r="4.6" style="--sd:600ms"/>' +
    '</svg>',
    '<svg class="pt__senal" viewBox="0 0 120 120" aria-hidden="true">' +
      '<line class="dibuja" x1="60" y1="60" x2="24" y2="30" style="--largo:47;--sd:60ms"/>' +
      '<line class="dibuja" x1="60" y1="60" x2="98" y2="34" style="--largo:46;--sd:150ms"/>' +
      '<line class="dibuja" x1="60" y1="60" x2="26" y2="92" style="--largo:47;--sd:240ms"/>' +
      '<line class="dibuja" x1="60" y1="60" x2="96" y2="94" style="--largo:49;--sd:330ms"/>' +
      '<circle class="lleno" cx="60" cy="60" r="5.5"/>' +
      '<circle class="lleno late" cx="24" cy="30" r="3.2" style="--sd:0ms"/>' +
      '<circle class="lleno late" cx="98" cy="34" r="3.2" style="--sd:260ms"/>' +
      '<circle class="lleno late" cx="26" cy="92" r="3.2" style="--sd:520ms"/>' +
      '<circle class="lleno late" cx="96" cy="94" r="3.2" style="--sd:780ms"/>' +
    '</svg>'
  ];

  /* ── Lo que hay dentro sale de las tarjetas que ya existían ─ */
  function loQueIncluye(ids) {
    var lista = [];
    (typeof ids === "string" ? [ids] : ids).forEach(function (id) {
      var tarjeta = doc.getElementById(id);
      if (!tarjeta) return;
      Array.prototype.forEach.call(tarjeta.querySelectorAll(".plan-features li"), function (li) {
        var txt = (li.textContent || "").trim();
        if (txt) lista.push(txt);
      });
    });
    return lista.slice(0, 6);
  }

  /* ── El escenario ────────────────────────────────────────── */
  var pt = el("section", "pt");
  pt.setAttribute("aria-label", t("Planes", "Plans"));
  pt.innerHTML =
    '<div class="pt__aire" aria-hidden="true"></div>' +
    '<div class="pt__wrap"><div class="pt__filas" data-filas></div></div>' +
    '<div class="pt__wrap"><div class="pt__final">' +
      '<p class="pt__cupo"><i aria-hidden="true"></i>' +
        t("Cupos limitados · los primeros proyectos entran a precio de lanzamiento",
          "Limited spots · the first projects come in at launch pricing") + '</p>' +
      '<button class="pt__todo" type="button" data-todo>' +
        t("Ver el detalle completo", "See the full detail") + '</button>' +
    '</div></div>';

  var primera = vitrinas[0];
  var padre = primera.parentNode;
  padre.insertBefore(pt, primera);

  var filas = pt.querySelector("[data-filas]");

  PUERTAS.forEach(function (p, i) {
    var puerta = el("article", "pt__puerta");
    puerta.setAttribute("role", "button");
    puerta.setAttribute("tabindex", "0");
    puerta.setAttribute("aria-expanded", "false");
    puerta.setAttribute("data-i", String(i));
    puerta.style.setProperty("--tono", p.tono);
    puerta.style.setProperty("--borde", p.borde);
    puerta.style.setProperty("--trazo", p.trazo);
    puerta.style.setProperty("--ed", (i * 110) + "ms");
    puerta.insertAdjacentHTML("afterbegin", SENALES[i]);

    puerta.appendChild(el("span", "pt__lomo", p.nombre));
    if (p.marca) puerta.appendChild(el("p", "pt__marca", p.marca));
    puerta.appendChild(el("h3", "pt__nombre", p.nombre));
    puerta.appendChild(el("p", "pt__frase", p.frase));

    var pie = el("div", "pt__pie");
    var tiempo = el("div", "pt__tiempo");
    tiempo.appendChild(el("span", "pt__cifra", p.cifra));
    tiempo.appendChild(el("span", "pt__unidad", p.unidad));
    pie.appendChild(tiempo);

    var abrir = el("span", "pt__abrir");
    abrir.setAttribute("aria-hidden", "true");
    abrir.appendChild(el("span", "", t("Qué incluye", "What’s included")));
    abrir.appendChild(el("i", "", "↓"));
    pie.appendChild(abrir);
    puerta.appendChild(pie);

    var dentro = el("div", "pt__dentro");
    dentro.id = "pt-dentro-" + i;
    puerta.setAttribute("aria-controls", dentro.id);
    var caja = el("div");
    var ul = el("ul", "pt__lista");
    loQueIncluye(p.da).forEach(function (linea, k) {
      var li = el("li", "", linea);
      li.style.setProperty("--sd", (k * 70 + 90) + "ms");
      ul.appendChild(li);
    });
    caja.appendChild(ul);

    var cta = el("a", "pt__cta");
    cta.href = CONTACTO;
    cta.appendChild(el("span", "", t("Quiero este plan", "I want this plan")));
    cta.appendChild(el("i", "", "→"));
    cta.setAttribute("aria-label", t("Quiero el ", "I want the ") + p.nombre);
    dentro.appendChild(caja);
    puerta.appendChild(dentro);
    /* fuera de la zona que rueda: el botón de compra siempre a la vista */
    puerta.appendChild(cta);

    filas.appendChild(puerta);
  });

  /* ── Abrir y cerrar ──────────────────────────────────────── */
  var abierta = -1;

  function abrirPuerta(i) {
    var puertas = filas.querySelectorAll(".pt__puerta");
    abierta = (abierta === i) ? -1 : i;

    Array.prototype.forEach.call(puertas, function (p, k) {
      var esta = k === abierta;
      p.classList.toggle("is-abierta", esta);
      /* la puerta se abre siempre por el principio: si quedó
         desplazada, el nombre se perdía fuera de cuadro */
      if (esta) window.setTimeout(function () { p.scrollTop = 0; }, 0);
      p.setAttribute("aria-expanded", String(esta));
      p.setAttribute("aria-label",
        (esta ? t("Cerrar ", "Close ") : t("Abrir ", "Open ")) + PUERTAS[k].nombre);
      var b = p.querySelector(".pt__abrir span");
      if (b) b.textContent = esta ? t("Cerrar", "Close") : t("Qué incluye", "What’s included");
    });

    filas.classList.toggle("hay-abierta", abierta >= 0);

    var luz = abierta >= 0 ? PUERTAS[abierta] : null;
    pt.style.setProperty("--luz-a", luz ? luz.luzA : "rgba(232,52,135,.15)");
    pt.style.setProperty("--luz-b", luz ? luz.luzB : "rgba(198,255,106,.09)");
    pt.style.setProperty("--luz-x", luz ? luz.luzX : "20%");

    /* la tarjeta equivalente se marca dentro de la hoja */
    if (abierta >= 0) {
      var ids = PUERTAS[abierta].da;
      ids = typeof ids === "string" ? [ids] : ids;
      Array.prototype.forEach.call(doc.querySelectorAll(".card.price"), function (c) {
        c.classList.toggle("is-elegida", ids.indexOf(c.id) >= 0);
      });
    }
  }

  pt.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    var p = e.target.closest ? e.target.closest(".pt__puerta") : null;
    if (!p || e.target.closest(".pt__cta")) return;
    e.preventDefault();
    abrirPuerta(parseInt(p.getAttribute("data-i"), 10));
  });

  pt.addEventListener("click", function (e) {
    if (e.target.closest(".pt__cta")) return;          // el botón se va a contacto
    if (e.target.closest("[data-todo]")) { abrirHoja(true); return; }
    var p = e.target.closest(".pt__puerta");
    if (!p) return;
    abrirPuerta(parseInt(p.getAttribute("data-i"), 10));
  });


  /* ── El halo sigue al puntero ─────────────────────────────── */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var pide = false;
    filas.addEventListener("mousemove", function (e) {
      if (pide) return;
      pide = true;
      requestAnimationFrame(function () {
        pide = false;
        var p = e.target.closest ? e.target.closest(".pt__puerta") : null;
        if (!p) return;
        var r = p.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width;
        p.style.setProperty("--mx", (nx * 100).toFixed(1) + "%");
        p.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
        p.style.setProperty("--mxn", nx.toFixed(3));
      });
    }, { passive: true });
  }

  /* ── Las puertas se levantan al entrar en cuadro ──────────── */
  if ("IntersectionObserver" in window) {
    var ojo = new IntersectionObserver(function (ent) {
      ent.forEach(function (x) {
        if (!x.isIntersecting) return;
        pt.classList.add("is-vivo");
        ojo.disconnect();
      });
    }, { threshold: 0.15 });
    ojo.observe(pt);
  } else {
    pt.classList.add("is-vivo");
  }

  /* ── La hoja con todas las tarjetas, para quien compara ──── */
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

  Array.prototype.forEach.call(vitrinas, function (v, i) {
    var lead = v.previousElementSibling;
    while (lead && !lead.classList.contains("section-lead")) lead = lead.previousElementSibling;
    cuerpo.appendChild(el("p", "hoja__grupo", ROTULOS[i] || ""));
    if (lead && i > 0) { lead.classList.add("hoja__lead"); cuerpo.appendChild(lead); }
    var pista = el("p", "hoja__pista");
    pista.innerHTML = t("Desliza para comparar", "Swipe to compare") + " <i>→</i>";
    cuerpo.appendChild(pista);
    /* cumplida su función, la pista se va */
    v.addEventListener("scroll", function () {
      if (v.scrollLeft > 24) pista.classList.add("se-fue");
    }, { passive: true, once: false });

    v.classList.remove("crt-rail");
    v.removeAttribute("style");
    Array.prototype.forEach.call(v.querySelectorAll(".crt-card"), function (c) {
      c.classList.remove("crt-card", "is-foco");
      c.removeAttribute("data-crt-n");
      c.style.removeProperty("--k");
    });
    var barra = v.nextElementSibling;
    if (barra && barra.classList.contains("crt-bar")) barra.remove();

    cuerpo.appendChild(v);
  });

  var focoPrevio = null;

  function abrirHoja(abrir) {
    hoja.classList.toggle("is-open", abrir);
    hoja.setAttribute("aria-hidden", String(!abrir));
    doc.body.classList.toggle("no-scroll", abrir);
    if (abrir) {
      focoPrevio = doc.activeElement;
      cuerpo.scrollTop = 0;
      Array.prototype.forEach.call(cuerpo.querySelectorAll(".pricing, .process-strip"),
        function (v) { v.scrollLeft = 0; });
      /* con visibility:hidden en transición el foco no prende:
         hay que esperar a que la hoja exista de verdad */
      window.setTimeout(function () { hoja.querySelector("[data-hoja-x]").focus(); }, 60);
    } else if (focoPrevio && focoPrevio.focus) {
      focoPrevio.focus();
      focoPrevio = null;
    }
  }

  /* el foco no se escapa de la hoja mientras está abierta */
  hoja.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !hoja.classList.contains("is-open")) return;
    var dentro = hoja.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    if (!dentro.length) return;
    var primero = dentro[0], ultimo = dentro[dentro.length - 1];
    if (e.shiftKey && doc.activeElement === primero) { ultimo.focus(); e.preventDefault(); }
    else if (!e.shiftKey && doc.activeElement === ultimo) { primero.focus(); e.preventDefault(); }
  });
  hoja.addEventListener("click", function (e) {
    if (e.target.closest("[data-hoja-x]")) abrirHoja(false);
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && hoja.classList.contains("is-open")) abrirHoja(false);
  });

  /* ── Despejar lo que competía con la decisión ────────────── */
  /* Alrededor de los planes había una bajada, la tarjeta de
     fundadores con su propio botón, el proceso y un CTA suelto.
     Lo que aporta se muda a la hoja; el resto sobra. */
  var bajada = padre.querySelector(".section-lead");
  if (bajada) bajada.remove();
  var marca = padre.querySelector(".badge");
  if (marca) marca.remove();

  var fundadores = padre.querySelector(".founding-card");
  if (fundadores) {
    var bloque = el("div");
    bloque.appendChild(el("p", "hoja__grupo", t("Clientes fundadores", "Founding clients")));
    var titF = fundadores.querySelector(".founding-title");
    var leadF = fundadores.querySelector(".founding-lead");
    var perks = fundadores.querySelector(".founding-perks");
    if (titF) { titF.classList.add("hoja__sub"); bloque.appendChild(titF); }
    if (leadF) { leadF.classList.add("hoja__lead"); bloque.appendChild(leadF); }
    if (perks) bloque.appendChild(perks);
    cuerpo.appendChild(bloque);
    fundadores.remove();
  }

  var cabezaP = padre.querySelector(".process-head");
  var tira = padre.querySelector(".process-strip");
  if (cabezaP || tira) {
    var bloqueP = el("div");
    bloqueP.appendChild(el("p", "hoja__grupo", t("Cómo avanzamos", "How we work")));
    if (tira) {
      var barraP = tira.nextElementSibling;
      if (barraP && barraP.classList.contains("crt-bar")) barraP.remove();
      tira.classList.remove("crt-rail");
      Array.prototype.forEach.call(tira.querySelectorAll(".crt-card"), function (c) {
        c.classList.remove("crt-card", "is-foco");
        c.removeAttribute("data-crt-n");
        c.style.removeProperty("--k");
      });
      bloqueP.appendChild(tira);
    }
    cuerpo.appendChild(bloqueP);
    if (cabezaP) cabezaP.remove();
  }

  Array.prototype.forEach.call(padre.querySelectorAll(".hr, .plans-divider"), function (n) { n.remove(); });
  Array.prototype.forEach.call(padre.children, function (n) {
    if (n === pt) return;
    if (n.querySelector && n.querySelector("a.btn")) n.remove();
  });

  /* el nivel más pedido se abre solo, ya con las puertas en pie */
  window.setTimeout(function () { abrirPuerta(1); }, 620);
})();
