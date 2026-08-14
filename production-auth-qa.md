
## Bracket persistence smoke

With the user's confirmation, the authenticated Brackets page changed queued Round 2 Match 3 athlete A from Adam Demo to Omar Demo and saved the slot. The page re-rendered with `Omar Demo` versus `Youssef Demo`, confirming the controlled React state, save mutation, Supabase persistence path, and refreshed dashboard data. Finished matches remained non-editable in the UI.

## Results and Referee smoke

The authenticated Results section rendered Gold, Silver, and Bronze placements for Kids, Girls Youth, Boys Teens, Women Adult, and Men Adult divisions from the generated Round N matches. The authenticated `/referee` desk then loaded a live Match 2 plus queued Matches 3, 5, 8, 11, and 14. It showed score inputs, a 10:00 digital timer with Start and Reset, and the `Finish match and advance winner` control. No scoring mutation was performed during this verification.

## Supabase production cutover

After deploying the Supabase secret and recovering the partial fixture, the published authenticated organizer workspace now reads the Supabase-backed Demo Open correctly: 20 registered athletes, 15 paid, 15 checked in, 15 total matches, and 1 live match. The Supabase ownership diagnostic confirms one user (`tmomen521@gmail.com`), one demo tournament owned by that user, four mats, and fifteen matches. During route verification an accidental New tournament modal was opened and closed without submitting any mutation.

## Public Supabase flow

The public `/event/demo-live/participants` route loaded without organizer authentication and rendered all five Demo Open divisions. Each division showed four registrations, three approved athletes with Pool A labels, and one expandable unapproved registration count. The public `Register for this event` link is present and points to `/register/demo-live`.

## Athlete portal verification

The public `/athlete/demo-live` portal accepted `DEMO-00001` and resolved Adam Demo from Supabase. It showed the Championship OS Demo Open registration as approved, weigh-in as passed, the queued next match Round 2 · Match 3 on Mat 1 with time TBA, and bracket history for finished Round 1 · Match 1 plus queued Round 2 · Match 3.

## Supabase Brackets verification

The authenticated production Brackets section loaded the completed Demo Open fixture from Supabase. It rendered all five division match groups with finished, live, and queued states, four mats, and controlled athlete selectors. Queued Match 3 showed Adam Demo versus Youssef Demo in the current database state; the earlier Omar Demo persistence test was performed before the production cutover and did not overwrite this post-cutover fixture.

## Supabase Results and Referee verification

The authenticated production Results section rendered medal placements across Kids, Girls Youth, Boys Teens, Women Adult, and Men Adult divisions from the Supabase-backed match results. The `/referee` desk then loaded the live Round 1 · Match 2 queue item plus queued Matches 3, 5, 8, 11, and 14, with score inputs, a 10:00 digital timer, Start and Reset controls, and Finish match and advance winner. No scoring mutation was performed.

## Real public registration write/read-back

With the user's confirmation, the public form submitted one synthetic registration named `QA Supabase Athlete` using non-personal QA contact data. Supabase read-back found accreditation code `ATH-00021`, status `pending`, and category `Juvenile / Male / White / -77 KG`. The public athlete portal accepted `ATH-00021` and rendered the athlete, tournament, category, pending registration/weigh-in states, and the expected no-match-yet empty state. A local helper write also succeeded for a separate QA-only record, confirming the PostgreSQL mutation path independently.

## Scheduler backfill

The idempotent `demo-live` recovery completed against Supabase with `created: false`, updating the existing fixture rather than duplicating it. Existing generic Round 1/2 records were normalized to named semifinal/final stages and all matches received mat queue order, scheduled start, duration, and delay metadata.
