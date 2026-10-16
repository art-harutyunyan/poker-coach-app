# AI Architecture and Cost Constraints

## Deterministic First

Never use an LLM for parsing, seat/position calculation, stack reconstruction, pot
calculation, bet percentage, pot odds, SPR, tournament statistics, opportunity
counting, replay snapshots, graph aggregation, or known strategy lookup.

## Future AI Path

1. Normalized decision.
2. Deterministic and strategy evidence.
3. Decision triage.
4. AI only when useful.
5. Typed response.
6. Persisted analysis plus usage ledger.

## Triage Contract

`IGNORE`: no educational value and no AI.

`STANDARD`: deterministic/reference-matched, no AI by default.

`REVIEW`: useful for review queue, AI optional only if explanation is needed.

`IMPORTANT`: high educational value; AI may summarize or explain when evidence is
insufficient or user asks.

`CRITICAL`: high-impact hand or ambiguous tournament spot; candidate for stronger
model after deterministic context is complete.

## Provider Boundary

Providers implement `PokerCoachAIProvider`. Requests contain normalized decision
context and evidence versions. Responses contain schema-valid analysis and usage.
The Phase 0 provider throws if called.

## AI Usage Ledger

Track operation, tournament/hand/decision IDs, provider, model, input tokens, output
tokens, cache status, estimated cost, latency, analyzer version, success/failure,
and timestamp.

## Benchmark Method

Later releases should compute average AI cost per tournament, cost by operation,
cache hit rate, zero-AI hand percentage, cheap/strong model ratio, and regression
against analyzer/prompt versions. Do not set a monetary target before benchmarking
real prompts and real workloads.
