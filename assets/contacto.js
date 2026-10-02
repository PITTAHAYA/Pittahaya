/* Pittahaya · Contacto: una pregunta a la vez (el envío sigue en app.js) */
(function () {
  var form = document.querySelector(".ct-form");
  if (!form) return;
  var en = document.documentElement.lang === "en";
  var pasos = [].slice.call(form.querySelectorAll(".ct-paso"));
  var nav = form.querySelector(".ct-nav");
  var barra = document.querySelector(".ct-barra");
  var select = form.querySelector("#plan");
  var ops = [].slice.call(form.querySelectorAll(".ct-op"));
  var saludo = form.querySelector("[data-saludo]");
  var nombre = form.querySelector("#nombre");
  var i = 0;

  form.classList.add("ct-js");

  function marcaOps() {
    ops.forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-i") === select.selectedIndex); });
  }
  ops.forEach(function (b) {
    b.addEventListener("click", function () {
      select.selectedIndex = +b.getAttribute("data-i");
      select.dispatchEvent(new Event("change", { bubbles: true }));
      marcaOps();
      setTimeout(function () { avanza(1); }, 260);
    });
  });
  marcaOps(); // respeta ?plan= de app.js

  function valido(n) {
    var p = pasos[n], ok = true;
    [].slice.call(p.querySelectorAll("input[required],textarea[required],select[required]")).forEach(function (c) {
      if (c.type === "checkbox") return;
      if (!String(c.value || "").trim() || (c.type === "email" && !/^\S+@\S+\.\S+$/.test(c.value))) ok = false;
    });
    if (!ok) {
      p.classList.remove("mal"); void p.offsetWidth; p.classList.add("mal");
      var c = p.querySelector(".ct-campo"); if (c) c.focus();
    }
    return ok;
  }

  function muestra(n) {
    i = Math.max(0, Math.min(pasos.length - 1, n));
    pasos.forEach(function (p, j) { p.classList.toggle("on", j === i); p.classList.remove("mal"); });
    nav.classList.toggle("primero", i === 0);
    nav.classList.toggle("ultimo", i === pasos.length - 1);
    if (barra) barra.style.setProperty("--cb", ((i + 1) / pasos.length).toFixed(3));
    if (i === 1 && saludo) {
      var n1 = (nombre.value || "").trim().split(/\s+/)[0];
      saludo.textContent = n1 ? (en ? "Nice to meet you, " : "Un gusto, ") + n1 + "." : "";
    }
    var c = pasos[i].querySelector(".ct-campo");
    if (c && matchMedia("(hover:hover)").matches) setTimeout(function () { c.focus({ preventScroll: true }); }, 60);
  }
  function avanza(d) {
    if (d > 0 && !valido(i)) return;
    muestra(i + d);
  }

  form.querySelector("[data-sig]").addEventListener("click", function () { avanza(1); });
  form.querySelector("[data-atras]").addEventListener("click", function () { avanza(-1); });
  form.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.target.tagName === "TEXTAREA" || e.target.type === "checkbox") return;
    if (i < pasos.length - 1) { e.preventDefault(); avanza(1); }
  });
  form.addEventListener("submit", function (e) {
    for (var n = 0; n < pasos.length; n++) {
      if (!valido(n)) { e.preventDefault(); e.stopImmediatePropagation(); muestra(n); valido(n); return; }
    }
  }, true);

  /* cuando app.js confirma el envío, cambiamos la escena */
  var estado = form.querySelector("[data-form-status]");
  var gracias = document.querySelector(".ct-gracias");
  new MutationObserver(function () {
    if (estado.dataset.state === "success" && gracias) {
      form.hidden = true;
      gracias.hidden = false;
      if (barra) barra.style.setProperty("--cb", 1);
    }
  }).observe(estado, { attributes: true, attributeFilter: ["data-state"] });

  muestra(0);
})();
