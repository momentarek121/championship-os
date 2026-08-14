# Vercel deployment audit — 2026-08-14

Source: https://vercel.com/momentarek121s-projects/egyptbjj/deployments

The linked Vercel project `egyptbjj` is connected to GitHub repository `momentarek121/championship-os`, branch `main`.

Observed failed production deployments:

| Commit | Status | Error |
|---|---|---|
| `5dcf57e` | Error | `File not found: /vercel/path0/api/public/assets/index-Cqi2hBCN.js` |
| `e8edfa7` | Error | `vercel.json` schema validation: `functions.api/index.ts.includeFiles` should be string |
| `e41a9a2` | Error | `File not found: /vercel/path0/api/public/assets/index-mpBItbrX.js` |
| `a87c0a9` | Error | `File not found: /vercel/path0/api/public/assets/index-mpBItbrX.js` |
| `360a030` | Building at last capture | Latest change set `includeFiles: "dist/public/**"` |

Build logs for failing deployments show Vite successfully generates `dist/public/index.html` and hashed assets, then the serverless packaging/runtime fails while looking for a browser asset under `/vercel/path0/api/public/assets/`. Local build and `scripts/check-vercel-handler.mjs` pass. The current repair sequence is to use a schema-valid string glob for `dist/public/**` and prioritize `dist/public` in `server/_core/static.ts`; the live Vercel status still requires final verification after the latest deployment completes.

Earlier cache-busted Vercel root verification succeeded for a prior deployment and rendered the public sign-in page, but current production deployment status must not be claimed Ready until the latest build is confirmed.

## Final live smoke after checkpoint 056ea361

The primary Vercel URL `https://egyptbjj.vercel.app/?release=056ea361` rendered the public Championship OS sign-in screen in the browser. The first screenshot capture was blank, but DOM inspection confirmed the React root had rendered; a subsequent browser refresh displayed the page correctly.

Live HTTP checks returned `200` for `/`, `/register/demo`, `/register/demo/rules`, `/athlete/demo`, and `/referee`. `/register/demo` and its rules path correctly returned a user-facing `Registration link not found` state because `demo` is not an active registration slug, rather than a Vercel or asset error. The hashed JavaScript bundle returned `200` with `Content-Type: application/javascript; charset=UTF-8`.
