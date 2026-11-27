# Nocturne R8 replay controls QA

**Status:** R8 — READY FOR REVIEW. Focused checks, independent read-only review, and reviewer-run broad verification are complete. Awaiting explicit R8 approval. No commit, push, merge, or deployment was made.

## Scope

- The supported Start of hand, Back, Forward, street jump, and Hide Result controls now share one compact dock beneath the R7 table. Start of hand uses the existing cursor-0 behavior.
- The dock shows the existing source-backed current actor/context and `Action current / total` with an accessible progress bar derived from replay action counts.
- Street buttons retain the existing Preflop, Flop, Turn, River, and conditional Showdown cursor semantics. Keyboard arrows still step actions and now ignore dialog focus.
- The R6 hand strip, R7 table/seat geometry, analysis panel, parser, replay engine, privacy projection, and hand-selection logic were not rewritten.
- The current app has no autoplay or playback-speed state. The approved screenshot shows those controls, but R8 omits them under the brief's rule against unsupported controls. This remains a design gap for a separately approved behavior task.

## Visual evidence

| State                   | Capture                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Action 0, desktop       | [start-1440.png](start-1440.png)                                                                                                   |
| Flop and river, desktop | [flop-1440.png](flop-1440.png), [river-1440.png](river-1440.png)                                                                   |
| Opponent to act         | [opponent-to-act-1440.png](opponent-to-act-1440.png)                                                                               |
| Imported hand           | [imported-1440.png](imported-1440.png)                                                                                             |
| Responsive start        | [start-1280.png](start-1280.png), [start-1024.png](start-1024.png), [start-768.png](start-768.png), [start-390.png](start-390.png) |

Additional captured states: [mid-preflop-1440.png](mid-preflop-1440.png), [turn-1440.png](turn-1440.png), and [hero-to-act-1440.png](hero-to-act-1440.png).

The 1440px, full-page 390px, mid-preflop, turn, and Hero-to-act captures were inspected. The dock stays centered under the stage, clears the Hero plate, keeps the supported controls in one surface, and wraps the street selector below transport at narrow widths. The selected street uses a filled segment, while unavailable streets remain disabled and use the muted text token. The existing analysis presentation remains unchanged for R9.

## Checks run

- Focused Vitest: `ReplayControls`, `PokerTable`, `App`, `importedTournament`, and `handNavigation` — **40 passed** after the R8 changes.
- Focused R8 Playwright — **9 passed** after the disabled-color and target-size fixes, covering 1440/1280/1024/768/390 geometry, unavailable-street color, 44px button targets, action/street/keyboard/privacy interactions, actor agreement, and imported hand switching.
- Focused R7 Playwright regression — **15 passed** after the target-size fix.
- Legacy Replayer shell Playwright — **9 passed** after the target-size fix, including all eight widths that had failed in the full report.
- Reviewer-run full Playwright — **187 expected/passed, 0 unexpected, 0 flaky, 0 skipped**, confirmed from the embedded results in `playwright-report/index.html`.
- Typecheck, lint, and production build passed. Targeted formatting and diff checks are listed for final handoff.
- Independent read-only review found no Critical or Important issue. It found one minor disabled-street color specificity issue; a browser assertion reproduced the mismatch and passed after the CSS fix.

## Broad verification follow-up

The reviewer reported eight failures in `tests/visual/replayer-shell.spec.ts`, one at each tested width. The saved error contexts and a local reproduction showed the same assertion: the R8 Back button had a 36px bounding-box height, below the shell spec's 44px minimum. The R8 style had also reduced the street buttons to 32px. The transport and street buttons now have 44px targets, with a focused R8 browser assertion guarding the size at desktop and narrow widths. The legacy shell spec passed **9/9** locally, and the focused R7/R8 suites passed **24/24**. The reviewer then reran the full Playwright suite; its saved report confirms **187/187 passed**.

## Reviewer commands

1. `npm.cmd test -- src/ui/components/ReplayControls.test.tsx src/ui/components/PokerTable.test.tsx src/ui/App.test.tsx src/ui/importedTournament.test.tsx src/ui/handNavigation.test.tsx`
2. `npm.cmd test`
3. `npm.cmd run typecheck`
4. `npm.cmd run lint`
5. `npm.cmd run build`
6. `npm.cmd run format`
7. `npx.cmd playwright test tests/visual/nocturne-r8-controls.spec.ts tests/visual/nocturne-r7-table.spec.ts --reporter=html`
8. `npx.cmd playwright test --reporter=html`
9. `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp diff --check`
10. `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp status --short --branch`

The working tree contains earlier R5–R7 changes and unrelated generated QA/fixture edits. Review and stage only the intended files; do not reset existing work.
