# Demo Bracket QA

The public `/demo/brackets` route was visually checked at desktop 1280px and mobile 390px widths. The route clearly labels itself as a demo fixture with synthetic athletes only, presents four representative divisions (children, girls, boys, adult), shows pool labels and a round flow, and displays finished, live/queued-style match states with winner emphasis. The mobile layout stacks division selectors and match cards without horizontal overflow in the captured viewport. The fixture is static and does not modify production registration data.

After the latest server restart, both `/` and `/demo/brackets` were rechecked at 1280px. The organizer workspace loaded normally with the Demo brackets shortcut visible, and the demo bracket board rendered with all four divisions. The earlier blank/loading capture was transient during restart, not a persistent route error.

The published managed domain was smoke-tested after checkpoint 55dee928: `/` returned HTTP 200 and `/demo/brackets` returned HTTP 200. The demo route is static and does not call registration or write procedures.

Published public-route smoke results: `/event/demo/participants`, `/rankings`, `/news`, and `/regulations` returned HTTP 200. `/membership` also returned HTTP 200 with a response body, although curl reached its timeout after receiving 9,565 bytes; this indicates the route responded but the connection did not close within the client timeout and should be watched during a browser check.

## Populated demo fixture verification — 2026-08-14

The admin-only demo seeder created `Championship OS Demo Open` with slug `demo-live`, five divisions, twenty synthetic athletes plus the existing two records, twenty-two registrations, four mats, and fifteen matches. The newest tournament is selected first in the organizer dashboard, which now displays 22 registered athletes, 15 paid, 15 checked in, and 1 live match.

The desktop organizer capture showed the demo tournament, `/register/demo-live`, Demo brackets, Referee desk, and populated operational metrics. The mobile captures showed the organizer controls wrapping cleanly and the public `/event/demo-live/participants` directory rendering the Kids division with approved athletes and pool labels. Demo names are synthetic and marked with `Demo`; the fixed `demo-live` slug prevents duplicate seeding.

The referee route intentionally requires an authenticated staff session; its unauthenticated state shows the access-required boundary rather than exposing scoring controls publicly.

## Seeded workflow verification — 2026-08-14

A read-only server verification found the `demo-live` tournament with 20 synthetic athletes, 20 demo registrations, 15 matches, 15 passed weigh-ins, and 5 overweight cases. A real portal lookup using the seeded accreditation code `DEMO-30001` returned `Adam Demo`, the assigned category, and a next match in `Round 2`. The organizer dashboard now selects the demo tournament first by newest ID, while the older real tournament remains in the database.

Browser captures prove the populated organizer Overview and public participants route. Browser authentication is still required to capture the protected Results and Referee screens with the seeded match data; the verifier confirms the underlying records are present without modifying them.

## Seeded public route smoke test — 2026-08-14

The local preview returned HTTP 200 for `/register/demo-live`, `/event/demo-live/participants`, `/athlete/demo-live`, `/demo/brackets`, and `/demo/referee`. The athlete route presents the accreditation-code lookup form; the seeded code `DEMO-30001` was verified separately through the read-only server workflow check.
