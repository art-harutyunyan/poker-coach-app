# GG Poker Parser — Phase 1A

Status: Phase 1A COMPLETE (user approved). Phase 1 remains IN PROGRESS.

## Architecture and API

Production code is pure TypeScript with existing Zod schemas. It performs no I/O,
network request, persistence, AI call, or strategy analysis. Runtime AI cost: $0.
Phase 1A made no UI/engine changes. Phase 1B integration and its acceptance
corrections are documented below.

```ts
import { parseGgTournament } from "../../src/parsers/gg";
import { toReplayHand } from "../../src/domain/replayAdapter";

const outcome = parseGgTournament(text, { sourceName: "export.txt" });
if (outcome.ok) {
  const { tournament, warnings } = outcome;
  const replayProjection = toReplayHand(tournament.hands[0]!);
  // Inspect warnings and replayProjection.diagnostics before future UI integration.
} else {
  // outcome.errors contains stable type/message/hand/line/rawLine/source context.
}
```

Pipeline: source-numbered splitting → GG line tokens → raw section state machine →
normalization → domain ledger/card validation → validated tournament.
`src/domain/handHistory.ts` derives compatible fields from existing schemas and
reuses card, player, blind, position, action identity, and tournament identity
contracts. Import records omit absent mock analytics/finish requirements.

Hands sort oldest first. `handNumber` is the chronological import ordinal, not a
GG-provided hand counter; `source.sourceHandNumber` retains the export ordinal.
GG hand/tournament IDs are preserved. Player IDs are scoped by tournament and
source name; anonymized names do not establish global account identity.
Original hand text, absolute lines, source event IDs, and raw action lines are
retained for diagnostics. Consumer calculations use typed fields.

## Observed syntax and evidence

| Real fixture                          | Hands | Tournament ID | Buy-in minor units | Occupied players |
| ------------------------------------- | ----: | ------------- | -----------------: | ---------------- |
| Daily Monster Stack $2.50             |   222 | 314729652     |                250 | 5, 7, 8          |
| Fifty Stack $5.50                     |   191 | 314806258     |                550 | 4, 6, 7, 8       |
| GGMasters $150, $1M GTD [2-Day Event] |    28 | 317697722     |              15000 | 7, 8             |
| Daily Classic $10                     |   233 | 309704619     |               1000 | 4, 5, 6, 7, 8, 9 |

All 441 source hands are newest first, NLHE tournaments, and 8-max capacity.
Parsing supports BOM/LF/CRLF; occupied seat gaps; integer chips with comma groups;
per-player antes; SB/BB; empty opponent deals; Hero's two cards; folds/checks/
calls/bets/raises; all-in suffixes on calls/bets/raises; returned bets; shows before
runout or after river; one/two-card reveals; optional literal hand descriptions;
cumulative flop/turn/river; multiple unlabeled collections; and the observed seat
summary variants. The GG `SHOWDOWN` marker also appears on uncontested hands.

In the original three fixtures, four single-card reveals are preserved, including folded players. One hand
(TM6470156513) discloses cards only in its summary: retain summary evidence without
inventing a timed SHOW event. Thirteen hands contain multiple collections. The
GGMasters split in TM6524470976 preserves awards of 628 and 629, not rounded halves.
Source awards are recorded; this parser does not evaluate winning hand strength
or reconstruct main/side-pot eligibility labels.

## Exact chips, actions, and positions

Daily Classic is an additional immutable real regression fixture. Its tables have
8/9-max capacity; the complete four-file corpus contains 674 hands. Summary grammar
also accepts `showed [card(s)] and won (...)` without a `with ...` description.
TM6378370688 retains exactly `[Ah]` and 106,400 collected chips in its summary;
it has no source SHOW event, so no timed reveal or missing card is invented.
Existing card ownership, cardinality, syntax and duplicate validation remain active.

TM6377255556 demonstrates a short BB of 82 at a declared 450 BB level. Its
`raises 450 to 900` uses the declared preflop wager, while only actual contributions
enter the pot. The existing ledger accepts an optional declared BB argument;
the GG normalizer passes the level value. No side-pot eligibility is inferred
from the recorded collections of 343, 343, and 11,058. See the
[Phase 1B correction evidence](../qa/phase-1b-corrections/README.md).

Chip values and intermediate totals must be safe integers. Buy-ins use integer
minor units plus scale 2; no floating-point money arithmetic. BB conversions do
not replace source chips. Unsupported monetary tokens such as `$2,500` are not
silently read as `$2`. Only the first monetary token is considered: an unsupported
first price cannot cause a later guarantee to be selected as the buy-in.

`amountChips` is incremental contribution for posts/calls/bets/raises. RAISE also
requires `raiseByChips` and `raiseToChips`. For example, Fifty's Hero SB raises by
240 to 440: contribution is 340 after the existing 100 blind. Antes do not enter
live street commitments. All-in retains the underlying action and source flag.
`RETURN_UNCALLED` and `COLLECT_POT` are separate positive transfer events; returns
never enter collected winnings. Results include gross contributions, returns,
collections, final stack, and net chips.

Boards are cumulative: flop 3, turn 4, river 5. Repeated source prefixes and summary
boards must agree. Re-observing a player's known cards is allowed; cross-owner
physical duplicates, within-list duplicates, and conflicting reveals fail.

Positions derive from button and clockwise occupied seats, independently of source
player order or Hero's visual location. Full 6/8/9-max helpers have exact required
position tests. Observed 4/5/7-player tables, gaps, wraparound, and shuffled input
are covered; physical capacity is distinct from occupied count.

## Outcomes, warnings, and unresolved cases

Failure is atomic: `{ ok: false, errors, warnings }`, without a partial tournament.
Stable types: unsupported_format, malformed_hand, unsupported_game,
incomplete_hand, invalid_action, invalid_card, inconsistent_seats. The API reports
hand ID, source ordinal, absolute line/raw line, and diagnostic filename when
available. Public consumers do not need to interpret thrown strings.

Metadata warnings are structured:

- `$` does not specify ISO currency: retain symbol and null currency.
- Timestamps provide local wall time without timezone: retain it and null timezone.
- Buy-in is nullable when absent/unrecognized; tournament format classification is
  null. Literal title annotations such as `2-Day Event` are retained.
- Finish, fees split, tournament completion, account identity, and hidden cards
  are not inferred.

TM6471061841 has a 5,493 stack, 1,250 ante, and 4,243 SB at a 5,000 level without
an all-in suffix, followed by an explicit fold at zero. The parser accepts the
remaining-stack blind and preserves that fold with SHORT_BLIND_POST and
ZERO_STACK_FOLD warnings, both in the hand and public result. It does not infer
why the player folded, sit-out status, or pot eligibility. A voluntary all-in
cannot use this forced-post exception. The initial inspection missed the short
post; full-file tests exposed it and focused regressions failed before support.

TODOs requiring additional real evidence:

- Explain GG's forced-post zero-stack fold before eligibility/strategy analysis.
- Muck-line grammar (the domain reserves MUCK, but no fixture contains a muck line).
- Visible opponent deals: rejected as unsupported until a normalized representation
  preserves that evidence; supplied opponent deal lines are empty.
- Heads-up/three-handed positions, dead buttons, short antes, explicit all-in post
  suffixes, nonzero deductions, other game variants, and multiple runout markers.
- ISO currency/timezone and entry-fee classification from an authoritative import
  source. Do not infer them from the user's machine or filename.

Unrecognized substantive syntax is rejected. Existing empty opponent deal lines
carry no hole-card knowledge. No solver, grading, recommendations, analysis, ICM,
training, upload redesign, or persistence is implemented.

## Replay compatibility and limits

Phase 1B extends the existing adapter, shared Hand contract, and replay engine; it
does not introduce a second parser or engine. Imported projections explicitly use
source-event timing, while existing demo hands retain their legacy behavior.
Every projected cursor of all 674 fixture hands reconciles exact stacks/pot with
the canonical ledger; final results and boards match source records.

- Contributions remain incremental chips, with raise-by/to and all-in facts retained.
  RETURN_UNCALLED is a distinct refund; WIN represents only recorded pot collections.
- Hand.streets retains incremental boards; derived DEAL_BOARD steps carry cumulative
  boards, stable hand/street IDs and no fabricated source line/event mapping.
  Board-only runouts have separate flop/turn/river cursors.
- SHOW preserves one/two timed revealed cards, including a folded show. SHOWDOWN
  is an actorless boundary on the last dealt street. Canonical source-event IDs
  remain mapped; source warnings are preserved.
- SOURCE_WARNING remains a diagnostic. NON_FINANCIAL_EVENTS_OMITTED is reserved
  for an unprojected canonical MUCK; no supplied fixture establishes muck grammar.
  Former refund-as-win, sticky refund/all-in, reveal omission and skipped-runout
  diagnostics are retired for supported imported replay.

The local import UI applies Hide Result without changing poker truth and permits
refunds/runouts before collection. Summary-only cards remain completed-hand details,
never invented timed reveals. See [Phase 1B validation](../qa/phase-1b/README.md) for
interactive compatibility, browser evidence, review fixes and remaining limits.

## Tests and verification

Current coverage includes 441 real hands, focused golden facts from multiple hands
in every export, split boundaries/source lines, metadata/exact values, positions,
all observed action forms, card ownership, safe accounting, malformed input,
atomic failures, determinism, and replay cursor equivalence. Fixtures are read
unchanged; no thousands-line snapshots or AI interpretation are used.

Baseline had 91 tests; the final suite has **295 passing tests across 19 files**
(204 added tests in 11 new test files). Final checks on 2026-10-18:

| Check                                       | Result                                                     |
| ------------------------------------------- | ---------------------------------------------------------- |
| `npm run lint`                              | PASS, exit 0                                               |
| `npm run typecheck`                         | PASS, exit 0                                               |
| `npm test`                                  | PASS, exit 0; 295/295                                      |
| `npm run build`                             | PASS, exit 0                                               |
| Scoped Prettier check of all Phase 1A files | PASS, exit 0                                               |
| `npm run format`                            | FAIL, exit 1; only concurrent unrelated files listed below |
| `git diff --check`                          | PASS, exit 0                                               |

Repository formatting flags `CODEX-INSTRUCTIONS.md`, `Roadmap/phase-8.md`, and
`Roadmap/phase-9.md`, which appeared during execution and are outside this task.
They are preserved, not ignored. The approved immutable reference HTML was the
sole baseline format failure; `.prettierignore` excludes only that exact reference
path without modifying it. No parser/product source is excluded from checks.

All three original fixture SHA-256 hashes match the pre-implementation values.
The existing replay/schema files, UI, Phase 0 visual work, and AI boundary were not
modified by this task. Browser screenshots are not part of this parser increment.
Independent review's two Important findings were fixed with RED/GREEN regressions;
no Critical findings or deferred Minor findings remain. Overall Phase 1 is not
complete. Phase 1B now resolves the observed adapter presentation diagnostics;
its separate validation evidence records interactive support.

## Files changed by Phase 1A

New production modules:

- `src/parsers/gg/diagnostics.ts`, `split.ts`, `values.ts`, `tokens.ts`, `rawHand.ts`,
  `normalize.ts`, `index.ts`.
- `src/domain/handHistory.ts`, `positions.ts`, `handLedger.ts`, `cardRegistry.ts`,
  `replayAdapter.ts`.

New tests/helpers:

- `src/parsers/gg/fixtureTestUtils.ts`, `split.test.ts`, `values.test.ts`,
  `tokens.test.ts`, `rawHand.test.ts`, `normalize.test.ts`, `parser.test.ts`,
  `validation.test.ts`.
- `src/domain/handHistory.test.ts`, `positions.test.ts`, `handLedger.test.ts`,
  `replayAdapter.test.ts`.

Documentation/configuration:

- `.prettierignore`.
- `Roadmap/README.md`, `Roadmap/phase-0.md`, `Roadmap/phase-1.md`.
- `docs/specs/gg-parser.md`.
- `docs/superpowers/specs/2026-10-18-gg-parser-design.md`.
- `docs/superpowers/plans/2026-10-18-gg-parser.md`.

The existing three user-provided files under `tests/fixtures/gg/` are consumed and
not edited. Their hashes were recorded before implementation for final comparison.
All pre-existing Phase 0 visual changes remain outside this parser change set.

## Independent review and scope decisions

One independent read-only review found two Important issues and no Critical or
Minor issues. Both have reproducing regressions observed RED before fixes:
unsupported first monetary tokens could select a later guarantee, and visible
opponent deals were accepted without preserving those cards. The first now yields
null buy-in plus a warning; the second is explicitly unsupported. The full suite
passes after both fixes. No second review was requested; fixes are verified by
regressions and the full suite.

Execution rulings and their practical limits:

- Work remains uncommitted in the explicitly authorized checkout because `.git`
  is read-only; native Windows ledger bookkeeping replaces Bash helpers. Recovery
  depends on the working files/ledger rather than per-task commits.
- Real source facts override the initial mistaken short-blind assumption; preserve
  the forced-post zero-stack fold with warnings. Eligibility remains unresolved.
- Reusable card ownership lives in an additional focused `cardRegistry.ts` helper.
- Full poker legality/evaluation/side-pot eligibility remain outside Phase 1A;
  ledger reconciliation is not a complete betting rules engine.
- At Phase 1A completion, legacy diagnostics identified later UI work. Phase 1B
  now resolves the observed refund, reveal and board-only runout gaps.
- The known zero-stack-fold reason is not inferred; future analysis must inspect
  its warning before assigning eligibility.
- UI wiring, persistence, styling, and later roadmap phases remain outside this
  parser increment; Phase 1 therefore remains IN PROGRESS.
- Concurrent `CODEX-INSTRUCTIONS.md`, `Roadmap/phase-8.md`, and
  `Roadmap/phase-9.md` are left intact. Their formatting errors still affect the
  repository-wide formatting command; parser-scoped formatting is checked separately.

## Phase 1B.1 presentation refinement

The parser/domain/adapter and financial replay engine remain unchanged by this
increment. Metadata diagnostics gain neutral Info/Warning presentation, display
aliases preserve exact source IDs, and navigation stops before source reveals.
See [Phase 1B.1 validation and manual review](../qa/phase-1b-1/README.md) for
the four-fixture evidence, privacy, shared cards and browser acceptance.
