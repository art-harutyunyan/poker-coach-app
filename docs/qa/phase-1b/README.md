# Phase 1B validation evidence

Status: **READY FOR REVIEW - 2026-10-19.**

This is the original handoff. Manual acceptance prompted a bounded correction;
see the [current correction evidence](../phase-1b-corrections/README.md), including
the additional Daily Classic fixture. Counts and limitations below record the
original three-fixture increment.
The approved specification and implementation plan govern scope. No Phase 1C work,
AI/API integration, imported-data persistence, commits, pushes, or deployments.

## Local workflow

Upload Tournament now accepts a local GG .txt file, shows source metadata and
structured warnings, then opens Overview. Review Queue and the Replayer rail
navigate all chronological hands. New imports clear stale state; hand selection
resets cursor and privacy. Imported views have neutral analysis states and never
substitute demo analytics. Other app sections remain labeled demo.

The existing parser, imported contracts, adapter, and replay engine are retained.
Replay extensions preserve exact source returns, awards, one/two-card reveals,
actorless showdown/deal transitions, and board-only runouts. Existing seat anchors
are reused for partially occupied tables; no fake players or poker calculations.

## Coverage and source facts

All 441 hands from all three real exports pass import/selection through the
existing adapter and engine. Every projected cursor's exact stacks/pot is checked
against the canonical ledger, supplemented by existing independent source goldens:

- Daily: 222 hands; TM6469820465 Hero 7c/7h, Ad/6d/6h/3s/5h board, 672100 award.
  TM6469819712 preserves folded opponent 54df8316's single Ts show.
- Fifty: 191 hands; TM6471062694 refund129067, collection420450, recipient549517.
  TM6470172527 is seven-handed at 8-max; observed four-player hands also render.
  TM6471061841 retains SHORT_BLIND_POST and ZERO_STACK_FOLD warnings.
- GGMasters: 28 hands; TM6524471450 raise contribution586/by495/to656,
  call5874 and return417; TM6524470976 retains separate awards628/629.

Domain tests repeat adaptations/mappings and interleave cursor reconstruction,
checking complete frames, prior-frame and input immutability. Runtime tests repeat
A/B/A full imports, cover malformed outcomes, slow reads, replacement, cancellation,
StrictMode/unmount, selected-hand reset, privacy clamping, and integration failures.
Fixture SHA-256 values in [fixture-hashes.json](fixture-hashes.json) were captured
before implementation; the browser suite checks all three original files.

## Browser matrix and evidence

Real Chrome uses the actual file input for all three complete files at least once.
Daily is representative at 1440/1024/768/430/390. Fifty desktop plus mobile covers
refunds, warnings, four-player seating, failed replacement/retry, and native Escape.
GGMasters mobile covers all-in returns and separate awards. Exhaustive full-file,
all-hand accounting/determinism stays in domain/integration tests.

Assertions cover no page overflow, clipped panels/seats, overlapping nameplates,
duplicate coordinates, fake analytics, import storage, or introduced fetch/XHR/
WebSocket traffic. The import workflow is measured without an invented timing SLA.
Timing JSON files report observed selection-to-summary latency on this machine;
they are not production performance guarantees.

Named screenshots:

| Evidence                                                          | Context                                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Upload success](upload-success-1440.png)                         | Daily full import summary, desktop                                |
| [Upload error](upload-error-390.png)                              | Invalid replacement, mobile                                       |
| [Overview desktop](overview-1440.png), [mobile](overview-390.png) | Actual Daily metadata, neutral analysis                           |
| [Review Queue desktop](review-1440.png), [mobile](review-390.png) | All 222 neutral hand rows                                         |
| [Replayer desktop](replayer-1440.png), [mobile](replayer-390.png) | TM6469820465, cursor0, Hide Result on                             |
| [Warnings](warnings-390.png)                                      | Daily warnings expanded, mobile                                   |
| [Refund](refund-1440.png)                                         | TM6471062694 at privacy limit, refund consumed, collection hidden |

## Regression guard adjustments

Historical functional-file hashes are scoped only for:
schemas.ts (replay vocabulary), replay.ts (source steps/accounting),
PokerTable.tsx (source labels/privacy), PlayerSeat.tsx (reveals/privacy),
seatLayout.ts (partial occupancy), and ReplayControls.tsx (dealt-street jumps).
The two migration suites retain every other original hash and all byte-exact
approved Replayer screenshot/style comparisons. No reference images are refreshed.

The existing shell dialog test now expects real local import instructions instead
of the obsolete Phase0 "no files processed" copy; profile, focus return, Escape,
navigation, and demo replay checks stay intact. Additional source-file changes
remain limited to the approved import/replay integration.

## Checks and review

Final checks (all listed passing commands exited 0):

| Check                                                 | Result                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| npm run lint                                          | PASS after review fix                                               |
| npm run typecheck                                     | PASS after review fix                                               |
| npm test                                              | 336/336 across 23 files, including full post-review run             |
| npm run test:visual -- --workers=2                    | 102/102, real Chrome, existing demo and imported cases              |
| Playwright tournament-import.spec.ts after review fix | 8/8, all five widths and keyboard access through all 222 queue rows |
| npm run build                                         | PASS after review fix                                               |
| Explicit changed-file Prettier check                  | PASS                                                                |
| Tracked diff and direct new-file whitespace checks    | PASS                                                                |
| Fixture/spec/mock/reference integrity                 | PASS against pre-task SHA-256 manifest                              |

The full browser run and post-review targeted suite jointly verify the final change;
the review fix changes only imported-list sizing. No reference images were replaced.
The initial full browser run had two failures: obsolete Phase 0 upload copy (corrected
and rerun), and sandbox-denied existing public GitHub theme images (unchanged test
passes outside the sandbox). The final full run loaded those public assets with
permission; imported histories still introduce zero fetch/XHR/WebSocket traffic.

Independent read-only review ran 49/49 focused tests across six files and measured
the mobile Review Queue. It found no Critical or Minor issues and one Important
issue: 222 rows expanded the page to 21,280px. The browser regression failed with
20,853px list content height against a viewport-bound check, then passed after
list-specific max-height/overflow. All 336 unit tests and all eight affected browser
cases pass after the fix. There is no deferred Minor finding. The author verified
the fix by TDD and full unit regression; no second independent review is claimed.
Initial baseline: 299 tests across19 files passed. New tests were written first;
replay, file-validation, rendering/privacy, responsive sizing and mobile hand-row
failures were observed before fixes. The new hook initially failed module loading;
its full behavior and races are covered by the subsequent integration tests.

Repository-wide formatting reports five pre-existing exceptions: AGENTS.md,
CODEX-INSTRUCTIONS.md, Roadmap/phase-8.md, Roadmap/phase-9.md, and
.playwright-mcp/page-2026-10-18T13-52-07-008Z.yml. All five are unchanged.
Execution scratch copies are archived outside the repository before the final
formatting check. Changed deliverable text files pass scoped formatting.

Execution logs, native pre-task snapshots, review package and ledger are archived
locally at C:/Users/Lenovo/AppData/Local/Temp/PokerCoachApp-phase-1b-2026-10-19. This preserves recovery evidence without
committing scratch artifacts or changing formatter configuration.

## Known boundaries and manual review

Imports are session-only and refresh loses them. Currency/timezone/format/results
not present in the export stay unknown. Actual file coverage is 8-max capacity;
legacy 6/8/9 demo layout tests are retained. The parser guide remains authoritative
for unsupported GG syntax, heads-up/three-handed formats, muck grammar, multiple
runouts and nonzero deductions. Multiple recorded awards do not imply side-pot
eligibility solving, hand evaluation, strategy grading, or recommendations.

Manual review: import your own supported file; inspect warnings; open each tab;
switch hands after stepping; try Forward/Back and street jumps; verify Hide Result
across table/history/list; replace with an invalid file and retry; inspect phone
navigation/dialog focus. Product approval remains required after READY FOR REVIEW.

## Review rulings and deferred work

- Keep work in the authorized main worktree and uncommitted; preserve pre-existing edits.
  Recovery depends on the archived native baseline rather than new commits.
- Fixture expectations identify the exact source player for partial shows. The shared
  test-only fixture helper resolves from repository cwd because jsdom/Vite rewrites
  import.meta.url; production parsing and fixture bytes are unchanged.
- Full-file UI tests use a 30s test budget under concurrent load; this is not a
  performance guarantee. Real browser regressions own CSS layout checks because
  jsdom cannot calculate layout.
- The obsolete upload-copy assertion follows approved Phase 1B behavior while
  preserving profile/focus/Escape checks. External demo-theme assets require network
  permission for QA; no assets or verification assertions were bypassed.
- Review exclusions stay explicit: unsupported parser syntax, winner evaluation,
  betting legality/side-pot eligibility, AI, persistence/backend/deployment, and
  real 6/9-max files remain outside this increment. Existing layout helper tests
  are not evidence of real 6/9-max export compatibility.
- Local timing measurements are observations, not a production SLA. Final status
  updates follow accepted checks; Phase 0/1A are COMPLETE, Phase 1B READY FOR REVIEW,
  overall Phase 1 IN PROGRESS. No Phase 1C work or deferred minors.

## Files changed

- [Roadmap/README.md](../../../Roadmap/README.md)
- [Roadmap/phase-0.md](../../../Roadmap/phase-0.md)
- [Roadmap/phase-1.md](../../../Roadmap/phase-1.md)
- [docs/specs/gg-parser.md](../../../docs/specs/gg-parser.md)
- [docs/superpowers/plans/2026-10-19-gg-replay-integration.md](../../../docs/superpowers/plans/2026-10-19-gg-replay-integration.md)
- [src/domain/handHistory.ts](../../../src/domain/handHistory.ts)
- [src/domain/replay.ts](../../../src/domain/replay.ts)
- [src/domain/replayAdapter.test.ts](../../../src/domain/replayAdapter.test.ts)
- [src/domain/replayAdapter.ts](../../../src/domain/replayAdapter.ts)
- [src/domain/schemas.ts](../../../src/domain/schemas.ts)
- [src/main.tsx](../../../src/main.tsx)
- [src/parsers/gg/fixtureTestUtils.ts](../../../src/parsers/gg/fixtureTestUtils.ts)
- [src/services/tournamentImport.test.ts](../../../src/services/tournamentImport.test.ts)
- [src/services/tournamentImport.ts](../../../src/services/tournamentImport.ts)
- [src/styles/tournament-import.css](../../../src/styles/tournament-import.css)
- [src/ui/App.tsx](../../../src/ui/App.tsx)
- [src/ui/components/ImportDiagnostics.tsx](../../../src/ui/components/ImportDiagnostics.tsx)
- [src/ui/components/ImportedHandNavigator.tsx](../../../src/ui/components/ImportedHandNavigator.tsx)
- [src/ui/components/ImportedReplayBoundary.tsx](../../../src/ui/components/ImportedReplayBoundary.tsx)
- [src/ui/components/ImportedTournamentWorkspace.tsx](../../../src/ui/components/ImportedTournamentWorkspace.tsx)
- [src/ui/components/PlayerSeat.tsx](../../../src/ui/components/PlayerSeat.tsx)
- [src/ui/components/PokerTable.test.tsx](../../../src/ui/components/PokerTable.test.tsx)
- [src/ui/components/PokerTable.tsx](../../../src/ui/components/PokerTable.tsx)
- [src/ui/components/PrototypeDialog.tsx](../../../src/ui/components/PrototypeDialog.tsx)
- [src/ui/components/ReplayControls.tsx](../../../src/ui/components/ReplayControls.tsx)
- [src/ui/components/TournamentTabs.tsx](../../../src/ui/components/TournamentTabs.tsx)
- [src/ui/components/TournamentUpload.tsx](../../../src/ui/components/TournamentUpload.tsx)
- [src/ui/components/seatLayout.test.ts](../../../src/ui/components/seatLayout.test.ts)
- [src/ui/components/seatLayout.ts](../../../src/ui/components/seatLayout.ts)
- [src/ui/importedTournament.test.tsx](../../../src/ui/importedTournament.test.tsx)
- [src/ui/useTournamentImport.test.tsx](../../../src/ui/useTournamentImport.test.tsx)
- [src/ui/useTournamentImport.ts](../../../src/ui/useTournamentImport.ts)
- [tests/visual/replayer-shell.spec.ts](../../../tests/visual/replayer-shell.spec.ts)
- [tests/visual/tournament-import.spec.ts](../../../tests/visual/tournament-import.spec.ts)
- [tests/visual/tournament-subpages.spec.ts](../../../tests/visual/tournament-subpages.spec.ts)
- [tests/visual/visual-migration.spec.ts](../../../tests/visual/visual-migration.spec.ts)

QA artifacts: this README, ten PNG screenshots linked above, fixture-hashes.json,
and three timing JSON files. Prior-phase generated screenshots and compiler
cache artifacts were restored to their pre-task state; fresh demo QA outputs and
automatic browser diagnostics are preserved in the local execution archive.
No approved reference image was changed.
