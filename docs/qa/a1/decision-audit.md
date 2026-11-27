# A1 GG corpus extraction audit

Audit date: 2026-11-27. Source: four immutable GG fixtures under `tests/fixtures/gg`, parsed through the existing GG parser. The corpus test also checks every fixture byte against `docs/qa/phase-1c/1c1/asset-sha256.txt`.

| Measure                                                | Result |
| ------------------------------------------------------ | -----: |
| Parsed hands                                           |    674 |
| Hero decisions                                         |    899 |
| Hands with zero Hero decisions                         |      6 |
| Excluded hands                                         |      0 |
| Unexpected extraction failures                         |      0 |
| Unexplained A1/Replay pre-action discrepancies         |      0 |
| Unknown critical fields without a deterministic reason |      0 |

Decisions by street: preflop **694**, flop **103**, turn **63**, river **39** (sum **899**).

Decisions by actual action: fold **563**, check **94**, call **67**, bet **56**, raise **119** (sum **899**).

The only unknown critical scalar is multiway effective stack: **670** contexts have `effectiveStackBeforeChips` and its BB normalization null with `MULTIWAY_EFFECTIVE_STACK_AMBIGUOUS`. Their per-player stack/commitment records remain available. There were no unknown legal-action sets in the corpus. The audit reported **4** `SHORT_BLIND_POST` warnings and **2** recoverable `ZERO_STACK_FOLD` events; neither caused full-hand exclusion.

For every extracted decision, the audit compared exact pre-action pot, Hero stack, visible board, and non-folded player IDs to the source-event Replay cursor. The curated Replay tests additionally cover the BB check option, repeated Hero actions, later streets, short all-ins, and multiway hands. No unexplained difference appeared.

The [representative real-decision sample](representative-decisions.json) contains nine full `HeroDecisionContext` records with hand/event IDs and source lines for manual poker review: BB check option; unopened open; Hero 4-bet; multiway all-in call; Hero 3-bet; multiway flop bet; turn all-in call; flop raise; and multiway flop re-raise. It contains no raw hand text. These records are descriptive, not strategy judgments or goldens for the implementation.

Focused evidence: `npm.cmd test -- src/domain/extractHeroDecisions.corpus.test.ts --reporter verbose` passed the 674-hand audit and immutable SHA assertions. See the plan and final A1 handoff for other focused checks and user-run broad verification.

Independent review led to regressions for current under-minimum Hero actions, short all-in opening bets, the known forced-post fold in voluntary history, and inconsistent cards/final results. The updated focused gate passed 62 tests across the ledger, extractor, Replay, and corpus files. The corpus totals above were unchanged.
