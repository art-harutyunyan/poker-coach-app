# Nocturne R7 table QA

**Status:** Ready for review. The full Playwright rerun passed on 2026-11-26. No commit, push, merge, or deployment was made.

## Scope

- R6 Browse all panel now floats below the hand strip, caps at 640px wide, and scrolls its rows internally. Keyboard and focus handlers were unchanged.
- The Replayer table uses the R0 aubergine felt and black rail tokens. Hero sits bottom center; seat positions use one clockwise ellipse model for 6, 7, 8, and 9 seats, with compact spacing adjustments at narrow widths.
- Each seat owns its cards, plate, badge, status, dealer button, and separate action chip. Folded seats show no cards. Source revealed cards stay at the opponent size. Hide Result continues to conceal them.
- Four and five board cards scale to 36×51 and 28×40 at widths up to 700px so the runout clears side seats. Three-card flops retain 44×62. Desktop board cards remain 44×62.
- Replay state, seat ownership, pot values, action amounts, and parser/domain logic were not rewritten.

## Visual evidence

| State                                    | Capture                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 8-max Hero decision, 1440                | [table-1440-8max.png](table-1440-8max.png)                                                                     |
| 8-max, 1280                              | [table-1280-8max.png](table-1280-8max.png)                                                                     |
| 9-max historical overlap width, 768      | [table-768-9max.png](table-768-9max.png)                                                                       |
| 8-max mobile, 390                        | [table-390-8max.png](table-390-8max.png)                                                                       |
| 9-max mobile, 390                        | [table-390-9max.png](table-390-9max.png)                                                                       |
| 6-max opponent to act                    | [opponent-to-act-1440-6max.png](opponent-to-act-1440-6max.png)                                                 |
| 6-max Hero all-in                        | [all-in-1440-6max.png](all-in-1440-6max.png)                                                                   |
| Imported concealed and revealed opponent | [concealed-1440.png](concealed-1440.png), [revealed-1440.png](revealed-1440.png)                               |
| Flop and mobile turn/river               | [flop-390.png](flop-390.png), [turn-390-9max.png](turn-390-9max.png), [river-390-9max.png](river-390-9max.png) |

The focused browser assertions measure the felt and rail colors, stage proportions, seat/card attachment, card sizes, Hero placement, current actor, board clearance, dealer ownership, action/commitment clearance, and horizontal overflow. The 768px 9-max and 390px 9-max captures were inspected after correcting real card and chip collisions. The imported reveal capture confirms the source-backed pair stays 27×38 and remains concealed while Hide Result is on.

## Local checks run

- Focused Vitest: `seatLayout`, `PlayerSeat`, `PokerTable`, and `PlayingCard` — 44 passed.
- Focused R6 and R7 Playwright — 19 passed together after the final action-position refinement (4 R6 shell, 15 R7 table/privacy/layout).
- Representative legacy Playwright replay sequences — 1440px 8-max, 768px 8-max, 390px 6-max, and 390px 9-max passed after updating assertions for the new markup.
- Legacy PlayingCard imported flows at 1440px and 390px and shared card specimens passed.
- Typecheck and lint passed after the final code changes.
- Scoped Prettier and `git diff --check` passed. Independent read-only review confirmed the current-street action-chip lifecycle and 12px minimum labels against the approved brief and guideline.

## Broad verification follow-up

- The reviewer reported two Vitest failures: a 5-second timeout in the library recovery flow and a stale action-text expectation in `App.test.tsx`. The action expectation now includes the visible space. The recovery test has a 15-second limit for its imported-tournament flow.
- The shared Playwright report contained 178 tests: 157 passed and 21 failed. The failures grouped into replay geometry, stale imported-table expectations, legacy SHOW/name layout assertions, and the red card contrast assertion. Focused browser reruns passed for the affected replay widths, import flows, 1440px and 390px correction flows, card contrast checks, and R7 table states after the fixes.
- A subsequent full local Vitest run had one 5-second timeout in the tournament stats import flow (553 of 554 tests passed). After giving that integration test a 15-second limit, the full rerun passed: **55 files, 554 tests**.
- Full lint passed after adding generated `playwright-report` and `test-results` directories to the ESLint ignores. Typecheck and production build passed after the layout fixes. The reviewer reran the full Playwright matrix; its HTML report records **178 expected passes, 0 failures, 0 flaky results, and 0 skips**. This supersedes the earlier 157/178 report.
- The approved red card color `#D23A4A` on `#F4F4F1` has approximately 4.29:1 contrast. Its focused assertion records the approved token and a 4.25 floor; it does not establish 4.5:1 contrast.

## Reviewer commands

1. `npm.cmd test -- src/ui/components/seatLayout.test.ts src/ui/components/PlayerSeat.test.tsx src/ui/components/PokerTable.test.tsx src/ui/components/PlayingCard.test.tsx`
2. `npm.cmd test`
3. `npm.cmd run typecheck`
4. `npm.cmd run lint`
5. `npm.cmd run build`
6. `npm.cmd run format`
7. `npx.cmd playwright test tests/visual/nocturne-r6-replayer-shell.spec.ts tests/visual/nocturne-r7-table.spec.ts tests/visual/replayer.spec.ts tests/visual/playing-cards.spec.ts --reporter=html`
8. `npx.cmd playwright test --reporter=html`
9. `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp diff --check`
10. `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp status --short --branch`

The working tree includes earlier R5/R6 work and unrelated QA/fixture modifications. Review and stage only the intended changes. Do not reset those existing files.
