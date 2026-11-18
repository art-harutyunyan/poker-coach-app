# Phase 1C.1 - Facts, metrics and corpus audit

Status: READY FOR REVIEW (2026-11-12). Human acceptance pending. Only 1C.1 is authorized. No UI integration or 1C.2 work.

## Contracts implemented

All production contracts use `phase1c-v1` and canonical `ImportedHand` inputs:

- `deriveHandFacts(hand: ImportedHand, room: string): HandFacts` returns identity/provenance plus eligiblePreflop, voluntaryPreflop, preflopRaise, sawFlop, heroShowdown, collectedShare and played. Each fact is known true/false or unknown with reasons.
- `derivePreflopOpportunities(hand: ImportedHand): MetricContribution` returns one eligible 0/1 or 1/1 contribution, a non-opportunity, or an exclusion with reasons.
- `deriveMetricInput(hand: ImportedHand, room: string): MetricInput` composes those shared projections.
- `aggregatePokerMetrics(inputs: readonly MetricInput[]): PokerMetrics` sums integers over an explicit cohort, reports exclusions/non-opportunities, and computes unrounded percentages or null for an empty denominator.
- `buildMetricAudit(inputs: readonly MetricInput[], metric: MetricId): readonly MetricAuditRow[]` supplies composite hand key, source ID/ordinal, version, contribution and event/line/street references. Rows use the same metric selector as aggregates.

Composite keys encode `[room,tournamentId,heroPlayerId,handId]`. Duplicate keys, definition-version mismatch and invalid integer contributions throw `MetricCohortError` codes `duplicate_hand`, `definition_mismatch` and `unsafe_count`. No global player identity is inferred. Inputs remain unmodified and aggregation/audit order is deterministic.

## Denominators and opportunity boundaries

E requires an unambiguous Hero deal, chips after forced posts and an observed preflop decision or proven BB walk. VPIP/PFR share E; Saw Flop also uses E. Forced posts, refunds and awards are not voluntary entry. An all-in Hero remains participating when a flop is dealt; a flop after Hero's preflop fold does not count.

3-bet requires an observed response to the first full open, no prior Hero raise/intervening raise, Hero chips beyond a call, and an active opponent whose live commitment plus remaining stack exceeds the opening wager. Full opens use the nominal BB. A short all-in Hero second raise may count; short opens and ambiguous reopening are excluded. An original Hero opener facing subsequent raises is a known non-opportunity. Validation continues after observing the opportunity: a later unsupported non-all-in under-raise excludes the record; a legal short all-in does not erase an earlier opportunity. Incomplete settlement or contradictory canonical results exclude all metrics at the shared boundary.

WTSD uses eligible saw-flop hands with known source-confirmed showdown status. A surviving contested Hero needs independently established participation, a timed one/two-card SHOW before collection and a complete river runout. Folded/uncontested shows are false; surviving Hero without source reveal is unknown. W$SD independently uses confirmed showdowns with reconciled awards, including a forced-post-exhausted Hero when supported. Any positive recorded collection counts once, regardless of net chips, chops or multiple awards. No side-pot eligibility or winner evaluation is constructed.

## Audited corpus counts

See [pinned count records](metric-counts.json) for exact unrounded percentages, exclusion reasons and all partition counts. The following table is generated from those independently audited records; each cell is numerator/denominator (one-decimal display percentage).

| Tournament (imported hands) | VPIP           | PFR            | 3-Bet         | Saw Flop       | WTSD          | W$SD          |
| --------------------------- | -------------- | -------------- | ------------- | -------------- | ------------- | ------------- |
| 309704619 (233)             | 48/232 (20.7%) | 38/232 (16.4%) | 13/96 (13.5%) | 29/232 (12.5%) | 11/29 (37.9%) | 8/11 (72.7%)  |
| 314729652 (222)             | 52/222 (23.4%) | 38/222 (17.1%) | 7/84 (8.3%)   | 30/222 (13.5%) | 13/30 (43.3%) | 11/13 (84.6%) |
| 314806258 (191)             | 42/190 (22.1%) | 31/190 (16.3%) | 8/78 (10.3%)  | 33/190 (17.4%) | 22/33 (66.7%) | 13/22 (59.1%) |
| 317697722 (28)              | 6/28 (21.4%)   | 6/28 (21.4%)   | 2/11 (18.2%)  | 5/28 (17.9%)   | 2/5 (40.0%)   | 1/2 (50.0%)   |

## Independent source audit

The [source-audit report](source-audit.md) contains 29 representative hands, absolute original-file line references, all present metric/status categories per tournament, known anomalies and denominator arithmetic. A separate raw-text scanner corroborated all 674 hands, 4,044 contribution rows and 24 aggregate records, including chip conservation and partition identities. It did not import production parser/facts/metrics functions as its oracle.

The audit found one initial classification error: TM6471059891 is an original-Hero-raiser non-opportunity, not an ambiguous-reopening exclusion. A real-source regression failed before the precedence fix and passed afterward. Fifty 3-bet remains 8/78; its exclusions changed from 3 to 2 and non-opportunities from 110 to 111. The auditor approved the revised records before they were pinned. Original and revised candidate evidence remains in the task scratch directory.

## Exclusions and limits

- Daily Classic and Fifty each contain one zero-stack-fold hand; all six metrics exclude that hand because eligibility is unresolved. No sit-out explanation is inferred.
- Each of those tournaments also has one relevant short-open exclusion for 3-bet. Other short blind posts alone do not cause blanket exclusion.
- The real corpus contains no surviving contested Hero without timed reveal, no forced-post-exhausted Hero showdown and no live one-card Hero showdown. Both required summary-only examples have Hero folding preflop. These boundaries are covered synthetically, not claimed as observed real coverage.
- Unknown warnings, incomplete/invalid inputs, missing/inconsistent awards, MUCK, short Hero all-in second raises and the exact all-in-300 / other-opponent-100 capacity case have synthetic coverage. The bounded recognizer is not a complete betting-legality engine.
- WTSD remains source-confirmed and W$SD means collected a share, not cash profit, hand strength or strategic quality. No metric UI is shipped in this delivery.

## Verification and test coverage

Baseline: 392 existing tests passed. New tests cover voluntary/forced actions; walks/checks; opens/limps/calls/3-bets/4-bets/refunds; board-only runouts; SHOW timing and partial/folded/uncontested/summary-only evidence; all-in capacity and raise boundaries; missing Hero/deal, anomalies and malformed/card-conflicting inputs; independent W$SD eligibility; chops/multiple awards/negative-net shares; zero denominators; cohort overlap/version rejection; immutability/order independence; immutable hashes and audited corpus regressions.

Final post-review verification: `npm.cmd test -- --maxWorkers=2` passed 465/465 tests across 33 files; `npm.cmd run lint`, `npm.cmd run typecheck` and `npm.cmd run build` passed. All 73 focused facts/opportunity/metrics/corpus tests passed. Scoped Prettier and git diff whitespace checks passed. Post-fix counts and all audit rows remain byte-identical to the independently approved candidate. All 98 protected existing source/fixture/dependency files match the pre-delivery baseline; the only differences across its full 116-file manifest are the two intended Roadmap updates. Build-generated tsconfig metadata was restored to its pre-build bytes. No browser suite is required for this domain-only delivery. Existing parser/replay compatibility tests run in the full suite.

## Files and scope

New production modules: `src/domain/pokerMetricTypes.ts`, `metricHandValidation.ts`, `handFacts.ts`, `preflopOpportunities.ts`, `pokerMetrics.ts`.

New test modules: `src/domain/handFacts.test.ts`, `preflopOpportunities.test.ts`, `pokerMetrics.test.ts`, `pokerMetrics.corpus.test.ts`, and test-only `pokerMetricsTestUtils.ts`.

New audit tools: `scripts/audit-poker-metrics.ts`, `scripts/run-metrics-audit.mjs`. New evidence: this directory's README, immutable hashes, pinned counts and source audit. Architecture: `docs/adr/ADR-007-deterministic-poker-metrics.md`. Roadmap and Phase 1C plan status updates record current acceptance without deleting historical evidence.

The pre-delivery baseline contains hashes/copies of existing source, fixture, roadmap and ADR files. Parser, canonical contracts, ledger, replay, adapter, positions, cards, styling, UI and dependencies must match that baseline at handoff. No commits, push, merge or deployment. Phase 1 remains IN PROGRESS; 1C.2 requires explicit user approval after 1C.1 review.

## Execution rulings

- Use the user-authorized main worktree and native PowerShell ledger/brief/checkpoint equivalents of Bash helpers; retain scratch evidence because there are no commits. Recovery relies on the baseline/files rather than task commits.
- Add the shared `metricHandValidation.ts` consumer boundary to avoid duplicated checks between facts/opportunities. Cost: one additional focused module, no canonical contract edits.
- Give the two multi-pass corpus tests a local 30-second timeout after an observed 5-second timeout. All semantic/hash assertions remain; this is not a performance acceptance claim.

## Final independent review and fix pass

The fresh independent code reviewer reported no Critical findings, three Important findings and no Minor findings. All three entered one RED/GREEN fix pass:

1. Continue bounded preflop validation after observing Hero's opportunity: a later non-all-in under-raise excludes the hand; a legal later short all-in preserves the earlier opportunity.
2. Reject incomplete settlement and contradictory canonical results at the shared boundary, so no metric denominator accepts an incomplete record. Regressions remove all collections, reduce a collection and contradict a final stack.
3. Require independent Hero participation before confirming showdown. A timed SHOW alone cannot make unknown participation eligible for W$SD or Played; forced-post-exhausted participating Hero remains supported.

Five new regressions failed before the fixes; all 73 focused tests passed afterward. No second review was dispatched, following the executing-plans workflow. The original source-audit correction is documented separately above.

Additional review rulings:

- Complete betting-turn legality, hand-strength evaluation and side-pot eligibility remain outside this bounded metrics layer. Users receive source-backed counts with explicit exclusions, not a new poker adjudicator. Cost: unsupported legality outside the bounded recognizer is not independently adjudicated.
- The Node audit runner consumes the four fixed unique corpus exports; duplicate tournament containers supplied directly to that report helper are outside its supported invocation. Production aggregation rejects duplicate composite hand keys. Cost: the audit helper must not be repurposed as a general import boundary without validation.
