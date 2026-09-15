/* ORBITAL · la secuencia de seis números fijada al scroll (CSP-safe) */
(function () {
  "use strict";

  var seq = document.querySelector("[data-ob-seq]");
  if (!seq) return;

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var frames = [].slice.call(seq.querySelectorAll(".ob-seq__frame"));
  var cap = seq.querySelector(".ob-seq__cap");
  var sN = seq.querySelector("[data-ob-n]");
  var sV = seq.querySelector("[data-ob-v]");
  var sU = seq.querySelector("[data-ob-u]");
  var sK = seq.querySelector("[data-ob-k]");
  var bar = seq.querySelector("[data-ob-bar]");
  var cur = -1, pend = 0;
  seq.style.setProperty("--n", frames.length);

  var paint = function () {
    pend = 0;
    var travel = Math.max(1, seq.offsetHeight - innerHeight);
    var p = clamp(-seq.getBoundingClientRect().top / travel, 0, 0.9999);
    if (bar) bar.style.transform = "scaleY(" + p.toFixed(4) + ")";
    var i = Math.floor(p * frames.length);
    if (i === cur) return;
    cur = i;
    frames.forEach(function (f, n) {
      f.classList.toggle("is-on", n === i);
      f.classList.toggle("is-past", n < i);
    });
    var f = frames[i];
    cap.classList.remove("is-in");
    void cap.offsetWidth;
    sN.textContent = String(i + 1).padStart(2, "0") + " / " + String(frames.length).padStart(2, "0");
    sV.textContent = f.getAttribute("data-v");
    sU.textContent = f.getAttribute("data-u");
    sK.textContent = f.getAttribute("data-k");
    cap.classList.add("is-in");
  };
  var ask = function () { if (!pend) pend = requestAnimationFrame(paint); };
  addEventListener("scroll", ask, { passive: true });
  addEventListener("resize", ask, { passive: true });
  paint();
})();
