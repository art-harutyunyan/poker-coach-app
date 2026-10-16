# Poker Analysis Rules

## Decision Grades

`EXCELLENT`: decision strongly matches available evidence and exploits context well.

`GOOD`: decision is strategically sound, though another line may have similar or
slightly higher value.

`INACCURATE`: small or moderate deviation with limited expected impact.

`MISTAKE`: clear strategic issue with meaningful chip/opportunity cost.

`MAJOR_MISTAKE`: high-impact error, especially in large pots, all-in decisions,
or repeated leak categories.

## Grade vs Severity

Grade describes decision quality relative to available strategy evidence. Severity
describes practical impact. A technically inaccurate fold in a tiny pot can have
low severity. A similar quality error in a high-leverage all-in spot can have high
or critical severity.

## Result Independence

Outcome must not affect strategic grade. A correct all-in that loses remains good
or excellent. A bad call that wins remains bad. Result-hidden study mode exists to
reduce outcome bias.

## Confidence

`HIGH`: exact curated/solver-backed reference, deterministic poker rule, or complete
context with strong evidence.

`MEDIUM`: strong heuristic or exploit assumption with enough context, but no exact
reference node.

`LOW`: incomplete metadata, ambiguous assumptions, unsupported street, missing ICM,
or insufficient opponent/development sample.

## Strategy Provenance

Recommendations must identify whether they came from:

- deterministic rule,
- curated range,
- solver/cached solver solution,
- population exploit model,
- AI heuristic/explanation,
- unavailable reference,
- mock prototype data.

The system must never display invented exact frequencies as solver/reference truth.
