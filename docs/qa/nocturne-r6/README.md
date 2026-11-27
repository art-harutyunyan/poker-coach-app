# R6 Replayer shell QA

R6 is ready for review. The approved handoff is `docs/subframe-design/design-guideline.md`, with `04_Hand_Replayer (2).png` as the visual reference. The existing poker table, seats, action chips, replay controls, analysis content, and domain behavior remain in place.

## Focused evidence

- `npm.cmd test -- src/ui/components/ReplayerHandStrip.test.tsx src/ui/components/ImportedHandNavigator.test.tsx src/ui/handNavigation.test.tsx src/ui/App.test.tsx src/ui/importedTournament.test.tsx`: 5 files, 29 tests passed. Source order, selected hand, filter preservation, Browse all focus, imported navigation, Hide Result, demo sample action, and existing import access were checked.
- `npm.cmd run typecheck`: passed.
- Targeted ESLint for changed TS/TSX files: passed with zero warnings after separating the shared card label helper from the `PlayingCard` component.
- Targeted Prettier check for changed source, tests, CSS, and R6 docs: passed.
- `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp diff --check`: passed. Git printed only line-ending conversion notices for existing working-tree files.
- Focused Playwright: `node node_modules/@playwright/test/cli.js test tests/visual/nocturne-r6-replayer-shell.spec.ts --reporter=list` with the local Vite server already running at port 5180: 4 passed (exit 0). The tests cover 1440×900, 1280×900, 390×900, and the demo Replayer at 1280×900. They also check that a replay Forward action preserves manual strip scrolling and that filtered Browse all states its visible count.
- Independent read-only code review found no remaining substantive issue after the focus, card label, scroll, count, and type-size fixes.
- After reviewer follow-up, `npm.cmd test` passed: 55 files and 548 tests. The two reported 5-second timeouts passed both in isolation and in the full run; no test-timeout change was made.
- The prior full browser report contained 118 passes and 45 failures, mostly from historical specs using the removed persistent Replayer rail and header. Those tests now open Browse all or use the strip and verify the original replay, privacy, card, and filter behavior.
- Complete Playwright run: 163 passed, 0 failed, 0 flaky (18.4 minutes). See `playwright-report/index.html` and `playwright-report/results.json`.
- After final review, the existing card visual test again checks seat, center-label, dealer, and nameplate geometry against R6 host-width baselines at 1440, 1024, 768, 430, and 390px. `tests/visual/playing-cards.spec.ts`: 7 passed in a separate run (2.0 minutes).
- `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run build` passed after the follow-up changes. Targeted Prettier passed for the changed visual specs. A repository-wide `npm.cmd run format` scan reported existing unformatted files in `.agents`, `.playwright-mcp`, `.superpowers`, and historical docs; it was stopped without modifying them.
- The visual-preview test checks the configured source of externally hosted Block52 artwork and waits for local images to load. Availability of the external image host is outside the app's offline test environment.

## Captures and observations

| Capture                                                              | Observation                                                                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Imported 1440](imported-1440.png)                                   | 128px strip, 176px hand items, pinned Browse all, 8px tile gap, 400px analysis tile.                                                             |
| [Imported 1280](imported-1280.png)                                   | Two-column shell with legacy table fitting the remaining width.                                                                                  |
| [Imported 390](imported-390.png)                                     | Narrow strip scrolls horizontally; analysis stacks below the table. No document-level horizontal overflow.                                       |
| [Browse all 1440](browse-1440.png), [Browse all 390](browse-390.png) | Existing source filters and hand list appear in the popover. Selected hand stays visible in the list without scrolling the popover heading away. |
| [Filtered 1440](filtered-1440.png), [Filtered 390](filtered-390.png) | The selected hand can remain outside an active filter; the strip names that state and retains replay context.                                    |
| [Demo 1280](demo-1280.png)                                           | Existing illustrative analysis and sample-hand action remain reachable.                                                                          |

The source-backed imported Replayer uses a neutral “Not analysed” slot. It does not show the mock grades or strategy values from the reference screenshot. The separate demo retains its existing analysis with its illustrative labeling.

## Limits for review

- The current table is intentionally legacy. At 900px viewport height its replay controls may require vertical page scrolling. R7 owns table and seat geometry.
- The existing demo issue where a committed bet label can overlap BTN cards near 768px remains outside R6.
- Repository-wide formatting remains a separate cleanup task because of pre-existing documentation and generated artifacts.

## Reviewer commands

1. `npm.cmd test`
2. `npm.cmd run typecheck`
3. `npm.cmd run lint`
4. `npm.cmd run build`
5. `npx.cmd playwright test`
6. `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp diff --check`
7. `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp status --short --branch`

Playwright's configured HTML report is written to `playwright-report/` when the reviewer runs the normal command without a reporter override.
