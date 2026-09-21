/* PITTAHAYA · la consola del sistema: esta página obedece a quien la mira (CSP-safe) */
(function () {
  "use strict";

  var d = document, root = d.documentElement;
  var en = /^en\b/i.test(root.lang || "");
  var T = function (es, e) { return en ? e : es; };

  var host = d.querySelector("[data-lab]");
  if (!host) return;

  /* ── lo que la consola puede mover ─────────────────────── */
  var GRUPOS = [
    { id: "voz", name: T("Voz", "Voice"), attr: "data-voz", def: "editorial",
      opts: [["editorial", T("Editorial", "Editorial")], ["tecnica", T("Técnica", "Technical")]] },
    { id: "escala", name: T("Escala", "Scale"), attr: "data-escala", def: "estandar",
      opts: [["intima", T("Íntima", "Intimate")], ["estandar", T("Estándar", "Standard")], ["monumental", T("Monumental", "Monumental")]] },
    { id: "dens", name: T("Densidad", "Density"), attr: "data-dens", def: "normal",
      opts: [["compacta", T("Compacta", "Compact")], ["normal", T("Normal", "Normal")], ["amplia", T("Amplia", "Generous")]] },
    { id: "forma", name: T("Forma", "Shape"), attr: null, def: "10px", prop: "--radio",
      opts: [["0px", T("Recta", "Square")], ["10px", T("Suave", "Soft")], ["22px", T("Redonda", "Round")]] }
  ];
  var ACENTOS = [
    ["fruta", "#e0357b", "#ff5c9c", T("Fruta", "Fruit")],
    ["lima", "#9fce3a", "#c2ec63", T("Lima", "Lime")],
    ["champan", "#d9c3a0", "#f0dcb8", T("Champán", "Champagne")],
    ["hielo", "#6fd6e8", "#a6ecf7", T("Hielo", "Ice")],
    ["ambar", "#e6b25c", "#ffcf8a", T("Ámbar", "Amber")],
    ["brasa", "#ff6a2a", "#ff9366", T("Brasa", "Ember")]
  ];
  var estado = { voz: "editorial", escala: "estandar", dens: "normal", forma: "10px", acento: 0 };

  var el = function (tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ── la ficha de tokens, escrita en vivo ───────────────── */
  var pre;
  function linea(tok, val) {
    var b = el("b", null, "  " + tok + ": ");
    var m = el("em", null, val + ";");
    pre.append(b, m, d.createTextNode("\n"));
  }
  function pintarCodigo() {
    var cs = getComputedStyle(root);
    var acc = ACENTOS[estado.acento];
    pre.replaceChildren();
    pre.append(d.createTextNode(":root{\n"));
    linea("--serif", estado.voz === "editorial" ? '"Fraunces", Georgia, serif' : '"Space Grotesk", system-ui, sans-serif');
    linea("--t-display", cs.getPropertyValue("--t-display").trim());
    linea("--t-1", cs.getPropertyValue("--t-1").trim());
    linea("--t-cuerpo", cs.getPropertyValue("--t-cuerpo").trim());
    linea("--acento", acc[1]);
    linea("--acento-vivo", acc[2]);
    linea("--ritmo", "8px");
    linea("--dens", cs.getPropertyValue("--dens").trim());
    linea("--radio", estado.forma);
    linea("--col", "12");
    pre.append(d.createTextNode("}\n"));
  }

  function aplicar() {
    GRUPOS.forEach(function (g) {
      var v = estado[g.id];
      if (g.attr) root.setAttribute(g.attr, v);
      else root.style.setProperty(g.prop, v);
    });
    var acc = ACENTOS[estado.acento];
    root.style.setProperty("--fruta", acc[1]);
    root.style.setProperty("--fruta-viva", acc[2]);
    pintarCodigo();
  }

  /* ── construir la consola ──────────────────────────────── */
  var head = el("div", "lab__head");
  head.append(el("b", null, T("La consola del sistema", "The system console")),
    el("span", null, T("mueva los tokens · la página obedece", "move the tokens · the page obeys")));
  host.appendChild(head);

  var izq = el("div", "lab__row");
  GRUPOS.forEach(function (g) {
    var box = el("div", "lab__ctrl");
    box.appendChild(el("b", null, g.name));
    var opts = el("div", "lab__opts");
    g.opts.forEach(function (o) {
      var b = el("button", "lab__opt", o[1]);
      b.type = "button";
      b.setAttribute("aria-pressed", String(o[0] === estado[g.id]));
      b.addEventListener("click", function () {
        estado[g.id] = o[0];
        [].forEach.call(opts.children, function (x, i) { x.setAttribute("aria-pressed", String(g.opts[i][0] === o[0])); });
        aplicar();
      });
      opts.appendChild(b);
    });
    box.appendChild(opts);
    izq.appendChild(box);
  });

  var caja = el("div", "lab__ctrl");
  caja.appendChild(el("b", null, T("Acento", "Accent")));
  var accOpts = el("div", "lab__opts");
  ACENTOS.forEach(function (a, i) {
    var b = el("button", "lab__opt");
    b.type = "button";
    b.style.setProperty("--c", a[1]);
    b.setAttribute("aria-pressed", String(i === estado.acento));
    b.append(el("i"), d.createTextNode(a[3]));
    b.addEventListener("click", function () {
      estado.acento = i;
      [].forEach.call(accOpts.children, function (x, n) { x.setAttribute("aria-pressed", String(n === i)); });
      aplicar();
    });
    accOpts.appendChild(b);
  });
  caja.appendChild(accOpts);
  izq.appendChild(caja);
  host.appendChild(izq);

  var code = el("div", "lab__code");
  var ch = d.createElement("header");
  ch.appendChild(el("span", null, T("tokens en vivo", "live tokens")));
  var copy = el("button", "lab__copy", T("Copiar", "Copy"));
  copy.type = "button";
  copy.addEventListener("click", function () {
    var txt = pre.textContent;
    var ok = function () { copy.textContent = T("Copiado", "Copied"); setTimeout(function () { copy.textContent = T("Copiar", "Copy"); }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () {});
    else ok();
  });
  ch.appendChild(copy);
  pre = d.createElement("pre");
  code.append(ch, pre);
  host.appendChild(code);

  var nota = el("p", "lab__note", T(
    "Nada de esto es una maqueta: son las mismas custom properties con las que están hechos los cinco mundos.",
    "None of this is a mockup: these are the same custom properties the five worlds are built from."));
  host.appendChild(nota);
  aplicar();

  /* ── vestir la página con el mundo de un demo ──────────── */
  var banda = el("div", "viste");
  var bandaTxt = el("span");
  var volver = el("button", null, T("Volver a Pittahaya", "Back to Pittahaya"));
  volver.type = "button";
  banda.append(bandaTxt, volver);
  d.body.appendChild(banda);

  var base = null;
  function desvestir() {
    if (!base) return;
    ["--negro", "--tinta", "--carbon", "--marfil", "--marfil-2", "--marfil-3", "--linea", "--linea-2", "--serif"].forEach(function (k) { root.style.removeProperty(k); });
    base = null;
    aplicar();
    banda.classList.remove("on");
  }
  volver.addEventListener("click", desvestir);

  [].forEach.call(d.querySelectorAll(".semilla"), function (card) {
    var nombre = card.querySelector(".semilla-nombre");
    if (!nombre) return;
    var s = card.style;
    var fondo = s.getPropertyValue("--m-fondo").trim();
    if (!fondo) return;
    var b = el("button", "semilla-probar", T("Vestir la página", "Wear this world"));
    b.type = "button";
    b.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      base = true;
      root.style.setProperty("--negro", fondo);
      root.style.setProperty("--tinta", fondo);
      root.style.setProperty("--carbon", "color-mix(in srgb," + fondo + " 82%, #ffffff)");
      root.style.setProperty("--marfil", s.getPropertyValue("--m-texto").trim());
      root.style.setProperty("--marfil-2", s.getPropertyValue("--m-tenue").trim());
      root.style.setProperty("--marfil-3", s.getPropertyValue("--m-tenue").trim());
      root.style.setProperty("--linea", s.getPropertyValue("--m-linea").trim());
      root.style.setProperty("--linea-2", s.getPropertyValue("--m-linea").trim());
      root.style.setProperty("--serif", s.getPropertyValue("--m-tipo").trim());
      root.style.setProperty("--fruta", s.getPropertyValue("--m-acento").trim());
      root.style.setProperty("--fruta-viva", s.getPropertyValue("--m-acento").trim());
      bandaTxt.replaceChildren(d.createTextNode(T("Esta página, vestida con el sistema de ", "This page, wearing the system of ")), el("b", null, nombre.textContent));
      banda.classList.add("on");
      pintarCodigo();
    });
    card.appendChild(b);
  });

  d.addEventListener("keydown", function (e) { if (e.key === "Escape") desvestir(); });
})();
