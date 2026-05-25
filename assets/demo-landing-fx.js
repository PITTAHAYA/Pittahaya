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

    let w, h, particles = [], mx = -9999, my = -9999;
    const COUNT = 64;
    const LINK = 140;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .35,
        vy: (Math.random() - .5) * .35,
        r: Math.random() * 1.6 + .4
      });
    }

    canvas.addEventListener("mousemove", e => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    canvas.addEventListener("mouseleave", () => { mx = -9999; my = -9999; });

    const tick = () => {
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
      requestAnimationFrame(tick);
    };
    tick();
  };

  /* === 2. Letter-by-letter headline reveal ===================== */
  const initLetterReveal = () => {
    $$("[data-fx-letters]").forEach(el => {
      const text = el.textContent.trim();
      el.textContent = "";
      el.setAttribute("aria-label", text);
      const words = text.split(" ");
      words.forEach((word, wi) => {
        const wrap = document.createElement("span");
        wrap.className = "fx-word";
        wrap.setAttribute("aria-hidden", "true");
        [...word].forEach((ch, ci) => {
          const span = document.createElement("span");
          span.className = "fx-char";
          span.textContent = ch;
          if (!reduce) {
            span.style.animationDelay = `${(wi * 80 + ci * 28)}ms`;
          }
          wrap.appendChild(span);
        });
        el.appendChild(wrap);
        if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
      // Mark ready so the CSS visibility:hidden guard lifts and the
      // characters can fade in cleanly. Prevents the first-paint flash
      // where the original text would briefly appear and then blank.
      el.classList.add("fx-ready");
    });
  };

  /* === 3. Counters that count up on scroll into view =========== */
  const initCounters = () => {
    const els = $$("[data-fx-count]");
    if (!els.length) return;
    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

    const animate = (el) => {
      const end = parseFloat(el.getAttribute("data-fx-count")) || 0;
      const dur = parseInt(el.getAttribute("data-fx-duration") || "1400", 10);
      const decimals = (el.getAttribute("data-fx-count").split(".")[1] || "").length;
      const suffix = el.getAttribute("data-fx-suffix") || "";
      const prefix = el.getAttribute("data-fx-prefix") || "";
      if (reduce) {
        el.textContent = `${prefix}${end.toFixed(decimals)}${suffix}`;
        return;
      }
      const start = performance.now();
      const step = (now) => {
        const t  = Math.min(1, (now - start) / dur);
        const e  = easeOutQuart(t);
        const v  = end * e;
        el.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          animate(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: .35 });
    els.forEach(el => io.observe(el));
  };

  /* === 4. Reveal-on-scroll for [data-reveal] =================== */
  const initReveal = () => {
    const els = $$("[data-reveal]");
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: .08, rootMargin: "0px 0px -60px 0px" });
    els.forEach(el => io.observe(el));
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

  /* === 6. SVG funnel path draws as user scrolls =============== */
  const initFunnel = () => {
    const path = $("[data-fx-funnel-path]");
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    if (reduce) { path.style.strokeDashoffset = 0; return; }

    const container = path.closest("[data-fx-funnel]");
    if (!container) return;
    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const start = window.innerHeight * .8;
      const end   = -rect.height * .2;
      const prog  = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      path.style.strokeDashoffset = String(len * (1 - prog));
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  /* === 7. Funnel stations glow sequentially =================== */
  const initStations = () => {
    const stations = $$("[data-fx-station]");
    if (!stations.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("is-lit");
          io.unobserve(en.target);
        }
      });
    }, { threshold: .55 });
    stations.forEach(el => io.observe(el));
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

  /* === 9. Live ticker — rotates messages ====================== */
  const initTicker = () => {
    const ticker = $("[data-fx-ticker]");
    if (!ticker) return;
    const items = $$("[data-fx-ticker-item]", ticker);
    if (items.length < 2) return;
    let i = 0;
    items[0].classList.add("is-active");
    setInterval(() => {
      items[i].classList.remove("is-active");
      i = (i + 1) % items.length;
      items[i].classList.add("is-active");
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

  /* === 12. Animated chart bars (draw on scroll-into-view) ===== */
  const initChart = () => {
    const charts = $$("[data-fx-chart]");
    if (!charts.length) return;
    const animate = (chart) => {
      $$("[data-bar]", chart).forEach(bar => {
        const target = parseFloat(bar.getAttribute("data-bar")) || 0;
        if (reduce) { bar.style.setProperty("--bar", target + "%"); return; }
        let v = 0;
        const start = performance.now();
        const dur = 1200;
        const step = (now) => {
          const t = Math.min(1, (now - start) / dur);
          v = target * (1 - Math.pow(1 - t, 3));
          bar.style.setProperty("--bar", v.toFixed(1) + "%");
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
    }, { threshold: .3 });
    charts.forEach(c => io.observe(c));
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

  /* === 15. Timeline path draws as user scrolls ================ */
  const initTimeline = () => {
    const path = $("[data-fx-timeline-path]");
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    if (reduce) { path.style.strokeDashoffset = 0; return; }
    const container = path.closest("[data-fx-timeline]");
    if (!container) return;
    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const start = window.innerHeight;
      const end   = -rect.height;
      const prog  = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      path.style.strokeDashoffset = String(len * (1 - prog));
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
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
