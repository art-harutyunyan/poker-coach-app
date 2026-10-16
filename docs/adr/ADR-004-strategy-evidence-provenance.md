# ADR-004 - Strategy Evidence and Provenance Architecture

## Status

Accepted for Phase 0

## Context

Poker Coach must not invent solver frequencies or hide where recommendations came
from. Strategy evidence must remain separate from AI narration.

## Decision

Represent every recommendation with a `StrategyReference` containing:

- stable source ID,
- source type,
- source name,
- version,
- exact-reference flag,
- assumptions,
- supported actions and optional frequencies/sizings.

Source types include deterministic rule, curated range, solver cache, population
exploit, AI heuristic, unavailable, and mock prototype. Exact frequencies are only
shown as reference truth when `isExactReference` is true.

## Alternatives Considered

- Store strategy text only in analysis copy: rejected because it is not queryable
  or auditable.
- Let AI explain and grade without references: rejected because it invites
  hallucinated precision.
- Single source type: rejected because theory, exploit, solver, and heuristic
  evidence have different confidence profiles.

## Consequences

- UI can distinguish exact/reference-backed, heuristic, and unavailable strategy.
- Later strategy providers can be swapped without changing analysis components.
- Mock Phase 0 percentages are explicitly labeled as prototype data.
