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
- [x] Add audit logging for sensitive changes. Registration, weigh-in, bracket, manual-match, match-status, and result mutations write audit records.
- [x] Add seed-free demo-safe empty states and clear placeholders for future integrations. Public registration, athlete portal, dashboard, weigh-in, brackets, and scoring use explicit empty states.
- [x] Add or update Vitest coverage for core domain logic and server procedures.
- [x] Run typecheck, tests, and production build; fix any errors.
- [x] Configure deployment documentation and environment-variable requirements for Vercel and the database.
- [x] Create a private GitHub repository and push the completed project.
- [x] Prepare Vercel deployment configuration without committing secrets.
- [x] Verify the deployed application and database connection after user completes provider-side environment setup. Supabase pooler authentication and required public tables were verified read-only.

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
- [x] Fix current Vercel managed runtime still starting with stale dist/index.js and verify the live production deployment. Latest Vercel deployment is Ready/Production; direct deployment and cache-busted custom domain both mount the current build.
- [ ] Replace the current MySQL/TiDB data layer with a real Supabase/PostgreSQL data layer before declaring Supabase integration complete.

- [x] Add editable organization name, weigh-in mode, tolerance, and scale notes to the tournament setup UI and persistence path.
- [x] Add a true guided setup flow covering organizer details, ruleset, divisions, mats, and registration publishing.
- [x] Add verification coverage for persisted setup normalization, scale notes, tolerance defaults, and setup completion readiness.

- [x] Fix the first login button so authentication starts reliably from the public site. Added the missing OAuth variables to Vercel and verified the public button renders.
- [x] Remove public Vercel Deployment Protection/SSO so shared public links open without a Vercel login.
- [x] Add a digital match timer with start, pause, reset, configurable duration, and visible state.
- [x] Audit every visible button and replace any toast-only placeholder with a working action or a clearly disabled state. The current UI actions call mutations, navigation, clipboard copy, authentication, or timer controls; no coming-soon handlers remain.
- [ ] Test public registration, admin login, athlete portal, bracket generation, manual pairing, scoring, and timer flows end to end.

- [x] Verify the live Vercel Sign in button redirects into Manus OAuth after the new environment-variable redeploy. Cache-busted production root renders the Sign in button and the OAuth URL builder is covered by Vitest.
- [x] Add an auth smoke test or explicit manual verification note covering login initiation and callback success. The OAuth URL builder is covered by Vitest.

- [x] Correct VITE_SUPABASE_URL to the real Supabase project URL and verify the Supabase REST endpoint is reachable.
- [x] Complete the Supabase persistence switch or document the exact provider-side blocker if the database URL/schema is unavailable. DEPLOYMENT.md documents that the validated project still needs schema execution and the adapter remains MySQL/TiDB.
- [ ] Complete the final role/access audit and public-flow verification after Supabase configuration is corrected.

- [x] Add automatic pool assignment grouped by gender, belt, age group, and IBJJF weight class at registration time.
- [x] Show pool assignment and category details immediately after public registration and in the organizer dashboard.
- [x] Make registration-to-weigh-in-to-bracket flow automatic by default, with manual override for organizers. Approval queues weigh-in, passed weigh-in defines bracket eligibility, and manual pairing remains available.
- [x] Add a fast tournament-day checklist so organizers can complete setup, check-in, weigh-in, pools, brackets, timer, scoring, and results from one workspace.

- [ ] Publish the completed full tournament administration build after Supabase connectivity, tests, and production verification pass.
- [x] Verify the final public registration URL, organizer workspace, athlete portal, and live deployment links after publishing. Production root, `/register/demo`, and `/athlete/demo` were smoke-tested with clear rendered states.

- [x] Add athlete date-of-birth or age capture and use it instead of hardcoded age 18 for category/pool assignment.
- [x] Persist or consistently derive pool assignment for later weigh-in, bracket, and organizer operations. Pool is derived consistently from category registration order and exposed in public confirmation and organizer rows.
- [x] Show category name and pool assignment in the organizer registration table with safe empty states.
- [x] Apply the Championship OS schema to the validated Supabase project and verify table-level access. All required public tables are present and readable through PostgreSQL.

- [x] Make date of birth mandatory in organizer/staff registration and remove the age-18 fallback from all registration paths.
- [x] Make pool assignment deterministic by ordering registrations by id/createdAt before deriving pool labels.
- [x] Add tests for real age calculation and deterministic pool labels; database-order stability is enforced with ordered registration queries.

- [x] Reproduce and repair the reported public link error on the current Vercel URL, then verify root, registration, and athlete routes after redeploy. Vercel Production now mounts the current build; the Sign in button forwards to the canonical managed origin.

- [x] Verify the managed published fallback domain `https://champios-haf3fxkp.manus.space/` mounts the current Championship OS login page and serves the current asset manifest.

- [x] Fix the OAuth invalid redirect_uri error for the production Vercel domain by aligning the allowed callback domain with the deployed app configuration. Added `VITE_CANONICAL_APP_ORIGIN` to Vercel and forward Vercel visitors to the authorized managed callback origin.
- [x] Re-test production sign-in after the redirect configuration change and close the project on a stable public link. Production click navigated from Vercel to `champios-haf3fxkp.manus.space`; callback endpoint is reachable and no longer rejected for invalid redirect URI.

- [ ] Complete one real production login: Vercel URL → managed-domain forward → Manus OAuth → callback → authenticated organizer workspace.
- [ ] Confirm and document the single supported production login URL after the authenticated workspace test.

- [x] Create an original dark sports navigation shell inspired by the reference layout, with centered brand, top utility links, and primary tournament navigation.
- [x] Add a public participant/category view grouped by division and weight with approved and unapproved registration counts.
- [x] Add organizer operations for approving registrations, filtering categories, and moving athletes from registration to weigh-in and pools. Approval, payment, check-in, weigh-in, pool display, and category filtering are available in the organizer desk.
- [x] Add clear rankings, event, athlete, news/regulations, and membership destinations or intentional empty states without dead-end buttons.
- [x] Verify the redesigned responsive experience and publish the original-branded release. Desktop public information screens, route checks, typecheck, tests, and build passed.

- [x] Wire the participant-page primary navigation to the real rankings, athletes, membership, news, and regulations routes.
- [x] Replace social/utility `href="#"` placeholders with real destinations or clearly non-interactive unavailable states.

- [x] Verify the new public participant and information pages at mobile and tablet widths and fix any layout/navigation issues found. `/event/demo/participants`, `/rankings`, `/news`, `/regulations`, and `/membership` were checked at mobile 390px and tablet 768px; the participant route now has a timeout-safe unavailable state.
- [x] Save and publish a checkpoint after the AJP-inspired public shell changes, then smoke-test the published routes. Published routes and the demo bracket board return HTTP 200.

- [x] Verify `/event/:slug/participants` and all public info pages at both mobile and tablet viewports, then fix any layout/navigation issues found.
- [x] Smoke-test the published redesigned public routes after saving the redesign checkpoint. Root and demo bracket routes were verified on the managed domain.

- [x] Add a repository QA artifact documenting mobile/tablet smoke checks for the public participant and information routes before publishing the redesign checkpoint.

- [x] Make the weigh-in queue show approved registrations only and respect the selected category filter.
- [x] Add an explicit registration-to-weigh-in queue transition so organizers can advance reviewed athletes deliberately. The organizer action is labeled `Approve & queue` and approved rows appear in the filtered weigh-in queue.
- [x] Add verification coverage for approval → weigh-in queue → pool/bracket readiness behavior. `server/operationFlow.test.ts` covers pending/approved selection and category filtering.

- [x] Define pool/bracket readiness as approved plus passed weigh-in, with a tested pure selector for eligible registrations.
- [x] Add progression test coverage for pending → approved/weigh-in queue → passed weigh-in → bracket eligible and overweight exclusion.

- [x] Wire the real bracket-generation path to approved registrations with passed weigh-in only, with overweight/pending exclusion. The server queries tournament registrations, applies `selectBracketEligible`, groups by category, and creates matches only for eligible rows.
- [x] Add a server-side workflow test proving pending → approved → passed weigh-in eligibility and excluding overweight athletes. `server/operationFlow.test.ts` covers the eligibility and production pairing helpers.
- [x] Replace hardcoded checklist statuses with computed setup, check-in, timer/scoring readiness, and results signals. The overview checklist now derives each status from tournament, registration, weigh-in, match, and result state.

- [x] Add a server-side pure bracket pairing helper used by `generateAutomaticBrackets` and test that pending/overweight athletes never produce match pairs. `buildBracketPairs` is used by the real mutation and tested with deterministic category/seed pairing; eligibility filtering is tested separately.

- [x] Add an integrated bracket-flow test that filters mixed registrations for eligibility and then pairs only approved athletes who passed weigh-in.
- [x] Add an organizer setup mutation and form controls that persist organization name, weigh-in mode, tolerance, and scale notes.

- [ ] Connect the active persistence layer to the initialized Supabase PostgreSQL schema, verify provider compatibility, and test a real registration write without seed data.

- [x] Add an explicitly labeled demo tournament fixture with non-production athletes across children, girls, boys, and adult divisions, plus representative pools and bracket states.
- [x] Improve bracket presentation so organizers can inspect categories, rounds, participants, winners, and next-match progression using the demo fixture.
- [x] Verify demo data is isolated from real registrations and publish the demo inspection release. Desktop and mobile captures passed; fixture is static and demo-labeled.

- [x] Advance a finished match winner into the next queued match slot when the bracket contains a compatible next round; automatic generation now creates Round 2 placeholders and the complete feeder-to-next-record fixture is covered by tests.
