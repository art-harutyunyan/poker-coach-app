---
name: study-poker-validation
description: Use when implementing, debugging, testing, or reviewing GG hand-history parsing, deterministic poker accounting, positions, street transitions, or parser/replay compatibility in PokerCoachApp.
---

# Study Poker Validation

Validate poker truth against repository evidence. This is a reference companion to
Superpowers testing workflows, not a new poker specification.

## Find the evidence

Start with the [parser guide](../../../docs/specs/gg-parser.md); consult the
[approved design](../../../docs/superpowers/specs/2026-10-18-gg-parser-design.md)
for contract rationale. Read only relevant sources below; do not copy specifications.
Paths resolve from this skill directory.

| Concern                           | Sources and existing assertions                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contracts                         | [schemas](../../../src/domain/schemas.ts), [import contracts](../../../src/domain/handHistory.ts)                                                               |
| Accounting                        | [ledger](../../../src/domain/handLedger.ts), [tests](../../../src/domain/handLedger.test.ts)                                                                    |
| GG normalization, streets, errors | [parser](../../../src/parsers/gg/), especially `parser.test.ts`, `normalize.test.ts`, `rawHand.test.ts`, `validation.test.ts`                                   |
| Positions                         | [assignment](../../../src/domain/positions.ts), [tests](../../../src/domain/positions.test.ts)                                                                  |
| Replay                            | [adapter](../../../src/domain/replayAdapter.ts), [adapter tests](../../../src/domain/replayAdapter.test.ts), [engine tests](../../../src/domain/replay.test.ts) |
| Source facts                      | All three [GG fixtures](../../../tests/fixtures/gg/), selected by the [fixture helper](../../../src/parsers/gg/fixtureTestUtils.ts)                             |

## Choose justified assertions

Never invent expected poker calculations. Trace expectations to a fixture hand/line,
justified existing assertion, or independent arithmetic from explicit inputs within
supported contracts. Never regenerate goldens from the implementation under test.
Parser/replay agreement alone cannot detect shared mistakes. Unresolved evidence is
a documented gap, not permission to guess.

- Check safe integer chips, nonnegative stacks, and stacks plus pot conservation
  after each event/projected cursor. For supported zero-deduction hands, reconcile
  contributions minus returns, declared pot, and collections; verify recipients.
- Check blinds/antes separately: antes enter pot, not live commitments. Distinguish
  call/bet contributions, raise contribution, raise-by, and raise-to; preserve
  underlying all-in actions, short calls, and returns separately from winnings.
- Check positions from button, occupied seats, and capacity; distinguish helper
  coverage from observed fixture formats. Check street order, commitment resets,
  cumulative boards, card validity, and contextual malformed-input outcomes.
- Check replay through source-event mappings: cumulative versus incremental boards,
  financial transfers, and final results. A legacy refund `WIN` is not canonical
  winnings. Preserve documented omitted-event/runout diagnostics and display limits.

Multiple recorded awards are supported accounting, not side-pot construction,
eligibility, winner evaluation, or full betting legality. Consult the guide for
unimplemented syntax and warning-bearing exceptions; never infer missing rules.

## Check determinism explicitly

- Reparse identical text/options, including malformed input; compare complete
  outcomes, IDs, order, warnings, errors, and provenance. Interleave another fixture
  before repeating; source formats must not acquire guessed metadata.
- Repeat adaptation: compare complete hands, diagnostics, and event mappings.
  Rebuild each replay cursor after visiting other cursors/hands; compare complete
  frames. Verify canonical/projected inputs and previously returned frames remain
  unchanged. Repeated calls alone do not prove order independence or correctness.

## Work alongside Superpowers

Use `superpowers:test-driven-development` for behavior changes,
`superpowers:systematic-debugging` for failures, and
`superpowers:verification-before-completion` before claims, when available.
Extend relevant tests; rerun all three fixture suites for GG/accounting changes.
Use configured `package.json` checks within authorized scope. Report executed checks,
expectation provenance, existing coverage, and missing assertions separately.
This skill grants no permission for unrelated edits or feature implementation.
