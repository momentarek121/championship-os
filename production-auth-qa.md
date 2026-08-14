
## Bracket persistence smoke

With the user's confirmation, the authenticated Brackets page changed queued Round 2 Match 3 athlete A from Adam Demo to Omar Demo and saved the slot. The page re-rendered with `Omar Demo` versus `Youssef Demo`, confirming the controlled React state, save mutation, Supabase persistence path, and refreshed dashboard data. Finished matches remained non-editable in the UI.

## Results and Referee smoke

The authenticated Results section rendered Gold, Silver, and Bronze placements for Kids, Girls Youth, Boys Teens, Women Adult, and Men Adult divisions from the generated Round N matches. The authenticated `/referee` desk then loaded a live Match 2 plus queued Matches 3, 5, 8, 11, and 14. It showed score inputs, a 10:00 digital timer with Start and Reset, and the `Finish match and advance winner` control. No scoring mutation was performed during this verification.
