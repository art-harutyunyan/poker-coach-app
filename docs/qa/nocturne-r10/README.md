# Nocturne R10 visual reconciliation QA

**Status:** READY FOR REVIEW. Primary comparison: `docs/subframe-design/design-screenshots/04_Hand_Replayer (2).png` at 1440 × 900; behavior and visual rules: `docs/subframe-design/design-guideline.md`.

## Initial audit and decisions

The R9 imported 1440 capture already had the 128px strip, flexible table tile, 400px analysis tile, 8px grid gutter, approved aubergine felt, and stable seat placement. R10 concentrated on the visible gaps: Browse all retained large green legacy rows, duplicate headings and cramped controls; the current-hand header repeated the cards already shown in the strip and on the table; the dock could use less vertical space. The separate approved browser-open screenshot is not present in the local design folder, so its exact visual details were not inferred from unrelated screenshots. The guideline's 640px bottom-end popover and the established Nocturne tokens directed that work.

## Captures

| State                                     | Evidence                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imported 1440 × 900, analysis unavailable | [imported-1440.png](imported-1440.png)                                                                                                                    |
| Browse all 1440 × 900, 222 real hands     | [browse-1440.png](browse-1440.png)                                                                                                                        |
| Hero to act, 6 seats                      | [hero-to-act-1440-6max.png](hero-to-act-1440-6max.png)                                                                                                    |
| Opponent to act, 6 seats                  | [opponent-to-act-1440-6max.png](opponent-to-act-1440-6max.png)                                                                                            |
| Postflop board and folded opponents       | [postflop-folded-1440-6max.png](postflop-folded-1440-6max.png)                                                                                            |
| 9-handed table                            | [table-1440-9max.png](table-1440-9max.png)                                                                                                                |
| 1280                                      | [imported-1280.png](imported-1280.png), [Browse all](browse-1280.png)                                                                                     |
| 1024                                      | [imported-1024.png](imported-1024.png), [Browse all](browse-1024.png)                                                                                     |
| 768                                       | [imported-768.png](imported-768.png), [Browse all](browse-768.png)                                                                                        |
| 390                                       | [imported-390.png](imported-390.png), [Browse all](browse-390.png), [stacked panel](imported-panel-390.png)                                               |
| 390 filter edge cases                     | [outside filter](outside-filter-390.png), [source review open](source-review-open-390-short.png), [hand list reachable](source-review-list-390-short.png) |

## 1440 comparison and final deltas

### A. Fixed in R10

- Browse all uses one accessible heading, Nocturne surfaces and radii, compact cards, 12px minimum labels, real counts, a restrained selected accent and internally scrolling hand items. It remains anchored under the hand strip, about 640px wide, rather than becoming a second column.
- The current-hand header leads with the real hand number, total and source ID. Position and table occupancy remain as secondary context; cards remain visible in the strip and on the table.
- The strip title and hand count have a clearer hierarchy. The dock uses less vertical space, leaving Action history visible at 1440 × 900.
- The open browser, table and analysis tiles retain Nocturne border and surface treatment. The original R7 seat, card and action-chip coordinates remain intact.
- At 1280, 1024, 768 and 390, Browse all stays within the viewport; analysis stacks below the table at the narrow widths; the replay dock remains reachable without page-level horizontal overflow.
- Switching filters with a deep selected hand now scrolls its card into view. A narrow outside-filter notice and source-review disclosure remain in the popover flow; at 390 × 600, the popover scrolls and keeps the hand list reachable.

### B. Intentional differences from the illustrated reference

- Imported GG hands have real cards, positions, source IDs and replay states rather than the screenshot's illustrative values.
- Imported analysis remains **Analysis not available yet**. The demo fixture alone retains its explicitly illustrative analysis.
- The existing app's Overview, Replayer and Review Queue route tabs and navigation remain, as required by the R10 brief.

### C. Deferred pending approved product direction or real capability

- Mistakes/Flagged tabs, search in this popover, grades/EV/recommendations, autoplay, speed and persisted flags/reviews are not current Replayer capabilities. R10 did not create placeholders for them.
- Exact pixel comparison of Browse all with a separate approved open-state screenshot remains unavailable locally; no visual details were borrowed from the tournament hand-browser screenshot.

## Focused verification

- Browser test was observed RED for the absent single heading, legacy row presentation and current-hand hierarchy, then GREEN. Independent review identified deep-selection scrolling and narrow source-review overflow; both were reproduced RED and corrected. Final `tests/visual/nocturne-r10-reconciliation.spec.ts`: **8 passed**. It checks bounds, scrolling, filter counts, selection, Close/Escape focus return, stacked analysis, reachable controls and representative replay states.
- Focused Vitest: **5 files, 25 tests passed** (`ReplayerHandStrip`, `ImportedHandNavigator`, `HandFilterControls`, hand navigation and imported tournament).
- Scoped ESLint passed for changed TS/TSX. Scoped Prettier and whitespace checks were run. Full unit, typecheck, lint, build and full Playwright are reserved for reviewer verification per R10 handoff.

## Reviewer verification follow-up

- Reviewer reported focused and full Vitest passed, lint and formatting passed, and focused R10 Playwright passed. Typecheck and build exposed an invalid six-seat helper call in the R10 visual test. The test now uses the original six-seat fixture for its action cursor; `npm.cmd run typecheck` and `npm.cmd run build` both pass locally.
- The reviewer's full Playwright run had one failure: the R7 all-in test saw a blank page before finding the Hero seat. That case passed in one focused rerun and three repeated runs. The R10 visual spec passed again with 8 tests after the type correction. The full Playwright suite has not been rerun after this follow-up, so its earlier one-failure result remains the latest full-suite evidence.

No parser, domain, Strategy Engine, filtering semantics, Hide Result behavior or tournament import logic was changed.
