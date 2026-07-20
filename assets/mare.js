/* AURELIA · Villa Mare Alta — scroll-controlled threshold */
(function () {
  "use strict";

  var isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeInOut = function (p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; };

  /* the walk always begins at the door — never mid-house on a reload */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* handlers that must wait for layout (vh units, sticky) to settle */
  var inits = [];
  var settle = function (fn) { inits.push(fn); fn(); };
  var reSettle = function () { for (var i = 0; i < inits.length; i++) inits[i](); };
  addEventListener("load", function () { requestAnimationFrame(reSettle); });
  requestAnimationFrame(reSettle);

  /* year */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ═══ THE THRESHOLD ═══ */
  var th = document.querySelector("[data-th]");
  if (th) {
    var clips = Array.prototype.slice.call(th.querySelectorAll("[data-clip]"));
    var vids = clips.map(function (c) { return c.querySelector("video"); });
    var caps = Array.prototype.slice.call(th.querySelectorAll("[data-cap]"));
    var bars = Array.prototype.slice.call(th.querySelectorAll("[data-bar]"));
    var brand = th.querySelector("[data-brand]");
    var hint = th.querySelector("[data-hint]");
    var thrail = th.querySelector("[data-thrail]");
    /* real durations arrive with metadata; these are the known encodes */
    var durs = [8.04, 8.04, 12.04];
    var crossfade = 0.52;
    var starts = [], TOTAL = 0;
    var recalc = function () {
      starts = [0];
      for (var i = 1; i < durs.length; i++) {
        starts[i] = starts[i - 1] + Math.max(0.25, durs[i - 1] - crossfade);
      }
      TOTAL = starts[starts.length - 1] + durs[durs.length - 1];
    };
    recalc();

    var renderId = 0;

    /* The clips are only decoded as the visitor approaches them. */
    var primeClip = function (i) {
      var v = vids[i];
      if (!v || v.__primed) return;
      v.__primed = true;
      v.preload = "auto";
      if (v.readyState === 0) {
        try { v.load(); } catch (e) {}
      }
    };

    var renderWalk = function () {
      renderId = 0;
      var travel = Math.max(1, th.offsetHeight - innerHeight);
      var progress = clamp01(-th.getBoundingClientRect().top / travel);
      var t = progress * TOTAL;

      /* Adjacent clips overlap on the same scroll timeline. This keeps the walk
         continuous while both boundary frames are decoded and visible. */
      clips.forEach(function (clip, index) {
        var duration = durs[index] || 0.1;
        var localTime = t - starts[index];
        var opacity = 0;
        var video = vids[index];
        var frameReady = index === 0 || (video && video.readyState >= 2);

        if (localTime >= 0 && localTime <= duration) {
          /* The outgoing scene remains opaque underneath. The incoming scene
             is revealed only after its first frame exists, so the page never
             exposes the dark stage between encodes. */
          opacity = frameReady ? 1 : 0;
          if (index > 0 && frameReady) opacity = clamp01(localTime / crossfade);

          primeClip(index);
          if (video) {
            video.pause();
            var seekTime = Math.max(0, Math.min(duration - 0.04, localTime));
            if (video.readyState > 0 && Math.abs(video.currentTime - seekTime) > 0.025) {
              try { video.currentTime = seekTime; } catch (e) {}
            }
          }
        }

        /* If the next encode is still decoding, hold this clip's final frame
           instead of flashing the stage background during a fast scroll. */
        if (index < clips.length - 1 && localTime > duration) {
          var nextVideo = vids[index + 1];
          if (!nextVideo || nextVideo.readyState < 2) opacity = 1;
        }

        if (t >= starts[index] - 1.4) primeClip(index);
        clip.style.opacity = opacity.toFixed(3);
        clip.style.zIndex = String(index + 1);
        clip.setAttribute("aria-hidden", opacity > 0.01 ? "false" : "true");
      });

      /* Cinema bars retract as the first steps are taken. */
      var open = easeInOut(clamp01(t / 3.2));
      var bar0 = innerWidth <= 600 ? 4 : 7;
      bars.forEach(function (b) { b.style.setProperty("--bar", (bar0 * (1 - open)) + "vh"); });

      /* Brand holds at the door, then quietly lifts away. */
      if (brand) {
        var bo = 1 - clamp01((t - 2.2) / 2.2);
        brand.style.opacity = bo.toFixed(3);
        brand.style.transform = "translateY(" + (-14 * (1 - bo)).toFixed(1) + "px)";
      }

      /* captions live at moments in the walk */
      for (var q = 0; q < caps.length; q++) {
        var at = parseFloat(caps[q].getAttribute("data-at")) || 0;
        var span = parseFloat(caps[q].getAttribute("data-span")) || 3.5;
        var d = Math.abs(t - at);
        var o = clamp01(1 - (d - span * 0.34) / (span * 0.5));
        caps[q].style.opacity = o.toFixed(3);
        caps[q].style.transform = "translateY(" + (16 * (1 - o)).toFixed(1) + "px)";
      }

      if (hint) hint.style.opacity = (1 - clamp01(t / 2.4)).toFixed(3);
      if (thrail) thrail.style.width = (progress * 100).toFixed(2) + "%";
    };

    var requestRender = function () {
      if (!renderId) renderId = requestAnimationFrame(renderWalk);
    };

    vids.forEach(function (v, i) {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.removeAttribute("autoplay");
      v.pause();
      v.addEventListener("loadedmetadata", function () {
        if (v.duration && isFinite(v.duration)) {
          durs[i] = v.duration;
          recalc();
          requestRender();
        }
      });
      v.addEventListener("loadeddata", requestRender);
      v.addEventListener("seeked", requestRender);
    });

    vids.forEach(function (_video, index) { primeClip(index); });
    addEventListener("scroll", requestRender, { passive: true, capture: true });
    addEventListener("resize", requestRender, { passive: true });
    addEventListener("load", function () {
      requestRender();
    });
    settle(requestRender);
  }

  /* ═══ the page only exists once you're through the door ═══ */
  var site = document.querySelector("[data-site]");
  var bar = document.querySelector("[data-progress]");
  if (th && (site || bar)) {
    var onPast = function () {
      /* a zero-height threshold means layout hasn't settled — decide nothing yet,
         or the page would announce itself while the visitor is still at the door */
      if (th.offsetHeight <= 0 || innerHeight <= 0) return;
      var through = th.getBoundingClientRect().bottom <= innerHeight * 0.65;
      if (site) site.classList.toggle("on", through);
      if (bar) bar.classList.toggle("on", through);
    };
    addEventListener("scroll", onPast, { passive: true, capture: true });
    settle(onPast);
  }
  if (bar) {
    var onProg = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
    };
    addEventListener("scroll", onProg, { passive: true, capture: true });
    settle(onProg);
  }

  /* ═══ restrained depth in the editorial manifesto ═══ */
  var manifestoImage = document.querySelector("[data-manifesto-image]");
  if (manifestoImage && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var manifesto = manifestoImage.closest(".manifesto");
    var onManifesto = function () {
      var rect = manifesto.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      var progress = (innerHeight - rect.top) / (innerHeight + rect.height);
      var shift = (progress - 0.5) * -54;
      manifestoImage.style.setProperty("--manifesto-shift", shift.toFixed(1) + "px");
    };
    addEventListener("scroll", onManifesto, { passive: true });
    addEventListener("resize", onManifesto, { passive: true });
    settle(onManifesto);
  }

  /* the header quietly indicates the current chapter */
  var chapterLinks = Array.prototype.slice.call(document.querySelectorAll('.siteR a[href^="#"]'));
  if (chapterLinks.length && "IntersectionObserver" in window) {
    var chapterMap = {};
    chapterLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) chapterMap[id] = link;
    });
    var chapterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || !chapterMap[entry.target.id]) return;
        chapterLinks.forEach(function (link) { link.classList.remove("is-current"); });
        chapterMap[entry.target.id].classList.add("is-current");
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    Object.keys(chapterMap).forEach(function (id) {
      chapterObserver.observe(document.getElementById(id));
    });
  }

  /* ═══ reveal on scroll ═══ */
  var rs = document.querySelectorAll("[data-r]");
  if (rs.length && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(rs, function (r, i) {
      r.style.transitionDelay = ((i % 3) * 110) + "ms";
      rio.observe(r);
    });
  } else {
    Array.prototype.forEach.call(rs, function (r) { r.classList.add("in"); });
  }

  /* ═══ figures count up ═══ */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var fmt = function (n) {
      return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, isEnglish ? "," : ".");
    };
    var run = function (el) {
      var to = parseFloat(el.getAttribute("data-count"));
      var t0 = 0, dur = 1700;
      var step = function (ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var e = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(to * e);
        if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (c) { cio.observe(c); });
  }
})();
