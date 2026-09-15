/* ORBITAL · cinta de telemetría del héroe (CSP-safe) */
(function () {
  "use strict";

  var utc = document.querySelector("[data-orx-utc]");
  if (!utc) return;
  var orbit = document.querySelector("[data-orx-orbit]");
  var pass = document.querySelector("[data-orx-pass]");
  var en = /^en\b/i.test(document.documentElement.lang || "");

  /* 15 cruces del ecuador al día: un periodo de 96 min */
  var PERIOD = 5760;
  var EPOCH = Date.UTC(2026, 8, 1) / 1000;
  var pad = function (n) { return String(n).padStart(2, "0"); };

  function tick() {
    var d = new Date();
    var s = d.getTime() / 1000;
    utc.textContent = pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
    if (orbit) orbit.textContent = String(4812 + Math.floor((s - EPOCH) / PERIOD)).replace(/\B(?=(\d{3})+$)/, en ? "," : " ");
    if (pass) {
      var left = Math.floor(PERIOD - ((s - EPOCH) % PERIOD));
      pass.textContent = "T−" + pad(Math.floor(left / 60)) + ":" + pad(left % 60);
    }
  }
  tick();
  setInterval(function () { if (!document.hidden) tick(); }, 1000);
})();
