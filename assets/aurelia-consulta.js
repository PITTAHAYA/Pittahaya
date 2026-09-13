/* AURELIA · consulta privada en tres pasos (demo: no envía ni guarda datos) */
(function () {
  "use strict";

  var form = document.querySelector("[data-inq]");
  if (!form) return;

  var isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  var t = function (es, en) { return isEnglish ? en : es; };
  var steps = Array.prototype.slice.call(form.querySelectorAll("[data-inq-step]"));
  var count = form.querySelector("[data-inq-count]");
  var bar = form.querySelector("[data-inq-bar]");
  var back = form.querySelector("[data-inq-back]");
  var next = form.querySelector("[data-inq-next]");
  var submit = form.querySelector("[data-inq-submit]");
  var err = form.querySelector("[data-inq-err]");
  var done = form.querySelector("[data-inq-done]");
  var ref = form.querySelector("[data-inq-ref]");
  var residence = form.querySelector("[data-inq-residence]");
  var residenceField = form.querySelector("[data-inq-residence-field]");
  var locationField = form.querySelector("[data-inq-location-field]");
  var chrome = form.querySelectorAll("[data-inq-chrome]");
  var index = 0;

  /* residencias: la colección viva + los próximos horizontes */
  if (residence) {
    var addGroup = function (label, names) {
      var group = document.createElement("optgroup");
      group.label = label;
      names.forEach(function (name) {
        var option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        group.appendChild(option);
      });
      residence.appendChild(group);
    };
    var props = (window.AURELIA_PROPERTIES || []).map(function (p) { return p.name; });
    if (props.length) addGroup(t("Colección privada", "Private collection"), props);
    addGroup(t("Próximos horizontes", "Upcoming horizons"),
      isEnglish ? ["Amazonia", "Dubai", "Venice", "Monaco"] : ["Amazonía", "Dubái", "Venecia", "Mónaco"]);
  }

  var intent = function () {
    var checked = form.querySelector('input[name="intent"]:checked');
    return checked ? checked.value : "adquirir";
  };

  /* quien representa una propiedad no elige de la colección: escribe dónde está */
  var syncIntent = function () {
    var represent = intent() === "representar";
    if (residenceField) residenceField.hidden = represent;
    if (locationField) locationField.hidden = !represent;
    if (intent() === "horizontes" && residence && !residence.value) {
      residence.value = isEnglish ? "Amazonia" : "Amazonía";
    }
  };
  form.querySelectorAll('input[name="intent"]').forEach(function (r) { r.addEventListener("change", syncIntent); });

  var show = function (i, focus) {
    index = i;
    steps.forEach(function (s, n) { s.hidden = n !== i; });
    if (count) count.textContent = t("Paso ", "Step ") + (i + 1) + t(" de ", " of ") + steps.length;
    if (bar) bar.style.width = ((i + 1) / steps.length * 100).toFixed(1) + "%";
    if (back) back.hidden = i === 0;
    if (next) next.hidden = i === steps.length - 1;
    if (submit) submit.hidden = i !== steps.length - 1;
    if (err) err.textContent = "";
    if (focus) {
      var first = steps[i].querySelector("input:checked, input:not([type=radio]), select, textarea");
      if (first && !first.closest("[hidden]")) first.focus({ preventScroll: true });
    }
  };

  var validate = function () {
    var fields = steps[index].querySelectorAll("[required]");
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (f.closest("[hidden]")) continue;
      var bad = !f.value.trim() || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim()));
      f.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) {
        if (err) err.textContent = f.type === "email"
          ? t("Revise el correo: parece incompleto.", "Please check the email address: it looks incomplete.")
          : t("Este dato es necesario para continuar.", "This detail is needed to continue.");
        f.focus();
        return false;
      }
    }
    return true;
  };

  if (next) next.addEventListener("click", function () {
    if (!validate()) return;
    show(Math.min(steps.length - 1, index + 1), true);
  });
  if (back) back.addEventListener("click", function () { show(Math.max(0, index - 1), true); });

  form.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") === "true") e.target.setAttribute("aria-invalid", "false");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;
    var code = "AUR-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000));
    if (ref) ref.textContent = t("Referencia ", "Reference ") + code;
    steps.forEach(function (s) { s.hidden = true; });
    chrome.forEach(function (c) { c.hidden = true; });
    if (done) { done.hidden = false; done.focus(); }
  });

  /* "Solicitar dossier" desde la ficha: cierra, trae la residencia y salta al paso 2 */
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-dossier], [data-intent]");
    if (!trigger) return;
    e.preventDefault();
    var wanted = trigger.hasAttribute("data-dossier") ? "adquirir" : trigger.getAttribute("data-intent");
    var radio = form.querySelector('input[name="intent"][value="' + wanted + '"]');
    if (radio) radio.checked = true;
    if (trigger.hasAttribute("data-dossier")) {
      var title = document.querySelector("[data-dialog-title]");
      if (residence && title) residence.value = title.textContent;
      var dialog = trigger.closest("dialog");
      if (dialog && dialog.open) dialog.close();
      /* la ficha bloquea el scroll al abrirse; al saltar desde ella al
         formulario hay que devolverlo, o la página se queda congelada */
      document.documentElement.style.overflow = "";
    }
    syncIntent();
    if (done && !done.hidden) return;
    show(trigger.hasAttribute("data-dossier") ? 1 : 0, false);
    setTimeout(function () {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      var focusTarget = trigger.hasAttribute("data-dossier") ? residence : radio;
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    }, 80);
  });

  syncIntent();
  show(0, false);
})();
