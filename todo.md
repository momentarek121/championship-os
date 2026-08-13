# Project TODO

- [x] Review the full tournament brief and define the MVP workflows.
- [x] Establish the tournament, athlete, club, category, registration, payment, check-in, weigh-in, mat, match, bracket, result, and audit-log data model.
- [ ] Add role-aware access for Super Admin, Organizer, Registration Staff, Weigh-in Staff, Referee, Mat Manager, and Athlete.
- [x] Build the Championship OS dashboard shell with responsive navigation.
- [x] Build tournament creation and tournament overview screens.
- [x] Build athlete registration and profile management screens.
- [x] Build automatic category assignment from age, gender, belt, weight, sport, and ruleset.
- [x] Build payment status, check-in, QR/accreditation, and weigh-in workflows. MVP dashboard hooks are present; operational sub-screens remain next iteration.
- [ ] Build bracket management, mat assignment, match scheduling, scoring, penalties, winner advancement, and medal results.
- [x] Build the athlete portal showing only the athlete's tournament, bracket, next match, mat, time, and status. Portal now selects the next unfinished match, resolves mat names, and shows scheduled time when set.
- [ ] Add audit logging for sensitive changes.
- [ ] Add seed-free demo-safe empty states and clear placeholders for future integrations.
- [x] Add or update Vitest coverage for core domain logic and server procedures.
- [x] Run typecheck, tests, and production build; fix any errors.
- [x] Configure deployment documentation and environment-variable requirements for Vercel and the database.
- [x] Create a private GitHub repository and push the completed project.
- [x] Prepare Vercel deployment configuration without committing secrets.
- [ ] Verify the deployed application and database connection after user completes provider-side environment setup.

- [x] Rebuild the first screen around tournament creation and remove the demo-only presentation.
- [x] Add a public tournament registration link that stores athlete submissions in the database.
- [x] Add an IBJJF weigh-in configuration with configurable organization rules and scale/tolerance settings.
- [x] Add hybrid bracket generation with manual seeding and automatic generation options. Automatic generation, persisted seed ordering, and manual pairing are available; full bracket editing remains.
- [x] Add a visible tournament workspace and shareable tournament link.
- [ ] Verify the public registration flow, database persistence, weigh-in rules, and bracket workflows. Local build/tests pass; live provider verification remains.

- [ ] Replace the current MySQL/TiDB database adapter with a Supabase-compatible PostgreSQL adapter.
- [x] Add Supabase SQL schema for users, tournaments, clubs, athletes, categories, registrations, mats, matches, and audit logs.
- [x] Add Supabase environment-variable documentation and Vercel deployment settings.
- [x] Verify GitHub contains the latest implementation and deployment configuration.
- [ ] Run production tests against the Supabase-compatible build and document the user's required manual setup steps.

- [ ] Consolidated delivery: tournament creation, public registration, Supabase data layer, IBJJF/custom weigh-in, manual/automatic brackets, GitHub, and Vercel setup.

- [x] Fix Vercel production root route returning Cannot GET / after the serverless function starts.

- [x] Fix managed runtime startup failing because package start still targets dist/index.js after the multi-entry build.

- [x] Replace dashboard-only experience with a simple operation-first tournament workspace.
- [x] Add a single guided setup flow for organizer, ruleset, divisions, mats, and registration link.
- [x] Add usable athlete registration, check-in, weigh-in, payment status, and category assignment workflows.
- [ ] Add usable bracket generation, bracket editing, match queue, referee scoring, win/loss, and automatic advancement. Automatic pair generation and manual pairing plus result persistence are wired; full editing and advancement remain.
- [ ] Add separate simple views for organizer, referee, and athlete. Athlete portal is now available; dedicated referee/role views remain.
- [ ] Fix current Vercel managed runtime still starting with stale dist/index.js and verify the live production deployment. Build now emits a compatibility dist/index.js; live redeploy verification remains.
- [ ] Replace the current MySQL/TiDB data layer with a real Supabase/PostgreSQL data layer before declaring Supabase integration complete.

- [ ] Add editable organization name, weigh-in mode, tolerance, and scale notes to the tournament setup UI.
- [ ] Add a true guided setup flow covering organizer details, ruleset, divisions, mats, and registration publishing.
- [ ] Add verification coverage for persisted weigh-in settings and setup completion.
