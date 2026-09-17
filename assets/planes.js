/* ═══════════════════════════════════════════════════════════
   Pittahaya · Planes
   Selector web / IA, carrete de tarjetas en el teléfono,
   brillo que sigue al puntero y entradas al aparecer.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var page = doc.querySelector(".pl-page");
  if (!page) return;
  page.classList.add("pl-js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var movil = window.matchMedia("(max-width: 860px)");

  /* ── Carrete: en el teléfono arranca en la tarjeta destacada ── */
  function prepararCarrete(panel) {
    var rail = panel.querySelector("[data-rail]");
    var dots = panel.querySelectorAll(".pl-dots button");
    if (!rail) return;
    var cards = rail.querySelectorAll(".pl-card");

    function ir(i, suave) {
      var c = cards[i];
      if (!c) return;
      rail.scrollTo({
        left: c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2,
        behavior: suave && !reduce ? "smooth" : "auto"
      });
    }
    function marcar() {
      var centro = rail.scrollLeft + rail.clientWidth / 2, mejor = 0, dist = Infinity;
      Array.prototype.forEach.call(cards, function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centro);
        if (d < dist) { dist = d; mejor = i; }
      });
      Array.prototype.forEach.call(dots, function (b, i) {
        b.setAttribute("aria-current", String(i === mejor));
      });
    }
    Array.prototype.forEach.call(dots, function (b, i) {
      b.addEventListener("click", function () { ir(i, true); });
    });
    var pide = false;
    rail.addEventListener("scroll", function () {
      if (pide) return;
      pide = true;
      requestAnimationFrame(function () { pide = false; marcar(); });
    }, { passive: true });

    /* En el teléfono cada tarjeta enseña lo esencial; el resto, a un toque */
    var EN = doc.documentElement.lang === "en";
    Array.prototype.forEach.call(cards, function (c) {
      var extra = c.querySelectorAll(".pl-list li:not(.pl-carry)").length - 3;
      if (extra < 1) return;
      var b = doc.createElement("button");
      b.type = "button";
      b.className = "pl-more";
      b.setAttribute("aria-expanded", "false");
      var txt = function (open) {
        return open ? (EN ? "Show less" : "Ver menos")
                    : (EN ? "See " + extra + " more" : "Ver " + extra + " más");
      };
      b.textContent = txt(false);
      b.addEventListener("click", function () {
        var open = !c.classList.contains("is-full");
        c.classList.toggle("is-full", open);
        b.setAttribute("aria-expanded", String(open));
        b.textContent = txt(open);
      });
      c.querySelector(".pl-list").insertAdjacentElement("afterend", b);
    });

    panel._centrar = function () {
      if (!movil.matches) return;
      var star = rail.querySelector(".pl-card--star");
      ir(star ? Array.prototype.indexOf.call(cards, star) : 0, false);
      marcar();
    };
  }

  /* ── Selector web / IA ───────────────────────────────────── */
  var sw = page.querySelector(".pl-switch");
  var tabs = sw ? sw.querySelectorAll("[role=tab]") : [];
  var pill = sw ? sw.querySelector(".pl-switch__pill") : null;
  var panels = page.querySelectorAll(".pl-panel");
  Array.prototype.forEach.call(panels, prepararCarrete);

  function moverPill() {
    var act = sw && sw.querySelector("[aria-selected=true]");
    if (!act || !pill) return;
    pill.style.setProperty("--x", act.offsetLeft + "px");
    pill.style.setProperty("--w", act.offsetWidth + "px");
  }

  function elegir(i, foco) {
    Array.prototype.forEach.call(tabs, function (t, k) {
      var si = k === i;
      t.setAttribute("aria-selected", String(si));
      t.tabIndex = si ? 0 : -1;
      var p = doc.getElementById(t.getAttribute("aria-controls"));
      if (!p) return;
      p.hidden = !si;
      p.classList.remove("is-in");
      if (si) {
        void p.offsetWidth;
        p.classList.add("is-in");
        if (p._centrar) p._centrar();
      }
    });
    if (foco) tabs[i].focus();
    moverPill();
  }

  if (tabs.length) {
    Array.prototype.forEach.call(tabs, function (t, i) {
      t.addEventListener("click", function () { elegir(i, false); });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        elegir((i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length, true);
      });
    });
    /* #ia o un ancla a un plan de IA abren esa pestaña */
    var hash = location.hash.replace("#", "");
    var inicial = 0;
    if (hash) {
      var dest = doc.getElementById(hash);
      Array.prototype.forEach.call(tabs, function (t, i) {
        var p = doc.getElementById(t.getAttribute("aria-controls"));
        if (hash === t.getAttribute("data-hash") || (p && dest && p.contains(dest))) inicial = i;
      });
    }
    elegir(inicial, false);
    window.addEventListener("resize", moverPill);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(moverPill);
  }

  /* ── Brillo que sigue al puntero ─────────────────────────── */
  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    page.addEventListener("pointermove", function (e) {
      var c = e.target.closest ? e.target.closest(".pl-card") : null;
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ── Entradas ────────────────────────────────────────────── */
  var revs = page.querySelectorAll("[data-pl-rev], .pl-path");
  if (reduce || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revs, function (r) { r.classList.add("vis"); });
    return;
  }
  var io = new IntersectionObserver(function (ent) {
    ent.forEach(function (x) {
      if (!x.isIntersecting) return;
      x.target.classList.add("vis");
      io.unobserve(x.target);
    });
  }, { threshold: 0, rootMargin: "0px 0px -2% 0px" });
  Array.prototype.forEach.call(revs, function (r) { io.observe(r); });
})();
