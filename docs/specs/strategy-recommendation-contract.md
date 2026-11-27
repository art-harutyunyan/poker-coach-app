# A2 Strategy Recommendation Contract

This document describes the implemented domain boundary between A1 Hero decisions and future strategy providers. The types and runtime schemas live in `src/domain/strategyContract.ts`; `validateStrategyResult` is the acceptance boundary. A2 contains no production provider, registry, selector policy, recommendation data, grading, EV, AI, or UI wiring.

## Input and result identity

An engine receives an unchanged A1 `HeroDecisionContext`. A2 reads its decision identity, known legal actions, and pre-action facts. A2 never recomputes pot, stack, position, board, action sequence, effective stack, or legality. The Phase 0 `DecisionContext` and `StrategyReference` are presentation mocks and remain separate.

Every result carries `schemaVersion: "a2-v1"`, the exact A1 `{ handId, eventId, decisionIndex }`, `{ engineId, engineVersion, configurationId? }`, and a capability. The validator rejects a mismatched identity, schema, or capability engine ID. Versions and source identifiers stay attached to old results; A2 does not persist or migrate them.

| Status                 | Required content                                                            | Meaning                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `available`            | Recommendation, source, confidence, capability                              | A source-backed recommendation whose actions and sizing pass A1-aware checks.                                                                   |
| `unsupported`          | Typed coverage reason, `unsupported` capability                             | The engine does not cover this spot; it supplies no fallback action.                                                                            |
| `insufficient-context` | Typed reason and nonempty typed `missingFields`, non-unsupported capability | Coverage may exist, but required A1 facts are unknown or ambiguous. For `required-field-unknown`, listed fields must actually be unknown in A1. |

An `available` result requires known A1 `legalActions`. `legalActions: null` is unknown legality, not an empty legal set. The validator rejects `available` in that case and never repairs or downgrades it. A provider can support a multiway spot with null scalar `effectiveStackBeforeChips` when it does not need that scalar.

## Recommendation and sizing

Actions are A1 `HeroBettingAction`: `FOLD`, `CHECK`, `CALL`, `BET`, `RAISE`. `primaryAction` is required. Optional `primarySizing` is a tagged value: `chips-added`, `bb-added`, `raise-to-chips`, `raise-to-bb`, `pot-fraction-added`, or `all-in`. The first two and pot fraction describe incremental commitment; `raise-to-*` describes total live street commitment and applies only to `RAISE`. `all-in` describes committing the remaining stack and does not replace the action.

Numeric sizes must be finite and positive; chip sizes must be safe integers. `FOLD` and `CHECK` have no size. `CALL` has no numeric size; its `all-in` tag is valid only when A1's positive stack-capped call exhausts Hero's remaining stack. BB sizing needs known BB normalization, and pot fraction needs a positive pre-action pot. `chips-added` cannot exceed Hero's remaining stack; `raise-to-chips` must exceed the current live bet. A2 checks the provider's declared representation only. It does not convert between BB, chips, raise-to, or pot fraction, determine their economic equivalence, or define tolerance/rounding for grading an actual size.

Without `strategyMix`, `primaryAction` and optional sizing are a pure recommendation. `alternatives` may name other distinct action/sizing pairs without grades or frequencies. A choice absent sizing means the source supplies no supported size, not zero size.

With `strategyMix`, entries have positive finite frequencies within 0..1 and sum to one within absolute `1e-6`. Frequencies are action selection weights, not win probabilities. The same action plus sizing tag and value (including absent sizing) may occur once. Different tags remain distinct even if a later normalization layer could find equivalent amounts. `alternatives` must then be absent or empty.

`primaryAction` is the **representative display action** with the highest aggregate frequency across its sizes. Ranking uses exact numeric comparison; the `1e-6` allowance applies only to validating the mix total. On an exact aggregate tie, either tied action can be named. If `primarySizing` is supplied, it must match a highest-frequency size entry within that action, also by exact comparison; absence means no representative size was designated. `primaryAction` is not the only correct action. A4 must evaluate Hero's actual action and sizing against the complete mix and its frequencies.

## Source, confidence, and capability

An available result cites a stable source ID, typed kind, name, version, exact-reference flag, assumptions, and determinism declaration. This provenance follows ADR-004. Test-only source objects in A2 tests are contract fixtures, not product recommendations.

Confidence is an applicability classification: `supported`, `approximate`, or `limited`; it is not a win probability. Capability reports `supported`, `partial`, or `unsupported`, engine ID, optional compact coverage scope, and typed limitations.

| Available capability | Permitted confidence                  | Additional rule                         |
| -------------------- | ------------------------------------- | --------------------------------------- |
| `supported`          | `supported`, `approximate`, `limited` | Confidence follows the cited source.    |
| `partial`            | `approximate`, `limited`              | Explicit nonempty limitations required. |
| `unsupported`        | None                                  | Cannot accompany `available`.           |

A mixed result from a non-exact source cannot claim `supported` confidence. Scope is a provider declaration, not a measured coverage matrix. The validator does not prove that a provider truly covers the spot or that its recommended action is strategically good.

## Validation and selection boundary

`validateStrategyResult(context, candidate)` parses the unknown candidate with strict Zod objects, then checks identity, status/capability coherence, legal actions, sizing, mixes, and provenance. It returns either `{ ok: true, result }` or `{ ok: false, issues }` with typed codes and paths. It rejects unknown fields and preserves exact identifier and provenance text; it does not trim, mutate the candidate or A1 context, filter illegal entries, adjust frequencies, or substitute an action. Declared stack-depth scope must have a maximum at least as large as its minimum.

`StrategyEngine` and `StrategyEngineSelector` are interfaces only. A selector receives a context and candidate engine descriptors with integer priority and declared capability; its result is selected, none, or unresolved tie. Future selection prefers `supported` over `partial`, then higher configured priority. Equal rank is a tie, never an array-order choice. A3 owns the first provider, registry, configuration, and concrete selector. A4 owns comparison and grading, including any sizing normalization. A5 owns presentation integration.
