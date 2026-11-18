import type { ImportedHand } from "./handHistory";
import { deriveHandFacts } from "./handFacts";
import { derivePreflopOpportunities } from "./preflopOpportunities";
import {
  METRIC_IDS,
  METRIC_VERSION,
  type Fact,
  type MetricAuditRow,
  type MetricContribution,
  type MetricId,
  type MetricInput,
  type MetricSummary,
  type PokerMetrics,
} from "./pokerMetricTypes";

export class MetricCohortError extends Error {
  constructor(
    readonly code: "duplicate_hand" | "definition_mismatch" | "unsafe_count",
  ) {
    super(code);
    this.name = "MetricCohortError";
  }
}
export function deriveMetricInput(hand: ImportedHand, room: string): MetricInput {
  return {
    facts: deriveHandFacts(hand, room),
    threeBet: derivePreflopOpportunities(hand),
  };
}
function exclude(f: Fact): MetricContribution {
  return {
    status: "excluded",
    reasons:
      f.status === "unknown" ? [...new Set(f.reasons)] : [f.reason ?? "invalid_hand"],
    evidence: f.evidence,
  };
}
function contribution(input: MetricInput, metric: MetricId): MetricContribution {
  const f = input.facts;
  if (metric === "threeBet") return input.threeBet;
  const prerequisites: Fact[] =
    metric === "wsd"
      ? [f.heroShowdown]
      : metric === "wtsd"
        ? [f.eligiblePreflop, f.sawFlop]
        : [f.eligiblePreflop];
  const evidence = prerequisites.flatMap((p) => p.evidence);
  for (const prerequisite of prerequisites) {
    if (prerequisite.status === "unknown") return exclude(prerequisite);
    if (!prerequisite.value)
      return prerequisite === f.eligiblePreflop
        ? exclude(prerequisite)
        : { status: "not-opportunity", evidence };
  }
  const fact = {
    vpip: f.voluntaryPreflop,
    pfr: f.preflopRaise,
    sawFlop: f.sawFlop,
    wtsd: f.heroShowdown,
    wsd: f.collectedShare,
  }[metric];
  if (fact.status === "unknown") return exclude(fact);
  return {
    status: "eligible",
    numerator: fact.value ? 1 : 0,
    denominator: 1,
    evidence: [...evidence, ...fact.evidence],
  };
}
function validate(inputs: readonly MetricInput[]): void {
  const keys = new Set<string>();
  if (!Number.isSafeInteger(inputs.length)) throw new MetricCohortError("unsafe_count");
  for (const input of inputs) {
    if (input.facts.definitionVersion !== METRIC_VERSION)
      throw new MetricCohortError("definition_mismatch");
    if (keys.has(input.facts.key)) throw new MetricCohortError("duplicate_hand");
    keys.add(input.facts.key);
  }
}
function checkedContribution(input: MetricInput, metric: MetricId): MetricContribution {
  const result = contribution(input, metric);
  if (
    result.status === "eligible" &&
    (result.denominator !== 1 || (result.numerator !== 0 && result.numerator !== 1))
  )
    throw new MetricCohortError("unsafe_count");
  return result;
}
export function aggregatePokerMetrics(inputs: readonly MetricInput[]): PokerMetrics {
  validate(inputs);
  const metrics = Object.fromEntries(
    METRIC_IDS.map((metric) => {
      const summary: MetricSummary = {
        numerator: 0,
        denominator: 0,
        percentage: null,
        excluded: 0,
        notOpportunity: 0,
        reasons: {},
      };
      const reasons: Partial<Record<import("./pokerMetricTypes").ReasonCode, number>> =
        {};
      for (const input of inputs) {
        const c = checkedContribution(input, metric);
        if (c.status === "eligible") {
          summary.numerator += c.numerator;
          summary.denominator++;
        } else if (c.status === "not-opportunity") summary.notOpportunity++;
        else {
          summary.excluded++;
          for (const reason of new Set(c.reasons))
            reasons[reason] = (reasons[reason] ?? 0) + 1;
        }
      }
      summary.reasons = Object.fromEntries(
        Object.entries(reasons).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
      summary.percentage = summary.denominator
        ? (100 * summary.numerator) / summary.denominator
        : null;
      return [metric, summary];
    }),
  ) as Record<MetricId, MetricSummary>;
  return { definitionVersion: METRIC_VERSION, importedHands: inputs.length, metrics };
}
export function buildMetricAudit(
  inputs: readonly MetricInput[],
  metric: MetricId,
): readonly MetricAuditRow[] {
  validate(inputs);
  return inputs
    .map((input) => ({
      key: input.facts.key,
      handId: input.facts.handId,
      handNumber: input.facts.handNumber,
      metric,
      definitionVersion: METRIC_VERSION,
      contribution: checkedContribution(input, metric),
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}
