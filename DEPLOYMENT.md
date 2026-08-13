# Championship OS Deployment

## Recommended deployment path

The application is a full-stack React, Express, tRPC, Drizzle, and MySQL/TiDB project. The safest deployment sequence is to import the private GitHub repository into Vercel, configure the same build command already defined in `package.json`, and add the production database connection in Vercel Project Settings.

## Required environment variables

The platform-provided authentication and Manus runtime variables must be copied into the Vercel project environment for Production, Preview, and Development where applicable. The database provider must supply `DATABASE_URL`; it should point to a production MySQL-compatible database and must not be committed to GitHub.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection string used by Drizzle and the server. |
| `JWT_SECRET` | Session signing secret. |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL. |
| `VITE_OAUTH_PORTAL_URL` | Frontend login portal URL. |
| `VITE_APP_ID` | Manus OAuth application identifier. |
| `BUILT_IN_FORGE_API_URL` | Manus runtime API base URL. |
| `BUILT_IN_FORGE_API_KEY` | Server-side Manus runtime credential. |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend Manus runtime API base URL. |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend Manus runtime credential. |

## Database setup

Before the first production run, apply the generated Drizzle migrations from `drizzle/` to the production database. Never run destructive schema changes against a production database without a backup and a reviewed migration. The current MVP schema includes users, tournaments, clubs, athletes, categories, registrations, mats, matches, and audit logs.

## Vercel notes

Import the repository, keep the project root at the repository root, and use the existing `build` script. Add all required environment variables before the first production deployment. The application uses the server entry point built to `dist/index.js`; if the Vercel project requires a framework override, select the Node/Express-compatible configuration rather than a static-only configuration.

## Current MVP boundary

The first vertical slice includes authenticated command-center access, tournament creation, dashboard metrics, athlete registration, status update procedures, and category-engine unit coverage. Bracket advancement, mat operations, live referee scoring, athlete-only portal views, and provider-side Vercel deployment verification remain follow-up work.
