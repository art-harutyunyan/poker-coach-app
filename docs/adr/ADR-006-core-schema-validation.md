# ADR-006 - Core Schema and Runtime Validation Approach

## Status

Accepted for Phase 0

## Context

The product needs normalized poker contracts that are coherent enough for a real
parser/replayer later. TypeScript alone does not validate parser inputs, persisted
records, or future AI structured outputs at runtime.

## Decision

Use strict TypeScript plus Zod schemas for core contracts:

- `Tournament`
- `Player`
- `Hand`
- `Street`
- `Action`
- `ReplayState` snapshot contract
- `DecisionContext`
- `StrategyReference`
- `HandAnalysis`
- `TournamentEvaluation`
- `DevelopmentMetric`
- `AIUsage`

Zod is used at application/external boundaries and for centralized mock fixtures.
Replay state is a derived interface built from validated hands/actions.

## Alternatives Considered

- TypeScript interfaces only: rejected because parser and AI boundaries need runtime
  checks.
- JSON Schema first: valid later for API documentation, but slower for Phase 0
  iteration.
- Database schema first: premature without persistence implementation.

## Consequences

- Invalid grades, table sizes, chip values, and provenance shapes fail early.
- Phase 1 parser can normalize raw histories into validated contracts.
- Some duplication exists between TypeScript types and schema definitions, but Zod
  inference reduces drift.
