/* ──────────────────────────────────────────────────────────────
   Pittahaya · demo-scene.js — pointer-driven 3D depth scenes
   ----------------------------------------------------------------
   Usage:  <div data-scene> … <div data-depth="30">layer</div> … </div>
   Layers drift opposite the pointer, scaled by their data-depth,
   with a soft spring. CSS idle animations keep running beneath
   (this only writes --sx/--sy/--srx/--sry custom properties, so
   keyframe transforms and pointer parallax compose cleanly).
   Degrades gracefully: touch devices & reduced-motion get CSS only.
   CSP-safe: no deps, no eval, self-hosted.
   ────────────────────────────────────────────────────────────── */
(() => {
  "use strict";
  if (!matchMedia("(pointer:fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll("[data-scene]").forEach((scene) => {
    const layers = scene.querySelectorAll("[data-depth]");
    if (!layers.length) return;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

    const tick = () => {
      raf = 0;
      cx += (tx - cx) * 0.075;
      cy += (ty - cy) * 0.075;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth || "20");
        l.style.setProperty("--sx", (-cx * d).toFixed(2) + "px");
        l.style.setProperty("--sy", (-cy * d).toFixed(2) + "px");
        l.style.setProperty("--srx", (cy * d * 0.12).toFixed(2) + "deg");
        l.style.setProperty("--sry", (-cx * d * 0.12).toFixed(2) + "deg");
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(tick);
      }
    };

    scene.addEventListener("pointermove", (e) => {
      const r = scene.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    scene.addEventListener("pointerleave", () => {
      tx = ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  });
})();
