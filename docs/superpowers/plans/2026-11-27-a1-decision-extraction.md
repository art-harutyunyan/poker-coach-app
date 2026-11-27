# A1 Hero Decision Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract deterministic, source-backed pre-action contexts for every meaningful Hero betting decision in an imported NLHE hand.

**Architecture:** Traverse canonical `ImportedHand.events` once. `HandLedger` supplies chip, pot, commitment, wager, and call state; a separate A1 tracker supplies raise rights and structural action history. Use Replay only as a regression oracle. Keep the A1 contract separate from the Phase 0 analysis `DecisionContext`.

**Tech Stack:** TypeScript, Zod 3, Vitest 5; existing GG parser, `HandLedger`, replay adapter, and immutable fixtures. No new dependency.

**Spec:** [A1 design](../specs/2026-11-27-a1-decision-extraction-design.md)

## Global Constraints

- Work in the main PokerCoachApp worktree on `feature/a1-decision-extraction`, based on merged `main`; preserve unrelated changes.
- Pure domain implementation. No React/UI, strategy, grade, recommendation, EV, AI, parser replacement, database, or dependency change.
- `UNKNOWN` is not zero. Recoverable `ZERO_STACK_FOLD` skips only the anomalous non-decision; fatal structure/accounting failure returns no decisions.
- Do not alter immutable GG fixture bytes or `docs/qa/phase-1c/1c1/asset-sha256.txt`.
- Use focused RED/GREEN cycles and corpus audit. Do not automatically run broad project verification; provide numbered commands to the user at READY FOR REVIEW.
- No commit, push, merge, or deploy. Do not start A2.

## File Map

- Modify `src/domain/handLedger.ts` and `src/domain/handLedger.test.ts`: pre-action street transition and read accessors; keep current `apply` behavior for existing consumers.
- Create `src/domain/heroDecisionTypes.ts`: strategy-neutral A1 types and reason codes, separate from `schemas.ts` Phase 0 mock.
- Create `src/domain/extractHeroDecisions.ts` and `src/domain/extractHeroDecisions.test.ts`: single-pass extraction, input/fatal handling, legal betting state, and focused regressions.
- Create `src/domain/extractHeroDecisions.replay.test.ts`: curated exact pre-action Replay comparisons.
- Create `scripts/audit-hero-decisions.ts` and `src/domain/extractHeroDecisions.corpus.test.ts`: deterministic corpus report and acceptance assertions.
- Create `docs/specs/hero-decision-extraction.md` and `docs/qa/a1/decision-audit.md` plus a compact representative-context JSON sample: implemented contract and manual-review evidence.

## Review Focus

1. A short posted BB still establishes the nominal preflop wager; Task 1 tests `currentBetChips()` and `amountToCallChips()` against a short blind.
2. The first Hero action on a new street must not inherit previous-street commitments; Tasks 1 and 2 test the pre-action `beginStreet` boundary.
3. Multiple short all-ins can reopen action cumulatively; Task 3 tests both below-threshold and threshold-crossing sequences.
4. A later fatal ledger failure must erase earlier extracted contexts; Task 2 tests exclusion with zero partial decisions.
5. An all-in opponent remains in the non-folded set and can have a contestable committed wager; Tasks 3 and 4 test this with effective stack and Replay comparisons.

---

### Task 1: Expose ledger pre-action wager state

**Files:** Modify `src/domain/handLedger.ts`; test `src/domain/handLedger.test.ts`.

**Interfaces:** `beginStreet(street: HandHistoryEvent["street"]): void`, `currentBetChips(): number`, `facingAmountChips(actorId: string): number`, `amountToCallChips(actorId: string): number`. `currentBetChips` is max(live commitments, nominal BB on preflop); facing is max(0, wager minus actor's commitment); call is min(facing, actor's remaining stack). `apply` remains compatible and calls the same idempotent street transition.

- [x] **Step 1: Write failing tests** for posted SB/BB plus ante (`currentBet=BB`, Hero facing difference, stack-capped call), short BB (nominal BB remains wager), return-adjusted commitments, and `beginStreet("FLOP")` clearing live commitments before Hero's first flop event while retaining pot/stacks.
- [x] **Step 2: Run RED:** `npm.cmd test -- src/domain/handLedger.test.ts`; confirm the missing accessors/boundary cause the expected failures.
- [x] **Step 3: Implement the four interfaces** by reusing the existing `maximum` calculation in `apply`, with safe actor lookup and an idempotent call to the existing `setStreet`.
- [x] **Step 4: Run GREEN:** `npm.cmd test -- src/domain/handLedger.test.ts`; verify existing ledger cases still pass.

### Task 2: Extract source-backed Hero contexts and enforce hand outcomes

**Files:** Create `src/domain/heroDecisionTypes.ts`, `src/domain/extractHeroDecisions.ts`, `src/domain/extractHeroDecisions.test.ts`.

**Interfaces:** `extractHeroDecisions(hand: ImportedHand): DecisionExtractionResult`; `DecisionExtractionResult` is `{status:"ok", decisions:HeroDecisionContext[], diagnostics:DecisionDiagnostic[]}` or `{status:"excluded", decisions:[], diagnostics:DecisionDiagnostic[]}`. Context identity fields: `handId`, `eventId`, `sourceLine`, `decisionIndex`, `street`. Context pre-action fields: `heroPosition`, `heroCards`, `board`, `playersDealt`, `playersInHand`, `playersRemaining`, `heroStackBeforeChips`, `potBeforeActionChips`, `currentBetChips`, `facingAmountChips`, `amountToCallChips`, and `contributionsByPlayerChips` (gross contributions to that point). Each remaining player has `playerId`, `seatNumber`, `position`, `stackBeforeChips`, `streetCommitmentChips`, and `active|all-in` state. Actual action fields: source `FOLD|CHECK|CALL|BET|RAISE`, `isAllIn`, incremental `amountAddedChips`, nullable `raiseToChips`, nullable BB/pot ratios. Later tasks fill the same context's betting/structural fields, not a new output type. Use existing domain `Position`, `Card`, and `Street` types.

- [x] **Step 1: Write failing tests** using `metricHand` and selected parsed fixtures: only Hero voluntary events become contexts; indices are contiguous through two Hero actions on one street; blind/ante/return/partial reveal/split award are excluded; pot/stack/contributions are read before Hero acts; first flop board has exactly three cards and no prior street commitment; actual increment differs from raise-to; input object is unchanged.
- [x] **Step 2: Run RED:** `npm.cmd test -- src/domain/extractHeroDecisions.test.ts`; verify API/behavior failures.
- [x] **Step 3: Implement validation and the single pass.** Validate canonical shape, Hero identity, event order/identity, street/actor references, and cumulative board; do not call `inspectMetricHand` wholesale. Call `ledger.beginStreet(event.street)` before reading each decision and `ledger.apply(event)` once for every event, then `ledger.finish(summary.totalPotChips)` at the end. Catch fatal structural/accounting failures and return `excluded` with no partial decisions. Apply a known `ZERO_STACK_FOLD` through the ledger and folded tracker, but omit its Hero context and emit a recoverable diagnostic with event/line evidence. Do not treat other impossible actions as recoverable.
- [x] **Step 4: Add failing boundary tests** for a later invalid event removing prior contexts, unknown actor, duplicate/out-of-order event, missing canonical Hero cards, a zero-stack forced-post Hero fold retaining other decisions, and a zero-stack fold without the known warning remaining fatal.
- [x] **Step 5: Implement minimal boundary behavior** and run GREEN: `npm.cmd test -- src/domain/extractHeroDecisions.test.ts`.

### Task 3: Add betting legality and structural context

**Files:** Modify `src/domain/extractHeroDecisions.ts`, `src/domain/heroDecisionTypes.ts`; test `src/domain/extractHeroDecisions.test.ts`.

**Interfaces:** `legalActions: ("FOLD"|"CHECK"|"CALL"|"BET"|"RAISE")[] | null`; nullable full `minimumRaiseToChips`; `facingAction: "UNOPENED"|"LIMPED"|"CHECKED_TO"|"FACING_BET"|"FACING_RAISE"|"FACING_3BET"|"FACING_4BET"|"FACING_ALL_IN"` (last wager type and preflop raise count determine the facing form); `potType: "UNOPENED"|"LIMPED"|"SINGLE_RAISED"|"THREE_BET"|"FOUR_BET_PLUS"`; structured `preflopSequence`; `effectiveStackBeforeChips/Bb`; Hero stack BB; `sourceConfidence` plus field/reason diagnostics. The tracker stores last full raise increment and each actor's last acted wager/reopening threshold, not chips or current bet. `legalActions:null` means undetermined, never “nothing legal.” The full `minimumRaiseToChips` may exceed Hero's stack when only a shorter all-in raise is legal.

- [x] **Step 1: Write failing tests** for unopened fold/open, facing open/3-bet/4-bet, Hero BB check option, postflop checked-to/facing bet/check-raise, and distinct preflop sequence prefixes. Assert no fold when nothing is owed, no check facing a wager, and no raise without chips beyond a call or another player able to contest.
- [x] **Step 2: Run RED:** `npm.cmd test -- src/domain/extractHeroDecisions.test.ts`.
- [x] **Step 3: Implement tracker updates after each applied event.** Forced posts do not consume action rights; full raises update the last full increment; short all-in raises retain the prior threshold; cumulative short raises reopen only when the increase since that player's last action reaches the required full increment. Classify preflop pot structure from observed voluntary raises; freeze it on later streets. Keep each preflop sequence prefix source-backed and ordered.
- [x] **Step 4: Add failing tests** for short all-in call/raise, below-threshold and cumulatively reopened action, min-raise/full-raise and all-in exceptions, multiway scalar effective-stack ambiguity, HU all-in opponent contestable commitment, folded player removal, BB/zero-pot ratio handling, returns, and known short-blind warning. Assert every unknown critical field has a deterministic reason and every source-backed actual action is among legal actions unless a documented anomaly makes legality unknown.
- [x] **Step 5: Implement these boundaries** using ledger values; mark unsupported raise/reopening as `legalActions:null` with reason and retain source-backed actual action. Run GREEN: `npm.cmd test -- src/domain/extractHeroDecisions.test.ts src/domain/handLedger.test.ts`.

### Task 4: Cross-check curated decisions against Replay

**Files:** Create `src/domain/extractHeroDecisions.replay.test.ts`.

**Interfaces:** Test-only `toReplayHand(source)`, `findActionCursor(replayHand,eventId)`, and `buildReplayState(replayHand,cursor)`; production extractor does not import Replay.

- [x] **Step 1: Write a curated table** of parsed fixture or valid synthetic hands containing blind option, repeated Hero action, flop/turn/river decision, short all-in, HU, and multiway. For each selected source Hero event, assert exact equality of pre-action pot, Hero stack, visible board, and sorted non-folded player-ID set. Keep documented source warning diagnostics separate.
- [x] **Step 2: Run RED/GREEN investigation:** `npm.cmd test -- src/domain/extractHeroDecisions.replay.test.ts`. Resolve A1 defects; if Replay differs due to a documented source anomaly, report it with event/line and do not silently change expected values. Acceptance: zero unexplained discrepancies.

### Task 5: Audit immutable corpus and document the contract

**Files:** Create `scripts/audit-hero-decisions.ts`, `src/domain/extractHeroDecisions.corpus.test.ts`, `docs/specs/hero-decision-extraction.md`, `docs/qa/a1/decision-audit.md`, `docs/qa/a1/representative-decisions.json`.

**Interfaces:** `buildHeroDecisionAudit(tournaments: readonly ImportedTournament[]): HeroDecisionAudit` is deterministic and read-only. Include hand/decision totals, street and actual-action counts, zero-decision hands, exclusions, unknown critical-field reason counts, recoverable anomalies, Replay discrepancies, and selected contexts identified by hand/event ID. Use `fixtureNames/readFixture` and `parseGgTournament`; do not rewrite source fixtures or SHA manifest.

- [x] **Step 1: Write failing audit tests** for count reconciliation, deterministic ordering across input tournament order, reason coverage for every unknown critical field, no unreported extraction failure, and the four immutable SHA checks already used by `pokerMetrics.corpus.test.ts`.
- [x] **Step 2: Run RED:** `npm.cmd test -- src/domain/extractHeroDecisions.corpus.test.ts`.
- [x] **Step 3: Implement the audit** and run GREEN on all four existing GG fixtures. In the audit (outside production extraction), compare every extractable context against Replay for the four exact pre-action fields. Enforce zero unexpected extraction failures and zero unexplained A1/Replay discrepancies. Record any documented source anomaly separately, with evidence. Report decisions by street and action, and hands with zero decisions.
- [x] **Step 4: Prepare manual review evidence:** save a curated, compact sample of real `HeroDecisionContext` records covering open, call, 3-bet/4-bet, blind option, postflop bet/raise, all-in, and multiway. Include source hand/event IDs and no private raw hand text. Write the corpus counts, unknown reasons, known anomalies, and acceptance result to `docs/qa/a1/decision-audit.md`.
- [x] **Step 5: Write the technical contract** at `docs/specs/hero-decision-extraction.md`: decision and pre-action semantics, amount fields, HandLedger/A1 ownership, raise rules, effective-stack rule, pot type, preflop sequence, unknown/fatal behavior, and Replay's limited test role.
- [x] **Step 6: Run focused GREEN:** `npm.cmd test -- src/domain/handLedger.test.ts src/domain/extractHeroDecisions.test.ts src/domain/extractHeroDecisions.replay.test.ts src/domain/extractHeroDecisions.corpus.test.ts src/domain/pokerMetrics.corpus.test.ts`; inspect `git status` and `git diff --check`. Stop at **A1 — READY FOR REVIEW**. Provide the user numbered commands for the full unit suite, typecheck, lint, build, format, relevant parser/replay regressions, and diff/whitespace checks; do not run broad verification automatically.
