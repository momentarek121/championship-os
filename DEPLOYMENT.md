# Championship OS Deployment

## Recommended deployment path

Championship OS is a full-stack React, Express, tRPC, Drizzle, and PostgreSQL application. The active server adapter uses Drizzle with `node-postgres` and prefers `SUPABASE_DATABASE_URL`; `DATABASE_URL` remains only as a local fallback. The Supabase schema is maintained in `supabase/schema.sql` and uses snake_case PostgreSQL columns mapped to camelCase application fields in `drizzle/schema.ts`.

## Required environment variables

The platform-provided authentication and Manus runtime variables must be present in the Vercel project for Production, Preview, and Development where applicable. The Supabase connection string must be server-only and must not be committed to GitHub.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_DATABASE_URL` | Supabase PostgreSQL pooler URI used by the active Drizzle adapter. Surrounding quote characters are sanitized defensively. |
| `DATABASE_URL` | Local or legacy fallback only; it is not preferred when `SUPABASE_DATABASE_URL` is present. |
| `JWT_SECRET` | Session signing secret. |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL. |
| `VITE_OAUTH_PORTAL_URL` | Frontend login portal URL. |
| `VITE_APP_ID` | Manus OAuth application identifier. |
| `VITE_CANONICAL_APP_ORIGIN` | Managed production origin used for the authorized OAuth callback. |
| `BUILT_IN_FORGE_API_URL` | Manus runtime API base URL. |
| `BUILT_IN_FORGE_API_KEY` | Server-side Manus runtime credential. |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend Manus runtime API base URL. |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend Manus runtime credential. |
| `VITE_SUPABASE_URL` | Supabase project URL for browser-safe metadata and health checks. |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key for browser-safe access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-only secret; never expose it with `VITE_` or commit it. |

## Database setup and verification

The initialized Supabase project already contains the required public tables and matching snake_case columns for users, tournaments, clubs, athletes, categories, registrations, mats, matches, and audit logs. A direct PostgreSQL query and an application-level Drizzle read-only query both succeeded against the pooler and returned an empty database, confirming connectivity without seeding or inserting test data. The audit payload columns are `jsonb` and the adapter passes structured values directly.

Drizzle Kit still reports malformed legacy MySQL snapshot metadata in the historical `drizzle/meta` files. This does not block the active adapter because the Supabase schema was reviewed and applied separately, and the runtime schema read probe passed. Future schema changes should use a fresh PostgreSQL migration history or a carefully reviewed additive SQL migration; do not run destructive changes against production without a backup.

The service-role key is server-only. Because a service-role credential was shared in the task conversation, rotate it in Supabase after validation and update `SUPABASE_SERVICE_ROLE_KEY` in Vercel before using production administration features.

## Vercel notes

Import the private repository, keep the project root at the repository root, and use the existing `build` script. The build emits `dist/index.js` for managed runtime compatibility, `dist/_core/index.js` for the local production server, and `dist/vercel.js` for the Vercel function. The canonical managed domain is `https://champios-haf3fxkp.manus.space/`; Vercel visitors are forwarded there for the authorized OAuth callback.

## Current MVP boundary

The current vertical slice includes authenticated command-center access, owner/admin organizer authorization, tournament creation, dashboard metrics, public and staff athlete registration, mandatory date-of-birth classification, deterministic category pools, payment/check-in/weigh-in controls, automatic and manual match creation, controlled queued-slot editing, referee scoring, the digital timer, the athlete portal, bracket advancement, medal results, and audit records. The remaining verification boundary is a complete interactive OAuth callback with a real user session and a real authenticated smoke test of organizer, referee, Results, and slot-edit persistence flows.
