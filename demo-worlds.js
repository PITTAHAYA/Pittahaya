/* ──────────────────────────────────────────────────────────────
   Pittahaya · demo-worlds.js — structural grammars for demos
   Three tiny engines, zero deps, CSP-safe:
   1. Progress rail  [data-rail-fill] — fills with scroll progress
   2. Dialogue flow  [data-flow] / [data-flow-go="id"] — guided steps
   3. Sticky bar     [data-stickybar] — appears after [data-stickybar-after]
   ────────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  /* 1 ─ progress rail (gallery walk) */
  const fill = document.querySelector("[data-rail-fill]");
  if (fill) {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      fill.style.height = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* 2 ─ dialogue flow (guided steps) */
  const flow = document.querySelector("[data-flow]");
  if (flow) {
    const steps = flow.querySelectorAll("[data-flow-step]");
    const show = (id) => {
      steps.forEach(s => {
        const on = s.dataset.flowStep === id;
        s.classList.toggle("flow-on", on);
        s.toggleAttribute("hidden", !on);
      });
    };
    flow.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-flow-go]");
      if (!btn) return;
      e.preventDefault();
      show(btn.dataset.flowGo);
    });
    const first = steps[0];
    if (first) show(first.dataset.flowStep);
  }

  /* 3 ─ sticky commerce bar */
  const bar = document.querySelector("[data-stickybar]");
  const sentinel = document.querySelector("[data-stickybar-after]");
  if (bar && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      bar.classList.toggle("bar-on", !en.isIntersecting && en.boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(sentinel);
  }

  /* 4 ─ wax-seal dossier: click the seal → break it → open the envelope.
         <body> gets .dossier-open; CSS choreographs flap + fade.
         While sealed, page scroll is locked (the ritual comes first). */
  const seal = document.querySelector("[data-seal]");
  if (seal) {
    document.body.classList.add("dossier-locked");
    seal.addEventListener("click", () => {
      document.body.classList.remove("dossier-locked");
      document.body.classList.add("dossier-open");
    }, { once: true });
  }
})();
