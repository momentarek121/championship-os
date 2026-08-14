# Live Vercel status — 2026-08-14

- Vercel project: `egyptbjj`, domain: https://egyptbjj.vercel.app
- Latest redeploy started after adding the production variable: deployment `5V4ewbnbGyCXKbq4tPKpxwVQAfFz`, host `https://egyptbjj-ogrge0dl5-momentarek121s-projects.vercel.app`, source commit `ac70416`.
- At the latest browser check, deployment was still Building; install/build completed through Vite transformation.
- Vercel Environment Variables page now visibly includes `SUPABASE_DATABASE_URL`, marked Sensitive, Production and Preview, Added 1m ago. Existing variables include `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
- Before this redeploy, the old deployment host `https://egyptbjj-66libv3i8-momentarek121s-projects.vercel.app` and `https://egyptbjj.vercel.app` returned HTTP 200 for `/api/trpc/publicRegistration.getBySlug` but JSON null (`{"result":{"data":{"json":null,"meta":{"values":["undefined"]}}}}`), because the deployment predated the database variable.
- The production database secret was validated locally by a read-only Vitest test: `server/supabase.production-db.test.ts`; full validation passed with 24 test files / 60 tests, typecheck, and production build.
- The current user added the PostgreSQL Session Pooler URI to Vercel after guidance from Supabase Connect. The URI form used port 5432 and must contain the real password in place of `[YOUR-PASSWORD]`.
