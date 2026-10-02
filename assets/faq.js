/* Pittahaya · FAQ: buscar, filtrar y abrir una a la vez */
(function () {
  var raiz = document.querySelector(".fq");
  if (!raiz) return;
  var items = [].slice.call(raiz.querySelectorAll("[data-fq]"));
  var input = raiz.querySelector("[data-fq-buscar]");
  var chips = [].slice.call(raiz.querySelectorAll(".fq-chip"));
  var nada = raiz.querySelector(".fq-nada");

  [].slice.call(raiz.querySelectorAll(".phead-mask")).forEach(function (m) {
    requestAnimationFrame(function () { m.classList.add("vis"); });
  });

  /* solo una abierta a la vez */
  items.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  function norm(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  items.forEach(function (d) { d._txt = norm(d.textContent); d._q = d.querySelector(".fq-q"); d._q0 = d._q.textContent; });

  function filtra(q, abrir) {
    var t = norm(q).trim(), partes = t.split("|").filter(Boolean), vistos = 0, primero = null;
    items.forEach(function (d) {
      var ok = !t || partes.some(function (p) { return d._txt.indexOf(p) > -1; });
      d.classList.toggle("fuera", !ok);
      d._q.textContent = d._q0;
      if (ok) { vistos++; if (!primero) primero = d; }
      else d.open = false;
    });
    if (nada) nada.hidden = vistos > 0;
    if (abrir && primero && vistos <= 2) primero.open = true;
  }

  if (input) input.addEventListener("input", function () {
    chips.forEach(function (c) { c.classList.remove("on"); });
    filtra(input.value, true);
  });
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var on = !c.classList.contains("on");
      chips.forEach(function (x) { x.classList.remove("on"); });
      if (input) input.value = "";
      c.classList.toggle("on", on);
      filtra(on ? c.getAttribute("data-k") : "", true);
    });
  });

  var chat = raiz.querySelector("[data-fq-chat]");
  if (chat) chat.addEventListener("click", function () {
    var l = document.querySelector(".pitahaya-chat__launcher");
    if (l) l.click(); else location.href = document.documentElement.lang === "en" ? "contact.html" : "contacto.html";
  });
})();
