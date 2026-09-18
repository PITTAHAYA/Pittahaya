/* VELOCE · despiece con el scroll, línea de luz sobre el perfil y la firma escrita (CSP-safe) */
(function () {
  "use strict";

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ── despiece: el scroll arma y desarma el auto ────────── */
  var exp = document.querySelector("[data-vx-exp]");
  if (exp) {
    var vid = exp.querySelector("[data-vx-exp-video]");
    var still = exp.querySelector("[data-vx-exp-img]");
    var bar = exp.querySelector("[data-vx-exp-bar]");
    var specs = [].slice.call(exp.querySelectorAll("[data-at]"));
    var dur = 5, target = 0, cur = 0, raf = 0, ready = false;

    var seek = function () {
      raf = 0;
      cur += (target - cur) * 0.24;
      if (Math.abs(target - cur) < 0.004) cur = target;
      try { vid.currentTime = cur; } catch (e) {}
      if (cur !== target) raf = requestAnimationFrame(seek);
    };
    var paint = function () {
      var travel = Math.max(1, exp.offsetHeight - innerHeight);
      var p = clamp(-exp.getBoundingClientRect().top / travel, 0, 1);
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      specs.forEach(function (li) { li.classList.toggle("is-on", quieto || p >= parseFloat(li.getAttribute("data-at"))); });
      /* imagen fija: un acercamiento lento acompaña el scroll */
      if (still && !quieto) still.style.transform = "scale(" + (1.12 - p * 0.12).toFixed(4) + ")";
      if (!vid || !ready || quieto) return;
      target = clamp(p * 1.15, 0, 1) * (dur - 0.05);
      if (!raf) raf = requestAnimationFrame(seek);
    };

    var prime = function () {
      vid.preload = "auto";
      var go = function () {
        dur = vid.duration || 5;
        var pr = vid.play();
        var done = function () { vid.pause(); ready = true; paint(); };
        if (pr && pr.then) pr.then(done).catch(done); else done();
      };
      if (vid.readyState >= 1) go(); else vid.addEventListener("loadedmetadata", go, { once: true });
      vid.load();
    };
    if ("IntersectionObserver" in window) {
      /* la barra de reserva tapaba las cifras: se retira mientras el despiece ocupa la pantalla */
      new IntersectionObserver(function (es) {
        document.documentElement.classList.toggle("vx-in-exp", es[0].isIntersecting);
      }, { threshold: 0.35 }).observe(exp);
      if (vid) {
        var near = new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) { near.disconnect(); prime(); }
        }, { rootMargin: "150% 0px" });
        near.observe(exp);
      }
    } else if (vid) prime();

    addEventListener("scroll", paint, { passive: true });
    addEventListener("resize", paint, { passive: true });
    paint();
  }

  /* ── línea de luz: un barrido dorado recorre el perfil ── */
  var line = document.querySelector("[data-vx-line]");
  if (line && !quieto) {
    var lp = 0;
    var sweep = function () {
      lp = 0;
      var r = line.getBoundingClientRect();
      var p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      line.style.setProperty("--p", p.toFixed(4));
    };
    addEventListener("scroll", function () { if (!lp) lp = requestAnimationFrame(sweep); }, { passive: true });
    sweep();
  } else if (line) line.style.setProperty("--p", ".55");

  /* ── la firma elegida se escribe sobre el auto ─────────── */
  var big = document.querySelector("[data-sig-name-big]");
  if (big) {
    [].forEach.call(document.querySelectorAll("[data-sig]"), function (s) {
      s.addEventListener("click", function () {
        big.textContent = s.getAttribute("data-name") || "";
        big.classList.remove("is-swap");
        void big.offsetWidth;
        big.classList.add("is-swap");
      });
    });
  }
})();
