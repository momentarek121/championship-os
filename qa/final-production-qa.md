# Championship OS — Final Production QA

## Scope

This verification was run against the Supabase-backed production configuration using a fresh non-demo tournament created through the application database helpers. The records are synthetic QA records and are clearly named `QA Live`; they do not alter the seeded `demo-live` fixture.

## Evidence

| Check | Result | Evidence |
|---|---|---|
| Non-demo tournament creation | Passed | Tournament ID `6`, slug `qa-live-1786678911241` |
| Public registration write and read-back | Passed | `ATH-00035` and `ATH-00036`; participant category and athlete portal returned the submitted athlete |
| Competition mode | Passed | Tournament persisted `both`; category resolver tests cover GI, No-Gi, and GI + No-Gi labels |
| Weigh-in policy | Passed | Custom mode persisted with `0.50 KG` tolerance |
| Exact weigh-in | Passed | `76.00 KG` recorded with passed status and an explicit measurement note |
| Belt policy | Passed | Tournament notes contain the selected belt policy, including children’s belt-band note |
| Mat provisioning | Passed | New tournaments create the configured mat set; QA reassignment persisted to Mat 2 |
| Named rounds | Passed | Four-athlete bracket produced Semifinal and Final records after the round-generation correction |
| Live scoring and advancement | Passed | Finished match persisted winner, score, advantage, and evaluation; winner advanced into the Final feeder slot |
| Automated tests | Passed | 46 Vitest tests and TypeScript validation passed |
| No-mat exception | Passed | Bracket generation now returns a clear error when matches exist but no mats are configured |
| Shared clock scope | Passed with defined scope | Organizer, referee, and athlete pages poll the same persisted UTC schedule; the referee’s interactive countdown remains local to the selected desk |
| Production build | Passed | Vite client and server bundle completed successfully |

## Access audit

The role matrix remains capability-based. Admin/owner procedures cover tournament setup and policy changes; registration staff procedures cover permitted registration fields; weigh-in staff procedures cover measured weight and weigh-in status; bracket procedures cover bracket generation, queued slot edits, and manual mat reassignment; referee procedures cover live status changes and scoring; athlete access remains intentionally limited to the public portal lookup path. The targeted role tests and field-level permission tests passed in the final suite. Finished match slot edits and finished-match mat reassignment remain rejected by server-side guards. The final route smoke verifies the public registration and participant pages; a fresh browser login/manual-pairing interaction was not repeated in this pass, so those remain covered by the earlier authenticated QA artifacts and existing mutation tests.

## Visual verification

The organizer root, public QA registration page, and protected referee desk were captured at desktop width. The referee desk showed the live queue, named rounds, mat assignment, digital timer, score controls, and winner workflow. The public registration page showed the open registration state and custom weigh-in rules. The organizer setup showed explicit GI/No-Gi/Both selection and selectable adult/children belt options. The Arabic implementation includes the dictionary-backed controls, RTL direction, and a legacy-label fallback; a dedicated editorial pass is still recommended for long-form descriptive copy.

## Caveat

The QA smoke uses synthetic records and application helpers to avoid requiring a human to submit personal data. The browser-facing public registration form and public route were visually verified separately; the persisted write/read-back was verified through the same public-registration server path used by the form.
