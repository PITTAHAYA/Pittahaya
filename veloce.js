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
    new IntersectionObserver(function (e) {
      sticky.classList.toggle("on", !e[0].isIntersecting && e[0].boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(after);
  }

  /* signature configurator — swatches repaint --sig / --sig2 live */
  var cfg = document.querySelector("[data-config]");
  if (cfg) {
    var swatches = cfg.querySelectorAll("[data-sig]");
    var nameEl = cfg.querySelector("[data-sig-name]");
    var cimg = cfg.querySelector("[data-config-img]");
    swatches.forEach(function (s) {
      s.addEventListener("click", function () {
        swatches.forEach(function (x) { x.classList.remove("on"); });
        s.classList.add("on");
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
    addEventListener("scroll", onScrollTT, { passive: true, capture: true });
    onScrollTT();
  }

  /* expand — the car photo opens from a contained card to full-bleed as you scroll */
  var ex = document.querySelector("[data-expand]");
  if (ex) {
    var em = ex.querySelector("[data-expand-media]");
    var onEx = function () {
      var total = ex.offsetHeight - innerHeight;
      var p = total > 0 ? Math.max(0, Math.min(1, -ex.getBoundingClientRect().top / total)) : 0;
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   /* easeInOut */
      em.style.setProperty("--ew", (70 + e * 30) + "vw");
      em.style.setProperty("--er", (18 * (1 - e)) + "px");
    };
    addEventListener("scroll", onEx, { passive: true, capture: true });
    onEx();
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
})();
