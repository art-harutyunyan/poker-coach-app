# A2 Strategy Recommendation Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define and validate source-backed Strategy Engine results for A1 Hero decisions without implementing poker strategy.

**Architecture:** Add a separate pure-domain A2 schema/types module, a deterministic result validator, and engine/selector interfaces. Runtime validation uses A1 facts and legal actions but never recomputes them. No engine instance, registry, selection policy, recommendation data, or UI integration is added.

**Tech Stack:** TypeScript, existing Zod 3 and Vitest 5; `HeroDecisionContext` from A1. No dependency change.

**Spec:** [Approved A2 design](../specs/2026-11-27-a2-strategy-contract-design.md)

## Global Constraints

- Work in the main PokerCoachApp worktree on `feature/a2-strategy-contract`, based on the merged A1 `main` commit. Preserve unrelated changes.
- Keep A2 separate from Phase 0 `DecisionContext`/`StrategyReference`. Do not modify GG parser, HandLedger, A1 extraction, immutable fixtures/SHA, A1 audit sample, or UI.
- No real strategy, preflop ranges, push/fold charts, solver, EV, grading, leak aggregation, AI, opponent model, ICM calculation, persistence, network, or A3 provider.
- An `available` result with unknown A1 legal actions is invalid; neither unsupported nor insufficient context becomes a fallback recommendation.
- The validator must preserve the A1 context and candidate recursively. All test engines are fake and test-only.
- Use focused RED/GREEN and real A1 context compatibility tests. Do not automatically run broad project verification; give numbered commands at handoff.
- No commit, push, merge, or deploy. Stop at **A2 — READY FOR REVIEW** and do not start A3.

## File map

- Create `src/domain/strategyContract.ts`: A2 runtime Zod schemas, inferred result/source/capability/sizing types, schema version, typed reasons, and `StrategyAction` aligned with A1.
- Create `src/domain/strategyEngine.ts`: synchronous `StrategyEngine`, descriptor, selector interface, and selected/none/tie result types; no implementation or registry.
- Create `src/domain/validateStrategyResult.ts`: pure structural and semantic validator returning typed issues or a validated result.
- Create `src/domain/strategyContract.test.ts`: focused contract and selector type tests with fake/test-only data.
- Create `src/domain/validateStrategyResult.test.ts`: focused semantic and immutability regressions.
- Create `src/domain/strategyContract.a1.test.ts`: compatibility tests using saved real A1 contexts without changing the sample.
- Create `docs/specs/strategy-recommendation-contract.md`: implemented API, invariants, provenance, versioning, and A3/A4 boundaries.

## Review focus

1. A mixed result whose largest **individual** entry differs from the largest **aggregate action** must select the aggregate action as representative; Task 3 tests this and the tie case.
2. `CALL` with `all-in` is valid only when A1's positive stack-capped call exhausts Hero; Task 3 tests both sides and forbids numeric CALL sizing.
3. `partial` capability with `supported` confidence or no limitations must fail, while `supported` capability may use any of the three confidence levels; Task 2 tests the matrix.
4. A malformed candidate with an exact-looking but wrong event ID or decision index must be rejected without mutation; Task 2 tests identity and deep freezing.
5. Two economically similar sizes in different declared units are distinct contract entries; identical action/tag/value pairs are duplicates; Task 3 tests both without cross-unit conversion.

---

### Task 1: Define A2 result and engine boundaries

**Files:** Create `src/domain/strategyContract.ts`, `src/domain/strategyEngine.ts`, and `src/domain/strategyContract.test.ts`.

**Interfaces:** `STRATEGY_SCHEMA_VERSION = "a2-v1"`; `StrategyAction = HeroBettingAction`; `StrategyDecisionKey = {handId:string;eventId:string;decisionIndex:number}`; `strategyRecommendationResultSchema` and inferred `StrategyRecommendationResult`. Every status shares `decisionKey`, `{engineId,engineVersion,configurationId?}`, schema version, and `StrategyCapability`. Available carries recommendation, source, and confidence; unsupported carries typed reason; insufficient-context carries typed reason and nonempty typed `missingFields`. `StrategySizing` tags are `chips-added`, `bb-added`, `raise-to-chips`, `raise-to-bb`, `pot-fraction-added`, `all-in`. Frequencies use 0..1. `StrategyEngine` has `id`, `version`, `supports(context)`, and `analyze(context)`; `StrategyEngineSelector.select(context,candidates)` returns selected/none/tie. Candidate descriptors carry integer priority. There is no concrete selector.

- [ ] **Step 1: Write failing shape tests** in `strategyContract.test.ts`: fake/test-only valid available/unsupported/insufficient objects parse; available without source, invalid action, blank engine/source version, nonfinite sizing, out-of-range frequency, empty missingFields, and unknown status fail. Assert action type equality with A1 and all statuses contain exact decision identity.
- [ ] **Step 2: Run RED:** `npm.cmd test -- src/domain/strategyContract.test.ts`. The missing A2 schemas/interfaces cause the expected failures.
- [ ] **Step 3: Implement schemas and types** in `strategyContract.ts`, including typed source kinds/reasons/limitations/scope and an explicit discriminated result union. Define only interfaces/types in `strategyEngine.ts`; no data, registry, or selection function.
- [ ] **Step 4: Run GREEN:** `npm.cmd test -- src/domain/strategyContract.test.ts`. Confirm all shape cases pass.

### Task 2: Validate identity, status, capability, and legal actions

**Files:** Create `src/domain/validateStrategyResult.ts` and `src/domain/validateStrategyResult.test.ts`.

**Interfaces:** `validateStrategyResult(context: HeroDecisionContext, candidate: unknown): StrategyValidationResult`, where success is `{ok:true,result:StrategyRecommendationResult}` and failure is `{ok:false,issues:StrategyValidationIssue[]}`. Issues have typed code and field path. Use `strategyRecommendationResultSchema.safeParse` first, then cross-field checks. Reject rather than repair.

- [ ] **Step 1: Write failing validator tests** for exact `handId/eventId/decisionIndex`, malformed input, known legal primary/mix/alternative actions, illegal actions, and `legalActions:null` with available. Assert rejected output has issues and no recommendation.
- [ ] **Step 2: Run RED:** `npm.cmd test -- src/domain/validateStrategyResult.test.ts`; confirm validator/API failures.
- [ ] **Step 3: Implement shape, identity, and action checks** without re-deriving A1 state. Make `unsupported` require unsupported capability; make insufficient-context require a typed nonempty field list and a non-unsupported capability. Validate capability engine ID against result engine ID.
- [ ] **Step 4: Add failing coherence/immutability tests:** supported capability accepts supported/approximate/limited confidence; partial available requires nonempty limitations plus approximate/limited confidence; unsupported capability cannot be available. Deep-freeze both context and candidate, then assert unchanged JSON after success and failure.
- [ ] **Step 5: Implement coherence checks** and run GREEN: `npm.cmd test -- src/domain/strategyContract.test.ts src/domain/validateStrategyResult.test.ts`.

### Task 3: Validate sizing and mixed strategy semantics

**Files:** Modify `src/domain/validateStrategyResult.ts`; extend `src/domain/validateStrategyResult.test.ts`.

**Interfaces:** Use the approved `1e-6` absolute mix-total tolerance. A duplicate key is action + sizing tag + value, with a separate marker for absent sizing. Do not convert declared units or compare actual Hero size to strategy size.

- [ ] **Step 1: Write failing sizing tests** for each tag, positive finite numeric values, safe integer chip values, `raise-to-*` only on RAISE, no FOLD/CHECK sizing, numeric CALL sizing rejection, CALL all-in only when A1 call exhausts Hero, BB normalization unknown, zero pre-action pot for pot fraction, `chips-added <= heroStackBeforeChips`, and `raise-to-chips > currentBetChips`. Do not reconstruct Hero's street commitment to enforce a raise-to maximum.
- [ ] **Step 2: Run RED:** `npm.cmd test -- src/domain/validateStrategyResult.test.ts`; inspect failures as sizing rules, not fixture strategy assertions.
- [ ] **Step 3: Implement sizing checks** solely in the provider's declared representation; do not convert BB/pot/raise-to units or invent a rounding/grading tolerance.
- [ ] **Step 4: Write failing mix tests** for pure action, valid two-action mix, 0 and >1 frequencies, total outside/inside tolerance, duplicate same-tag entries, distinct cross-unit entries, aggregate primary versus largest entry, tied aggregate primary, primary sizing selection, and alternatives absent when mix exists.
- [ ] **Step 5: Implement mix/alternative checks** including source `isExactReference:false` requiring approximate/limited confidence for a mix. Run GREEN: `npm.cmd test -- src/domain/strategyContract.test.ts src/domain/validateStrategyResult.test.ts`.

### Task 4: Check real A1 compatibility and document the boundary

**Files:** Create `src/domain/strategyContract.a1.test.ts` and `docs/specs/strategy-recommendation-contract.md`.

**Interfaces:** Consume unchanged `docs/qa/a1/representative-decisions.json`; fake/test-only engines or candidates are confined to the test. Test `TM6376938342:line:3808` (BB check), `TM6469820465:line:30` (multiway unknown scalar effective stack), and `TM6524471450:line:47` (turn call).

- [ ] **Step 1: Write failing compatibility tests** showing A2 accepts real A1 identity/known legal actions, permits a provider to support multiway despite null scalar effective stack, accepts a typed insufficient result when that scalar is required, and rejects illegal or wrong-identity fake results. Freeze the saved context and candidate; assert no mutation and no A1 field recomputation.
- [ ] **Step 2: Run RED/GREEN investigation:** `npm.cmd test -- src/domain/strategyContract.a1.test.ts`. Fix A2 defects only; do not alter A1 or saved evidence.
- [ ] **Step 3: Write `docs/specs/strategy-recommendation-contract.md`** with field semantics, three statuses, source/capability/confidence matrix, sizing and mix rules, the representative-only primary action, validation/immutability, selector priority/tie contract, versioning, and A3/A4/A5 boundaries.
- [ ] **Step 4: Run focused GREEN:** `npm.cmd test -- src/domain/strategyContract.test.ts src/domain/validateStrategyResult.test.ts src/domain/strategyContract.a1.test.ts src/domain/extractHeroDecisions.test.ts src/domain/extractHeroDecisions.corpus.test.ts`. Confirm fixture SHA and saved A1 sample unchanged; run targeted ESLint, TypeScript, Prettier, and `git diff --check` on A2 scope.
- [ ] **Step 5: Request independent whole-branch review,** resolve Important/Critical findings with focused RED/GREEN, recheck final scope, and stop at **A2 — READY FOR REVIEW**. Give numbered user commands for focused A2/A1/domain tests and the broad unit, typecheck, lint, build, format, and diff checks. Do not run broad verification automatically.
