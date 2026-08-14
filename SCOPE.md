# Championship OS delivered scope

Championship OS currently delivers tournament creation, public registration, approval and check-in, IBJJF/custom weigh-in configuration, deterministic category and pool assignment, automatic and manual bracket generation, mat assignment, queued/live/finished match states, controlled queued-slot editing, referee score entry, digital timers, winner advancement, medal results, public participants, and the no-account athlete portal.

The current match record includes a scheduled timestamp field for future scheduling integrations, but the released operator workflow does not expose a dedicated calendar or drag-and-drop rescheduling board. Likewise, the current scorer records numeric scores and winner outcomes but does not persist separate penalty/foul counters. These are intentionally documented as post-release extensions rather than silently represented as completed features. The current release therefore avoids claiming penalty-specific scoring or advanced scheduling controls.

The production QA record is maintained in `production-auth-qa.md`; Supabase adapter and schema evidence is maintained in `supabase-adapter-qa.md` and `DEPLOYMENT.md`.
