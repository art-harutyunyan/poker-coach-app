# Phase 1 - Tournament Upload + Parser + Replayer

## Status

IN PROGRESS — started 2026-10-18 after Phase 0 approval.

## Current acceptance and Phase 1C

Phase 1A, Phase 1B (including manual corrections), Phase 1B.1 and the finalized PlayingCard system are user accepted. Dated review entries below retain their historical verification status.

Phase 1C - Tournament Library + Deterministic Hand Navigation + Deterministic Tournament Stats Foundation uses one shared architecture, delivered separately:

- 1C.1 Facts/metrics and corpus audit: **ACCEPTED** by the user on 2026-11-12; independently audited counts are the regression baseline. See [1C.1 evidence](../docs/qa/phase-1c/1c1/README.md).
- 1C.2 Session Tournament Library: **ACCEPTED** by the user on 2026-11-13. See [1C.2 evidence](../docs/qa/phase-1c/1c2/README.md).
- 1C.3 Hand filtering/navigation: **ACCEPTED** by the user on 2026-11-13. A separate historical 768px demo geometry failure remains documented. See [1C.3 evidence](../docs/qa/phase-1c/1c3/README.md).
- 1C.4 Tournament Stats UI and integrated acceptance: **READY FOR REVIEW — 2026-11-13**. The user-reported final matrix and targeted reruns passed; a fresh independent whole-phase review found no Critical functional defect. Its handoff/accessibility/privacy-test findings were addressed. Human visual acceptance remains pending. See [1C.4 evidence](../docs/qa/phase-1c/1c4/README.md).

[Approved design](../docs/superpowers/specs/2026-11-07-phase-1c-tournament-library-stats-design.md) | [Delivery plans](../docs/superpowers/plans/2026-11-07-phase-1c-deliveries.md) | [1C.1 evidence](../docs/qa/phase-1c/1c1/README.md)

Phase 1C retains imports in session memory only; persistence requires separately approved future work. Phase 1 remains IN PROGRESS.

### Phase 1A — GG parser

**COMPLETE - approved by the user before Phase 1B.** Implementation, acceptance verification,
and the independent review fix pass are complete. The approved [specification](../docs/superpowers/specs/2026-10-18-gg-parser-design.md)
and [implementation plan](../docs/superpowers/plans/2026-10-18-gg-parser.md) cover
all three real GG fixtures: 222 Daily Monster Stack, 191 Fifty Stack, and 28
GGMasters hands (441 total). Phase 1 remains IN PROGRESS.

- [x] Deterministic ingestion, splitting, and observed GG syntax.
- [x] Shared domain normalization, occupied-seat positions, and exact chip ledger.
- [x] Structured errors/warnings and all-three-fixture regression tests.
- [x] Explicit replay adapter and every-cursor financial compatibility tests.
- [x] Final configured checks and independent review (formatting exception documented below).

Phase 1A covers ingestion, parsing, deterministic normalization, validation,
fixtures/tests, and an explicit replay adapter. Upload presentation, persistence,
AI, strategy, and later Phase 1 work are outside this increment.

### Phase 1B - Local GG import and real replay

**IN REVIEW / refinement.** Initially ready for review on 2026-10-19. The approved [specification](../docs/superpowers/specs/2026-10-19-gg-replay-integration-design.md)
and [implementation plan](../docs/superpowers/plans/2026-10-19-gg-replay-integration.md)
are implemented. See the [QA and manual-review handoff](../docs/qa/phase-1b/README.md).

- [x] Local file validation, structured outcomes, summary/warnings, replacement/cancellation safety.
- [x] In-memory real metadata and all-hand navigation without mock analytics.
- [x] Existing adapter/engine extensions for exact refunds, reveals, board-only runouts, and short-handed rendering.
- [x] All 441 real hands: every-cursor accounting, final results, determinism, and immutability.
- [x] Hide Result across table, history, hand navigation, accessible labels, and result details.
- [x] Representative five-width browser QA, all three actual UI imports, ten screenshots.
- [x] Lint, typecheck, 336 tests, 102 browser tests, build, scoped formatting and whitespace checks.
- [x] Independent review: one Important queue-scrolling issue fixed with RED/GREEN evidence; no Critical or deferred Minor findings.

Phase 1 remains **IN PROGRESS**. No AI, persistence, strategy engine, or Phase 1C
work was implemented. Repository-wide formatting has pre-existing exceptions,
listed in the QA evidence; changed deliverables pass scoped formatting.

#### Phase 1B manual acceptance corrections

**READY FOR REVIEW - 2026-10-19.** Approved bounded corrections retain the same
parser/domain/adapter/replay architecture. The added immutable Daily Classic $10
fixture has 233 hands, bringing four-fixture accounting/determinism coverage to 674.
The exact one-card winning summary is preserved; the same file exposed a short-BB
nominal-wager validation defect, corrected without changing actual chip amounts.
Shared hand-card navigation, intentional opponent identities, and contextual
re-import controls replace the reported presentation issues. TM6468725291 SHOW
timing/privacy already passed the initial real UI reproduction and is protected
by permanent component/browser regressions. See [correction QA](../docs/qa/phase-1b-corrections/README.md).

All 355 unit tests pass with two workers; lint/typecheck/build pass. Nine focused
browser cases cover all four real imports and five widths; eight existing demo
pixel/hash/shell guards pass. Independent review's one Important mobile text-lane
issue was reproduced RED and fixed GREEN. All four fixture hashes are unchanged.
No Critical or deferred Minor findings remain; overall Phase 1 is still IN PROGRESS.

#### Phase 1B.1 import and replay refinement

**READY FOR REVIEW - 2026-11-04.** The approved [design](../docs/superpowers/specs/2026-11-04-phase-1b-1-import-replay-refinement-design.md)
and [plan](../docs/superpowers/plans/2026-11-04-phase-1b-1-import-replay-refinement.md)
retain the existing parser, adapter, accounting, replay engine and table geometry.

- [x] Info for metadata gaps; Warnings for source anomalies; exact source details retained.
- [x] Neutral source metadata without currency, timezone or format inference.
- [x] One readable shared card face without changing card slots or seat coordinates.
- [x] Before-SHOW Showdown navigation, individual Forward reveals and Hide Result privacy.
- [x] Stable presentation aliases and accessible exact source IDs.
- [x] Four unchanged fixtures / 674 hands; 381 unit tests and 74 browser cases pass.
- [x] Lint, typecheck, build and changed-file formatting pass; baseline format exceptions preserved.
- [x] Fresh independent final review: no Critical, Important or Minor findings; manual handoff ready.

See [Phase 1B.1 QA and manual acceptance](../docs/qa/phase-1b-1/README.md).
Phase 1 remains IN PROGRESS; Phase 1C, persistence, AI and tournament-library work
have not started.

## Goal

Import GGPoker tournament hand-history files, normalize hands/actions, and connect
real parsed data to the replayer.

## Scope

Parser, upload/import flow, session tournament memory (Phase 1C), parser errors, golden
fixtures, and deterministic replay snapshots from real hand histories.

## Out of Scope

AI analysis, solver integration, full long-term development, and training generation.

## Dependencies

Phase 0 product/design approval.

## Task Checklist

- [x] Implement GGPoker import validation (text/parser boundary).
- [x] Normalize parsed hands using shared Phase 0 schemas and explicit import refinements.
- [x] Add parser fixture regression suite.
- [x] Connect real normalized hands to replayer.

## Acceptance Criteria

- [x] Real anonymized GGPoker fixtures parse into golden normalized outputs.
- [x] Replayer consumes parser output without UI redesign.

## Decisions / ADRs

- Parser architecture and TDD plan were approved before implementation.
- Import records reuse existing schemas without fabricated mock analytics.
- Exact chips, source-local time, nullable ISO currency, and explicit refund events
  preserve source facts. Phase 1A kept the engine unchanged; Phase 1B adds only the
  approved source-event replay extensions behind the same adapter.
- [Parser API, format limits, and review rulings](../docs/specs/gg-parser.md).

## Risks / Open Questions

- Currency/timezone and tournament completion metadata are unavailable.
- TM6471061841 has a short SB followed by an explicit zero-stack fold; structured
  warnings preserve the source while its reason/eligibility remain unresolved.
- Muck grammar, visible opponent deals, heads-up/three-handed policy, nonzero
  deductions, other variants, and extra runout syntax need further real evidence.
- Phase 1B resolves the observed refund/reveal/runout presentation gaps; additional
  unobserved formats still need real evidence.

## Validation Evidence

The following records Phase 1A; current Phase 1B evidence is linked above.

- All three unchanged real GG fixtures parse: 222 + 191 + 28 = 441 hands.
- 295 unit tests pass, including meaningful multi-hand goldens, corruption cases,
  determinism, positions, and every projected replay cursor's financial state.
- Lint, typecheck, tests, and production build pass.
- Parser-scoped formatting passes. Repository formatting fails only on concurrent
  unrelated `CODEX-INSTRUCTIONS.md`, `phase-8.md`, and `phase-9.md`; these are preserved.
- Independent review: two Important findings reproduced RED and fixed GREEN;
  no Critical findings or deferred Minors. `git diff --check` passes.
- No AI/API calls or costs; no Phase 0 UI or replay-engine changes.
- [Detailed evidence and limitations](../docs/specs/gg-parser.md).

## Completion Log

- 2026-10-18: Phase 1A parser READY FOR REVIEW. Phase 1 remains IN PROGRESS.
- Phase 1A excluded UI wiring and upload presentation; Phase 1B now connects the
  local UI. Persistence, AI and Phase 1C remain unimplemented.
- 2026-10-19: Phase 1A approved COMPLETE; Phase 1B READY FOR REVIEW after all-three-fixture
  integration, browser QA, automated checks and independent review fix. Phase 1 remains IN PROGRESS.
- 2026-11-04: Phase 1B.1 READY FOR REVIEW after four-fixture preservation, 381 unit tests,
  74 browser cases, lint/typecheck/build, scoped formatting and a clean fresh independent review.
  Phase 1B remains IN REVIEW / refinement; Phase 1 remains IN PROGRESS. No Phase 1C work.

- 2026-11-07: Approved shared playing-card system READY FOR REVIEW, pending human
  visual acceptance. Source SVGs preserved; compact/table/board variants, Ten
  presentation and concealed identity verified. 392 unit tests and seven post-review
  browser cases pass; 64 historical visual/privacy and 12 geometry cases passed
  before the final back-variant fix. Independent review finding fixed with regressions.
  [Screenshots, constrained-size exceptions and deferred test minor](../docs/qa/playing-cards/README.md).
  Phase 1 remains IN PROGRESS; no Phase 1C work.
