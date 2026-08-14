# Demo Bracket QA

The public `/demo/brackets` route was visually checked at desktop 1280px and mobile 390px widths. The route clearly labels itself as a demo fixture with synthetic athletes only, presents four representative divisions (children, girls, boys, adult), shows pool labels and a round flow, and displays finished, live/queued-style match states with winner emphasis. The mobile layout stacks division selectors and match cards without horizontal overflow in the captured viewport. The fixture is static and does not modify production registration data.

After the latest server restart, both `/` and `/demo/brackets` were rechecked at 1280px. The organizer workspace loaded normally with the Demo brackets shortcut visible, and the demo bracket board rendered with all four divisions. The earlier blank/loading capture was transient during restart, not a persistent route error.

The published managed domain was smoke-tested after checkpoint 55dee928: `/` returned HTTP 200 and `/demo/brackets` returned HTTP 200. The demo route is static and does not call registration or write procedures.

Published public-route smoke results: `/event/demo/participants`, `/rankings`, `/news`, and `/regulations` returned HTTP 200. `/membership` also returned HTTP 200 with a response body, although curl reached its timeout after receiving 9,565 bytes; this indicates the route responded but the connection did not close within the client timeout and should be watched during a browser check.
