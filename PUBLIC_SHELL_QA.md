# Public shell QA record

## Scope

This record covers the original-branded public navigation and event-directory routes added to Championship OS. The routes are designed for a dark sports-federation presentation with a centered brand, utility navigation, responsive headings, and clear data-unavailable states.

## Route matrix

| Route | Desktop 1280×720 | Tablet 768×1024 | Mobile 390×844 | Expected behavior |
|---|---:|---:|---:|---|
| `/event/:slug/participants` | Checked | Checked | Checked | Shows real category groups for a valid slug; shows branded unavailable state for an invalid or unavailable slug; never stays indefinitely on loading after the timeout safeguard. |
| `/rankings` | Checked | Checked | Checked | Shows branded public information state with readable heading, explanatory copy, and back navigation. |
| `/athletes` | Route implemented | Route implemented | Route implemented | Shows the same branded public information state. |
| `/membership` | Checked | Checked | Checked | Shows branded public information state with readable heading, explanatory copy, and back navigation. |
| `/news` | Checked | Checked | Checked | Shows branded public information state with readable heading, explanatory copy, and back navigation. |
| `/regulations` | Checked | Checked | Checked | Shows branded public information state with readable heading, explanatory copy, and back navigation. |

## Acceptance notes

The participant directory uses a responsive grid and keeps its primary content inside a max-width container. The public information pages use responsive typography and a compact mobile header. Utility social icons are intentionally non-interactive until organization links are configured, while the primary navigation items route to real pages. The participant directory uses a 2.5-second response timeout to prevent a frozen loading screen when the database or event slug is unavailable.

The last local verification run passed TypeScript, 11 Vitest tests, and the production build. This artifact should be updated whenever the public shell routes or responsive layout change.
