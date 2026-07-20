/* ──────────────────────────────────────────────────────────────
   Pittahaya — Vercel Web Analytics (privacy-first, cookieless)
   ----------------------------------------------------------------
   • First-party & same-origin: the script and the beacons live at
     /_vercel/insights/* on your own domain, so the strict CSP
     (script-src 'self' / connect-src 'self') already allows it —
     no CSP changes, no third-party domains, no cookies, no banner.
   • Collects only aggregate/anonymous data (page, referrer, country,
     device type) + the named conversion events we fire below.
   • Enable once in Vercel → Project → Analytics. Off Vercel (e.g.
     localhost) the script 404s harmlessly and events just no-op.
   ────────────────────────────────────────────────────────────── */
(function () {
  // Queue stub so track() works even before the script finishes loading.
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

  // Load the first-party insights script (same-origin → CSP-safe).
  var s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
})();

/* Small helper any page script can call:
     window.track("Lead Submitted")
     window.track("Plan Checkout Click", { plan: "premium" })   */
window.track = function (name, data) {
  try {
    if (!window.va) return;
    window.va("event", data ? { name: name, data: data } : { name: name });
  } catch (e) { /* analytics must never break the page */ }
};
