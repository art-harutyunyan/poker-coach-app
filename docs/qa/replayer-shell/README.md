# Replayer Shell QA

Date: 2026-10-16. Phase 0: **READY FOR REVIEW**. Human product approval is pending.

## Results

- Lint, typecheck, formatting and production build pass.
- 89 unit tests pass (eight files).
- 40 browser tests pass: nine shell checks and 31 existing table/replay checks.
- The nine shell checks were rerun after final responsive refinements.
- Chrome at device scale 1; Safari, Firefox and enlarged-text modes are untested.
- No table/seat/card/theme/replay-engine changes. The original geometry checks
  still cover 6/8/9-max at eight widths and nine hand-state checkpoints each.

## Screenshots

| Evidence                         | Files                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Desktop                          | [1600](shell-1600.png), [1440](shell-1440.png), [1280](shell-1280.png)                      |
| Tablet                           | [1024](shell-1024.png), [768](shell-768.png)                                                |
| Mobile                           | [430](shell-430.png), [390](shell-390.png), [375](shell-375.png)                            |
| Expanded controls/history, 9-max | `shell-{width}-expanded.png` at all eight widths                                            |
| Source/app comparisons           | [Desktop](comparison-1440.png), [Mobile](comparison-390.png)                                |
| Focused analysis comparison      | [Analysis](comparison-analysis.png)                                                         |
| Production native cards, flop    | [1440](production-1440.png), [390](production-390.png)                                      |
| 6/8/9-max regression             | `seat-regression/{width}-{count}max.png`                                                    |
| Replay checkpoints               | `seat-regression/{1440,390}-8max-{initial,blinds,raise,call,flop,check,bet,turn,river}.png` |
| All-in                           | `seat-regression/{1440,390}-{6,8,9}max-all-in.png`                                          |

The source captures are one directory above: `shell-source-settings.png` and
`shell-source-replayer-{1440,390}.png`. Early `shell-iteration-*` captures are
historical, not final QA; their remote card images were network-blocked. Final
shell captures use the accepted local Letele deck and regression captures verify
remote Block52 assets with network access.

## Checks

- Readable header, visible tournament tabs, compact rail, desktop analysis beside
  the table and tablet/mobile analysis below it.
- All eight viewports: no page overflow, including expanded history and preview;
  44px Back/Forward/street/review targets; explicitly loaded Inter font.
- Street jumps, Back/Forward, keyboard stepping, Hide Result, fixed analysis
  binding, Context/Decision tabs, sample review marking and Queue navigation.
- Accessible informational dialogs, Escape dismissal, focus restoration and
  mobile access to profile/upload entries. No files uploaded or services called.
- Seat overlap, card mounting, dealer ownership, pot/bet collisions, Hero
  anchoring, folded-card removal, stacks, current actor and all-in states.

## Deliberate Differences

One playable mock hand is shown, not eight fabricated hands. Only implemented
tournament sections are exposed. Poker Coach branding and existing analysis
content are preserved. Theory/exploit modes have not been invented. Coach is
disabled; upload/profile are informational. Mobile keeps the existing top screen
selector instead of adding the prototype's bottom navigation. The expanded
analysis is longer because all existing reasoning and provenance remain visible.

The source's 8-max hand uses different players, stacks, grade and action count.
Comparisons are matched to the same preflop Hero decision after a BTN raise, not
to identical mock content or card artwork. The app's approved table system is
intentionally not evaluated for redesign here.

Run `npm.cmd run test:visual` for all browser checks and
`node scripts/compare-shell.mjs` to regenerate paired captures from the saved
source screenshots. The app should be running at `http://127.0.0.1:5180`.
