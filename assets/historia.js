/* Pittahaya · Sobre nosotros */
(function () {
  var sn = document.querySelector(".sn");
  if (!sn) return;
  [].slice.call(sn.querySelectorAll(".phead-mask")).forEach(function (m) {
    requestAnimationFrame(function () { m.classList.add("vis"); });
  });
  var els = [].slice.call(sn.querySelectorAll("[data-rev]"));
  if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("vis"); }); return; }
  var io = new IntersectionObserver(function (ent) {
    ent.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vis"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  els.forEach(function (e) { io.observe(e); });
})();
