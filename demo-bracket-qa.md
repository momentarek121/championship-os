# Demo Bracket QA

The public `/demo/brackets` route was visually checked at desktop 1280px and mobile 390px widths. The route clearly labels itself as a demo fixture with synthetic athletes only, presents four representative divisions (children, girls, boys, adult), shows pool labels and a round flow, and displays finished, live/queued-style match states with winner emphasis. The mobile layout stacks division selectors and match cards without horizontal overflow in the captured viewport. The fixture is static and does not modify production registration data.

After the latest server restart, both `/` and `/demo/brackets` were rechecked at 1280px. The organizer workspace loaded normally with the Demo brackets shortcut visible, and the demo bracket board rendered with all four divisions. The earlier blank/loading capture was transient during restart, not a persistent route error.
