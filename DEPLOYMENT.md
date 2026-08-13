# Championship OS Deployment

## Recommended deployment path

The application is a full-stack React, Express, tRPC, Drizzle, and MySQL/TiDB project. The safest deployment sequence is to import the private GitHub repository into Vercel, configure the build command already defined in `package.json`, and add the database connection in Vercel Project Settings. Supabase variables are documented for the planned PostgreSQL migration, but the current server adapter still reads `DATABASE_URL`.

## Required environment variables

The platform-provided authentication and Manus runtime variables must be copied into the Vercel project environment for Production, Preview, and Development where applicable. The database provider must supply `DATABASE_URL`; it should point to a production MySQL-compatible database and must not be committed to GitHub.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Current MySQL/TiDB connection string used by Drizzle and the server. |
| `JWT_SECRET` | Session signing secret. |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL. |
| `VITE_OAUTH_PORTAL_URL` | Frontend login portal URL. |
| `VITE_APP_ID` | Manus OAuth application identifier. |
| `BUILT_IN_FORGE_API_URL` | Manus runtime API base URL. |
| `BUILT_IN_FORGE_API_KEY` | Server-side Manus runtime credential. |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend Manus runtime API base URL. |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend Manus runtime credential. |
| `VITE_SUPABASE_URL` | Supabase project URL for the planned PostgreSQL adapter. |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key for browser-safe access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-only secret; never expose it with `VITE_` or commit it. |

## Database setup

Before the first production run, apply the generated Drizzle migrations from `drizzle/` to the production database. Never run destructive schema changes against a production database without a backup and a reviewed migration. The current server adapter still uses MySQL/TiDB through `DATABASE_URL`; setting `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` validates the Supabase REST project but does not switch the Drizzle adapter automatically.

The validated Supabase project is reachable through its REST root, but the application table probe returned HTTP 404 because the reference schema has not been applied. Open the project’s **SQL Editor**, paste the reviewed non-destructive schema from `supabase/schema.sql`, run it, and confirm `public.tournaments` is visible in Table Editor. Only after that provider step should the adapter be migrated to PostgreSQL. The schema contains users, tournaments, clubs, athletes, categories, registrations, mats, matches, and audit logs; it does not drop existing tables.

The service-role key is server-only. Because a service-role credential was shared in the task conversation, rotate it in Supabase after validation and update `SUPABASE_SERVICE_ROLE_KEY` in Vercel before using the production database.

## Vercel notes

Import the repository, keep the project root at the repository root, and use the existing `build` script. Add all required environment variables before the first production deployment. The build emits `dist/index.js` for managed runtime compatibility, `dist/_core/index.js` for the local production server, and `dist/vercel.js` for the Vercel function. If the Vercel project requires a framework override, select the Node/Express-compatible configuration rather than a static-only configuration.

## Current MVP boundary

The current vertical slice includes authenticated command-center access, owner/admin organizer authorization, tournament creation, dashboard metrics, public and staff athlete registration, mandatory date-of-birth classification, deterministic category pools, payment/check-in/weigh-in controls, automatic and manual match creation, referee scoring, the digital timer, the athlete portal, and audit records. Full PostgreSQL adapter replacement, table-level Supabase verification, dedicated multi-role views, bracket advancement/medal logic, and final live end-to-end verification remain follow-up work.
