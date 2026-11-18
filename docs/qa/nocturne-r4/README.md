# Nocturne R4 Tournament Hand Browser QA

**Status:** Ready for review. Authority: `docs/subframe-design/design-guideline.md`, the approved R4 brief, and `docs/subframe-design/design-screenshots/03_Tournament_Detail (2).png`.

## Captures

| State                                                                         | Capture               |
| ----------------------------------------------------------------------------- | --------------------- |
| 222 real imported hands, no analysis, 1440 × 900                              | `many-hands-1440.png` |
| Selected second hand, 1440 × 900                                              | `selected-1440.png`   |
| Hand-number/card search, 1440 × 900                                           | `search-1440.png`     |
| Position filter with zero matching results and retained selection, 1440 × 900 | `filter-1440.png`     |
| Same 222-hand import, 1280 × 900                                              | `many-hands-1280.png` |
| Stacked library and workspace, 1024 × 900                                     | `many-hands-1024.png` |
| Narrow stacked rows and internal browser scrolling, 390 × 900                 | `many-hands-390.png`  |

The browser uses the existing shared `PlayingCard` compact faces. Hand number and order are the parser's chronological import order. Position is the parser's Hero position. Spot is the first recorded voluntary Hero action with its recorded street; when none exists, it shows the Hero position and last reached street. Street is the last recorded board street, **not** an analysis decision street. Final pot is the imported hand summary's recorded total pot. The column says **Final pot** to distinguish it from a decision-time pot. Effective stack is unavailable because the browser has no existing verified effective-stack projection.

Imported tournaments have no analysis results or persisted reviewed/flagged hand state. Graded, Mistakes, Flagged, and Unreviewed show `—` and are disabled. Grade requires analysis; Stack is also disabled. Rows say **Not analysed** with neutral text. No grade pill, review count, or flag state is invented. The `F` flag shortcut is deferred because there is no real hand flag store.

Search uses hand number, Hero cards (including `10` for tens and either card order), Hero position, and the displayed spot. Position and reached-street filters preserve source order. Search/filter state stays local to the selected tournament's mounted workspace; selecting a hand does not clear it. A selected hand outside the results remains in the bottom context bar, and Clear filters restores all rows. Arrow keys move selection only from a focused row; Space selects a focused row, including a sole filtered result; Enter opens that row in Replayer. Search and select inputs do not receive row shortcuts. The bottom **Open in Replayer** action opens the selected real hand through the existing session controller.

The browser list scrolls internally with the header, filter controls, column header, and action bar outside that row scroller. Its desktop tile height is bounded to 48dvh at 900px, so Tournament Stats begins just below it instead of after 222 full-page cards. The workspace may scroll to reach Stats, preserving its deterministic metrics and W$SD reveal behavior. At 1024px the Library and workspace stack. At 390px the rows use a labelled, stacked layout and the browser is taller to keep a usable row viewport. The R2 Library and R3 Overview were not redesigned; the R3 visual regression now looks for the new browser beneath the same Overview.

## Focused evidence

- Vitest: `src/ui/handBrowserPresentation.test.ts`, `src/ui/components/TournamentHandBrowser.test.tsx`, `src/ui/importedTournament.test.tsx`, `src/ui/App.library-recovery.test.tsx`, `src/ui/App.stats.test.tsx`, and `src/ui/components/ImportedHandNavigator.test.tsx` passed 24/24.
- Scoped ESLint passed on the R4 TypeScript and TSX files.
- Playwright: the R3 overview regression cases at 1440, 1280, and 1024px reported passing. The R4 1440 case and 1280/1024/390 fallback case reported passing. A mobile row-height assertion was observed failing before the CSS fix and passing after it. A later 390px capture after adding narrow-row labels was inspected; that run hung before reporting the case result and was interrupted. On this Windows session, the earlier Playwright processes also hung during server teardown after reporting case results, so these commands did not exit zero. Captures were inspected directly.
- Broad verification was reserved for the reviewer's local run as required by the R4 brief.

## Reviewer verification — 2026-11-19

The reviewer reported the focused unit tests, full unit suite, typecheck, lint, build, format check, focused Playwright, and full Playwright suite as passing. They also completed `git diff --check`. Their attached `git status --short` shows the working tree remains dirty, including the R4 files and earlier unrelated changes; no commit or cleanup was requested. This is reviewer-reported evidence, with no test counts or logs supplied for those broad runs.
