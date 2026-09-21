/* PITTAHAYA · la compilación de la página y la hoja de obra de los Rayos X (CSP-safe) */
(function () {
  "use strict";

  var d = document, root = d.documentElement, body = d.body;
  var en = /^en\b/i.test(root.lang || "");
  var T = function (es, e) { return en ? e : es; };
  var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var el = function (t, c, x) { var e = d.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ── 1. la página se compila delante de quien llega ─────── */
  var telon = d.querySelector("[data-telon]");
  if (telon) telon.remove();

  if (!quieto) {
    var comp = el("div", "comp");
    comp.setAttribute("aria-hidden", "true");
    comp.append(el("div", "comp__malla"), el("div", "comp__ritmo"));
    var bloques = el("div", "comp__bloques");
    bloques.append(el("i"), el("i"), el("i"));
    var marca = el("div", "comp__marca");
    var logo = d.createElement("img");
    logo.src = (en ? "../" : "") + "assets/pitahaya-mark.png";
    logo.alt = "";
    marca.append(logo, el("span", null, "Pittahaya"));
    var log = el("div", "comp__log");
    comp.append(bloques, marca, log);
    body.appendChild(comp);

    var pasos = [
      ["--col: 12", T("retícula levantada", "grid raised")],
      ["--ritmo: 8px", T("ritmo aplicado", "rhythm applied")],
      ["--t-display", T("escala tipográfica asentada", "type scale set")],
      ["--acento: #e0357b", T("color en su sitio", "color in place")],
      ["0 " + T("bibliotecas", "libraries"), T("página lista", "page ready")]
    ];
    pasos.forEach(function (p) {
      var line = el("span");
      line.append(el("b", null, p[0]), d.createTextNode("· " + p[1]));
      log.appendChild(line);
    });

    var fases = [["p1", 0], ["p2", 520], ["p3", 1180]];
    fases.forEach(function (f) { setTimeout(function () { comp.classList.add(f[0]); }, f[1]); });
    log.childNodes.forEach(function (n, i) { setTimeout(function () { n.classList.add("on"); }, 180 + i * 280); });
    setTimeout(function () { comp.classList.add("fuera"); }, 2100);
    setTimeout(function () { if (comp.parentNode) comp.remove(); }, 3200);
  }

  /* ── 2. la hoja de obra ─────────────────────────────────── */
  var capa = el("div", "obra");
  capa.setAttribute("aria-hidden", "true");
  body.appendChild(capa);

  var hex = function (c) {
    c = (c || "").trim();
    if (c.charAt(0) === "#") {
      if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16), 1];
    }
    var m = c.match(/[\d.]+/g) || [255, 255, 255];
    return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]];
  };
  var canal = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  var lum = function (c) { return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]); };
  var sobre = function (f, b) { var a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; };
  var ratio = function (a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  var px = function (v) { return Math.round(parseFloat(v) || 0); };
  var vista = function (r) { return r.bottom > -40 && r.top < innerHeight + 40 && r.width > 8; };

  var pend = 0;
  function pintar() {
    pend = 0;
    if (!body.classList.contains("xray")) { capa.replaceChildren(); return; }
    var piezas = d.createDocumentFragment();
    var fondo = sobre(hex(getComputedStyle(body).backgroundColor), [8, 7, 10, 1]);

    /* cajas medidas de cada componente declarado */
    [].forEach.call(d.querySelectorAll("[data-comp]"), function (c) {
      var r = c.getBoundingClientRect();
      if (!vista(r)) return;
      var caja = el("div", "obra__caja");
      caja.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      caja.append(el("b", null, c.getAttribute("data-comp")), el("u", null, Math.round(r.width) + " × " + Math.round(r.height)));
      piezas.appendChild(caja);
    });

    /* cotas entre secciones: la distancia real, en píxeles */
    var secs = [].slice.call(d.querySelectorAll("main > section, main > .env"));
    for (var i = 1; i < secs.length; i++) {
      var a = secs[i - 1].getBoundingClientRect(), b = secs[i].getBoundingClientRect();
      var hueco = b.top - a.bottom;
      if (hueco < 12) continue;
      var mid = (a.bottom + b.top) / 2;
      if (mid < 0 || mid > innerHeight) continue;
      var cota = el("div", "obra__cota");
      cota.style.cssText = "left:" + (b.left + 18) + "px;top:" + a.bottom + "px;width:96px;height:" + hueco + "px";
      cota.appendChild(el("span", null, Math.round(hueco) + " px"));
      piezas.appendChild(cota);
    }

    /* tipografía y contraste de los bloques de texto visibles */
    var textos = [].slice.call(d.querySelectorAll(".display, .t1, .t2, .plomo, .semilla-nombre, .aud__v")).slice(0, 14);
    textos.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (!vista(r) || r.height < 14) return;
      var cs = getComputedStyle(t);
      var col = sobre(hex(cs.color), fondo);
      var rc = ratio(col, fondo);
      var chip = el("div", "obra__tipo");
      chip.style.cssText = "left:" + (r.right - 4) + "px;top:" + r.top + "px;transform:translateX(-100%)";
      chip.append(
        d.createTextNode(px(cs.fontSize) + " / " + px(cs.lineHeight) + " px  "),
        el("em", rc >= 4.5 ? "" : "ojo", rc.toFixed(1) + ":1")
      );
      piezas.appendChild(chip);
    });

    capa.replaceChildren(piezas);
  }
  var pedir = function () { if (!pend) pend = requestAnimationFrame(pintar); };
  addEventListener("scroll", pedir, { passive: true });
  addEventListener("resize", pedir, { passive: true });
  new MutationObserver(pedir).observe(body, { attributes: true, attributeFilter: ["class"] });
  setTimeout(pintar, 400);
})();
