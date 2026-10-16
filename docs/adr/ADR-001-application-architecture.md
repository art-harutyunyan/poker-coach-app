# ADR-001 - Application Architecture and Repository Structure

## Status

Accepted for Phase 0

## Context

Poker Coach needs a premium mocked vertical slice now and a deterministic parser,
poker engine, strategy engine, analysis cache, and optional AI later. The UI must
never call an LLM directly, and parser/replayer work in Phase 1 must fit without
redesign.

## Decision

Use a strict TypeScript React application with a domain-first source layout:

- `src/domain`: normalized schemas, replay contracts, deterministic state helpers.
- `src/data`: typed mock fixtures for Phase 0 only.
- `src/services`: application-service boundaries such as AI providers.
- `src/ui`: shell, routes, poker primitives, charts, and formatting helpers.
- `docs/adr`: architectural decisions.
- `docs/specs`: poker-analysis and future QA specifications.
- `Roadmap`: phase tracking and validation evidence.

The current app is frontend-only. Future backend/API boundaries will sit behind
application services and consume the same runtime-validated domain contracts.

## Alternatives Considered

- Next.js full-stack app: useful later, but premature for Phase 0 and adds server
  conventions before the parser/API shape is proven.
- Monolithic component-only prototype: faster visually, but weak for Phase 1
  parser/replayer integration.
- Backend-first scaffold: misprioritizes Phase 0, which requires a UX checkpoint
  and documented architecture before parser implementation.

## Consequences

- The mocked replayer already consumes action/state contracts, so Phase 1 can
  replace fixtures with normalized parser output.
- Strict TypeScript plus Zod keeps external and AI boundaries explicit.
- Persistence is documented but not implemented in Phase 0.
- Deployment assumption is static app hosting for the prototype; future product
  deployment can add API/database services without moving UI primitives.
