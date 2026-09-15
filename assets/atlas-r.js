/* ATLAS · informe del grupo: navegación, tenencia, libro mayor y el día en UTC (CSP-safe) */
(function () {
  "use strict";

  var d = document;
  d.documentElement.classList.add("js");
  var en = /^en\b/i.test(d.documentElement.lang || "");
  var T = function (es, e) { return en ? e : es; };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var el = function (tag, cls, txt) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };

  var SEC = [
    { id: "energia", n: "01", c: "var(--s1)", name: T("Energía", "Energy") },
    { id: "maritimo", n: "02", c: "var(--s2)", name: T("Marítimo", "Maritime") },
    { id: "mineria", n: "03", c: "var(--s3)", name: T("Recursos", "Resources") },
    { id: "infraestructura", n: "04", c: "var(--s4)", name: T("Infraestructura", "Infrastructure") }
  ];
  var data = (window.ATLAS_CONTENT && window.ATLAS_CONTENT.companies) || [];
  var cos = data.map(function (c, i) {
    return {
      i: i, id: c.id, name: c.name, sec: SEC[Math.floor(i / 6)], country: c.country, region: c.region,
      year: c.acquisitionYear, own: c.yearsOwned, type: c.assetType, desc: c.description, caps: c.capabilities || []
    };
  });

  /* ── navegación ───────────────────────────────────────── */
  var burger = d.querySelector("[data-burger]");
  var nav = d.querySelector("[data-nav]");
  if (burger && nav) {
    var setNav = function (open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? T("Cerrar menú", "Close menu") : T("Abrir menú", "Open menu"));
      nav.classList.toggle("is-open", open);
    };
    burger.addEventListener("click", function () { setNav(burger.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); burger.focus(); }
    });
  }

  /* ── entradas ─────────────────────────────────────────── */
  var io = !reduce && "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }) : null;
  var watch = function (x) { if (io) io.observe(x); else x.classList.add("in"); };
  [].forEach.call(d.querySelectorAll("[data-in]"), watch);

  /* ── filtros por sector ───────────────────────────────── */
  function chips(box, onPick) {
    if (!box) return;
    var all = el("button", "ar-chip", T("Todos", "All"));
    all.type = "button";
    all.setAttribute("aria-pressed", "true");
    box.appendChild(all);
    var bs = [all];
    SEC.forEach(function (s) {
      var b = el("button", "ar-chip");
      b.type = "button";
      b.style.setProperty("--c", s.c);
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("data-s", s.id);
      b.appendChild(el("i"));
      b.appendChild(d.createTextNode(s.name));
      box.appendChild(b);
      bs.push(b);
    });
    bs.forEach(function (b) {
      b.addEventListener("click", function () {
        bs.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        onPick(b.getAttribute("data-s"));
      });
    });
  }

  /* ── fig. 1 · tenencia: una barra por compañía, desde su entrada hasta hoy ── */
  var hold = d.querySelector("[data-hold]");
  if (hold && cos.length) {
    var plot = hold.querySelector("[data-plot]");
    var axis = hold.querySelector("[data-axis]");
    var read = hold.querySelector("[data-read]");
    var Y0 = 1993, Y1 = 2026;
    var rows = [];
    var sorted = cos.slice().sort(function (a, b) { return a.year - b.year || a.i - b.i; });

    var show = function (c) {
      rows.forEach(function (r) { r.el.classList.toggle("is-on", r.c === c); });
      read.style.setProperty("--c", c.sec.c);
      read.querySelector("code").textContent = c.id + " · " + c.sec.name;
      read.querySelector("b").textContent = c.name;
      var dd = read.querySelectorAll("dd");
      dd[0].textContent = c.country;
      dd[1].textContent = c.year;
      dd[2].textContent = c.own + T(" años", " years");
      dd[3].textContent = c.type;
    };

    sorted.forEach(function (c, k) {
      var r = el("button", "ar-row");
      r.type = "button";
      r.setAttribute("aria-label", c.id + " · " + c.name + " · " + c.year);
      r.appendChild(el("code", null, c.id.replace("ATLAS-", "A-")));
      var tr = el("span", "tr");
      var bar = el("i", "bar");
      bar.style.setProperty("--x", ((c.year - Y0) / (Y1 - Y0) * 100).toFixed(2) + "%");
      bar.style.setProperty("--c", c.sec.c);
      bar.style.setProperty("--d", (k * 40) + "ms");
      tr.appendChild(bar);
      r.appendChild(tr);
      ["mouseenter", "focus", "click"].forEach(function (ev) { r.addEventListener(ev, function () { show(c); }); });
      plot.appendChild(r);
      rows.push({ el: r, c: c });
    });

    [1993, 2000, 2010, 2020, 2026].forEach(function (y) {
      var s = el("span", null, y);
      s.style.left = ((y - Y0) / (Y1 - Y0) * 100) + "%";
      axis.appendChild(s);
    });

    chips(hold.querySelector("[data-chips]"), function (id) {
      rows.forEach(function (r) { r.el.classList.toggle("is-dim", !!id && r.c.sec.id !== id); });
      var first = rows.filter(function (r) { return !id || r.c.sec.id === id; })[0];
      if (first) show(first.c);
    });
    show(sorted[0]);
    watch(plot);
  }

  /* ── registro: libro mayor ordenable ──────────────────── */
  var led = d.querySelector("[data-ledger]");
  if (led && cos.length) {
    var tb = led.querySelector("tbody");
    var cnt = led.querySelector("[data-count]");
    var st = { k: "id", dir: 1, sec: null };
    var val = function (c, k) { return k === "sec" ? c.sec.n : c[k]; };

    var render = function () {
      tb.replaceChildren();
      var list = cos.filter(function (c) { return !st.sec || c.sec.id === st.sec; }).sort(function (a, b) {
        var x = val(a, st.k), y = val(b, st.k);
        return ((x > y) - (x < y)) * st.dir || a.i - b.i;
      });
      if (cnt) cnt.textContent = pad(list.length) + " / 24";
      list.forEach(function (c) {
        var tr = el("tr", "ar-r");
        tr.tabIndex = 0;
        tr.setAttribute("aria-expanded", "false");
        tr.style.setProperty("--c", c.sec.c);
        tr.appendChild(el("td", "id", c.id));
        tr.appendChild(el("td", "nm", c.name));
        var sc = el("td", "sc");
        sc.appendChild(el("i"));
        sc.appendChild(d.createTextNode(c.sec.name));
        tr.appendChild(sc);
        tr.appendChild(el("td", "co", c.country));
        tr.appendChild(el("td", "yr", c.year));
        tr.appendChild(el("td", "ow", c.own));

        var x = el("tr", "ar-x");
        x.hidden = true;
        var td = el("td");
        td.colSpan = 6;
        td.appendChild(el("p", null, c.desc));
        var tags = el("div", "ar-tags");
        [c.region, c.type].concat(c.caps).forEach(function (t) { tags.appendChild(el("span", "ar-tag", t)); });
        td.appendChild(tags);
        x.appendChild(td);

        var toggle = function () {
          var open = x.hidden;
          x.hidden = !open;
          tr.setAttribute("aria-expanded", String(open));
          tr.classList.toggle("is-open", open);
        };
        tr.addEventListener("click", toggle);
        tr.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
        });
        tb.appendChild(tr);
        tb.appendChild(x);
      });
    };

    [].forEach.call(led.querySelectorAll("th[data-k]"), function (th) {
      th.querySelector("button").addEventListener("click", function () {
        var k = th.getAttribute("data-k");
        st.dir = st.k === k ? -st.dir : (k === "own" ? -1 : 1);
        st.k = k;
        [].forEach.call(led.querySelectorAll("th[data-k]"), function (h) { h.removeAttribute("aria-sort"); });
        th.setAttribute("aria-sort", st.dir > 0 ? "ascending" : "descending");
        render();
      });
    });
    chips(led.querySelector("[data-chips]"), function (id) { st.sec = id; render(); });
    render();
  }

  /* ── cartera: las seis compañías de cada sector ───────── */
  [].forEach.call(d.querySelectorAll("[data-list]"), function (ul) {
    var id = ul.getAttribute("data-list");
    cos.filter(function (c) { return c.sec.id === id; }).forEach(function (c) {
      var li = el("li");
      li.appendChild(el("b", null, c.name));
      li.appendChild(el("span", null, c.country));
      li.appendChild(el("code", null, c.year));
      ul.appendChild(li);
    });
  });

  /* ── fig. 3 · el día del grupo sobre un mismo eje UTC ─── */
  var day = d.querySelector("[data-day]");
  if (day && window.Intl) {
    var lis = [].slice.call(day.querySelectorAll("[data-tz]"));
    var utcOut = day.querySelector("[data-utc]");
    var local = function (tz, now) {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(now);
      var g = function (t) { for (var i = 0; i < p.length; i++) if (p[i].type === t) return p[i].value; return ""; };
      var h = parseInt(g("hour"), 10) % 24, m = parseInt(g("minute"), 10);
      var off = h * 60 + m - (now.getUTCHours() * 60 + now.getUTCMinutes());
      if (off > 720) off -= 1440;
      if (off < -720) off += 1440;
      return { h: h, m: m, off: off, wd: g("weekday") };
    };
    lis.forEach(function (li) {
      var tr = li.querySelector(".ar-day__track");
      tr.appendChild(el("i"));
      tr.appendChild(el("i"));
      tr.appendChild(el("b", "ar-day__now"));
    });
    var put = function (x, a, b) { x.style.left = (a / 14.4) + "%"; x.style.width = ((b - a) / 14.4) + "%"; };
    var paint = function () {
      var now = new Date();
      var un = now.getUTCHours() * 60 + now.getUTCMinutes();
      if (utcOut) utcOut.textContent = "UTC " + pad(now.getUTCHours()) + ":" + pad(now.getUTCMinutes());
      lis.forEach(function (li) {
        var o = local(li.getAttribute("data-tz"), now);
        var seg = li.querySelectorAll(".ar-day__track i");
        var s = ((480 - o.off) % 1440 + 1440) % 1440, e = s + 600;
        if (e <= 1440) { put(seg[0], s, e); seg[1].style.width = "0"; }
        else { put(seg[0], s, 1440); put(seg[1], 0, e - 1440); }
        li.querySelector(".ar-day__now").style.left = (un / 14.4) + "%";
        var open = o.wd !== "Sat" && o.wd !== "Sun" && o.h >= 8 && o.h < 18;
        li.classList.toggle("is-open", open);
        li.querySelector("[data-clock]").textContent = pad(o.h) + ":" + pad(o.m);
        li.querySelector("[data-status]").textContent = open ? T("Abierta", "Open") : T("Cerrada", "Closed");
      });
    };
    paint();
    setInterval(function () { if (!d.hidden) paint(); }, 20000);
  }

  var y = d.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
