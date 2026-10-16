# Poker Coach Architecture Specification

## Phase 0 Application Shape

The Phase 0 prototype is a Vite, React, and strict TypeScript application. It uses
typed mock fixtures and no backend. Runtime schemas live in `src/domain`, mock data
in `src/data`, service boundaries in `src/services`, and reusable UI primitives in
`src/ui/components`.

## Future Conceptual Pipeline

1. Import / Parser
2. Poker Engine
3. Strategy Engine
4. Decision Triage
5. Poker Analyzer AI, only where useful
6. Analytics / Development / Training

The UI consumes normalized records and replay snapshots. It does not parse raw hand
history text and does not call an LLM.

## Backend and API Boundary

Phase 0 has no live API. Future backend endpoints should accept raw imports, return
import job state, expose normalized tournament/hand records, and serve persisted
analysis. All external payloads should be validated with runtime schemas.

## Persistence Assumption

Use a relational database later for tournaments, hands, actions, analysis outputs,
strategy versions, AI usage, and development metrics. Store original raw hand
history for audit/debugging while all product logic consumes normalized data.

## State and Data Fetching

Phase 0 uses local React state because all data is typed mock data. Future phases
should add a query/cache layer after real API endpoints exist.

## Observability

Future observability should record parse failures, analysis failures, cache hits,
AI cost, AI latency, schema validation failures, and version mismatches.
