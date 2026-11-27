# A2 Strategy Recommendation Contract and Capability Model

## Intent and boundaries

A2 defines the pure-domain agreement between A1's deterministic `HeroDecisionContext` and future strategy providers. It lets an engine say what it covers, return a source-backed action or action mix, or explain why it cannot answer. A2 does not calculate poker strategy, EV, a grade, or advice. No production engine, registry, AI, persistence, UI integration, or raw-hand parser belongs here. A3 supplies the first real provider; A4 compares the actual action with a recommendation; A5 connects validated results to presentation.

The authoritative input is the existing `HeroDecisionContext`. A2 never recomputes pot, stack, position, board, action sequence, effective stack, or legal actions. A1's `legalActions: null` means action legality is unknown, not an empty legal set. A2 may reject an input as insufficient for an engine without changing A1. The Phase 0 `DecisionContext` and `StrategyReference` remain mock presentation contracts and are not reused or modified.

## Approaches

1. **Separate A2 contracts, validator, and selector interface (chosen).** Define domain types and runtime checks; document a deterministic selection rule. Fake engines exist only in tests. This makes the first A3 provider possible without production orchestration code now.
2. Build a production engine registry and selection policy in A2. This could exercise overlap immediately, but there are no real providers or priority requirements to register, so it would add framework behavior before A3 can validate it.

The user selected option 1 and explicitly deferred registry and concrete selection behavior to A3. A separate A2 contract also preserves the A1 and Phase 0 boundaries.

## Engine and result shape

`StrategyEngine` is synchronous and pure-domain: an `id` and `version`, `supports(context): StrategyCapability`, and `analyze(context): StrategyRecommendationResult`. No network adapter or runtime engine instance is created in A2. For the same context, engine version, and configuration, an implementation must return the same result unless its source explicitly declares stochastic behavior; A2 introduces no randomness.

Every result has a `decisionKey` made from A1 `handId`, `eventId`, and `decisionIndex`, an engine ID/version, and an A2 schema version. The three result states are a discriminated union:

- `available`: a validated recommendation, source reference, confidence classification, and capability.
- `unsupported`: a typed reason and capability saying which spot the engine does not cover. This is a valid answer; no generic fallback action is inserted.
- `insufficient-context`: a typed reason, a nonempty list of typed missing A1 fields, and capability. It means required facts are unknown or ambiguous for that engine, not that the spot class is unsupported.

An `available` result requires `context.legalActions` to be known so A2 can validate every recommended action. When legality is unknown, an engine returns `insufficient-context` with `legalActions` listed. A source or engine returning `available` anyway is a contract error; the validator rejects it and never silently rewrites the result. An engine may support a multiway spot despite A1's scalar effective stack being null if it does not require that scalar.

## Recommendation, action, and sizing

Reuse A1 `HeroBettingAction` (`FOLD`, `CHECK`, `CALL`, `BET`, `RAISE`). `isAllIn` belongs to a sizing/state descriptor and never replaces the action. `primaryAction` is required. `primarySizing` is optional for `BET` or `RAISE`. `FOLD` and `CHECK` have no sizing. `CALL` has no numeric sizing because A1 already determines the call amount, but it may carry `all-in` when A1's stack-capped call equals Hero's remaining stack. Missing sizing means the source recommends an action but gives no supported size. It is not a zero-size bet.

Sizing is a tagged union with explicit units: incremental `chips-added`, incremental `bb-added`, `raise-to-chips` or `raise-to-bb` (total live street commitment, valid only for `RAISE`), `pot-fraction-added` (incremental chips divided by A1's `potBeforeActionChips`), or `all-in` (the remaining stack committed by that action). Only finite, positive numeric amounts are valid; chip values must be safe integers. A pot fraction requires a positive pre-action pot; BB sizing requires known blind normalization; `CALL` with `all-in` requires A1's stack-capped call to equal Hero's positive remaining stack. The validator checks size form and action compatibility. It may check directly comparable chip bounds, but does not convert relative units into chip targets, invent rounding rules, or assert a model's preferred amount from A1 facts.

A2 validates sizing in the provider's declared representation only. It does not determine economic equivalence between `raise-to-bb`, `raise-to-chips`, pot fractions, or other forms, and it defines no tolerance or rounding rule for comparing an actual size with a recommended size. A4 or a later sizing-normalization layer owns that comparison.

`alternatives` lists distinct other acceptable action/sizing choices without grading labels or invented frequencies. It may be empty. If a mix is present, its entries already describe the strategy choices, so alternatives must be absent or empty to avoid two conflicting choice lists.

## Mixed strategy semantics

`strategyMix` is optional. When absent, the recommendation is a pure action recommendation. When present it is a nonempty list of action/sizing entries with frequencies in **0..1**. Each frequency is finite and greater than zero; the total must equal 1 within an absolute tolerance of `1e-6`. Frequencies are provider-declared action selection weights, never win probabilities. Identical action plus normalized sizing pairs may occur only once; entries cannot name actions outside A1's legal set. Duplicate identity is the action, sizing tag, and value within that tag (including an explicit marker for absent sizing). Equivalent economic amounts written in different units are **not** treated as duplicates: A1 does not expose a separate exact BB chip field, and cross-unit conversion would require rounding and sizing policy that A2 does not own. Providers should emit one representation for a given intended size.

`primaryAction` is the action with the highest **aggregate** mix frequency across its sizes. On an aggregate tie, either tied action may be explicitly named primary. When `primarySizing` is present, it must match a highest-frequency sizing entry within the chosen primary action; ties are explicitly selectable. If the chosen action has multiple sizes and no primary sizing, that absence means the source does not designate a representative size. With a mix, `primaryAction` is a representative/display action, **not** the only correct action. A4 must evaluate Hero's actual action against the entire action-and-sizing mix with its frequencies, not just compare it to `primaryAction`. The validator enforces the representative relation. It also checks that a pure recommendation's alternatives are distinct from its primary action/sizing pair.

## Source, confidence, capability, and versioning

Every available recommendation identifies a concise `StrategySource`: stable source ID; typed source kind; source name; source version; exact-reference flag; assumptions; and whether its result is deterministic or approximate. The source kind can distinguish future curated range, deterministic rule, push/fold, solver-derived, postflop model, ICM model, and exploit adjustment, without asserting any currently exist. Do not embed source documents or allow mock/AI output into production A2 recommendations. This follows ADR-004's evidence/provenance requirement while keeping the Phase 0 mock schema separate.

`StrategyConfidence` is a deterministic applicability classification (`supported`, `approximate`, `limited`) with optional typed limitations. It does **not** mean the probability that an action wins. An exact-reference flag applies only to the cited source/version. A mix from a non-exact source must be classified `approximate` or `limited`, never presented as exact reference truth.

`StrategyCapability` reports `supported`, `partial`, or `unsupported`, the engine ID, an optional compact scope declaration, and typed limitations. Scope can declare only dimensions a provider actually constrains: street, table size, Hero position, stack depth, pot type, heads-up/multiway, tournament/cash mode, ante structure, ICM availability, and facing-action type. No exhaustive coverage matrix is created in A2. A capability describes coverage, not a recommendation or grade. For an `available` result, the validator requires the following coherence:

- `supported` capability may use `supported`, `approximate`, or `limited` confidence, according to the cited source.
- `partial` capability requires explicit nonempty limitations and confidence of `approximate` or `limited`; it cannot claim fully `supported` confidence.
- `unsupported` capability can never accompany `available`.

The A2 schema version, engine ID/version, source ID/type/version, and any future configuration identifier travel with the result. A3 may use them for cache keys; A2 persists nothing. Old results retain the versions that produced them. Validation rejects missing or blank required provenance. This is consistent with ADR-005's future versioning requirement.

## Validation and failure behavior

`validateStrategyResult(context, candidate)` is a deterministic domain boundary that returns either a typed validated result or a typed list of contract issues. It parses untrusted result structure at runtime, verifies the exact A1 decision key, checks coherent engine/capability/source versions, and applies the action, sizing, mix, confidence, and status rules above. It checks all primary, mix, and alternative actions against `context.legalActions`. It must not mutate either the A1 `HeroDecisionContext` or the candidate result, including nested arrays/objects. It never filters illegal entries, changes frequencies, substitutes CHECK/FOLD, or turns a bad available result into unsupported. Unknown legal actions, illegal action, bad size, bad frequency/total, duplicate pair, missing source, or mismatched decision identity cause rejection.

The validator does not judge poker strategy, whether a provider truly covers a spot, or whether a legal sizing is strategically sound. A2 tests use clearly labeled fake/test-only engines and real saved A1 contexts only as input examples. The fake actions are contract fixtures, not recommendations for the product.

## Selector boundary

Define only a `StrategyEngineSelector` interface and its selection result types. It receives an A1 context and candidate engine descriptors/capabilities; it returns one selected engine, no supporting engine, or an unresolved tie. No production registry or concrete policy is implemented. The future orchestration rule is explicit: prefer `supported` over `partial`, then higher configured integer priority; an equal-rank tie is unresolved and must not silently pick by array order. A3 owns configuration, registration, selection implementation, and any stricter specificity rule when the first real provider exists.

## Verification and delivery

Use focused TDD for runtime structure and semantic invariants: available, unsupported, insufficient, legal and illegal actions, pure and mixed recommendations, frequency total and duplicates, sizing units, source/version validity, capability coherence, and exact decision identity. Test real A1 representative contexts including a BB check option, a multiway context with unknown scalar effective stack, and a later-street decision. Confirm the input is not mutated and no A1 fact is recomputed. No existing GG fixtures, SHA manifest, A1 audit sample, parser, ledger, A1 extractor, or UI file may change.

Deliver a concise `docs/specs/strategy-recommendation-contract.md`, focused tests, and an independent review. Stop at **A2 — READY FOR REVIEW** without commit, push, merge, deploy, production strategy, or A3 work. Provide numbered commands for user-run broad verification.
