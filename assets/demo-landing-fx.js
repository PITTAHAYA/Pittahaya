/* ─────────────────────────────────────────────────────────────
   PITTAHAYA — Demo Landing FX
   Immersive motion system for the flagship Landing demo.
   No external libraries. CSP: script-src 'self'.
   All animations honor prefers-reduced-motion.
───────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const isMobile = window.matchMedia("(max-width: 680px)").matches;

  /* === 1. Constellation particle canvas (hero background) ====== */
  const initParticles = () => {
    const canvas = $("[data-fx-particles]");
    if (!canvas || reduce || isMobile) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, particles = [], mx = -9999, my = -9999, seeded = false;
    const LINK = 150;
    // Particle count scales with the hero area so the network always looks
    // evenly dense — never a sparse field on big screens nor a clustered
    // blob on small ones. Clamped so it stays performant.
    const densityFor = (ww, hh) => Math.max(48, Math.min(120, Math.round((ww * hh) / 13000)));

    const seed = () => {
      const count = densityFor(w, h);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,            // spread across the FULL width
          y: Math.random() * h,            // and the FULL height
          vx: (Math.random() - .5) * .35,
          vy: (Math.random() - .5) * .35,
          r: Math.random() * 1.6 + .4
        });
      }
      seeded = true;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      // Layout isn't ready yet (hero still collapsed / web fonts still
      // loading). Keep retrying on the next frame so we NEVER lock in a
      // zero/short box and seed the whole field into a tiny corner.
      if (rect.width < 2 || rect.height < 2) {
        requestAnimationFrame(resize);
        return;
      }
      const changed = Math.abs(rect.width - w) > 1 || Math.abs(rect.height - h) > 1;
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // (Re)seed across the real dimensions whenever the box size changes.
      // This is what fixes the corner-cluster: the first measurement may be
      // a short pre-font box, but once the hero reflows to full size we lay
      // the constellation out edge-to-edge again at the right density.
      if (!seeded || changed) seed();
    };

    canvas.addEventListener("mousemove", e => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    canvas.addEventListener("mouseleave", () => { mx = -9999; my = -9999; });

    const tick = () => {
      if (seeded && w > 0 && h > 0) {
        ctx.clearRect(0, 0, w, h);

        for (const p of particles) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;

          // mouse attraction
          const dx = mx - p.x, dy = my - p.y;
          const d  = Math.hypot(dx, dy);
          if (d < 180 && d > 0) {
            p.x += (dx / d) * .35;
            p.y += (dy / d) * .35;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 209, 102, .85)";
          ctx.fill();
        }

        // links
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d = Math.hypot(dx, dy);
            if (d < LINK) {
              const op = (1 - d / LINK) * .22;
              ctx.strokeStyle = `rgba(255, 209, 102, ${op})`;
              ctx.lineWidth = .6;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }
      requestAnimationFrame(tick);
    };

    // Measure now, then re-sync on every event that can change the box:
    // window resize, web-font swap (reflows the hero), and full load.
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("load", resize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(resize).catch(() => {});
    }
    // ResizeObserver is the bulletproof catch-all: any time the canvas
    // box actually changes size (font reflow, late content, zoom) we
    // re-sync the bitmap so the constellation always fills the hero.
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => resize());
      ro.observe(canvas);
    }
    tick();
  };

  /* === 2. Headline reveal — CSS-driven, preserves inline tags ====
     We just flip a class. The actual animation is pure CSS (see the
     fx-letters-guard block in each demo's inline <style>). Important:
     we DO NOT split into individual chars anymore — that destroyed
     <em> gradient styling on words like "producto", "caro", "antes". */
  const initLetterReveal = () => {
    $$("[data-fx-letters]").forEach(el => el.classList.add("fx-ready"));
  };

  /* === 3. Counters — pre-populated in HTML now, just sync the
     text in case any aren't already set. NO animation on cold load. */
  const initCounters = () => {
    $$("[data-fx-count]").forEach(el => {
      const val = el.getAttribute("data-fx-count");
      if (!val) return;
      const end = parseFloat(val) || 0;
      const decimals = (val.split(".")[1] || "").length;
      const suffix = el.getAttribute("data-fx-suffix") || "";
      const prefix = el.getAttribute("data-fx-prefix") || "";
      el.textContent = `${prefix}${end.toFixed(decimals)}${suffix}`;
    });
  };

  /* === 4. Reveal-on-scroll for [data-reveal] =================== */
  const initReveal = () => {
    const els = $$("[data-reveal]");
    if (!els.length) return;
    // Synchronously reveal anything already in (or near) the viewport,
    // so above-the-fold content is never briefly invisible while we
    // wait for IntersectionObserver to fire its first async callback.
    const vh = window.innerHeight;
    const remaining = [];
    els.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < vh + 60) el.classList.add("in");
      else remaining.push(el);
    });
    if (!remaining.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: .08, rootMargin: "0px 0px -60px 0px" });
    remaining.forEach(el => io.observe(el));
  };

  /* === 5. Mouse parallax for hero light ======================= */
  const initParallax = () => {
    if (reduce || isCoarse) return;
    const layers = $$("[data-fx-parallax]");
    if (!layers.length) return;
    let rx = 0, ry = 0, tx = 0, ty = 0;
    document.addEventListener("mousemove", e => {
      tx = (e.clientX / window.innerWidth  - .5) * 2;
      ty = (e.clientY / window.innerHeight - .5) * 2;
    });
    const tick = () => {
      rx += (tx - rx) * .06;
      ry += (ty - ry) * .06;
      layers.forEach(el => {
        const depth = parseFloat(el.getAttribute("data-fx-parallax")) || 18;
        el.style.transform = `translate3d(${rx * depth}px, ${ry * depth}px, 0)`;
      });
      requestAnimationFrame(tick);
    };
    tick();
  };

  /* === 6. SVG funnel path — fully visible from first paint ==== */
  const initFunnel = () => {
    const path = $("[data-fx-funnel-path]");
    if (!path) return;
    // No scroll-driven draw. Path is fully drawn from the start so
    // it's never "missing" on cold load.
    path.style.strokeDasharray = "none";
    path.style.strokeDashoffset = "0";
  };

  /* === 7. Funnel stations — all lit from first paint ========== */
  const initStations = () => {
    // No scroll-into-view dependence. All stations show at full
    // brightness immediately so they don't look "dim/broken" on cold load.
    $$("[data-fx-station]").forEach(el => el.classList.add("is-lit"));
  };

  /* === 8. Magnetic hover for primary CTAs ===================== */
  const initMagnetic = () => {
    if (reduce || isCoarse) return;
    $$("[data-fx-magnet]").forEach(el => {
      const strength = parseFloat(el.getAttribute("data-fx-magnet")) || 18;
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx / r.width * strength}px, ${dy / r.height * strength}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  };

  /* === 9. Live ticker — single element, content swap ==========
     Bulletproof: there is ONE visible element. We replace its text
     every 3.2s. Physically impossible for two messages to overlap.
     The old multi-span approach could leak when CSS hadn't applied
     yet, leaving all spans visible at once (the garbled glitch). */
  const initTicker = () => {
    const ticker = $("[data-fx-ticker]");
    if (!ticker) return;
    if (ticker.dataset.fxTickerInit === "1") return; // guard against double-init
    ticker.dataset.fxTickerInit = "1";
    const text = $("[data-fx-ticker-text]", ticker);
    if (!text) return;
    const msgs = (ticker.getAttribute("data-fx-msgs") || "").split("|").filter(Boolean);
    if (msgs.length < 2) return;
    let i = 0;
    setInterval(() => {
      // Fade out, swap, fade in — single element, no overlap possible.
      text.style.opacity = "0";
      text.style.transform = "translateY(-4px)";
      setTimeout(() => {
        i = (i + 1) % msgs.length;
        text.textContent = msgs[i];
        text.style.transform = "translateY(6px)";
        // Next frame: fade back in
        requestAnimationFrame(() => {
          text.style.opacity = "1";
          text.style.transform = "translateY(0)";
        });
      }, 300);
    }, 3200);
  };

  /* === 10. Compare slider (drag to reveal) ==================== */
  const initCompare = () => {
    const wrap = $("[data-fx-compare]");
    if (!wrap) return;
    const after  = $(".fx-compare__after", wrap);
    const handle = $(".fx-compare__handle", wrap);
    if (!after || !handle) return;

    let pct = 50;
    const set = (p) => {
      pct = Math.min(98, Math.max(2, p));
      after.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = `${pct}%`;
    };
    set(50);

    let dragging = false;
    // Only suppress text-selection while the handle is actually being dragged
    const start = (e) => { dragging = true; document.body.style.userSelect = "none"; e.preventDefault?.(); };
    const end   = () => { dragging = false; document.body.style.userSelect = ""; };
    const move  = (e) => {
      if (!dragging) return;
      const r = wrap.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      set((x / r.width) * 100);
    };
    handle.addEventListener("mousedown", start);
    handle.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("mouseup", end);
    document.addEventListener("touchend", end);
    document.addEventListener("mousemove", move);
    document.addEventListener("touchmove", move, { passive: true });
    // No more "click anywhere on the strip jumps the slider" —
    // it was making the whole image feel like a giant button and
    // blocked normal text selection on the labels.
  };

  /* === 11. Typewriter (terminal / code reveal) ================ */
  const initTypewriter = () => {
    $$("[data-fx-typewriter]").forEach(el => {
      const lines = (el.getAttribute("data-fx-typewriter") || "").split("|");
      const speed = parseInt(el.getAttribute("data-fx-speed") || "28", 10);
      const start = parseInt(el.getAttribute("data-fx-delay") || "300", 10);
      if (reduce) { el.textContent = lines.join("\n"); return; }
      el.textContent = "";
      el.classList.add("fx-typing");
      const caret = document.createElement("span");
      caret.className = "fx-caret";
      el.appendChild(caret);

      let li = 0, ci = 0;
      const tick = () => {
        if (li >= lines.length) { el.classList.add("fx-done"); return; }
        const cur = lines[li];
        if (ci < cur.length) {
          caret.insertAdjacentText("beforebegin", cur[ci]);
          ci++;
          setTimeout(tick, speed + Math.random() * 20);
        } else {
          if (li < lines.length - 1) {
            caret.insertAdjacentText("beforebegin", "\n");
          }
          li++; ci = 0;
          setTimeout(tick, 280);
        }
      };
      setTimeout(tick, start);
    });
  };

  /* === 12. Chart bars — set to final width immediately ======== */
  const initChart = () => {
    $$("[data-fx-chart] [data-bar]").forEach(bar => {
      const target = parseFloat(bar.getAttribute("data-bar")) || 0;
      bar.style.setProperty("--bar", target + "%");
    });
  };

  /* === 13. Marquee — infinite horizontal scroll =============== */
  const initMarquee = () => {
    $$("[data-fx-marquee]").forEach(el => {
      // duplicate children for seamless loop
      const inner = el.firstElementChild;
      if (!inner) return;
      const clone = inner.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      el.appendChild(clone);
    });
  };

  /* === 14. Palette switcher (Marca demo) ====================== */
  const initPalette = () => {
    const root = $("[data-fx-palette]");
    if (!root) return;
    const swatches = $$("[data-palette]", root);
    swatches.forEach(sw => {
      sw.addEventListener("click", () => {
        swatches.forEach(s => s.classList.remove("is-active"));
        sw.classList.add("is-active");
        const palette = (sw.getAttribute("data-palette") || "").split(",");
        if (palette.length >= 2) {
          document.documentElement.style.setProperty("--palette-a", palette[0]);
          document.documentElement.style.setProperty("--palette-b", palette[1]);
          if (palette[2]) document.documentElement.style.setProperty("--palette-c", palette[2]);
        }
      });
    });
  };

  /* === 15. Timeline path — fully drawn from first paint ======= */
  const initTimeline = () => {
    const path = $("[data-fx-timeline-path]");
    if (!path) return;
    path.style.strokeDasharray = "none";
    path.style.strokeDashoffset = "0";
  };

  /* === 16. Tilted image gallery (hover reveals caption) ======= */
  const initGallery = () => {
    if (reduce || isCoarse) return;
    $$("[data-fx-tilt]").forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -8;
        const ry = ((e.clientX - r.left) / r.width  - .5) *  8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  };

  /* === 17. Service / pricing scope slider ===================== */
  const initScope = () => {
    const slider = $("[data-fx-scope]");
    if (!slider) return;
    const input = $("input[type=range]", slider);
    const out   = $("[data-fx-scope-value]", slider);
    const label = $("[data-fx-scope-label]", slider);
    const stops = (slider.getAttribute("data-fx-scope-stops") || "Esencial,Negocio,Premium,Ecosistema").split(",");
    if (!input || !out) return;
    const update = () => {
      const v = parseInt(input.value, 10);
      out.textContent = v;
      if (label) label.textContent = stops[Math.min(stops.length - 1, Math.max(0, Math.floor((v / 100) * stops.length)))] || stops[stops.length - 1];
      input.style.setProperty("--scope-pct", v + "%");
    };
    input.addEventListener("input", update);
    update();
  };

  /* === 18. Footer year ======================================== */
  const initYear = () => {
    $$("[data-year]").forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  };

  /* === Boot =================================================== */
  const boot = () => {
    initReveal();
    initLetterReveal();
    initCounters();
    initParticles();
    initParallax();
    initFunnel();
    initStations();
    initMagnetic();
    initTicker();
    initCompare();
    initTypewriter();
    initChart();
    initMarquee();
    initPalette();
    initTimeline();
    initGallery();
    initScope();
    initYear();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
