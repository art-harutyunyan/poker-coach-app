# Phase 1B — Local GG Tournament Import and Real Replay

Status: written specification awaiting user review, 2026-10-19.
The architectural direction is approved; this document does not authorize
implementation. Phase 0 and Phase 1A are approved and complete. Phase 1 remains
IN PROGRESS. Phase 1B is not yet READY FOR REVIEW as an implemented feature.

## Outcome and boundaries

A user selects a real GG `.txt` file through the existing Upload Tournament UI,
receives an import summary and accessible warnings, opens Tournament Review,
selects actual hands, and replays their events. Processing stays local and
in memory. Imported tournament data replaces demo data throughout that tournament
workspace. Refreshing may lose the import.

Reuse `parseGgTournament`, the existing imported domain contracts, `toReplayHand`,
`buildReplayState`, replay controls, and table/seat components. Do not introduce
another parser, adapter, replay engine, or tournament domain model. A runtime
state envelope and additions to existing replay contracts are integration work,
not alternative sources of poker truth.

No AI/API calls, strategy calculations, solver, grading, recommendations,
analytics engine, persistence, localStorage for imports, backend/cloud upload,
authentication, profiling, ICM, subscriptions, or Phase 1C work. Preserve the
approved visual system, routing approach, and unrelated functionality.

## Existing evidence and governing contracts

- [Repository instructions](../../../AGENTS.md), [roadmap](../../../Roadmap/README.md),
  and [Phase 1](../../../Roadmap/phase-1.md).
- [Architecture ADR](../../adr/ADR-001-application-architecture.md) and
  [schema validation ADR](../../adr/ADR-006-core-schema-validation.md).
- [Parser guide](../../specs/gg-parser.md) and
  [Phase 1A design](2026-10-18-gg-parser-design.md) own GG syntax, normalization,
  unsupported cases, warnings, and accounting semantics. Do not duplicate them.
- [Import contracts](../../../src/domain/handHistory.ts),
  [shared schemas](../../../src/domain/schemas.ts),
  [ledger](../../../src/domain/handLedger.ts),
  [adapter](../../../src/domain/replayAdapter.ts), and
  [replay engine](../../../src/domain/replay.ts).
- [Poker validation skill](../../../.agents/skills/study-poker-validation/SKILL.md)
  governs source-backed expectations, accounting, and determinism validation.

Inspection established that upload is currently a prototype dialog, tournament
views read module-level mocks, and there is no imported-tournament runtime state.
The seat layout requires full occupancy. The adapter maps refunds to `WIN`, omits
reveals/showdown boundaries, and cannot expose separate board-only runout steps.
These are the specific integration gaps this phase may address.

The inspection baseline ran
`npm.cmd test -- src/parsers/gg/parser.test.ts src/domain/replayAdapter.test.ts`:
18 tests in two files passed. This is baseline evidence, not Phase 1B acceptance.

## Architecture and ownership

```text
Existing upload dialog
  → local import controller
  → existing parseGgTournament
  → ImportedTournament + structured warnings
  → in-memory runtime state and selected hand
  → existing toReplayHand with source-complete projection
  → existing buildReplayState
  → existing tournament tabs, controls, table, and seats
```

The import controller owns file validation, reading, parser invocation, and typed
outcomes. React consumes those outcomes; it does not tokenize GG lines. Runtime
state owns the active source, import status, selected hand, and cursor lifecycle.
The existing adapter owns event projection. The existing replay engine owns
financial/state reconstruction. UI components format domain values and apply
privacy; they do not independently calculate pots, stacks, or poker positions.

Keep changes to the existing application composition focused. Extract import and
imported-view responsibilities where needed without restructuring unrelated
pages. Existing mock schemas must not acquire fabricated values to accommodate
imports. Keep schema composition used by Phase 1A (`pick`, `omit`, `extend`)
compatible when extending replay fields.

## File ingestion and outcomes

Accept a case-insensitive `.txt` extension. A nonempty MIME type must be textual
(`text/*`) or the generic `application/octet-stream`; an empty MIME type is
allowed. Explicit incompatible types such as PDF or images are rejected before
parsing. Neither extension nor MIME proves valid GG content: the parser remains
the format authority. Reject zero-byte and whitespace-only text as empty input.

Read locally using the browser File interface. Preserve the diagnostic filename
when invoking the parser. Do not send, persist, or log raw hand histories.

Retain parser failures as their existing structured `ParserIssue[]` and warnings
as `ParserWarning[]`, including available hand/line context. Do not change fatal
parser failures into successful imports or downgrade unsupported syntax.
File-boundary failures require only a small typed distinction for invalid type,
empty file, and read failure; they do not introduce another poker/parser error
taxonomy. Adaptation/rendering failures use a separate internal integration-error
state and preserve diagnostics; they must not be described as invalid GG syntax.

Display concise error text with optional safe contextual details, no white screen,
and an immediate way to select another file. Treat source text and filenames as
untrusted text; do not render them as HTML or expose raw history in ordinary UI.

## Runtime transitions and replacement safety

| Event                                 | Required state and behavior                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Initial visit                         | Existing demo source is explicitly labeled; no imported tournament exists.                                     |
| Open dialog or cancel the file picker | Do not discard a successful import merely for opening the picker.                                              |
| Select a new file                     | Enter import mode, clear the previous imported tournament/selection/cursor/results, then validate/read.        |
| Read or parse pending                 | Prevent duplicate submission, expose a busy state, and add no artificial delay.                                |
| Success                               | Store the parsed object and warnings; select its first chronological hand with cursor zero and Hide Result on. |
| Failure                               | Keep no previous imported tournament, adapted hand, or successful-summary CTA; allow retry.                    |
| Close during a pending read           | Invalidate that attempt; its eventual completion cannot restore discarded state.                               |
| Later import or selection             | Reset hand-specific state atomically and ignore superseded asynchronous completions.                           |

Use an attempt identity or equivalent cancellation guard for asynchronous reads.
After an import attempt begins, a missing/failed import must not silently fall
back to demo tournament content. A tournament view without a ready import shows
a neutral empty/error state with an upload action. Demo content can be entered
only through the initial clearly labeled demo flow or an explicit demo choice.

Keep successful imported state while navigating existing app sections. Other
demo sections may remain, but must be identified as demo and must not claim to
describe the imported tournament. Do not add persistence or new routes.

## Import summary and warnings

On success show the real tournament name, ID, hand count, game, distinct table
capacities, and warning count. The primary CTA is `Open Tournament Review` and
opens the existing tournament workspace on Overview. Display literal available
metadata; unknown currency, timezone, format, finish, and results stay unknown.
Do not interpret the user's machine timezone or `$` as missing metadata.

Provide an expandable warnings area in the summary and an accessible entry point
from imported Tournament Review. Retain structured fields internally and show
message, category/code, and available hand/line context. Ordinary warnings do not
block success. In particular retain `SHORT_BLIND_POST` and `ZERO_STACK_FOLD`
without inferring their cause or pot eligibility.

## Imported tournament views and demo boundary

The header, workspace chrome, Overview, Review Queue, hand rail, hand heading,
table, footer, and analysis area must consistently use the active source.
Imported views must not read mock tournament metadata or fake analysis as a
fallback. Existing development-only table-size/all-in preview mutations and QA
cursor parameters apply only to demo hands; they must never alter imported data.

Overview shows real metadata and neutral unavailable states for analytics. Do not
show mock development charts, scores, ROI, finish, winnings, VPIP/PFR/3-bet rates,
strengths, priorities, grades, or coaching claims for an imported tournament.

Review Queue and the Replayer rail become neutral navigation over all imported
hands in parser-provided chronological order. Display hand number, known Hero
cards, position, occupied players/capacity, and optionally existing deterministic
BB formatting. Distinguish the parser's chronological ordinal from the GG hand ID.
Do not fabricate prioritization, severity, confidence, category, or grades.
Use bounded scrolling within existing surfaces so full files remain navigable.

Selecting a hand opens Replayer, selects that exact ID, starts at cursor zero,
and resets Hide Result to on. Clear previous board, reveals, result text, review
flags, actor display, and source-specific diagnostics. Retain immutable source
hands; adapt the selected hand once per selection rather than reparse the file.

The imported analysis surface says `Analysis not available yet` and explains that
strategy/decision analysis belongs to a later phase. Only existing deterministic
context may accompany it. Do not invoke or manufacture `HandAnalysis` data.

## Narrow extensions to the existing replay contracts

Extend the existing shared replay `Hand`/`Action` contracts and engine; do not add
a parallel timeline engine. Source-complete imported projections are explicitly
distinguishable from legacy demo hands, whose existing cursor behavior remains
compatible. `toReplayHand` remains the single adapter entry point and retains its
return envelope: projected hand, diagnostics, and source-event mapping.

The imported projection preserves:

| Replay step                                   | Meaning                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Existing ante/blind/fold/check/call/bet/raise | Source actor and incremental chips; retain raise-by/to and source all-in information where applicable. |
| `RETURN_UNCALLED`                             | Explicit pot-to-player refund, not a `WIN` or collected winnings.                                      |
| Existing `WIN`                                | Projection of a source `COLLECT_POT`; keep separate source awards and recipients.                      |
| `SHOW`                                        | Zero-chip source reveal, retaining one or two known cards and its source identity.                     |
| `SHOWDOWN`                                    | Actorless, zero-chip source boundary; does not imply a contested showdown or evaluate a winner.        |
| Board reveal                                  | Actorless, zero-chip derived street-boundary step using the canonical cumulative board.                |

Add nullable actors only for explicit boundary steps; real player actions/reveals
still require a seated actor. Add only the fields needed for these representations
and their validation. A derived board step is labeled as derived, has a stable
hand/street identity, and has no fabricated source line or source-event ID.
It is a deal/display transition, not an invented player action.

Merge canonical events in their existing sequence with one board reveal per
parsed postflop street, before that street's events. Deal all intervening streets
even when they have no actions. Keep showdown events after the final dealt
street. This uses typed streets/events, not reparsing raw GG text.
Source mappings cover every projected canonical event; derived board steps are
explicitly excluded. IDs/order and mappings are deterministic.

Retire the refund-as-win, omitted-source-event, and skipped-runout limitations for
the imported interactive projection. Do not retain misleading diagnostics for
cases now supported. Keep source warnings and truthful remaining diagnostics.
Phase 1A syntax and accounting contracts remain authoritative and unchanged.

## Cursor, financial state, and rendering

Cursor `n` means the state after the first `n` replay steps. At zero, stacks are
starting stacks, pot and live commitments are zero, the board is empty, and no
opponent cards have been revealed. Forward applies one step; Back reconstructs
the preceding state. Non-player steps never highlight a fake current actor.

Imported boards appear only after consuming their board-reveal step. Street
navigation lands immediately after the corresponding reveal, before that
street's first player event; Preflop lands at zero. All-in runouts therefore have
distinct flop, turn, and river states even without betting actions. Showdown is
a distinct phase/step while retaining the last dealt betting street for the board.

Keep chip transfers in the existing engine. Antes affect pot, not live commitments;
raises contribute incremental chips. Returns restore chips and reduce the proper
live commitment; collections reduce pot and increase the named recipient's stack.
Gross contributions, returns, and winnings remain distinct facts. Clear live
commitments at street transitions and completed payout. A refunded player with
chips is not displayed as currently stack-exhausted solely because of an earlier
all-in. Preserve the forced-post zero-stack-fold source warning without inventing
an eligibility rule.

At every step, retain exact integer chips and reconcile pot plus stacks with
starting stacks. At completion, reconcile the existing source results and awards.
Multiple source collections do not authorize side-pot construction, eligibility
solving, hand-strength evaluation, or minimum-raise/action-order adjudication.

Use parsed positions and physical table capacity. Accept supported partially
occupied tables by relaxing only the full-occupancy assumption in `layoutPlayers`;
retain position uniqueness, supported positions, clockwise ordering, Hero mapping,
and existing anchors. Do not fill empty seats with invented players. Hero remains
bottom-center. All current fixtures have 8-max capacity; they do not establish
real 6-max/9-max file coverage, although existing 6/8/9 layout checks remain required.

## Cards and Hide Result

Hide Result starts on for every new import/hand. It is a presentation/navigation
policy, not an alternate calculation of poker state.

| Situation                               | Required presentation                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Hero cards                              | Use the known parsed cards; existing folded styling remains meaningful.                                                                   |
| Opponent cards before a consumed `SHOW` | Concealed, even when Hide Result is off.                                                                                                  |
| Consumed `SHOW`, Hide Result on         | Keep opponent card values and hand descriptions concealed.                                                                                |
| Consumed `SHOW`, Hide Result off        | Show only the revealed cards; a single-card show leaves the other unknown. Preserve folded state for a folded player's legitimate reveal. |
| Summary-only cards                      | Show only in completed-hand result details with Hide Result off; never invent a timed reveal or early table knowledge.                    |
| Future actions/reveals/results          | No descriptive result, card values, amounts, or outcome-bearing tooltips/accessible labels while Hide Result is on.                       |

With Hide Result on, cap navigation immediately before the first actual pot
collection, not before a refund. Allow earlier refunds, source boundaries, and
board runouts. Enabling privacy from a later cursor clamps the stored cursor to
that boundary. Turning it off retains the current cursor and enables subsequent
steps; it does not automatically jump to the result.

The hand list/rail uses no outcome-bearing summaries while hidden. The action
history, ribbon, table cards, result details, accessible names, and tooltips obey
the same policy. While off, action history may expose supported source results,
but table cards/board still obey the consumed cursor. Do not invent a future actor
or opponent cards from summary data. Privacy toggles never mutate source records;
rebuilding the same unmasked domain cursor produces the same financial state.

## Validation and acceptance evidence

Use the existing fixture helper and all three immutable exports. Expectations come
from source facts and existing justified assertions, not freshly generated parser
snapshots. Do not duplicate Phase 1A syntax-unit coverage.

| Fixture                               | Expected hands | Existing source-backed integration cases                                                                                                                                          |
| ------------------------------------- | -------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily Monster Stack $2.50             |            222 | `TM6469820465`: Hero 77, all-in, distinct board-only runout, 672,100 award; also a short-handed hand selected from existing parsed data.                                          |
| Fifty Stack $5.50                     |            191 | `TM6471062694`: Hero BB, Qc/Ah, 160,225 short call, 129,067 refund, 420,450 collection; `TM6470172527`: seven occupied seats in 8-max; `TM6471061841`: preserved source warnings. |
| GGMasters $150, $1M GTD [2-Day Event] |             28 | `TM6524471450`: Hero raise contribution 586, raise-by 495/to 656, turn all-in call 5,874 and return 417; `TM6524470976`: separate 628/629 awards.                                 |

These facts are anchored in
[normalization goldens](../../../src/parsers/gg/normalize.test.ts),
[parser tests](../../../src/parsers/gg/parser.test.ts), and
[adapter tests](../../../src/domain/replayAdapter.test.ts). The
[fixture helper](../../../src/parsers/gg/fixtureTestUtils.ts) identifies the three
files in [tests/fixtures/gg](../../../tests/fixtures/gg/). Preserve their bytes.

Required implementation evidence:

- TDD at import/state/replay integration boundaries. First reproduce each changed
  layout/reveal/runout/refund behavior with a failing regression; then fix the
  smallest existing layer. Preserve unrelated user changes.
- All three full exports pass parser → runtime → selection → existing adapter →
  existing engine, including meaningful selected-hand facts and every hand's
  final accounting. Compare every new replay step's pot/stacks with the canonical
  ledger at its mapped source prefix; board steps move no chips. Supplement shared
  ledger comparisons with the independent golden facts above.
- Determinism: repeated/interleaved imports produce equal domain outcomes and
  diagnostics; repeated adaptation preserves IDs/mappings; visiting other cursors
  or hands and returning reconstructs identical full frames. Canonical input,
  projected input, and earlier returned frames remain unchanged. Test failing
  imports and asynchronous replacement/cancellation as well.
- UI coverage: valid/invalid/empty/unreadable files, parser failure and retry,
  successful summary, warning details, review CTA, real hand counts/navigation,
  repeated switching/reset, Forward/Back, street/board progression, reveals,
  returns/collections, Hide Result, and absence of mock/strategy leakage.
- Actual Chrome/Playwright workflow for all three imports; inspect representative
  preflop-through-river replay, refunds, all-ins, warnings, invalid replacement,
  privacy, and hand reset. Check console errors, readable rows, keyboard/focus,
  usable dialog/controls, and overflow at 1440, 1024, 768, 430, and 390 pixels.
- Preserve existing demo visual/behavior tests. Historical whole-file hash guards
  need an explicitly documented scope adjustment for the functional files changed
  by Phase 1B; retain protection for unchanged assets, mock data, and real fixtures.
  Keep approved screenshot/style comparisons. Do not blindly refresh visual
  baselines or skip checks to conceal an unexplained change.
- Follow existing `docs/qa/<task>/README.md` and named PNG evidence conventions,
  using `docs/qa/phase-1b/` for this phase. Do not overwrite prior-phase evidence.
- Run configured lint, typecheck, unit/integration tests, applicable Playwright
  suites, build, scoped Prettier, and whitespace/diff checks. Report actual results
  and existing unrelated formatting exceptions without fixing unrelated files.
- Complete an independent final review of requirements, poker accounting/privacy,
  integration boundaries, and executed evidence; resolve substantive findings.

Measure full-file import responsiveness during browser acceptance. Do not add
workers, queues, streaming infrastructure, or arbitrary waits without demonstrated
need. This specification does not promise performance figures not yet measured.

## Review gates and eventual completion

This task writes this specification only. Stop for user review before creating an
implementation plan or changing production code. After specification approval,
the Superpowers planning workflow defines implementation tasks and execution
method; this document is not that implementation plan.

Phase 1B may become READY FOR REVIEW only after the complete local workflow,
all-three-fixture integration, exact accounting, privacy, no mock leakage,
responsive/browser acceptance, required checks, and independent review pass.
At that point update roadmap evidence to Phase 0 COMPLETE, Phase 1 IN PROGRESS,
Phase 1A COMPLETE, and Phase 1B READY FOR REVIEW. Do not mark Phase 1 complete or
start Phase 1C. Existing stale status text is not changed by this specification-only
task. Known parser format gaps remain the Phase 1A guide's documented limitations.
