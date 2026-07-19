/* ──────────────────────────────────────────────────────────────
   AURELIA — private estates · interactions (CSP-safe, self-hosted)
   • scroll progress rail
   • header condenses on scroll
   • reveal-on-scroll
   • a residence photo opens to full-bleed on scroll
   • count-up stats
   ────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  /* year */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* progress rail */
  var bar = document.querySelector("[data-progress]");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
    };
    addEventListener("scroll", onScroll, { passive: true, capture: true });
    onScroll();
  }

  /* header condenses once the hero is scrolled past a touch */
  var site = document.querySelector("[data-site]");
  var after = document.querySelector("[data-site-after]");
  if (site && after && "IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      site.classList.toggle("on", !(e[0].isIntersecting && e[0].intersectionRatio > 0.06));
    }, { threshold: [0, 0.06, 0.2] }).observe(after);
  }

  /* reveal on scroll */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (r, i) {
      /* subtle stagger for siblings */
      var d = (i % 4) * 90;
      r.style.transitionDelay = d + "ms";
      rio.observe(r);
    });
  } else {
    reveals.forEach(function (r) { r.classList.add("in"); });
  }

  /* THE JOURNEY — one continuous walk into the villa, scrubbed by scroll.
     Four video legs, each ending on the exact frame the next begins:
     puerta → salón → cocina → suite → piscina. Scroll = walking. */
  var jy = document.querySelector("[data-journey]");
  if (jy) {
    var jm = jy.querySelector("[data-j-media]");
    var stages = Array.prototype.slice.call(jy.querySelectorAll("[data-j-stage]"));
    var vids = stages.map(function (s) { return s.querySelector("video"); });
    var durs = stages.map(function (s) { return parseFloat(s.getAttribute("data-dur")) || 6; });
    var caps = Array.prototype.slice.call(jy.querySelectorAll("[data-j-cap]"));
    var dots = jy.querySelectorAll("[data-j-dots] i");
    var hint = jy.querySelector("[data-j-hint]");
    var clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };

    /* cumulative timeline across the legs (seconds of walk) */
    var cum = [0];
    for (var c = 0; c < durs.length; c++) cum.push(cum[c] + durs[c]);
    var TOTAL = cum[cum.length - 1];

    /* prime each leg when the journey approaches, so seeking is instant */
    var primed = false;
    var prime = function () {
      if (primed) return; primed = true;
      vids.forEach(function (v) {
        if (!v) return;
        v.preload = "auto";
        var p = v.play();
        if (p && p.then) p.then(function () { v.pause(); v.currentTime = 0; }).catch(function () {});
        v.addEventListener("loadedmetadata", function () {
          var k = vids.indexOf(v);
          if (v.duration && isFinite(v.duration)) durs[k] = v.duration;
          cum = [0];
          for (var c2 = 0; c2 < durs.length; c2++) cum.push(cum[c2] + durs[c2]);
          TOTAL = cum[cum.length - 1];
        });
      });
    };
    if ("IntersectionObserver" in window) {
      var pio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { pio.disconnect(); prime(); }
      }, { rootMargin: "150% 0px" });
      pio.observe(jy);
    } else prime();

    var onJy = function () {
      var total = jy.offsetHeight - innerHeight;
      if (total <= 0) return;
      var p = clamp01(-jy.getBoundingClientRect().top / total);
      var t = p * TOTAL;                                /* seconds into the walk */

      /* arrival: the frame opens from a card to full-bleed over the first steps */
      var a = clamp01(t / 2.2);
      var e = a < 0.5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2;
      var w0 = innerWidth <= 600 ? 88 : 72;
      var h0 = innerWidth <= 600 ? 62 : 76;
      jm.style.setProperty("--ew", (w0 + e * (100 - w0)) + "vw");
      jm.style.setProperty("--eh", (h0 + e * (100 - h0)) + "vh");
      jm.style.setProperty("--er", (4 * (1 - e)) + "px");

      /* which leg are we in? scrub it; neighbours stay parked at their edges */
      var k = 0;
      while (k < durs.length - 1 && t >= cum[k + 1]) k++;
      var lt = clamp01((t - cum[k]) / durs[k]) * (durs[k] - 0.05);
      for (var i = 0; i < stages.length; i++) {
        stages[i].style.opacity = (i === k) ? "1" : "0";
        var v = vids[i];
        if (!v || v.readyState < 1) continue;
        if (i === k) { try { v.currentTime = lt; } catch (err) {} }
        else if (i === k + 1) { try { if (v.currentTime !== 0) v.currentTime = 0; } catch (err) {} }
      }

      /* room captions surface as you arrive at each space, fade as you walk on */
      for (var q = 0; q < caps.length; q++) {
        var at = parseFloat(caps[q].getAttribute("data-at")) || 0;
        caps[q].style.opacity = clamp01(1 - Math.abs(t - at) / 1.9).toFixed(3);
      }

      /* progress dots: nearest room anchor reached */
      var idx = 0;
      for (var d2 = 0; d2 < caps.length; d2++) {
        if (t >= (parseFloat(caps[d2].getAttribute("data-at")) || 0) - 0.9) idx = d2;
      }
      for (var d3 = 0; d3 < dots.length; d3++) dots[d3].className = d3 === idx ? "on" : "";
      if (hint) hint.classList.toggle("off", t > 1.6);
    };
    addEventListener("scroll", onJy, { passive: true, capture: true });
    addEventListener("resize", onJy, { passive: true });
    onJy();
  }

  /* count-up stats */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var fmt = function (n, dec) {
      var parts = n.toFixed(dec).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    };
    var run = function (el) {
      var to = parseFloat(el.getAttribute("data-count"));
      var dec = (el.getAttribute("data-dec") | 0);
      var t0 = 0, dur = 1500;
      var step = function (t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e, dec);
        if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to, dec);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }
})();
