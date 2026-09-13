/* ──────────────────────────────────────────────────────────────
   VELOCE — hyper-GT drop · interactions (CSP-safe, self-hosted)
   • hero video autoplay guard
   • scroll progress rail
   • sticky reserve bar (appears past the hero)
   • signature-light configurator (recolors --sig across the page)
   • animated spec counters
   ────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  /* Quien pide menos movimiento no debería recibir un vídeo que gira
     con el scroll ni cifras que trepan solas. El arrastre se queda:
     ese lo inicia la persona. */
  var quieto = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* premium framing — inject Bugatti-style corner brackets into [data-framed] media */
  Array.prototype.forEach.call(document.querySelectorAll("[data-framed]"), function (el) {
    ["tl", "tr", "bl", "br"].forEach(function (c) {
      var s = document.createElement("span"); s.className = "cnr " + c; s.setAttribute("aria-hidden", "true"); el.appendChild(s);
    });
  });

  /* fire cb once the element is within ~2 screens — used to defer heavy video loads */
  var whenNear = function (el, cb) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); cb(); }
    }, { rootMargin: "200% 0px" });
    io.observe(el);
  };

  /* hero video — force play on browsers that stall muted autoplay */
  var v = document.querySelector("[data-hero-video]");
  if (v) {
    v.muted = true; v.defaultMuted = true;            // some engines need the property, not just the attr
    var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    tryPlay();
    v.addEventListener("canplay", tryPlay, { once: true });
    v.addEventListener("loadeddata", tryPlay, { once: true });
    // last resort: kick playback on the visitor's first interaction
    var kick = function () { tryPlay(); ["pointerdown", "touchstart", "scroll", "keydown"].forEach(function (e) { removeEventListener(e, kick); }); };
    ["pointerdown", "touchstart", "scroll", "keydown"].forEach(function (e) { addEventListener(e, kick, { once: true, passive: true }); });
  }

  /* scroll progress rail */
  var bar = document.querySelector("[data-progress]");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* sticky reserve bar — reveal once the hero has scrolled past */
  var sticky = document.querySelector("[data-reserve-bar]");
  var after = document.querySelector("[data-reserve-after]");
  if (sticky && after && "IntersectionObserver" in window) {
    /* mientras está escondida bajo el borde, su botón seguía recibiendo
       el tabulador: invisible pero enfocable */
    var setSticky = function (on) {
      sticky.classList.toggle("on", on);
      sticky.setAttribute("aria-hidden", on ? "false" : "true");
      sticky.inert = !on;
    };
    setSticky(false);
    /* se muestra pasado el héroe, pero se retira en la propia sección de
       reserva: ahí repetía el botón y tapaba la tira de chasis */
    var pastHero = false, inReserve = false;
    var reserve = document.getElementById("reservar");
    var sync = function () { setSticky(pastHero && !inReserve); };
    new IntersectionObserver(function (e) {
      pastHero = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;
      sync();
    }, { threshold: 0 }).observe(after);
    if (reserve) new IntersectionObserver(function (e) {
      inReserve = e[0].isIntersecting;
      sync();
    }, { threshold: 0, rootMargin: "0px 0px -35% 0px" }).observe(reserve);
  }

  /* signature configurator — swatches repaint --sig / --sig2 live */
  var cfg = document.querySelector("[data-config]");
  if (cfg) {
    var swatches = cfg.querySelectorAll("[data-sig]");
    var nameEl = cfg.querySelector("[data-sig-name]");
    var cimg = cfg.querySelector("[data-config-img]");
    swatches.forEach(function (s) {
      s.addEventListener("click", function () {
        swatches.forEach(function (x) {
          x.classList.remove("on");
          /* la firma elegida se veía sólo por el color: quien usa lector
             de pantalla no tenía forma de saber cuál está puesta */
          x.setAttribute("aria-pressed", "false");
        });
        s.classList.add("on");
        s.setAttribute("aria-pressed", "true");
        document.documentElement.style.setProperty("--sig", s.getAttribute("data-sig"));
        document.documentElement.style.setProperty("--sig2", s.getAttribute("data-sig2") || s.getAttribute("data-sig"));
        if (nameEl) nameEl.textContent = s.getAttribute("data-name") || "";
        /* swap the car so it actually wears the chosen signature — crossfade */
        var src = s.getAttribute("data-img");
        if (cimg && src && (cimg.getAttribute("src") || "") !== src) {
          var pre = new Image();
          pre.onload = function () { cimg.src = src; cimg.style.opacity = "1"; };
          pre.onerror = function () { cimg.style.opacity = "1"; };
          cimg.style.opacity = "0";
          pre.src = src;
        }
      });
    });
  }

  /* silueta turntable — scrub the orbit clip by dragging (and by scroll until grabbed) */
  var tt = document.querySelector("[data-turntable]");
  if (tt) {
    var tv = tt.querySelector("[data-turntable-video]");
    var dur = 5, target = 0, cur = 0, raf = null, grabbed = false, userTook = false;

    var clamp = function (t) { return Math.max(0, Math.min(dur - 0.06, t)); };
    /* direct set — used by drag for instant 1:1 response */
    var apply = function (t) { target = cur = clamp(t); try { tv.currentTime = cur; } catch (e) {} };
    /* smoothed set — used by the scroll-linked idle rotation */
    var render = function () {
      cur += (target - cur) * 0.2;
      if (Math.abs(target - cur) < 0.002) cur = target;
      try { tv.currentTime = cur; } catch (e) {}
      raf = (Math.abs(target - cur) > 0.002) ? requestAnimationFrame(render) : null;
    };
    var seekTo = function (t) {
      target = clamp(t);
      if (!raf) raf = requestAnimationFrame(render);
    };

    var prime = function () {
      dur = tv.duration || 5;
      var p = tv.play();
      if (p && p.then) p.then(function () { tv.pause(); tv.currentTime = 0; }).catch(function () {});
    };
    whenNear(tt, prime);   /* defer the 3.6MB clip until the section approaches */

    /* drag to rotate */
    var startX = 0, startT = 0;
    tt.addEventListener("pointerdown", function (e) {
      grabbed = true; userTook = true; startX = e.clientX; startT = target;
      tt.classList.add("grabbing", "touched");
      if (tt.setPointerCapture) { try { tt.setPointerCapture(e.pointerId); } catch (e2) {} }
    });
    tt.addEventListener("pointermove", function (e) {
      if (!grabbed) return;
      var dx = e.clientX - startX;
      apply(startT + (dx / (tt.clientWidth || 1)) * dur * 1.15);   /* direct, tactile */
    });
    var release = function () { grabbed = false; tt.classList.remove("grabbing"); };
    tt.addEventListener("pointerup", release);
    tt.addEventListener("pointercancel", release);
    tt.addEventListener("pointerleave", release);

    /* before the visitor grabs it, gently rotate with scroll position (no zoom) */
    var onScrollTT = function () {
      if (userTook || grabbed) return;
      var r = tt.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var p = Math.max(0, Math.min(1, 1 - (r.top + r.height / 2) / innerHeight));
      seekTo(p * dur);
    };
    if (!quieto) {
      addEventListener("scroll", onScrollTT, { passive: true, capture: true });
      onScrollTT();
    }
  }

  /* expand — the car photo opens from a contained card to full-bleed as you scroll */
  var ex = document.querySelector("[data-expand]");
  if (ex) {
    var em = ex.querySelector("[data-expand-media]");
    var onEx = function () {
      var total = ex.offsetHeight - innerHeight;
      var p = total > 0 ? Math.max(0, Math.min(1, -ex.getBoundingClientRect().top / total)) : 0;
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   /* easeInOut */
      /* en el teléfono, al 70% el auto quedaba diminuto entre dos franjas negras */
      var base = innerWidth <= 760 ? 88 : 70;
      em.style.setProperty("--ew", (base + e * (100 - base)) + "vw");
      em.style.setProperty("--er", (18 * (1 - e)) + "px");
    };
    if (quieto) {
      em.style.setProperty("--ew", "100vw");
      em.style.setProperty("--er", "0px");
    } else {
      addEventListener("scroll", onEx, { passive: true, capture: true });
      onEx();
    }
  }

  /* spec counters — count up when scrolled into view */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var fmt = function (n, dec) {
      var parts = n.toFixed(dec).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");   /* 1340 → 1,340 */
      return parts.join(".");
    };
    var run = function (el) {
      var to = parseFloat(el.getAttribute("data-count"));
      var dec = (el.getAttribute("data-dec") | 0);
      if (quieto) { el.textContent = fmt(to, dec); return; }
      var t0 = 0, dur = 1400;
      var step = function (t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e, dec);
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = fmt(to, dec);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: .5 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* reserva de chasis — 50 números, 12 ya con dueño; el elegido viaja
     a la tarjeta de resumen, al botón y a la barra fija */
  var resv = document.querySelector("[data-resv]");
  if (resv) {
    var en = /^en\b/i.test(document.documentElement.lang || "");
    var sold = [1, 2, 3, 5, 7, 8, 11, 17, 23, 31, 42, 50];
    var grid = resv.querySelector("[data-chassis]");
    var noEl = resv.querySelector("[data-resv-no]");
    var etaEl = resv.querySelector("[data-resv-eta]");
    var sigEl = resv.querySelector("[data-resv-sig]");
    var cta = resv.querySelector("[data-resv-cta]");
    var barNo = document.querySelector("[data-reserve-bar] .no");
    var barCta = document.querySelector("[data-reserve-bar] .pill");
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var eta = function (n) {
      var q = n <= 20 ? 1 : n <= 35 ? 2 : 3;
      return (en ? "Q" : "T") + q + " 2027";
    };
    var buttons = [];
    var pick = function (n, btn) {
      buttons.forEach(function (b) { if (!b.disabled) b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      if (noEl) noEl.textContent = pad(n);
      if (etaEl) etaEl.textContent = eta(n);
      if (cta) cta.textContent = (en ? "Reserve No. " : "Reservar el Nº ") + pad(n) + " →";
      if (barNo) barNo.textContent = (en ? "No. " : "Nº ") + pad(n) + "/50";
      if (barCta) barCta.textContent = (en ? "Reserve No. " : "Reservar el Nº ") + pad(n) + " →";
    };
    for (var n = 1; n <= 50; n++) {
      (function (num) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ch";
        b.textContent = pad(num);
        if (sold.indexOf(num) > -1) {
          b.disabled = true;
          b.setAttribute("aria-label", (en ? "Chassis " : "Chasis ") + pad(num) + (en ? ", reserved" : ", reservado"));
        } else {
          b.setAttribute("aria-label", (en ? "Chassis " : "Chasis ") + pad(num));
          b.setAttribute("aria-pressed", "false");
          b.addEventListener("click", function () { pick(num, b); });
        }
        buttons.push(b);
        grid.appendChild(b);
      })(n);
    }
    pick(12, buttons[11]);
    var syncSig = function () {
      var s = document.querySelector("[data-sig-name]");
      if (s && sigEl) sigEl.textContent = s.textContent;
    };
    document.querySelectorAll("[data-sig]").forEach(function (s) { s.addEventListener("click", syncSig); });
    syncSig();
  }
})();
