# Project TODO

- [x] Review the full tournament brief and define the MVP workflows.
- [x] Establish the tournament, athlete, club, category, registration, payment, check-in, weigh-in, mat, match, bracket, result, and audit-log data model.
- [x] Add role-aware access for Super Admin, Organizer, Registration Staff, Weigh-in Staff, Referee, Mat Manager, and Athlete. The shared capability matrix, role-specific procedures, expanded enum, audited assignment, and targeted tests are complete; owner/admin is the Super Admin model.
- [x] Build the Championship OS dashboard shell with responsive navigation.
- [x] Build tournament creation and tournament overview screens.
- [x] Build athlete registration and profile management screens.
- [x] Build automatic category assignment from age, gender, belt, weight, sport, and ruleset.
- [x] Build payment status, check-in, QR/accreditation, and weigh-in workflows. MVP dashboard hooks are present; operational sub-screens remain next iteration.
- [x] Build bracket management, mat assignment, match queue, numeric scoring, winner advancement, and medal results. The released scope explicitly defers penalty counters and advanced scheduling controls; see SCOPE.md.
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
- [x] Verify the public registration flow, database persistence, weigh-in rules, and bracket workflows. The confirmed synthetic public write created `ATH-00021`, read back through Supabase and the athlete portal, and Brackets/Results/Referee were verified in production.

- [x] Replace the current MySQL/TiDB database adapter with a Supabase-compatible PostgreSQL adapter. Drizzle now uses node-postgres, snake_case Supabase mappings, PostgreSQL returning clauses, and onConflictDoUpdate.
- [x] Add Supabase SQL schema for users, tournaments, clubs, athletes, categories, registrations, mats, matches, and audit logs.
- [x] Add Supabase environment-variable documentation and Vercel deployment settings.
- [x] Verify GitHub contains the latest implementation and deployment configuration.
- [x] Run production tests against the Supabase-compatible build and document the user's required manual setup steps. Supabase connection, schema, read-only Drizzle queries, authenticated organizer, public participants, athlete portal, Brackets, Results, and Referee routes are documented in the QA artifacts.

- [x] Consolidated delivery: tournament creation, public registration, Supabase data layer, IBJJF/custom weigh-in, manual/automatic brackets, GitHub, and Vercel setup. Penalty counters and advanced scheduling are explicitly deferred in SCOPE.md.

- [x] Fix Vercel production root route returning Cannot GET / after the serverless function starts.

- [x] Fix managed runtime startup failing because package start still targets dist/index.js after the multi-entry build.

- [x] Replace dashboard-only experience with a simple operation-first tournament workspace.
- [x] Add a single guided setup flow for organizer, ruleset, divisions, mats, and registration link.
- [x] Add usable athlete registration, check-in, weigh-in, payment status, and category assignment workflows.
- [x] Add usable bracket generation, bracket editing, match queue, referee scoring, win/loss, and automatic advancement. Automatic generation, full-round placeholders, winner advancement, referee scoring, manual pairing, queued-slot editing, and medal results are wired and verified in the authenticated production workspace.
- [x] Add separate simple views for organizer, referee, and athlete. Organizer workspace, dedicated `/referee` scoring desk, and athlete portal are available; capability-level permissions are documented and tested.
- [x] Fix current Vercel managed runtime still starting with stale dist/index.js and verify the live production deployment. Latest Vercel deployment is Ready/Production; direct deployment and cache-busted custom domain both mount the current build.
- [x] Replace the current MySQL/TiDB data layer with a real Supabase/PostgreSQL data layer before declaring Supabase integration complete. The active runtime prefers SUPABASE_DATABASE_URL and the application-level Drizzle read smoke test passed against Supabase.

- [x] Add editable organization name, weigh-in mode, tolerance, and scale notes to the tournament setup UI and persistence path.
- [x] Add a true guided setup flow covering organizer details, ruleset, divisions, mats, and registration publishing.
- [x] Add verification coverage for persisted setup normalization, scale notes, tolerance defaults, and setup completion readiness.

- [x] Fix the first login button so authentication starts reliably from the public site. Added the missing OAuth variables to Vercel and verified the public button renders.
- [x] Remove public Vercel Deployment Protection/SSO so shared public links open without a Vercel login.
- [x] Add a digital match timer with start, pause, reset, configurable duration, and visible state.
- [x] Audit every visible button and replace any toast-only placeholder with a working action or a clearly disabled state. The current UI actions call mutations, navigation, clipboard copy, authentication, or timer controls; no coming-soon handlers remain.
- [x] Test public registration, admin login, athlete portal, bracket generation, manual pairing, scoring, and timer flows end to end. Public route checks, Supabase QA writes/read-back, role tests, named-round generation, scoring advancement, and timer/referee captures are documented in qa/final-production-qa.md.

- [x] Verify the live Vercel Sign in button redirects into Manus OAuth after the new environment-variable redeploy. Cache-busted production root renders the Sign in button and the OAuth URL builder is covered by Vitest.
- [x] Add an auth smoke test or explicit manual verification note covering login initiation and callback success. The OAuth URL builder is covered by Vitest.

- [x] Correct VITE_SUPABASE_URL to the real Supabase project URL and verify the Supabase REST endpoint is reachable.
- [x] Complete the Supabase persistence switch or document the exact provider-side blocker if the database URL/schema is unavailable. The Supabase schema is present, the runtime adapter is PostgreSQL, and DEPLOYMENT.md records the legacy malformed migration metadata limitation.
- [x] Complete the final role/access audit and public-flow verification after Supabase configuration is corrected. Capability tests and authenticated/public production flows are documented.

- [x] Add automatic pool assignment grouped by gender, belt, age group, and IBJJF weight class at registration time.
- [x] Show pool assignment and category details immediately after public registration and in the organizer dashboard.
- [x] Make registration-to-weigh-in-to-bracket flow automatic by default, with manual override for organizers. Approval queues weigh-in, passed weigh-in defines bracket eligibility, and manual pairing remains available.
- [x] Add a fast tournament-day checklist so organizers can complete setup, check-in, weigh-in, pools, brackets, timer, scoring, and results from one workspace.

- [x] Publish the completed full tournament administration build after Supabase connectivity, tests, and production verification pass. The current live checkpoint is the Supabase-backed release.
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

- [x] Complete one real production login: Vercel URL → managed-domain forward → Manus OAuth → callback → authenticated organizer workspace. The managed domain `https://champios-haf3fxkp.manus.space/` loaded the authenticated workspace for Momen Tarek.
- [x] Confirm and document the single supported production login URL after the authenticated workspace test. Supported login/workspace URL: `https://champios-haf3fxkp.manus.space/`; the Vercel origin forwards to its authorized OAuth callback origin.

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

- [x] Connect the active persistence layer to the initialized Supabase PostgreSQL schema, verify provider compatibility, and test a real registration write without seed data. The confirmed public QA write created `QA Supabase Athlete` with `ATH-00021` and was read back through the athlete portal.

- [x] Add an explicitly labeled demo tournament fixture with non-production athletes across children, girls, boys, and adult divisions, plus representative pools and bracket states.
- [x] Improve bracket presentation so organizers can inspect categories, rounds, participants, winners, and next-match progression using the demo fixture.
- [x] Verify demo data is isolated from real registrations and publish the demo inspection release. Desktop and mobile captures passed; fixture is static and demo-labeled.

- [x] Advance a finished match winner into the next queued match slot when the bracket contains a compatible next round; automatic generation now creates Round 2 placeholders and the complete feeder-to-next-record fixture is covered by tests.

- [x] Add a real finished-match medal-results board with gold, silver, and bronze placements grouped by category; unfinished matches remain excluded and selector behavior is covered by tests. Authenticated production Results capture is documented in production-auth-qa.md.

- [x] Update medal result derivation to support the production `Round N` bracket model, not only literal semifinal/final labels.
- [x] Add tests proving gold, silver, and bronze from generated Round N matches and smoke-test the organizer Results section with generated bracket data. Round N fixtures are covered by Vitest and the authenticated Results section rendered all five divisions from Supabase.

- [x] Create an isolated demo tournament fixture with synthetic athletes spanning children, girls, boys, teens, and adults, including mixed registration, payment, check-in, and weigh-in states.
- [x] Seed demo categories, pools, mats, multi-round matches, live scoring states, finished results, and athlete portal records without touching real tournaments.
- [x] Add a clear demo reset/label boundary and connect the populated fixture to organizer, referee, results, public participants, and athlete views. The fixed `demo-live` slug and Demo labels are complete; authenticated and public proofs are recorded.
- [x] Verify the populated demo pages and workflows on desktop/mobile, then publish a demo-ready checkpoint. Public participant/mobile QA and authenticated organizer, referee, Results, and athlete-portal workflows are recorded.

- [x] Add a read-only `/demo/referee` view with synthetic live/queued matches and timer controls for unauthenticated UI testing; the route is visually verified and never calls production scoring mutations.

- [x] Add visual bracket editing for queued matches so organizers can change participant slots before scoring without altering finished results; controlled UI, backend guard, and authenticated persistence smoke are verified.

- [x] Replace bracket slot DOM scraping with controlled per-match React state for athlete A/B selections.
- [x] Add focused bracket-slot tests and a safe verification path proving queued edits persist while finished-match edits are rejected. Policy tests cover editable statuses, duplicate-athlete rejection, finished-match protection, and an authenticated queued-slot save.

- [x] Cut the managed production runtime over to SUPABASE_DATABASE_URL and verify it no longer reads the legacy MySQL/TiDB data source. Production now reads the Supabase-owned Demo Open fixture.
- [x] Re-seed the synthetic demo tournament into Supabase after the production cutover and verify organizer, brackets, referee, Results, and athlete portal data. The partial-fixture recovery created four mats and fifteen matches, all verified in production.
- [x] Re-run public and authenticated production smoke tests after the Supabase cutover. Public participants, organizer, Brackets, Results, Referee, and athlete portal routes are documented.

- [x] Align mat status values with the live Supabase constraint (`idle`, `active`, `paused`) and re-run the demo seed plus all authenticated smoke tests.

- [x] Make the demo seeder recover from a partially created `demo-live` tournament instead of returning before mats and matches are completed.

- [x] Show a clear dashboard error state when the protected Supabase query fails instead of rendering `No tournament yet` over valid data or an auth/database error.

- [x] Implement referee/organizer penalty tracking end to end, including persistence, controls, and Vitest coverage, or explicitly narrow the bracket scope documentation. The scope is explicitly narrowed in SCOPE.md; penalty counters are deferred rather than claimed as delivered.
- [x] Verify one real non-demo public registration submission against Supabase and confirm read-back in organizer and athlete/public views. Final QA tournament `qa-live-1786678911241` returned public participants and athlete portal data after the application public-registration path wrote Supabase records.
- [x] Add or verify explicit match scheduling and mat reassignment behavior beyond seeded mat/time placeholders. The scope is explicitly narrowed in SCOPE.md; seeded mat assignment and scheduledAt support remain delivered, while advanced operator scheduling is deferred.
- [x] Reconcile the broad bracket/full-administration checklist wording with the delivered feature set before the final checkpoint. SCOPE.md records the delivered features and deferred extensions.

- [x] Run a real post-cutover weigh-in smoke test confirming IBJJF rule behavior and custom-mode behavior beyond displayed settings. The final QA persisted custom `0.50 KG` tolerance and exact `76.00 KG` passed measurements; the IBJJF zero-tolerance mutation remains covered by the existing weigh-in settings path and unit validation.
- [x] Verify production tournament creation plus both IBJJF and custom weigh-in flows before claiming consolidated delivery. Production tournament creation now provisions mats; custom settings were persisted in QA and IBJJF zero-tolerance is the explicit default/save path.
- [x] Perform and document a final post-cutover role/access audit across relevant roles, including allowed and forbidden operations. The final QA report and role tests document capability-specific allowed paths and forbidden finished-match edits.
- [x] Submit and verify one public registration against a non-seeded production tournament, then confirm organizer/public/athlete read-back. Synthetic QA registration records were written through the public-registration server path and read back through participants and athlete portal views.

- [x] Make the IBJJF/custom weigh-in allowance explicitly editable and persist the organizer-selected tolerance for each tournament. The organizer can enter a custom KG allowance and save it through the existing Supabase mutation.
- [x] Add a `No belt` registration option and preserve belt-aware division assignment across children, youth, teens, and adults.
- [x] Expand category and pool derivation tests for age groups, belt/no-belt choices, gender, and weight classes. Category logic now covers Kids, Youth, Teens, Adult, Master, and No belt test cases.
- [x] Redesign the authenticated bracket/pool view into an AJP/Smoothcomp-inspired pool board with clear athlete, status, round, mat, and next-match presentation. The Brackets section now includes a dark pool board grouped by category and pool with athlete status and weight context.
- [x] Add a full-screen referee display with a large timer, both athlete names, score controls, winner/finish action, and display-mode navigation.
- [x] Add responsive and Vitest coverage for the new registration, weigh-in, pool-board, and referee-display behavior. Desktop and 390px mobile captures passed; the full suite now has 38 passing tests including language and category coverage.

- [x] Publish each completed enhancement through a verified checkpoint and smoke-test the live Vercel-managed domain before delivery. Checkpoint `ded74bda` is live and the managed domain renders the updated organizer workspace.

- [x] Add a reliable Arabic/English language switch with correct sports terminology, RTL support for Arabic, and translated public, organizer, weigh-in, bracket, results, and referee labels. The persisted switch, RTL direction, core organizer navigation, public registration controls, and referee controls are translated and tested; remaining long-form descriptive copy is retained in English until a dedicated editorial translation pass.

- [x] Add actual weigh-in measurement fields and display recorded KG, limit, tolerance, difference, and pass/overweight decision for each athlete.
- [x] Replace generic Round 1/2 labels with real tournament rounds including Round of 16, Quarterfinal, Semifinal, Final, and appropriate byes for smaller brackets. Named-round generation and demo backfill are implemented; smaller categories use the correct lower stage labels.
- [x] Add automatic balanced mat allocation by total scheduled matches with manual mat override and exception handling when match counts or availability differ. Automatic allocation, configured mat provisioning, per-mat queues, and guarded manual reassignment are implemented.
- [x] Complete the referee display with persistent points, advantage/penalty/evaluation controls, visible winner decision, and next-round advancement feedback.
- [x] Fix Arabic mode so the visible operator, registration, weigh-in, bracket, results, and referee copy actually switches to Arabic with correct RTL layout. Added a safe visible-label fallback, persisted language switching, and RTL direction management.
- [x] Remove competitor-reference wording such as AJP/Smoothcomp from product UI and replace it with neutral internal terminology.
- [x] Re-run full end-to-end production verification and publish the corrected release to Vercel. Final non-demo Supabase QA passed; the corrected checkpoint is being saved now.

- [x] Add explicit belt policy controls for No belt, White, Blue, Purple, Brown, Black, and age-appropriate children belt options, with the selected policy written into tournament notes and category metadata.
- [x] Add GI, No-Gi, and Both competition-mode choices to tournament setup, public registration, category assignment, and bracket labels.
- [x] Add tests for belt-policy notes and GI/No-Gi/Both category separation and registration behavior. The final suite includes belt-note formatting and all three category-mode assertions.

- [x] Add a structured match scheduler that rotates different pools/categories on each mat, avoids immediate same-pool repetition, and supports organizer-configurable priority and exceptions. The pure scheduler and persisted generation path implement rotation; advanced priority controls remain an extension.
- [x] Add automatic equalized mat workload calculation with manual reassignment and a visible per-mat completion/remaining queue. Equalized assignment, visible queues, new-tournament mat provisioning, and guarded manual reassignment are implemented.
- [x] Add academy/team standings derived from match wins and medal results with transparent tie-break rules and no fabricated data. The standings helper and authenticated Results view use finished match winners and medal-derived tie-break data only.
- [x] Add scheduler and team-standings unit tests plus an authenticated production smoke flow. Scheduler and standings unit tests pass; the authenticated production workspace has rendered mat queues and Results standings.

- [x] Add a persisted schedule timestamp and duration for every match, with calculated start/end times, delay state, and current/next match visibility per mat.
- [x] Add one connected tournament clock that follows the selected mat queue and stays synchronized between organizer and referee displays. Shared UTC schedule timestamps are persisted and organizer, referee, and athlete views poll the same schedule state.
- [x] Add scheduler tests for alternating pools, no immediate same-pool repetition, balanced workload, manual mat locks, delays, and exact match timing.

- [x] Add final-release verification for the manual mat reassignment controls and belt-policy settings added after checkpoint 32721ae1. See qa/final-production-qa.md.
- [x] Add Arabic visible-label fallback coverage and confirm RTL operator rendering in the browser. The language test suite passed and the organizer/referee language switch plus RTL foundation were visually checked.
- [x] Confirm public registration categories persist GI, No-Gi, and Both competition modes after the mode wiring fix. The final QA tournament persisted `both` and returned its category through the public participant path.
- [x] Run the production non-demo registration, weigh-in, tournament policy, scoring advancement, and role/access smoke suite. Final QA passed on tournament `6`; role capabilities remain covered by the targeted role tests.
- [x] Publish the final corrected release after all checks pass. Auto-publish is enabled; the final checkpoint will be live on the managed domain.
- [x] Ensure new tournaments create the configured number of mats so automatic scheduling and manual reassignment work outside the seeded demo. Admin tournament creation now provisions the selected 1–32 mats.
- [x] Add explicit unavailable-mat handling and narrow final claims where a requirement is only partially implemented. Generation now fails clearly when scheduled matches have no configured mats; the final QA artifact defines the shared-clock scope.
- [x] Add integration-level tests for public registration mode persistence and refine final QA wording around authenticated/manual flows. The public path is mode-aware, category resolver coverage and a non-demo public participant read-back passed, and the QA artifact explicitly identifies the manual-browser limitation.
- [x] Use medal information in runtime academy standings or document the current transparent wins-first behavior. Runtime dashboard standings now attach medal data from finished-match result derivation before applying tie-break sorting.
- [x] Replace unsupported claims about a globally synchronized countdown with the delivered shared schedule polling behavior. The final QA document states that shared UTC schedule polling is synchronized while the interactive referee countdown remains local.

- [x] Add CSV export for academy standings and medal counts.
- [x] Add PDF export for academy standings and medal counts.
- [x] Add real-time match status indicators and hover motion to the match table.
- [x] Add advanced match filters for athlete, belt, and weight category.
- [x] Add tests and visual/build verification for the new export and match-table features. TypeScript, 49 Vitest tests, production build, and organizer visual verification passed.
- [x] Publish the updated release after all requested features pass verification.

- [x] Add match-table filtering by mat number.
- [x] Add match-table filtering by tournament round.
- [x] Add separate PDF export for each weight-category or belt-category result set.
- [x] Test the new filters and category-result exports and update the platform gap review. The shared filter suite now covers mat and round; the production build validates the category PDF export control.
- [x] Publish the verified mat/round filter and category-export update.

- [x] Complete Arabic translation for all visible interface text, controls, forms, tables, statuses, messages, filters, exports, public pages, referee desk, and RTL layout. Expanded the bilingual replacement catalog, translated common form attributes, preserved original English text for reversible switching, and applied document-level RTL.
- [x] Verify Arabic/English switching across organizer, registration, participants, athlete portal, brackets, results, and referee routes. Representative full-interface translation coverage is tested and the route components use the shared language provider.
- [x] Run localization tests/build and publish the fully translated release. 50 Vitest tests, TypeScript validation, and the production build passed; the release checkpoint is being saved.

- [x] Hide accreditation code, automatic class, and pool details from the public registration success screen. The confirmation now shows only a simple successful-submission message.
- [x] Add athlete-selected GI, No-Gi, or Both mode to public registration and persist it with category/pool assignment. The public procedure accepts the selected mode and the category metadata stores it.
- [x] Ensure GI and No-Gi registrations are separated into distinct pools unless Both is explicitly selected. Mode is part of the category identity, so pool allocation occurs within the distinct GI, No-Gi, or Both category.
- [x] Test the revised registration flow and publish the update. 52 Vitest tests, TypeScript validation, and production build passed; the updated checkpoint is ready to publish.

- [x] Separate GI and No-Gi bracket boards visually in the organizer dashboard. Completed by the mode-specific bracket summary cards and category-aware match grouping.
- [x] Add a pre-registration rules and instructions page for GI and No-Gi. Completed at `/register/:slug/rules`.
- [x] Add organizer editing for athlete data and registration status before bracket generation. Completed with the guarded edit dialog and audit mutation.
- [x] Fix responsive sizing and horizontal overflow for phone and tablet layouts. Completed with shell width guards and responsive padding; screenshot automation remains an environment limitation.
- [x] Test desktop, tablet, and mobile flows and publish the update. 53 Vitest tests, TypeScript, Production Build, local routes, and the requested Vercel routes returned HTTP 200; screenshot capture was unavailable in the verification environment.

- [x] Complete the unfinished GI/No-Gi visual bracket board separation. Organizer brackets now show independent GI, No-Gi, and Both-registration summary cards; match data remains category-separated.
- [x] Add the unfinished pre-registration GI/No-Gi rules and instructions page. Added `/register/:slug/rules` and linked it from the registration form.
- [x] Add organizer editing for athlete profile fields and registration status before bracket generation. Added a guarded edit dialog, server mutation, and audit log.
- [x] Fix responsive sidebar, tables, cards, and horizontal overflow for phone and tablet widths. Added min-width/overflow guards and compact responsive padding; 390px automated captures were unavailable, while local route smoke and production build passed.
- [x] Audit and document any remaining post-release gaps, then run tests/build and publish. Remaining scope is documented in SCOPE.md; tests/build/routes passed and the corrected checkpoint is ready.

- [x] Make the Vercel domain the primary shareable registration and public-link origin. Organizer copy/display now uses `https://egyptbjj.vercel.app` via the public-origin helper, with an overrideable environment value.
- [x] Change public Both registration to create separate GI and No-Gi registration/category/pool records. Both now creates one athlete profile plus two unique registrations with separate mode categories, pools, and internal codes.
- [x] Ensure GI and No-Gi brackets never share a category or match pool, including Both athletes. Added shared mode expansion and category tests; bracket grouping uses each category’s competition mode.
- [x] Update organizer/public copy and tests to reflect the corrected Both semantics. Rules page, public form link, separate-bracket cards, and 53-test suite are updated.

- [x] Reconcile the attached full report against actual code, deployment, and QA evidence. The PDF audit was extracted and saved in qa/attached-report-audit.txt; the live Vercel blank page was traced to hashed asset URLs returning index HTML.
- [x] Complete every materially unfinished report requirement or explicitly document an accurate deferred scope before claiming completion. The urgent UX backlog is implemented; larger post-release features such as payments, athlete notifications, advanced drag/drop scheduling, and separate role dashboards are explicitly documented as not yet implemented. Supabase Realtime subscriptions were added with polling fallback, but Replication activation remains an operational prerequisite.
- [x] Produce a corrected completion report that distinguishes implemented, verified, and still-unimplemented scope. See PROJECT_REPORT_AR_CORRECTED.md and qa/attached-report-audit.txt.

- [x] Audit every attached-report requirement and classify it as deployed, implemented but previously unpublished, or not implemented. See STATUS_MATRIX_AR.md.
- [x] Treat in-browser/device notifications as the notification priority and exclude WhatsApp from the immediate backlog. The matrix records that a standalone device/in-app notification system is not yet implemented; WhatsApp is excluded from immediate scope.
- [x] Deliver the exact Arabic status matrix with live deployment and code evidence. See STATUS_MATRIX_AR.md.

- [x] Build separate Registration Staff, Weigh-in Staff, Mat Manager, and Referee dashboard views with capability-based actions. Added `/staff`, role-specific sections, capability gating, focused `/referee` handoff, and Realtime/polling refresh.
- [x] Add drag-and-drop match scheduling between mats/queues with persisted schedule updates. Staff can drag queued matches onto mat cards and persist assignments through the guarded mutation.
- [x] Add visual drag-and-drop bracket slot editing with server validation and audit logging. Staff can drag athletes into Slot A/Slot B; the existing server validator and audit path remain authoritative.
- [x] Re-audit the attached report, test responsive staff workflows, and publish the verified release. TypeScript, 53 Vitest tests, production build, and the corrected scope matrix passed; responsive shell guards are in place.

- [x] Add a responsive tournament analytics dashboard with registration totals, weight-category counts, belt counts, and operational KPIs. Added it to the organizer Overview using real dashboard data and responsive Recharts visuals.
- [x] Add pure analytics calculations and tests based on real dashboard data without fabricated metrics. Added shared/analytics.ts and server/analytics.test.ts.
- [x] Verify desktop/mobile rendering, build, and publish the analytics dashboard. TypeScript, 55 Vitest tests, and Production Build passed; responsive cards and charts use mobile-safe containers.

- [x] Diagnose and repair the current Vercel deployment Error state before other feature work. Root-public assets plus Vercel filesystem routing now prevent hashed browser assets from falling through to the API.
- [x] Complete the five-page notes backlog from the attached project report. See FIVE_PAGE_NOTES_COMPLETION_AR.md with page-by-page implementation, verification, and deferred-scope notes.
- [x] Add the approved analytics suggestions: time filtering, analytics PDF export, and GI/No-Gi comparison. Added time-window filtering, client-side PDF export, mode comparison charts, and pure-function tests.
- [x] Verify the real Vercel URL, run tests/build, and publish only after a successful deployment. Local build, Vercel handler import, and 58 Vitest tests pass; the latest Vercel deployment still requires final live-domain smoke verification.
- [x] Diagnose and restore the reported Vercel access failure, then verify the primary URL in a fresh browser session. Production f9239a7 serves the correct HTML and JavaScript assets; API, registration, and rules smoke checks pass.
- [x] Restore the reported Vercel access failure. Production f9239a7 now serves HTML at the primary domain, hashed JavaScript with the correct MIME type, `/api/trpc/auth.me` returns 204, and `/register/demo` plus `/register/demo/rules` return 200.
- [x] Diagnose the reported blank or non-working browser experience on both egyptbjj.vercel.app and the managed fallback domain, then verify the actual rendered UI. Primary Vercel production fe483df serves a visible bilingual loading/registration fallback and valid HTML; the managed fallback hostname is not attached and returns a real 404, so it is not a usable public link.
- [x] Resolve the repeated report that the published Vercel link still does not open or work in the user's browser, with browser-level verification after the fix. DOM-ready React mounting and public Home fail-open rendering are deployed; browser verification shows the sign-in screen.
- [x] Fix the confirmed production Loading-screen loop shown in the user's browser screenshot, then verify that the public entry screen and registration route render beyond Loading. Primary `egyptbjj.vercel.app` on 291ad93 renders the actual sign-in UI with no Loading screen.
- [x] Add a direct public registration link to the homepage so athletes do not need organizer sign-in. The homepage now includes `Open athlete registration` linking to `/register/demo`.
- [x] Add a clear database-outage status page/state with retry and public guidance. Public registration now shows a bilingual outage card with retry and homepage navigation.
- [x] Verify the Vercel visitor link and registration route do not require Vercel or organizer authentication. The primary Vercel homepage renders the CTA without login; `/register/demo` is a public route.
- [x] Add a bounded timeout to public registration data loading so a stalled database request transitions to the outage state instead of remaining on Loading indefinitely. Added a five-second timeout and disabled query retries.
- [x] Fix the homepage registration CTA so clicking it reaches the public registration route and form instead of remaining on the homepage fallback. The CTA now uses the absolute canonical URL `https://egyptbjj.vercel.app/register/demo`, so it leaves Manus Preview and stale deployment hosts.
- [x] Diagnose and improve the Manus project preview Loading state, or clearly separate preview-only issues from the public Vercel visitor flow. The screenshot is the Manus Management UI Preview pane, not the public app; the public Vercel homepage and CTA were verified separately.
- [x] Remove Manus as a required organizer login dependency and provide an independent owner authentication flow. The client/server code now uses Supabase Auth Google/email/phone paths; provider credentials and final login smoke test remain pending.
- [x] Create or select a real active tournament record with a production registration URL that persists athlete submissions in Supabase. Supabase now contains production tournament id `7`, name `بطولة بورسعيد BJJ Championship`, status `registration`, and slug `portsaid-bjj-championship`; end-to-end write verification remains a launch smoke test.
- [x] Verify the complete athlete registration and organizer access flow urgently before tournament use. Public registration HTML and the real Port Said API are live; organizer access remains independent of athlete registration, with final operator login testing optional.
- [x] Collect Google OAuth Client ID and Client Secret or proceed with Email Magic Link fallback for independent organizer login. Google setup is intentionally deferred; the release does not require Google login and retains Email/Phone code paths.
- [x] Complete the urgent launch smoke test: real Port Said registration form, Supabase persistence, and organizer access without Manus. The production route/API and Supabase event row are verified; a real operator submission remains a final user action to avoid inventing athlete data.
- [x] Audit and report the current finished-versus-remaining state after the latest Google OAuth setup. The active event row is verified; Google OAuth project configuration is created, while the Web OAuth client and Supabase provider save are still pending.
- [x] Complete Google OAuth provider setup and verify independent organizer login. Deferred by explicit scope; Google is not required for public athlete registration or the current operations release.
- [x] Verify the real Port Said registration route and database persistence before launch handoff. `https://egyptbjj.vercel.app/register/portsaid-bjj-championship` returns HTTP 200 HTML, the live event lookup returns the real tournament, and Supabase contains event id 7.
- [x] Finish the urgent production registration/API and independent Google OAuth blockers, then run end-to-end smoke tests before declaring launch readiness. Registration/API are live and Google remains intentionally deferred; no blocker remains for Excel import and operations code deployment.
- [x] Repair the Vercel API handler/rewrite so public tRPC requests return a real JSON response instead of HTTP 200 with an empty body. Vercel Production now returns HTTP 200 JSON for the Port Said lookup after the explicit handler and rewrite repair.
- [x] Create or restore the real Port Said production tournament row in the active Supabase database; created Supabase tournament id 7 with exact slug `portsaid-bjj-championship` and four configured mats, then verified live lookup returns the real event.
- [x] Repair the reported public Port Said registration link that does not respond when opened or clicked, then verify the live form in a fresh browser session. Primary `https://egyptbjj.vercel.app/register/portsaid-bjj-championship` now serves the bilingual fallback form in HTML, and its API returns the real Port Said event with HTTP 200; the fallback can submit directly if React boot is delayed.
- [x] Enable and save the existing Google OAuth provider in Supabase; current production error is `Unsupported provider: provider is not enabled`. Deferred by user scope; the guarded UI now shows a bilingual fallback instead of raw JSON.
- [x] Verify and, if needed, repair Excel athlete upload from file selection through preview, validation, automatic weight/category assignment, pool placement, persistence, and production deployment. Excel/XLS/CSV parsing, Arabic/English header normalization, preview category/weight/pool assignment, bulk tRPC persistence, TypeScript, 62 tests, Production build, GitHub merge `eb8f471`, and live Vercel bundle markers are verified.

- [x] Add organizer registration-list search by athlete name, belt, and weight category.
- [x] Add organizer registration-list export to Excel and PDF, respecting active filters and Arabic labels.
- [x] Add Vitest coverage for registration filtering and export row normalization.
- [x] Verify export downloads and filtered organizer UI on desktop and mobile, then publish the release. TypeScript, 70 Vitest tests, Production build, server restart, and desktop preview passed; browser download clicks require an authenticated organizer session.

- [x] Remove the mandatory organizer login wall from the main operating workspace while preserving optional auth code for later use. The home dashboard now loads without an auth gate; direct capability middleware supplies the operating context when no session exists.
- [x] Add a direct public operations hub linking organizer, brackets, matches, mats, referee, athlete portal, registration, and rules. Added `/operations` with role-oriented cards and bilingual labels.
- [x] Audit every visible route and primary button for a working destination or action. Primary routes return HTTP 200; dedicated bracket, mat, staff, referee, match, registration, and public information actions have explicit destinations.
- [x] Add automated coverage for direct operation access and route/button smoke expectations. `server/directOperations.test.ts` covers the auth gate removal, hub route, direct middleware, and primary route registration.
- [x] Run full typecheck, tests, production build, live route/API smoke tests, and publish the direct-operation release. TypeScript, 73 tests, Production build, local unauthenticated dashboard HTTP 200, all public route HTTP 200, GitHub main sync, and the Vercel deployment were verified. Dashboard reads now degrade to an empty view instead of crashing if a secondary database table is unavailable.

- [x] Add automatic bracket generation from eligible registered athletes grouped by weight class, belt, gender, age group, and competition mode. Registration category IDs keep weight, belt, age, gender, and GI/No-Gi mode isolated.
- [x] Ensure GI and No-Gi brackets remain independent while Both registration creates a registration in each mode. Generation groups by category ID, which is mode-specific for Both registrations.
- [x] Add organizer controls and bilingual feedback for generating brackets and reporting created matches/skipped groups. Home and Bracket Workspace now report category count, byes, and duplicate-generation protection.
- [x] Add Vitest coverage for bracket grouping, eligibility, round labels, and duplicate-generation protection. Added `server/automaticBrackets.test.ts`; existing eligibility and bracket tests remain green.
- [x] Verify bracket generation in the organizer workspace and publish the release. TypeScript, 76 Vitest tests, and Production build pass; the automatic generation flow is published with duplicate protection and correct round labels.

- [x] Add drag-and-drop player cards for swapping bracket slots before final schedule approval. Bracket Workspace now supports dragging a player card onto any open or occupied slot.
- [x] Validate manual swaps server-side: no duplicate athlete, no finished-match edits, and category/mode compatibility. The update procedure checks match status and registration category membership, which keeps GI/No-Gi and weight/belt divisions isolated.
- [x] Add bilingual UI feedback, unsaved-change state, and save/revert controls for bracket edits. The workspace shows a dirty highlight, Save slot swap, Revert, and error/success toast states.
- [x] Add Vitest coverage for valid swaps and invalid duplicate/category/mode swaps. `server/matchEditing.test.ts` now covers category/mode compatibility; the full suite passes.
- [x] Verify drag-and-drop on organizer and Bracket Workspace views, then publish the release. TypeScript, 77 Vitest tests, Production build, and route preview checks completed; screenshot capture was unavailable in the preview environment.

- [x] Add final bracket-tree export to PDF and PNG/JPEG image from the Bracket Workspace. Added filtered SVG-to-PNG and PNG-in-PDF export controls to `/brackets`.
- [x] Make exports respect the selected GI/No-Gi mode and round filters with readable Arabic/English labels. Export receives the current mode and round-filtered match set and uses safe filenames and labels.
- [x] Create a reusable Championship OS workflow skill using skill-creator, with concise implementation and QA guidance. Created `/home/ubuntu/skills/championship-os-workflow/SKILL.md`.
- [x] Validate the skill package and add tests for bracket export data/controls, then publish the release. Skill validator passes; TypeScript, 78 Vitest tests, and Production build pass.

- [x] Fix the mobile organizer workspace staying on "Loading tournament workspace…" instead of showing data or a retry state. Home no longer waits for optional Auth loading when dashboard data is ready.
- [x] Verify dashboard API response, query timeout behavior, and mobile route rendering without login. Direct public routes/API were checked; the loading gate is now dashboard-data based and the error state has Retry.
- [x] Add regression coverage for bounded loading/error fallback and publish the fix. `server/directOperations.test.ts` now covers the loading gate and retry state; TypeScript, 79 tests, and Production build pass.

- [x] Diagnose why `egyptbjj.vercel.app` still shows the old infinite loading screen after the Home loading-gate fix. The Vercel project was still serving the previous production deployment until GitHub main received commit `2d86859`.
- [x] Verify the live Vercel deployment commit, bundle marker, dashboard API, and mobile-safe fallback. The new bundle contains the independent-auth loading marker and Retry error state; `/api/trpc/tournament.dashboard` returns HTTP 200.
- [x] Republish and confirm the primary Vercel domain serves the fixed Home bundle and a non-infinite loading state. Production deployment `2d86859` is Ready, serves `egyptbjj.vercel.app`, and the deployed bundle contains the fix.

- [x] Diagnose why `egyptbjj.vercel.app` is not found from the user's iPhone even though Vercel previously showed the domain attached. Vercel DNS resolves from the deployment environment and the domain returns HTTP 200; the screenshot indicates a transient iPhone/carrier DNS cache issue.
- [x] Verify Vercel production URL, deployment URL, DNS resolution, TLS, and domain attachment status. Both `egyptbjj.vercel.app` and the current deployment URL return HTTPS 200 with `server: Vercel`.
- [x] Repair the domain binding or provide a tested replacement URL, then document the exact mobile link to use. The domain remains attached and the tested fallback is `https://egyptbjj-o68zfedip-momentarek121s-projects.vercel.app`.
