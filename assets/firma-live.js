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
    if (typeof medir === "function") setTimeout(medir, 60);
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


  /* ── la auditoría: la página se mide a sí misma ─────────── */
  var aud = d.querySelector("[data-aud]");
  var medir = function () {};
  if (aud) {
    var rgb = function (c) {
      c = (c || "").trim();
      if (c.charAt(0) === "#") {
        if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
        return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16), 1];
      }
      var m = c.match(/[\d.]+/g) || [255, 255, 255];
      return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]];
    };
    var lum = function (c) {
      return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]);
    };
    var canal = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    var mezcla = function (frente, fondo) {
      var a = frente[3];
      return [frente[0] * a + fondo[0] * (1 - a), frente[1] * a + fondo[1] * (1 - a), frente[2] * a + fondo[2] * (1 - a), 1];
    };
    var ratio = function (a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
    var px = function (v) { return Math.round(parseFloat(v)); };

    var fila = function (k) {
      var f = el("div", "aud__fila");
      var kk = el("span", "aud__k", k);
      var v = el("span", "aud__v");
      var e = el("span", "aud__e");
      e.appendChild(el("i"));
      e.appendChild(el("u"));
      e.querySelector("u").style.textDecoration = "none";
      f.append(kk, v, e);
      aud.appendChild(f);
      return { v: v, e: e, t: e.querySelector("u") };
    };
    var marcar = function (r, ok, txt) { r.e.classList.toggle("ojo", !ok); r.t.textContent = txt; };
    var val = function (r, texto, nota) {
      r.v.replaceChildren(d.createTextNode(texto));
      if (nota) r.v.appendChild(el("small", null, nota));
    };

    var rC = fila(T("Contraste · texto sobre fondo", "Contrast · text on background"));
    var rA = fila(T("Contraste · acento sobre fondo", "Contrast · accent on background"));
    var rR = fila(T("Retícula · medida en tu pantalla", "Grid · measured on your screen"));
    var rE = fila(T("Escala · renderizada ahora", "Scale · rendered right now"));
    var r8 = fila(T("Ritmo de 8 · espaciados auditados", "Rhythm of 8 · spacings audited"));
    var rP = fila(T("Peso servido · esta página", "Payload · this page"));
    var pie = el("div", "aud__pie");
    aud.appendChild(pie);

    medir = function () {
      var cs = getComputedStyle(d.body);
      var fondo = mezcla(rgb(cs.backgroundColor), [0, 0, 0, 1]);
      var texto = mezcla(rgb(cs.color), fondo);
      var rc = ratio(texto, fondo);
      val(rC, rc.toFixed(2) + " : 1", T("mínimo AA 4.5 · AAA 7", "AA needs 4.5 · AAA 7"));
      marcar(rC, rc >= 4.5, rc >= 7 ? "AAA" : rc >= 4.5 ? "AA" : T("revisar", "check"));

      var acc = mezcla(rgb(getComputedStyle(root).getPropertyValue("--fruta-viva").trim() || "#fff"), fondo);
      var ra = ratio(acc, fondo);
      val(rA, ra.toFixed(2) + " : 1", T("mínimo 3 para rótulos", "3 minimum for labels"));
      marcar(rA, ra >= 3, ra >= 4.5 ? "AA" : ra >= 3 ? T("rótulos", "labels") : T("solo adorno", "decor only"));

      var env = d.querySelector(".env");
      var ancho = env ? env.getBoundingClientRect().width : innerWidth;
      var rej = d.querySelector(".sistema");
      var gut = rej ? px(getComputedStyle(rej).columnGap) : 20;
      var pad = env ? px(getComputedStyle(env).paddingLeft) : 0;
      var col = Math.round((ancho - pad * 2 - gut * 11) / 12);
      val(rR, "12 × " + col + " px", T("canal ", "gutter ") + gut + " px · " + T("margen ", "margin ") + pad + " px");
      marcar(rR, col > 0, T("viva", "live"));

      var h1 = d.querySelector(".heroe h1") || d.querySelector(".display");
      var t1 = d.querySelector(".t1");
      val(rE, (h1 ? px(getComputedStyle(h1).fontSize) : 0) + " / " + (t1 ? px(getComputedStyle(t1).fontSize) : 0) + " / " + px(cs.fontSize) + " px",
        T("display · titular · cuerpo", "display · headline · body"));
      marcar(rE, true, root.getAttribute("data-escala") || "estandar");

      var muestras = [].slice.call(d.querySelectorAll(".mod, .lab, .aud__fila, .semilla-cuerpo, .sistema, .semillero")).slice(0, 24);
      var total = 0, ok = 0;
      muestras.forEach(function (m) {
        var g = getComputedStyle(m);
        [g.paddingTop, g.paddingBottom, g.rowGap, g.columnGap].forEach(function (x) {
          var n = parseFloat(x);
          if (!n || isNaN(n)) return;
          total++;
          if (Math.abs(Math.round(n / 8) * 8 - n) <= 1.2) ok++;
        });
      });
      val(r8, ok + T(" fijos · ", " fixed · ") + (total - ok) + T(" fluidos", " fluid"),
        T("múltiplos de 8 px · el resto, clamp()", "multiples of 8 px · the rest, clamp()"));
      var barra = el("span", "aud__barra");
      var ib = el("i");
      ib.style.setProperty("--w", (total ? ok / total * 100 : 0).toFixed(0) + "%");
      barra.appendChild(ib);
      r8.v.appendChild(barra);
      marcar(r8, true, T("conforme", "conformant"));

      var css = 0, js = 0, img = 0;
      (performance.getEntriesByType ? performance.getEntriesByType("resource") : []).forEach(function (r) {
        var kb = (r.encodedBodySize || r.transferSize || r.decodedBodySize || 0) / 1024;
        if (r.initiatorType === "css" || /\.css/.test(r.name)) css += kb;
        else if (r.initiatorType === "script") js += kb;
        else if (r.initiatorType === "img" || r.initiatorType === "video") img += kb;
      });
      val(rP, Math.round(css) + " KB CSS · " + Math.round(js) + " KB JS", T("sin una sola biblioteca externa", "without a single external library"));
      marcar(rP, js < 120, T("propio", "first-party"));

      pie.replaceChildren();
      var comps = d.querySelectorAll("[data-comp]").length;
      var p1 = el("span"); p1.append(d.createTextNode(T("Componentes declarados: ", "Declared components: ")), el("b", null, String(comps)));
      var p2 = el("span"); p2.append(d.createTextNode(T("Ventana: ", "Viewport: ")), el("b", null, innerWidth + " × " + innerHeight));
      var p3 = el("span"); p3.append(d.createTextNode(T("Medido: ", "Measured: ")), el("b", null, new Date().toLocaleTimeString(en ? "en-GB" : "es-ES")));
      pie.append(p1, p2, p3);
    };
    addEventListener("resize", function () { clearTimeout(aud.__t); aud.__t = setTimeout(medir, 260); }, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { medir(); });
    setTimeout(medir, 200);
  }

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
      setTimeout(medir, 80);
    });
    card.appendChild(b);
  });

  d.addEventListener("keydown", function (e) { if (e.key === "Escape") desvestir(); });
})();
