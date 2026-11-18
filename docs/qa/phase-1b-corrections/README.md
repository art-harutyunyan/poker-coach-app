# Phase 1B manual acceptance corrections

Status: **READY FOR REVIEW - 2026-10-19.** This bounded correction retains the
approved architecture and design. Overall Phase 1 remains IN PROGRESS; Phase 1C,
AI, persistence, commits, pushes and deployment are outside this work.

## Source facts and corrections

- The new immutable `GG20260905-2102 - Daily Classic 10.txt` contains 233 hands.
  Together with the original 222/191/28 fixtures, all 674 hands are covered by
  every-cursor accounting, replay reconstruction, repeat/interleaved determinism,
  final results and immutability checks. [Fixture hashes](fixture-hashes.json)
  were captured from the native baseline before implementation.
- TM6378370688: the exact summary `Seat 2: f5cbea50 (big blind) showed [Ah] and won (106,400)`
  failed before the narrow optional-description grammar fix. The resulting
  summary contains one Ah, 106400 collected chips, and no invented SHOW event.
  Invalid/empty/duplicate cards remain rejected; existing two-card syntax passes.
- The full file then exposed TM6377255556: BB posts 82 at level 225/450, SB posts 225,
  and a source raise is by 450 to 900. Positive and corrupted-raise regressions both
  failed before the existing ledger was given the explicit level BB. Contributions
  stay exact; recorded collections 343/343/11058 reconcile pot 11744. This is recorded
  payout accounting, not side-pot construction or winner evaluation.
- TM6468725291: initial read-only tracing and pre-change Chrome at 1440/390 both
  already preserved Ah5d after BTN SHOW at cursor 23, Hero KdKc, and privacy.
  No failing reveal-path regression was manufactured and no parser/adapter/engine
  reveal code was changed. Permanent component/browser tests verify before SHOW,
  consumed opponent/Hero SHOW, privacy toggling and the subsequent board runout.
- Imported IDs retain exact source/domain values. Seats, accessible labels and
  completed results display `Opponent <source ID>`; Hero remains Hero.
- Both navigation surfaces use the existing ImportedHandNavigator and PlayingCard
  component: actual Hero cards, ordinal, position, occupied/capacity count and subdued
  GG hand ID. No grades, mistakes or recommendations are added.
- Re-import is next to tournament context on all three tabs. Persistent navigation
  upload remains, the imported utility icon is removed, dialog focus returns, and
  the demo shell stays unchanged.

## Verification and review

Final checks after the independent review fix pass:

| Check                                                            | Result                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| `npm run lint`                                                   | PASS                                                    |
| `npm run typecheck`                                              | PASS                                                    |
| `npm test -- --maxWorkers=2`                                     | 355/355, all 24 files                                   |
| `npm run build`                                                  | PASS                                                    |
| Focused correction + prior-fixture Playwright cases, two workers | 9/9; all four complete fixtures imported through the UI |
| Existing demo pixel/hash and shell-dialog guards                 | 8/8; five approved Replayer widths unchanged            |
| Independent focused tests                                        | 129/129, 10 files                                       |
| Changed-file formatting/whitespace, source/fixture integrity     | PASS; repository-wide exceptions below                  |

Before the final worker-bounded run, the default full suite passed twice (355/355).
A later run concurrent with two Chrome workers, lint, typecheck and build timed out
seven cases: file import fixtures 0/1, App keyboard replay/queue navigation, and
app import fixtures 0/1/2. Its log records 348 passed and seven failed; failures were
5s test deadlines or an import-summary wait deadline. With browser/build work ended
and two unit workers, all 355 pass in 38.85s. No tests are skipped and no timeouts
or global configuration are relaxed. Prefer bounded test concurrency on this host.

The independent reviewer ran 129 focused tests across 10 files and verified all four
fixture hashes. One Important finding: mobile opponent labels overlapped action
text by 6px. A new browser bounding-box regression reproduced the overlap, then
passed after compact imported name/stack lanes. No Critical or Minor findings.
The author verifies the fix; no second independent review is claimed. The final
browser suite checks action/name/stack bounds after consumed actions, full label
width, row identity bounds, and SHOW/privacy. Geometry and approved demo styles are unchanged.

Repository-wide Prettier retains five unchanged pre-existing exceptions: AGENTS.md,
CODEX-INSTRUCTIONS.md, Roadmap/phase-8.md, Roadmap/phase-9.md, and
.playwright-mcp/page-2026-10-18T13-52-07-008Z.yml. Changed deliverables pass formatting.

Browser checks cover the new complete file at 1440/1024/768/430/390, SHOW/privacy at
desktop/mobile, row content bounds, full visible opponent IDs, bounded queue
scrolling, shared row markup, contextual import on every tab, dialog focus and
absence of fake analytics. Existing Fifty/GGMasters browser cases cover refunds,
partial seating, replacement/recovery, separate awards, and no import network/storage.
The existing approved-demo pixel/hash guards are retained without refreshing references.

During visual QA, desktop rail cards initially clipped hand IDs and mobile single-line
opponent labels truncated IDs. Observed RED regressions now cover both. Grid rows
size to content; imported identity labels use compact separate lines. The older
browser layout helper now targets row metadata rather than a card's hidden suit label;
its original no-squeezing assertion is preserved. No unrelated baseline is refreshed.

## Screenshots and manual review

- [Complete real import](import-success-1440.png)
- Hand rail: [desktop](hand-rail-1440.png), [mobile](hand-rail-390.png)
- Review Queue: [desktop](review-queue-1440.png), [mobile](review-queue-390.png)
- SHOW/privacy OFF: [desktop](show-off-1440.png), [mobile](show-off-390.png)
- Privacy ON: [desktop](show-hidden-1440.png), [mobile](show-hidden-390.png)
- [One-card summary result](partial-summary-390.png)

Import Daily Classic via the real file picker, open all tabs, and inspect warnings.
Select TM6378370688; its row has Hero Th7s and its completed result has only the
recorded opponent Ah. Import Daily Monster Stack, select TM6468725291 and disable
Hide Result: before cursor 23 opponent cards are hidden; at 23 Ah5d appears; at 24
Hero KdKc remains; subsequent street controls deal the board. Re-enable privacy
and verify concealment. Try contextual re-import and persistent navigation upload.

Imports remain memory-only; refresh loses them. The parser guide's unsupported
formats and unknown metadata rules still apply. Actual fixture capacities now
include 8/9-max, with 4-9 occupied seats; no real 6-max-capacity export was supplied.
No solver, eligibility evaluation, full betting-legality engine or coaching was added.

Native baseline, RED/GREEN logs, review diff and recovery evidence are stored locally
at `C:/Users/Lenovo/AppData/Local/Temp/PokerCoachApp-phase1b-corrections-2026-10-19`.
Generated prior-phase QA outputs are archived there and restored to their original
bytes; approved reference images were not refreshed.

## Review scope decisions

- Keep the already-correct SHOW pipeline; test the exact behavior through the real UI.
- Preserve summary-only Ah without assigning it a source reveal time.
- Full legality, side-pot eligibility, zero-stack-fold explanations and unobserved
  formats require separate evidence and remain outside these corrections.
- Keep existing positional action-history labels; imported identity formatting
  applies where source player names are displayed.
- Preserve all pre-existing Phase 0/1A/1B changes and unrelated formatting exceptions.
  No AI, persistence, Phase 1C or shell/table redesign is authorized.

## Files changed

- [Roadmap/phase-1.md](../../../Roadmap/phase-1.md)
- [docs/qa/phase-1b/README.md](../../../docs/qa/phase-1b/README.md)
- [docs/specs/gg-parser.md](../../../docs/specs/gg-parser.md)
- [src/domain/handLedger.ts](../../../src/domain/handLedger.ts)
- [src/domain/replayAdapter.test.ts](../../../src/domain/replayAdapter.test.ts)
- [src/parsers/gg/fixtureTestUtils.ts](../../../src/parsers/gg/fixtureTestUtils.ts)
- [src/parsers/gg/normalize.ts](../../../src/parsers/gg/normalize.ts)
- [src/parsers/gg/parser.test.ts](../../../src/parsers/gg/parser.test.ts)
- [src/parsers/gg/tokens.test.ts](../../../src/parsers/gg/tokens.test.ts)
- [src/parsers/gg/tokens.ts](../../../src/parsers/gg/tokens.ts)
- [src/services/tournamentImport.test.ts](../../../src/services/tournamentImport.test.ts)
- [src/styles/tournament-import.css](../../../src/styles/tournament-import.css)
- [src/ui/App.tsx](../../../src/ui/App.tsx)
- [src/ui/components/ImportedHandNavigator.test.tsx](../../../src/ui/components/ImportedHandNavigator.test.tsx)
- [src/ui/components/ImportedHandNavigator.tsx](../../../src/ui/components/ImportedHandNavigator.tsx)
- [src/ui/components/ImportedTournamentWorkspace.tsx](../../../src/ui/components/ImportedTournamentWorkspace.tsx)
- [src/ui/components/PlayerSeat.tsx](../../../src/ui/components/PlayerSeat.tsx)
- [src/ui/components/PokerTable.test.tsx](../../../src/ui/components/PokerTable.test.tsx)
- [src/ui/components/seatLayout.test.ts](../../../src/ui/components/seatLayout.test.ts)
- [src/ui/format.ts](../../../src/ui/format.ts)
- [src/ui/importedTournament.test.tsx](../../../src/ui/importedTournament.test.tsx)
- [src/ui/useTournamentImport.test.tsx](../../../src/ui/useTournamentImport.test.tsx)
- [tests/visual/phase1b-corrections.spec.ts](../../../tests/visual/phase1b-corrections.spec.ts)
- [tests/visual/tournament-import.spec.ts](../../../tests/visual/tournament-import.spec.ts)

This QA directory adds the README, four-fixture hash manifest and ten screenshots.
The user-supplied Daily Classic fixture is preserved byte-for-byte. No approved
specification, reference image, mock data, routing or replay-engine implementation
was changed by this correction.
