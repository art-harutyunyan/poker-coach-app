# Phase 1C.1 Facts, Metrics and Corpus Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended for this delivery) or superpowers:subagent-driven-development to implement this plan task-by-task after authorization. Steps use checkbox syntax for tracking.

**Goal:** Produce reusable deterministic facts, metric opportunities and independently audited tournament counts without changing product UI.

**Architecture:** Canonical ImportedHand inputs feed source-backed facts and a bounded preflop opportunity recognizer. Pure aggregation combines contributions over explicit cohorts; audit rows retain provenance and exclusions.

**Tech Stack:** Existing TypeScript, Zod, Vitest and immutable GG fixtures; no dependencies.

**Spec:** [Approved Phase 1C design](../specs/2026-11-07-phase-1c-tournament-library-stats-design.md), sections 6-8 and 11. Also read the [shared delivery contract](2026-11-07-phase-1c-deliveries.md).

## Global Constraints

- Session memory only; no React, storage, file I/O or network in production fact/metric modules.
- Preserve parser, canonical schemas, ledger, positions, replay, source files and approved UI.
- Definition version is `phase1c-v1`. Unknown is not false. Zero denominator is null, not 0%.
- Use integer contributions and recorded collections; no strategic judgment, side-pot construction or optional metrics.
- No UI wiring, Library, filters or Stats UI implementation in this delivery. No commit/push/deploy.

## Review Focus

- Forced-post exhaustion versus a voluntary decision, including ZERO_STACK_FOLD: Task 1/3 must separate E from showdown eligibility.
- Early/partial/folded shows and summary-only cards: Task 1 must not use a navigation marker as statistical truth.
- Short opens and opponents unable to contest additional chips: Task 2 must not inflate 3-bet denominator.
- Repeated/cohort-overlapping hand IDs and mixed definition versions: Task 3 must reject duplicates rather than average or double count.
- Candidate corpus values becoming self-confirming goldens: Task 4 requires independent source audit before pinning counts.

## Task 1: Evidence contracts and Hero hand facts

**Files:** Create `src/domain/pokerMetricTypes.ts`, `src/domain/handFacts.ts`, `src/domain/handFacts.test.ts`, `src/domain/pokerMetricsTestUtils.ts` (test-only builders). Read `handHistory.ts`, `handLedger.ts`, `replayAdapter.ts`, `replayNavigation.test.ts`, parser guide and local validation skill. Do not edit these existing domain modules.

**Interfaces (owned here):**

```ts
type MetricId = "vpip" | "pfr" | "threeBet" | "sawFlop" | "wtsd" | "wsd";
type ReasonCode =
  | "invalid_hand"
  | "missing_hero"
  | "incomplete_hand"
  | "unsupported_source_warning"
  | "zero_stack_fold"
  | "forced_post_exhausted"
  | "missing_preflop_decision"
  | "missing_hero_reveal"
  | "incomplete_runout"
  | "unsupported_muck"
  | "award_mismatch"
  | "short_open"
  | "ambiguous_reopening"
  | "unsupported_raise";
interface EvidenceRef {
  eventId?: string;
  lineNumber?: number;
  street?: ImportedHand["events"][number]["street"];
}
type Fact =
  | {
      status: "known";
      value: boolean;
      reason?: ReasonCode;
      evidence: readonly EvidenceRef[];
    }
  | {
      status: "unknown";
      reasons: readonly ReasonCode[];
      evidence: readonly EvidenceRef[];
    };
type MetricContribution =
  | {
      status: "eligible";
      numerator: 0 | 1;
      denominator: 1;
      evidence: readonly EvidenceRef[];
    }
  | { status: "not-opportunity"; evidence: readonly EvidenceRef[] }
  | {
      status: "excluded";
      reasons: readonly ReasonCode[];
      evidence: readonly EvidenceRef[];
    };
interface HandFacts {
  definitionVersion: "phase1c-v1";
  key: string;
  room: string;
  tournamentId: string;
  heroPlayerId: string;
  handId: string;
  handNumber: number;
  eligiblePreflop: Fact;
  voluntaryPreflop: Fact;
  preflopRaise: Fact;
  sawFlop: Fact;
  heroShowdown: Fact;
  collectedShare: Fact;
  played: Fact;
}
function deriveHandFacts(hand: ImportedHand, room: string): HandFacts;
```

Export types from `pokerMetricTypes.ts`; export the function from `handFacts.ts`. Composite key is `JSON.stringify([room, hand.tournamentId, hand.heroPlayerId, hand.id])`. A known-false eligiblePreflop fact must carry a reason (for example forced_post_exhausted); ordinary known-false action facts need no reason. Evidence references canonical events/board streets, not fabricated source event IDs. Type EvidenceRef.street as ImportedHand['events'][number]['street'], not arbitrary text. Test builder returns canonical inputs with coherent exact-chip results, plus deliberate invalid variants for defensive-boundary tests; never cast arbitrary invalid poker scenarios into valid fixtures silently.

- [x] **Write RED tests:** table-driven `unopened fold`, `limp`, `call`, `open then fold to 3-bet`, `3-bet`, `4-bet`, `BB check sees flop`, `BB walk`, `voluntary all-in`, `forced-post all-in`, `refunded open`, and `preflop fold before others' runout`. Assert facts explicitly, for example:

  ```ts
  expect(bbCheckFacts).toMatchObject({
    voluntaryPreflop: { status: "known", value: false },
    preflopRaise: { status: "known", value: false },
    sawFlop: { status: "known", value: true },
    played: { status: "known", value: true },
  });
  expect(summaryOnlyFacts.heroShowdown).toMatchObject({
    status: "unknown",
    reasons: ["missing_hero_reveal"],
  });
  ```

  Also assert early all-in SHOW + complete river runout=true; one-card timed SHOW=true in a contested surviving hand; folded/uncontested show=false; contested no Hero SHOW=unknown; marker-only=unknown when contested; MUCK=unknown; missing river=unknown. Verify missing Hero, conflicting Hero flags, incomplete/deformed hand, ZERO_STACK_FOLD, unknown warning and harmless metadata warnings. Record source references. Deep-freeze inputs and verify interleaved calls do not mutate or depend on visit order.

- [x] **Run RED:** `npm.cmd test -- src/domain/handFacts.test.ts --maxWorkers=2`; expected failure is missing exports/required facts, not broken fixture construction.
- [x] **Implement contracts and facts:** use canonical events/streets, the approved E denominator and three-valued OR for Played (a proven true branch establishes true even if another branch is unknown; otherwise unknown dominates false). Validate the canonical envelope and identity before calculation; schema failures become unknown facts, not uncaught exceptions. Treat eligibility anomalies per spec; do not make optional-card or summary inference. CollectedShare is known only when exact COLLECT_POT totals, per-player results and summary pot reconcile; refunds are excluded. Defensive invalid input cannot manufacture an award zero. Keep validation checks bounded to supplied contracts, not a new general poker engine.
- [x] **Run GREEN:** rerun the command and existing `npm.cmd test -- src/domain/replayNavigation.test.ts src/domain/replayAdapter.test.ts --maxWorkers=2`. All pass; fixtures unchanged. Record task-only diff and evidence checkpoint, no commit.

## Task 2: Bounded preflop 3-bet opportunities

**Files:** Create `src/domain/preflopOpportunities.ts`, `src/domain/preflopOpportunities.test.ts`; extend test-only builders as needed.

**Interfaces:** Consume `MetricContribution` and canonical ImportedHand. Export `derivePreflopOpportunities(hand: ImportedHand): MetricContribution` for the one supported 3-bet opportunity per hand. Eligibility cannot depend on final collected chips. Existing HandLedger can be used read-only for exact chips/commitments; minimum-raise/opportunity recognition stays in this new module.

- [x] **Write RED tests** asserting exact contribution objects: full open/fold=0/1; full open/call=0/1; full open/Hero raise=1/1; open+callers/Hero squeeze=1/1; Hero limp then full open/raise=1/1. Unopened fold, walk, Hero original opener facing re-raise and stack only sufficient to call return not-opportunity. Full open followed by legal short all-in Hero second raise=1/1; short opening all-in, prior under-raise/ambiguous reopening and non-all-in undersized raise are excluded with their specified reasons. Include declared BB distinct from a short actual BB post. Assert all-in opener to 300 + other active opponent with commitment+stack=100 + Hero stack=1,000 is not-opportunity; another active opponent able to contest above 300 permits it. Exact equality to 300 is not sufficient. Repeated Hero turns cannot add another denominator.
- [x] **Run RED:** `npm.cmd test -- src/domain/preflopOpportunities.test.ts --maxWorkers=2`.
- [x] **Implement the scan:** initial nominal wager is declared BB; track exact stacks/live commitments, folded players and prior raises up to Hero's observed response. Use `heroRemaining > openingRaiseTo - heroCommitment` and at least one active opponent with `commitment + remaining > openingRaiseTo`. Only one full opening raise, no prior Hero raise/intervening increase, and supported full-open/reopening context qualify. A Hero non-all-in second raise must meet a full increment; a short second raise must exhaust Hero's stack. Once a supported opportunity is assessed, return its one contribution. If a later malformed action makes the canonical hand inconsistent, exclude rather than use an early apparently valid opportunity. Preserve spec exclusion priority for unresolved warnings.
- [x] **Run GREEN:** focused tests plus Task 1 tests; verify source-event evidence references and immutability. Record checkpoint, no commit.

## Task 3: Reusable aggregation and audit records

**Files:** Create `src/domain/pokerMetrics.ts`, `src/domain/pokerMetrics.test.ts`; extend `pokerMetricTypes.ts` with owned result types.

**Interfaces:**

```ts
interface MetricInput {
  facts: HandFacts;
  threeBet: MetricContribution;
}
interface MetricAuditRow {
  key: string;
  handId: string;
  handNumber: number;
  metric: MetricId;
  definitionVersion: "phase1c-v1";
  contribution: MetricContribution;
}
interface MetricSummary {
  numerator: number;
  denominator: number;
  percentage: number | null;
  excluded: number;
  notOpportunity: number;
  reasons: Readonly<Partial<Record<ReasonCode, number>>>;
}
interface PokerMetrics {
  definitionVersion: "phase1c-v1";
  importedHands: number;
  metrics: Readonly<Record<MetricId, MetricSummary>>;
}
function deriveMetricInput(hand: ImportedHand, room: string): MetricInput;
function aggregatePokerMetrics(inputs: readonly MetricInput[]): PokerMetrics;
function buildMetricAudit(
  inputs: readonly MetricInput[],
  metric: MetricId,
): readonly MetricAuditRow[];
```

Functions are exported by `pokerMetrics.ts`; types by `pokerMetricTypes.ts`. DeriveMetricInput composes Tasks 1/2. One private contribution selector in `pokerMetrics.ts` powers aggregation and audit, preventing independent definitions. Audit rows sort by composite key for deterministic cohort order; navigator order is separate. Reject duplicate composite keys, mixed versions and unsafe integer counts with explicit typed Error codes `duplicate_hand`, `definition_mismatch`, `unsafe_count`; never silently deduplicate or average rates.

- [x] **Write RED tests:** E and VPIP/PFR numerator predicates, Saw Flop over E, WTSD over E+sawFlop+known showdown, W$SD over confirmed showdown+known collection independent of E. Forced-post all-in confirmed showdown with positive collection contributes W$SD 1/1 but is excluded from E-based metrics. Assert refund-only does not win, zero award is 0 only when reconciled, partial timed reveal qualifies, summary-only reveal excludes, negative net with positive share wins, 628/629 chop winners each count once in their own Hero cohort, multiple Hero awards count once and missing awards exclude. For aggregation use explicit contribution inputs to assert `1/2 + 1/8 = 2/10 = 20%`, not 31.25%; empty input yields importedHands 0, denominator 0, percentage null. Partition: eligible+excluded+notOpportunity equals input count for every metric; reasons count unique hand/reason pairs. Audit sums equal aggregates. Test duplicate/mixed-version errors, input freezing and permutation/interleaving.
- [x] **Run RED:** `npm.cmd test -- src/domain/pokerMetrics.test.ts --maxWorkers=2`.
- [x] **Implement composition/aggregation:** percentages are unrounded `100*n/d`; presentation owns one-decimal formatting. An eligible fact false for E is excluded with its existing reason; no-opportunity applies to hands outside a metric's known opportunity set (for example known not-saw-flop for WTSD). Unknown facts needed for a metric cause exclusion; unrelated unknowns do not poison independently established eligibility. For W$SD, known non-showdown is not-opportunity; unknown showdown/awards exclude. Do not expose raw source text in audit objects or invent identity across tournaments.
- [x] **Run GREEN:** `npm.cmd test -- src/domain/handFacts.test.ts src/domain/preflopOpportunities.test.ts src/domain/pokerMetrics.test.ts --maxWorkers=2`. Record checkpoint, no commit.

## Task 4: Candidate corpus reports, independent audit and delivery gate

**Files:** Create `src/domain/pokerMetrics.corpus.test.ts`, `scripts/audit-poker-metrics.ts`, `scripts/run-metrics-audit.mjs`, `docs/qa/phase-1c/1c1/{README.md,asset-sha256.txt,metric-counts.json,source-audit.md}` and candidate JSONs in this delivery's scratch directory. Create `docs/adr/ADR-007-deterministic-poker-metrics.md`; modify Roadmap summaries as specified in the index. No package/dependency changes.

**Interfaces:** Export `buildCorpusAudit(tournaments: readonly ImportedTournament[]): {counts: readonly {room:string;tournamentId:string;summary:PokerMetrics}[]; rows: readonly MetricAuditRow[]}` from the audit script; Node-only I/O stays in the script, never domain code. The `.mjs` runner uses installed Vite `createServer` in middleware mode and `ssrLoadModule` to load the TypeScript audit module, then closes the server in `finally` without opening a listening port. Invocation: `node scripts/run-metrics-audit.mjs --out <candidate-directory>`. No extra runner dependency or npm alias. The only supported inputs are the four existing fixture names, loaded explicitly; no directory-wide untrusted execution. The output must retain room/tournament ID with every count summary, rather than depending on array position.

- [x] **Write RED tests:** the report matches tournament-ID-to-hand-count pairs `{314729652:222,314806258:191,317697722:28,309704619:233}`, total 674, independent of array order, integer n/d and exclusion reasons; audit rows reconcile per metric; all results deterministic after reversing tournament order and interleaving parses; files retain initial SHA-256. Use a focused synthetic hand set with independently calculated counts to test the report plumbing before real goldens exist. Initially assert required missing report fields, not fabricated percentages.
- [x] **Run RED:** `npm.cmd test -- src/domain/pokerMetrics.corpus.test.ts --maxWorkers=2`.
- [x] **Implement audit runner/report and run candidate generation:** use immutable parser results and Task 3 APIs. Output deterministic JSON (stable tournament/key ordering, no wall-clock fields) with version, per-metric n/d/percentage/excluded/notOpportunity and hand evidence. Source fixtures stay untouched. Run `node scripts/run-metrics-audit.mjs --out .superpowers/sdd/2026-11-07-phase-1c-1-facts-metrics/candidate-audit` and focused test; candidate counts are not yet goldens.
- [x] **Obtain independent source audit:** dispatch a read-only reviewer under study-poker-validation with candidate rows and original source. For every metric and every tournament inspect at least one numerator and one eligible zero-numerator row (0/1) when present, and at least one non-opportunity/excluded reason when present; record absent categories honestly. Audit every known anomaly and every unique exclusion reason, plus short-open/raise/call-capacity boundaries and the six known IDs named in spec section 11. Audit includes denominator justification from events, not just numerator recognition. If a mismatch is found, reproduce with a focused failing test, fix and regenerate candidate output. Do not pin unreviewed discrepancies. If source requires changing an approved definition rather than fixing its implementation, report the evidence and obtain that scope decision before changing it.
- [x] **Pin audited integer counts and regression:** only after audit reconciliation, save `metric-counts.json` and source reasoning in `source-audit.md`. Have the test compare n/d/exclusions to that file; derived percentages are checked arithmetically. Rerun corpus tests and runner into a second scratch directory; compare deterministic outputs. Never offer an auto-update flag that silently replaces approved goldens.
- [x] **Delivery verification/review:** run all common commands in the index. Have a fresh independent reviewer assess the complete 1C.1 diff and audited evidence (separate from source-audit responsibility); resolve substantive findings via regression tests. Document commands/results, unchanged corpus hashes, exact count tables, coverage limitations and no UI change. Update ADR/Roadmap to 1C.1 READY FOR REVIEW, not Phase 1 complete. Stop for user review before 1C.2.
