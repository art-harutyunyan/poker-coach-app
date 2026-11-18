# Nocturne R3 Tournament Overview QA

**Status:** Ready for review. Authority: `docs/subframe-design/design-guideline.md`, the approved R3 brief, and `docs/subframe-design/design-screenshots/03_Tournament_Detail (2).png`.

## Captures

| State                                                    | Capture                         |
| -------------------------------------------------------- | ------------------------------- |
| Real 222-hand import, no summary or analysis, 1440 × 900 | `selected-unavailable-1440.png` |
| Same import, 1280 × 900                                  | `selected-unavailable-1280.png` |
| Stacked fallback, 1024 × 900                             | `selected-unavailable-1024.png` |

The overview uses the real GG tournament name, ID, buy-in, source-local first-hand time, and accepted hand count. The import schema has no tournament summary, verified payout, final-table size, or strategy analysis output. Finish is therefore unknown with “No summary file imported”; no achievement badge, winnings amount, grade count, review count, or decision-quality distribution appears. A real verified-finish capture is unavailable because no summary fixture or summary import path exists.

The existing hand navigator appears below the overview. Its row and selection behavior are unchanged. The existing Phase 1C Tournament Stats section remains below the hand list, including the W$SD reveal control and audit navigation. Overview, Replayer, and Review Queue tabs remain available; the replayer and review screens retain their existing layout. Import and Tournament Library actions remain in the selected-tournament header.

At 1440 and 1280, the library measures 364px. The browser check verifies the hand list begins below the overview and the document has no horizontal overflow at all three widths. At 1280, header actions wrap beneath the metadata. At 1024, the library and workspace stack. The overview stats stack below 760px; no new mobile layout was designed.

The reference screenshot's analysis counts, achievements, and payout are illustrative. This capture uses real imported data. The legacy hand list and deterministic stats are visibly different from the approved future hand-browser design, which is reserved for a later task.

## Focused evidence

- Vitest: `src/ui/importedTournament.test.tsx`, `src/ui/tournamentLibraryPresentation.test.ts`, `src/ui/App.library.test.tsx`, and `src/ui/App.stats.test.tsx` passed 18/18 after R3 test updates. The subsequent source-time label change passed a focused RED/GREEN case.
- Typecheck: `npm.cmd run typecheck` passed after the overview implementation.
- Playwright: the 1440px, 1280px, and 1024px `nocturne-r3-overview.spec.ts` cases each reported passing. On this Windows run, Playwright did not exit after the cases and the command was stopped during server teardown. The screenshots were captured before teardown.
- Independent read-only review: no Critical or Important finding. The reviewer noted that reaching Tournament Stats below all 222 legacy hand cards takes substantial scrolling; the section remains functional there pending a later dedicated layout decision.

## Broad verification reported by reviewer

On 2026-11-18, the reviewer reported that the focused and full Vitest runs, typecheck, lint, build, format, focused and full Playwright runs, and `git diff --check` all passed. The reviewer supplied `git status --short` output for the final check. The worktree remains dirty with R0–R3 work, earlier project changes, QA captures, and generated artifacts; no commit, push, merge, or deploy was performed for R3.

R3 remains **Ready for review** pending explicit approval.
