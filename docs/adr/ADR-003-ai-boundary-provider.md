# ADR-003 - AI Boundary and Provider Abstraction

## Status

Accepted for Phase 0

## Context

AI is optional and expensive. The product requirements prohibit using an LLM for
parsing, arithmetic, replay-state reconstruction, statistics, range lookup, or
normal graph aggregation. Phase 0 must not perform real AI/API calls.

## Decision

Create a provider interface in `src/services/aiProvider.ts`:

- UI never imports an LLM SDK.
- AI requests accept normalized decision context plus evidence versions.
- Responses must be typed and include usage ledger metadata.
- Phase 0 ships only `PhaseZeroMockAIProvider`, which throws if called.

Future routing can select cheap, strong, external, local, or mock providers behind
the same interface.

## Alternatives Considered

- Direct client SDK calls: rejected because secrets, costs, and model coupling
  would leak into UI.
- Generic "send hand to LLM" service: rejected because it makes AI the source of
  truth and weakens auditability.
- No interface in Phase 0: rejected because later phases need a clear boundary.

## Consequences

- Normal Phase 0 usage cannot incur AI cost.
- Future calls can be cached, measured, versioned, and tested in isolation.
- Ask Coach remains an affordance only until a later phase explicitly implements it.
