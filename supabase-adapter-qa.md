# Supabase PostgreSQL adapter QA

The active server database helper now imports Drizzle's `node-postgres` adapter and prefers `SUPABASE_DATABASE_URL`, with `DATABASE_URL` retained only as a fallback. The helper strips accidental surrounding quotes from the injected URI.

A direct PostgreSQL pool smoke test reached Supabase and returned database `postgres` in schema `public`. A second application-level smoke test imported `getDb()` and queried the converted Drizzle tables for tournaments, athletes, registrations, categories, and matches. It returned successfully with zero rows in each table, confirming the adapter and column mappings without inserting seed or test records.

The full verification completed with a clean TypeScript check, 34 passing Vitest tests across 15 files, and a successful production build. Drizzle Kit reports malformed historical MySQL snapshot metadata under `drizzle/meta`; the live Supabase schema was already applied and matched through the read-only inspection, so no destructive migration was run. Future schema changes should start a clean PostgreSQL migration history or use reviewed additive SQL.

The remaining unverified operation is a real authenticated registration write and read-back, intentionally deferred until an authenticated production-safe session is available. The production OAuth initiation URL is correct, but the current browser session did not complete the provider callback and ended at a blank auth page.
