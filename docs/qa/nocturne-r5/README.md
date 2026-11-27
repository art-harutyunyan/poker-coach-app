# Nocturne R5 Tournament Import QA

**Status:** Ready for review. Primary authority: `docs/subframe-design/design-guideline.md` and the approved R5 brief. There is no approved import-state screenshot in the repository; the screenshot named `02_Import_Hand_Histories` depicts the hand browser and was not used to infer import visuals.

## Implemented states and semantics

- The existing Library and top-level Import entry points open one Nocturne import dialog. The empty state offers a labelled drop area and keyboard-accessible **Choose files** action for GGPoker `.txt` hand histories. It describes session-only local storage.
- Each selected file enters an indeterminate processing row with a spinner and an indeterminate bar. The importer exposes no reliable percentage or hand-progress count. **Cancel** is omitted because the existing controller can ignore a late result but cannot abort the underlying file read or parser.
- Accepted files show the source tournament name, ID, accepted hand count, game and format when available, parser notices when present, and **Open tournament**. Parser notices are not counted as skipped hands. A true warning row is typed and styled amber for an accepted outcome with actual skipped records, but the current importer rejects invalid records atomically and emits no such outcome. No real warning/skipped fixture or screenshot is available.
- Identical imports produce a neutral duplicate row, **Nothing added**, and **Show existing**. Same-ID differing imports produce a red conflict row, explicit unchanged-library copy, and **Show existing**. Neither result adds or alters an entry. No Replace, Merge, Keep both, or Overwrite action is offered.
- Read/format failures show a red error row, the importer-provided reason, zero accepted hands, and **Choose another file**. The UI shows a base file name only, never a local path.
- Multi-file selections run sequentially through the existing single-file importer. Each file gets its own row, and outcome chips count imported, warning, duplicate, and rejected/error rows. While processing, the drop area tells the user to wait before adding more files. Closing the dialog or opening an earlier result prevents later files in the selection from starting and ignores the pending result. **Open tournament** and **Show existing** use the existing selected-tournament navigation.

## Captures inspected

| State                                     | Widths                | Files                                                           |
| ----------------------------------------- | --------------------- | --------------------------------------------------------------- |
| Empty import entry                        | 1440, 1280, 390 × 900 | `empty-1440.png`, `empty-1280.png`, `empty-390.png`             |
| Indeterminate processing                  | 1440 × 900            | `processing-1440.png`                                           |
| Accepted 222-hand fixture                 | 1440, 1280, 390 × 900 | `success-1440.png`, `success-1280.png`, `success-390.png`       |
| Duplicate and conflict                    | 1440 × 900            | `duplicate-1440.png`, `conflict-1440.png`                       |
| Mixed success, duplicate, conflict, error | 1440, 1280, 390 × 900 | `mixed-results-{width}.png`, `mixed-results-bottom-{width}.png` |
| Two-file batch                            | 1440 × 900            | `batch-1440.png`                                                |

The dialog uses the established Nocturne panel, status, button, and focus treatments. At 390px, result actions stack beneath the details, long source names wrap, and the dialog scrolls internally. Captures and browser assertions found no horizontal overflow at the three inspected widths. The narrow layout is a responsive adaptation of the same dialog; no separate mobile flow was introduced.

## Focused verification

- Focused Vitest run with two workers: 10 files, 46 tests passed, including the import controller, presentation adapter, result component, upload/drop/batch handling, App navigation, and changed library/replay integration tests. A higher-concurrency run overlapped with formatting and timed out in two App tests; the isolated lower-concurrency run passed.
- Scoped ESLint on changed R5 TypeScript/TSX files passed. Scoped Prettier checks passed for changed files using their existing LF/CRLF conventions. `git diff --check` passed. The repository's default Prettier command also flags unchanged CRLF files such as `src/ui/ApplicationShell.tsx` in this checkout; those files were not reformatted for R5.
- Focused Playwright: all five R5 cases passed together with exit code 0, covering empty, processing, success, duplicate, conflict, error, mixed results, batch rows, and navigation while a later file is pending. The viewport cases ran at 1440, 1280, and 390px. The representative real import and existing four-tournament Library cases also passed with exit code 0 against a separately started Vite server. An earlier combined run had a Chrome `browserContext.newPage: Target crashed` before the processing case reached the app; its isolated rerun and the final five-case run passed. An earlier Playwright-managed dev-server run stayed open after reporting a pass result and was interrupted.
- Reviewer verification on 2026-11-21: the initial full unit run passed 545 of 546 tests; the sole failure was a fixture SHA-256 mismatch caused by Windows CRLF checkout conversion. The fixture content matched Git after line-ending normalization. `.gitattributes` now preserves the raw GG fixture bytes and pins the audited `DevelopmentChart.tsx` checkout to LF. The focused corpus rerun passed 4 of 4 tests, and the complete unit rerun passed 546 of 546 tests across 54 files. Typecheck and lint also passed in the local follow-up; the reviewer reported build success.
- The reviewer's full Playwright report recorded 151 passed and four failed tests. Two failures were obsolete R5 copy assertions; two were hashes of unchanged files converted to CRLF on checkout. After updating the assertions and checkout attributes, all four failed cases passed in a targeted browser rerun. This is combined evidence from the original broad run and the four-case rerun, not a single all-green broad run. Generated screenshots and timing files from those runs were restored to their approved baselines. Git status may list the four fixtures and chart source as modified until the new `.gitattributes` rules enter the index; `git diff` shows no content changes for those five files.
- The parser, library decision rules, R2 Library, R3 Overview, R4 Hand Browser, and Replayer were not redesigned.

## Reviewer commands

Run from the repository root, in order. Stop the local dev server after Playwright if you start it separately.

1. Focused unit tests: `npm.cmd test -- --maxWorkers=2 src/ui/useTournamentImport.session.test.tsx src/ui/useTournamentImport.test.tsx src/ui/importResultPresentation.test.ts src/ui/components/ImportResult.test.tsx src/ui/components/TournamentUpload.test.tsx src/ui/importedTournament.test.tsx src/ui/App.library-recovery.test.tsx src/ui/App.library.test.tsx src/ui/App.stats.test.tsx src/ui/handNavigation.test.tsx`
2. Full unit suite: `npm.cmd test`
3. Typecheck: `npm.cmd run typecheck`
4. Lint: `npm.cmd run lint`
5. Build: `npm.cmd run build`
6. Formatting: `npm.cmd run format`
7. Focused Playwright: `npx.cmd playwright test tests/visual/nocturne-r5-import.spec.ts`
8. Full browser suite: `npx.cmd playwright test`
9. Whitespace/diff: `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp diff --check`
10. Working tree: `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp status --short --branch`

The R4 Hand Browser Street-column wording follow-up remains separate from R5.
