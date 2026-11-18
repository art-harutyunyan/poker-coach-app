# ADR-007 - Deterministic poker facts and metrics

## Status

Architecture approved in the Phase 1C design. Phase 1C.1 implementation READY FOR REVIEW (2026-11-12), with independent source audit, final review fixes and 465 passing tests; later deliveries remain unauthorized.

## Decision

Project canonical `ImportedHand` records into pure, versioned `HandFacts` and a bounded preflop opportunity contribution. Aggregate explicitly supplied `MetricInput` cohorts with integer numerators and denominators. Audit rows use the same contribution selector and retain composite identity, definition version and canonical event/line references.

The definition version is `phase1c-v1`. Known false differs from unknown; excluded hands differ from non-opportunities. Empty denominators produce null percentages. Duplicate composite hand keys and mixed versions fail explicitly. Tournament-scoped Hero identifiers do not establish cross-tournament player identity.

VPIP/PFR and Saw Flop share the approved voluntary-decision eligibility set E. WTSD uses E hands that saw a flop and have an assessable source-confirmed showdown. W$SD independently uses confirmed Hero showdowns and reconciled recorded collections; it does not inherit E. A positive collected share counts once, even with negative net chips or multiple awards. No hand strength or side-pot eligibility is reconstructed.

The bounded 3-bet recognizer tracks actual preflop commitments/stacks against the nominal BB. Hero must face the first full open, have chips beyond a call, and have an active opponent able to contest above the opening wager. Original Hero raisers face potential 4-bets, not 3-bet opportunities. Short opening/reopening ambiguity is excluded when relevant; global source eligibility anomalies remain excluded.

`metricHandValidation.ts` shares defensive consumer validation using existing schemas, CardRegistry and HandLedger without modifying them. Unsupported warnings and malformed inputs cannot silently become eligible zeroes. Metadata gaps remain separate from poker eligibility. Production modules have no React, I/O, storage or network dependency.

## Evidence and consequences

See the [approved definitions](../superpowers/specs/2026-11-07-phase-1c-tournament-library-stats-design.md), [1C.1 plan](../superpowers/plans/2026-11-07-phase-1c-1-facts-metrics.md) and [source audit](../qa/phase-1c/1c1/source-audit.md).

Pure cohort aggregation supports future tournament subsets and multi-tournament cohorts without UI-specific definitions or averaging percentages. A later session library can cache these derived inputs per immutable import. This delivery does not wire those consumers, introduce persistence, or authorize strategy analysis.

Unknown reveal coverage can shrink WTSD's denominator; source-confirmed labels and exclusion reporting are therefore part of the contract. Corpus counts are pinned only after independent raw-source validation, with synthetic tests for boundaries absent from real exports.
