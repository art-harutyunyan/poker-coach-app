# Nocturne R2 Tournament Library QA

**Status:** Ready for review. The approved reference is `docs/subframe-design/design-screenshots/03_Tournament_Detail (2).png`; `docs/subframe-design/design-guideline.md` is the handoff confirmed for R2.

## Captures

| State                                                     | Capture                         |
| --------------------------------------------------------- | ------------------------------- |
| Empty library, 1440 × 900                                 | `empty-1440.png`                |
| Three real GG fixtures, 1440 × 900                        | `multiple-1440.png`             |
| Two real GG fixtures, 1280 × 900                          | `multiple-1280.png`             |
| Selected tournament with unavailable analysis, 1440 × 900 | `selected-unavailable-1440.png` |
| Selected tournament with unavailable analysis, 1280 × 900 | `selected-unavailable-1280.png` |
| Search with no matches, 1440 × 900                        | `search-empty-1440.png`         |

The Playwright check measured the library at 364px at both desktop widths, verified internal list scrolling, selected row semantics, unknown winnings, and no document overflow at 1280px. The selected screenshot shows the approved mixed state: new Nocturne shell and library beside the existing tournament workspace.

## Comparison and data gaps

- The library follows the reference panel, header/import, search, segments, sort, compact four-line rows, selected treatment, recency grouping, and footer. The screenshot's tournament values are illustrative; the captures use imported GG fixtures.
- The current `LibraryEntry` has no verified payout, finish, final-table size, achievement, analysis result, mistake count, or flagged count. Won and Finish are therefore unknown; no achievement badge or counts appear. All imported entries use the typed `unavailable` status. `Analysed` and `Needs action` remain visible but disabled until real supporting states exist.
- Source dates in these fixtures fall before the current week, so all entries appear under `Earlier`. The presenter separately tests the `This week` group with a source-local date.
- The existing workspace and top shell header retain their current layout. The empty library view retains the existing demo entry point in the right host. The R2 brief leaves workspace and mobile redesign for later work; below 1180px the library and workspace stack to preserve usability.

## Focused verification

- `TournamentLibrary.test.tsx`: 6/6 passed after the final accessibility and ID-search changes.
- `npx.cmd playwright test tests/visual/nocturne-r2-library.spec.ts tests/visual/phase1c-library.spec.ts`: 9/9 passed after the final changes.
- The five-file focused Vitest run reached 19/22 passing in a serial rerun. Three existing `importedTournament.test.tsx` fixture cases timed out at their 30-second limits on this machine; an isolated fixture 0 rerun passed in about 29 seconds. The same five-file set had passed 21/21 before the final accessible-name changes and new ID-search test. The current result is a timing limitation, not a passing claim for the whole focused set.
- Scoped ESLint, Prettier, and tracked-file whitespace checks are used for changed R2 files.

Broad unit tests, project typecheck, lint, build, formatting, and browser suites are deferred to the reviewer's requested local verification step.

## Post-review verification, 2026-11-18

The reviewer reported focused tests, full unit tests, lint, formatting, targeted browser checks, and whitespace checks green. Typecheck and build found two test-only `getByRole` options unsupported by Testing Library; those options were removed. `npm.cmd run typecheck` and `npm.cmd run build` now pass.

The reviewer's full Playwright run passed 147/149. The two failures used pre-R2 viewport geometry assumptions. The navigation case now compares seats within the table, independent of workspace scrolling. The card case uses `docs/qa/playing-cards/r2-geometry-1440.json` as the 1440px baseline for the narrower R2 workspace; older baselines remain in place for smaller widths. Both formerly failing cases pass together (2/2). The full browser suite has not been rerun after these corrections.
