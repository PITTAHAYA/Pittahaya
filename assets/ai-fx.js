/* ─────────────────────────────────────────────────────────────
   PITTAHAYA — AI page FX
   Makes the AI automation page feel ALIVE:
   · live activity feed (AI actions streaming in)
   · self-typing chatbot conversation (loops)
   · count-up stats
   · reveal-on-scroll
   No external libs. CSP-safe (script-src 'self'). Honors reduced-motion.
───────────────────────────────────────────────────────────── */
(() => {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===== 1. Reveal on scroll ================================= */
  const initReveal = () => {
    const els = $$("[data-air]");
    if (!els.length) return;
    const vh = window.innerHeight;
    const rest = [];
    els.forEach(el => {
      if (el.getBoundingClientRect().top < vh + 60) el.classList.add("in");
      else rest.push(el);
    });
    if (!rest.length) return;
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .08, rootMargin: "0px 0px -50px 0px" });
    rest.forEach(el => io.observe(el));
  };

  /* ===== 2. Live activity feed =============================== */
  /* Streams "AI actions" into a console, newest on top.        */
  const initFeed = () => {
    const feed = $("[data-ai-feed]");
    if (!feed) return;
    const items = JSON.parse(feed.getAttribute("data-ai-feed") || "[]");
    if (!items.length) return;

    const names = ["María", "Carlos", "Andrea", "Diego", "Valentina", "Mateo", "Camila", "Sofía", "Lucas", "Daniela"];
    let i = 0;

    const rowEl = (item) => {
      const row = document.createElement("div");
      row.className = "aiFeedRow";
      const name = names[Math.floor(Math.random() * names.length)];
      const txt = item.t.replace("{name}", name);
      row.innerHTML =
        `<span class="aiFeedIco">${item.i}</span>` +
        `<span class="aiFeedTxt">${txt}</span>` +
        `<span class="aiFeedTime">ahora</span>`;
      return row;
    };

    // seed a few so it isn't empty on first paint
    for (let s = 0; s < 4; s++) {
      const r = rowEl(items[s % items.length]);
      r.style.opacity = "1";
      feed.appendChild(r);
    }
    if (reduce) return;

    setInterval(() => {
      i = (i + 1) % items.length;
      const r = rowEl(items[i]);
      feed.insertBefore(r, feed.firstChild);
      requestAnimationFrame(() => r.classList.add("show"));
      // age the "ahora" labels
      $$(".aiFeedTime", feed).forEach((t, idx) => { if (idx > 0) t.textContent = `${idx}m`; });
      // cap rows
      while (feed.children.length > 6) feed.removeChild(feed.lastChild);
    }, 2400);
  };

  /* ===== 3. Self-typing chatbot conversation ================ */
  const initChatDemo = () => {
    const chat = $("[data-ai-chat]");
    if (!chat) return;
    const script = JSON.parse(chat.getAttribute("data-ai-chat") || "[]");
    if (!script.length) return;
    const body = $(".aiChat__body", chat);
    if (!body) return;

    if (reduce) {
      // Render statically
      script.forEach(m => {
        const b = document.createElement("div");
        b.className = `aiChat__msg aiChat__msg--${m.from}`;
        b.textContent = m.text;
        body.appendChild(b);
      });
      return;
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const typingBubble = () => {
      const t = document.createElement("div");
      t.className = "aiChat__msg aiChat__msg--bot aiChat__typing";
      t.innerHTML = "<span></span><span></span><span></span>";
      return t;
    };

    const run = async () => {
      body.innerHTML = "";
      for (const m of script) {
        if (m.from === "user") {
          await sleep(700);
          const b = document.createElement("div");
          b.className = "aiChat__msg aiChat__msg--user";
          body.appendChild(b);
          // type the user message
          for (let c = 0; c < m.text.length; c++) {
            b.textContent = m.text.slice(0, c + 1);
            body.scrollTop = body.scrollHeight;
            await sleep(28);
          }
        } else {
          await sleep(450);
          const typing = typingBubble();
          body.appendChild(typing);
          body.scrollTop = body.scrollHeight;
          await sleep(900 + Math.min(m.text.length * 12, 1200));
          typing.remove();
          const b = document.createElement("div");
          b.className = "aiChat__msg aiChat__msg--bot";
          body.appendChild(b);
          for (let c = 0; c < m.text.length; c++) {
            b.textContent = m.text.slice(0, c + 1);
            body.scrollTop = body.scrollHeight;
            await sleep(16);
          }
        }
        body.scrollTop = body.scrollHeight;
      }
      await sleep(3200);
      run(); // loop
    };

    // Start only when scrolled into view (saves cycles)
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { run(); io.disconnect(); }
      });
    }, { threshold: .3 });
    io.observe(chat);
  };

  /* ===== 4. Count-up stats =================================== */
  const initCounters = () => {
    const els = $$("[data-ai-count]");
    if (!els.length) return;
    const ease = t => 1 - Math.pow(1 - t, 4);
    const animate = (el) => {
      const end = parseFloat(el.getAttribute("data-ai-count")) || 0;
      const dec = (el.getAttribute("data-ai-count").split(".")[1] || "").length;
      const suf = el.getAttribute("data-ai-suffix") || "";
      const pre = el.getAttribute("data-ai-prefix") || "";
      if (reduce) { el.textContent = `${pre}${end.toFixed(dec)}${suf}`; return; }
      const t0 = performance.now(), dur = 1500;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        el.textContent = `${pre}${(end * ease(t)).toFixed(dec)}${suf}`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
    }, { threshold: .4 });
    els.forEach(el => io.observe(el));
  };

  /* ===== 5. Footer year ===================================== */
  const initYear = () => $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });

  const boot = () => { initReveal(); initFeed(); initChatDemo(); initCounters(); initYear(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
