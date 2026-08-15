# Live button failure evidence — 15 Aug 2026

Source URL: https://egyptbjj.vercel.app/register/portsaid-bjj-championship

The browser-rendered production page showed `Loading the workspace… إذا لم تفتح الواجهة، استخدم التسجيل المباشر بالأسفل.` and a link labeled `Open registration / فتح التسجيل` pointing back to the exact same URL. Therefore clicking that fallback link cannot advance the user and appears to be a broken button.

A direct curl of the same URL returned HTTP 200 HTML containing the module script `/assets/index-D76IezuA.js`, a `<form id="fallback-registration-form" class="fallback-grid">`, the loading fallback text, and the self-link target `register/portsaid-bjj-championship`. The live API endpoint had previously returned HTTP 200 JSON for tournament id 7 and slug `portsaid-bjj-championship`.

Next diagnostic target: determine why React does not replace the fallback on the live route and make the fallback itself a complete working public form rather than a self-link.
