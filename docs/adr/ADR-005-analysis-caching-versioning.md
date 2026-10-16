# ADR-005 - Caching and Versioning for Future Analysis

## Status

Accepted for Phase 0

## Context

Opening an already analyzed tournament should not trigger new AI calls when inputs
have not changed. Users also need old recommendations to remain explainable after
strategy or model changes.

## Decision

Future generated analysis cache keys will include:

- hand ID,
- decision ID,
- normalized hand schema version,
- strategy source/version,
- analyzer/prompt version,
- provider/model/version,
- relevant development-context version,
- product feature flag or grading-rubric version when material.

Analysis records will store the exact versions used. AI usage rows will track cache
status, cost, tokens, latency, success, and analyzer version.

## Alternatives Considered

- Cache only by hand ID: rejected because strategy/analyzer changes would become
  invisible.
- Always re-run AI on open: rejected because it violates cost principles.
- Cache only final prose: rejected because typed decision fields need reuse and
  validation.

## Consequences

- Cost, latency, and cache hit rate can be measured by operation.
- Re-analysis is explicit when strategy or analyzer versions change.
- Persistence is designed now but implemented in a later phase.
