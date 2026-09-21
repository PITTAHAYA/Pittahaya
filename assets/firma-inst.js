/* PITTAHAYA · instrumentos del sistema y generador de mundos (CSP-safe) */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var en = /^en\b/i.test(root.lang || "");
  var T = function (es, e) { return en ? e : es; };
  var el = function (t, c, x) { var e = d.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var px = function (n) { return Math.round(n) + "px"; };

  /* ── contraste, para medir lo que ofrecemos ─────────────── */
  var hex = function (c) {
    c = (c || "").trim();
    if (c.charAt(0) === "#") {
      if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)];
    }
    var m = (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
    return [m[0], m[1], m[2]];
  };
  var canal = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  var lum = function (c) { return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]); };
  var ratio = function (a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  /* ── 1. escala: una proporción que manda en toda la página ── */
  var mEscala = d.querySelector('[data-comp="modulo/escala"],[data-comp="module/scale"]');
  if (mEscala) {
    var filas = [].slice.call(mEscala.querySelectorAll(".escala-fila"));
    var ins = el("div", "ins");
    ins.appendChild(el("span", "ins__k", T("Proporción", "Ratio")));
    var val = el("span", "ins__v", "1.250");
    var rango = d.createElement("input");
    rango.type = "range"; rango.min = "1.10"; rango.max = "1.50"; rango.step = "0.005"; rango.value = "1.25";
    rango.setAttribute("aria-label", T("Proporción de la escala tipográfica", "Type scale ratio"));
    ins.append(rango, val);
    mEscala.insertBefore(ins, mEscala.querySelector(".nota"));

    var pintarEscala = function () {
      var r = parseFloat(rango.value);
      var base = 17;
      var pasos = [9, 6, 4, 2, 0];                      /* display, t1, t2, t3, cuerpo */
      var techo = [200, 118, 68, 40, 20];
      var tokens = ["--t-display", "--t-1", "--t-2", "--t-3", "--t-cuerpo"];
      tokens.forEach(function (tok, i) {
        var max = Math.min(techo[i], base * Math.pow(r, pasos[i]));
        var min = Math.max(14, max * (i === 0 ? 0.33 : i === 1 ? 0.45 : 0.62));
        var vw = (max / 14.4).toFixed(2);
        root.style.setProperty(tok, "clamp(" + px(min) + "," + vw + "vw," + px(max) + ")");
        var f = filas[i];
        if (f) {
          var m = f.querySelector(".escala-muestra"), t = f.querySelector(".escala-tok");
          if (m && i < 4) m.style.fontSize = "clamp(" + px(min * 0.62) + "," + (vw * 0.6).toFixed(2) + "vw," + px(max * 0.62) + ")";
          if (t) t.textContent = tok + " · " + Math.round(min) + " → " + Math.round(max) + " px";
        }
      });
      val.textContent = r.toFixed(3);
      if (window.__firmaMedir) window.__firmaMedir();
    };
    rango.addEventListener("input", pintarEscala);
    pintarEscala();
  }

  /* ── 2. ritmo: la base que audita la propia página ───────── */
  var mRitmo = d.querySelector('[data-comp="modulo/ritmo"],[data-comp="module/rhythm"]');
  if (mRitmo) {
    var barras = [].slice.call(mRitmo.querySelectorAll(".ritmo-demo i"));
    var nota = mRitmo.querySelector(".nota");
    var ins2 = el("div", "ins");
    ins2.appendChild(el("span", "ins__k", T("Base", "Base")));
    var seg = el("div", "ins__seg");
    [4, 8, 12].forEach(function (b) {
      var bt = el("button", null, b + " px");
      bt.type = "button";
      bt.setAttribute("aria-pressed", String(b === 8));
      bt.addEventListener("click", function () {
        [].forEach.call(seg.children, function (x, i) { x.setAttribute("aria-pressed", String([4, 8, 12][i] === b)); });
        root.style.setProperty("--ritmo", b + "px");
        barras.forEach(function (i, n) { i.style.height = ((n + 1) / barras.length * 100).toFixed(0) + "%"; });
        if (nota) nota.textContent = "--ritmo: " + b + "px · " + [1, 2, 3, 5, 7, 9, 11, 12].map(function (k) { return k * b; }).join(" · ");
        if (window.__firmaMedir) window.__firmaMedir();
      });
      seg.appendChild(bt);
    });
    ins2.appendChild(seg);
    mRitmo.insertBefore(ins2, nota);
  }

  /* ── 3. paleta: cada tono, con su contraste, es un acento ── */
  var mPal = d.querySelector('[data-comp="modulo/paleta"],[data-comp="module/palette"]');
  if (mPal) {
    var fondo = hex(getComputedStyle(d.body).backgroundColor);
    [].forEach.call(mPal.querySelectorAll(".tono"), function (t) {
      var color = (t.style.background || "").trim();
      var r = ratio(hex(color), fondo);
      t.appendChild(el("span", "tono__r", r.toFixed(1) + ":1"));
      t.appendChild(el("span", "tono__mar", r >= 4.5 ? "AA" : r >= 3 ? T("rótulo", "label") : T("fondo", "surface")));
      var b = d.createElement("button");
      b.type = "button";
      b.className = t.className;
      b.style.cssText = t.style.cssText;
      b.setAttribute("aria-label", T("Usar ", "Use ") + color + T(" como acento", " as accent"));
      while (t.firstChild) b.appendChild(t.firstChild);
      b.addEventListener("click", function () {
        [].forEach.call(mPal.querySelectorAll(".tono"), function (x) { x.classList.remove("es-acento"); });
        b.classList.add("es-acento");
        root.style.setProperty("--fruta", color);
        root.style.setProperty("--fruta-viva", color);
        if (window.__firmaMedir) window.__firmaMedir();
      });
      t.parentNode.replaceChild(b, t);
    });
  }

  /* ── 4. retícula: de 6 a 16 columnas, y los Rayos X obedecen ── */
  var mRet = d.querySelector('[data-comp="modulo/reticula"],[data-comp="module/grid"]');
  var cols = d.querySelector(".xray-grid .cols");
  if (mRet) {
    var demo = mRet.querySelector('[aria-hidden="true"]');
    var notaR = mRet.querySelector(".nota");
    var ins3 = el("div", "ins");
    ins3.appendChild(el("span", "ins__k", T("Columnas", "Columns")));
    var vR = el("span", "ins__v", "12");
    var rR = d.createElement("input");
    rR.type = "range"; rR.min = "6"; rR.max = "16"; rR.step = "1"; rR.value = "12";
    rR.setAttribute("aria-label", T("Columnas de la retícula", "Grid columns"));
    ins3.append(rR, vR);
    mRet.insertBefore(ins3, notaR);

    var pintarRet = function () {
      var n = parseInt(rR.value, 10);
      vR.textContent = n;
      root.style.setProperty("--col", n);
      if (cols) {
        cols.style.gridTemplateColumns = "repeat(" + n + ",1fr)";
        while (cols.children.length > n) cols.removeChild(cols.lastChild);
        while (cols.children.length < n) cols.appendChild(d.createElement("i"));
      }
      if (demo) {
        demo.style.gridTemplateColumns = "repeat(" + n + ",1fr)";
        var trozos = [[n, "rgba(224,53,123,.30)"], [Math.ceil(n / 2), "rgba(224,53,123,.22)"], [Math.floor(n / 2), "rgba(224,53,123,.22)"]];
        var tercio = Math.max(1, Math.round(n / 3));
        trozos.push([tercio, "rgba(159,206,58,.22)"], [tercio, "rgba(159,206,58,.22)"], [n - tercio * 2, "rgba(159,206,58,.22)"]);
        demo.replaceChildren();
        trozos.forEach(function (t) {
          if (t[0] < 1) return;
          var i = el("i");
          i.style.cssText = "grid-column:span " + t[0] + ";height:26px;border-radius:4px;background:" + t[1];
          demo.appendChild(i);
        });
      }
      if (notaR) notaR.textContent = "--col: " + n + " · --gutter: clamp(12,1.6vw,24) · --margen: clamp(20,5vw,72) · --maxw: 1460";
      if (window.__firmaMedir) window.__firmaMedir();
    };
    rR.addEventListener("input", pintarRet);
  }

  /* ── 5. el sistema genera mundos ─────────────────────────── */
  var rejilla = d.querySelector(".semillero");
  if (rejilla) {
    var PARES = [
      ['"Fraunces",Georgia,serif', "Fraunces · Space Grotesk", 320],
      ['"Space Grotesk",system-ui,sans-serif', "Space Grotesk · JetBrains Mono", 500],
      ['"Cormorant Garamond",Georgia,serif', "Cormorant Garamond · Inter", 300]
    ];
    var SECT = T(
      ["Hotelería de autor", "Bodega familiar", "Clínica de precisión", "Editorial independiente", "Fondo de arte", "Astillero privado"],
      ["Boutique hospitality", "Family winery", "Precision clinic", "Independent press", "Art fund", "Private shipyard"]);
    var NOMB = ["Vespera", "Cárdenas", "Nocta", "Aurífera", "Cuerda", "Salinas", "Bruma", "Peñasco"];
    var n = 0;

    var hsl = function (h, s, l) { return "hsl(" + h + " " + s + "% " + l + "%)"; };
    var gen = el("div", "gen");
    var txt = el("p", "gen__t");
    txt.append(el("b", null, T("El sistema no solo documenta: produce.", "The system does not only document: it produces.")),
      d.createTextNode(T(" Cada mundo nuevo sale de las mismas reglas — un matiz, su neutro, una pareja tipográfica, una retícula y un ritmo.",
        " Every new world comes from the same rules — one hue, its neutral, a type pairing, a grid, and a rhythm.")));
    var bt = el("button", "gen__b", T("Generar un mundo", "Generate a world"));
    bt.type = "button";
    gen.append(txt, bt);
    rejilla.parentNode.insertBefore(gen, rejilla.nextSibling);

    bt.addEventListener("click", function () {
      n++;
      var h = Math.floor(Math.random() * 360);
      var par = PARES[Math.floor(Math.random() * PARES.length)];
      var col = Math.random() < 0.5 ? 12 : Math.random() < 0.5 ? 8 : 16;
      var rit = [4, 8, 12][Math.floor(Math.random() * 3)];
      var fondo = hsl(h, 16, 5), texto = hsl(h, 14, 94), acento = hsl((h + 24) % 360, 78, 62);
      var nombre = NOMB[(n + Math.floor(Math.random() * NOMB.length)) % NOMB.length];
      var sector = SECT[Math.floor(Math.random() * SECT.length)];

      var card = el("a", "semilla semilla--nueva");
      card.href = "#sistema";
      card.style.cssText = "--m-fondo:" + fondo + ";--m-texto:" + texto + ";--m-tenue:" + hsl(h, 12, 70) +
        ";--m-acento:" + acento + ";--m-linea:" + hsl(h, 14, 30) + ";--m-brillo:" + hsl(h, 60, 40) +
        ";--m-reticula:" + Math.round(560 / col) + "px;--m-tipo:" + par[0] + ";--m-peso:" + par[2] + ";--m-track:-.03em";
      card.append(el("span", "semilla-lienzo"), el("span", "semilla-brillo"));
      var mec = el("span", "semilla-mec");
      mec.append(d.createTextNode(T("Generado ahora con las reglas del sistema", "Generated now from the system rules")), d.createElement("br"),
        el("em", null, col + T(" columnas · ritmo ", " columns · rhythm ") + rit + " px"));
      card.appendChild(mec);
      var cuerpo = el("span", "semilla-cuerpo");
      var tapa = el("span", "semilla-tapa");
      tapa.append(el("span", "semilla-sector", sector), el("span", "semilla-anio", T("Nuevo", "New")));
      cuerpo.append(tapa, el("span", "semilla-nombre", nombre),
        el("span", "semilla-linea", T("Matiz " + h + "° · neutro de la misma familia · " + par[1] + ".",
          "Hue " + h + "° · neutral from the same family · " + par[1] + ".")));
      var espec = el("span", "espec");
      var fila = el("span", "espec-fila");
      [fondo, texto, acento, hsl((h + 180) % 360, 52, 56)].forEach(function (c) {
        var i = el("i", "espec-sw");
        i.style.background = c;
        fila.appendChild(i);
      });
      fila.appendChild(el("span", "espec-meta", T("fondo · texto · acento", "surface · text · accent")));
      espec.append(fila, el("span", "espec-tipo", par[1]));
      cuerpo.append(espec, el("span", "semilla-ir", T("Vestir la página →", "Wear this world →")));
      card.appendChild(cuerpo);
      card.addEventListener("click", function (ev) { ev.preventDefault(); vestir(); });
      rejilla.appendChild(card);

      /* el mundo generado viste la página al instante */
      var vestir = function () {
      root.style.setProperty("--negro", fondo);
      root.style.setProperty("--tinta", fondo);
      root.style.setProperty("--marfil", texto);
      root.style.setProperty("--marfil-2", hsl(h, 12, 72));
      root.style.setProperty("--marfil-3", hsl(h, 12, 64));
      root.style.setProperty("--linea", hsl(h, 14, 26));
      root.style.setProperty("--linea-2", hsl(h, 14, 34));
      root.style.setProperty("--serif", par[0]);
      root.style.setProperty("--fruta", acento);
      root.style.setProperty("--fruta-viva", acento);
      root.style.setProperty("--ritmo", rit + "px");
      root.style.setProperty("--col", col);
      if (window.__firmaViste) window.__firmaViste(nombre);
      if (window.__firmaMedir) window.__firmaMedir();
      };
      vestir();
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
})();
