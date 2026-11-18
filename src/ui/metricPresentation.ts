import type { MetricId, ReasonCode } from "../domain/pokerMetricTypes";

export interface MetricDefinition {
  label: string;
  denominatorLabel: string;
  definition: string;
}

const DEFINITIONS: Readonly<Record<MetricId, MetricDefinition>> = {
  vpip: {
    label: "VPIP",
    denominatorLabel: "eligible hands",
    definition:
      "Eligible hands with a positive voluntary preflop call, bet or raise. Forced posts, checks, refunds and awards do not count. Hands without a proven decision or with unresolved eligibility are excluded.",
  },
  pfr: {
    label: "PFR",
    denominatorLabel: "eligible hands",
    definition:
      "Eligible hands with a canonical preflop raise. Uses the same eligible-hand denominator as VPIP; unsupported or ambiguous hands are excluded.",
  },
  threeBet: {
    label: "3-Bet",
    denominatorLabel: "opportunities",
    definition:
      "Hero raises over the first full preflop open when chips beyond a call and an opponent able to contest the raise are proven. Short opens and ambiguous reopening are excluded; this is a bounded opportunity definition, not a general betting-legality model.",
  },
  sawFlop: {
    label: "Saw Flop",
    denominatorLabel: "eligible hands",
    definition:
      "Eligible VPIP/PFR hands where Hero remained active for a dealt flop, including a checked big blind or an all-in runout. A later flop after Hero folded does not count.",
  },
  wtsd: {
    label: "WTSD · source-confirmed",
    denominatorLabel: "assessable saw-flop hands",
    definition:
      "Eligible saw-flop hands with a confirmed contested Hero showdown. A timed Hero SHOW, surviving Hero, two surviving players and complete river runout are required. Contested survivors without a timed Hero SHOW are excluded from the assessable denominator; a summary card or SHOWDOWN marker alone is insufficient.",
  },
  wsd: {
    label: "W$SD · collected a share",
    denominatorLabel: "confirmed showdowns",
    definition:
      "Confirmed Hero showdowns where Hero collected any positive recorded share of the pot. Chops and multiple awards count once per hand. A refund is not a collection. This measures recorded chips collected, not cash profit or hand strength; missing award truth is excluded.",
  },
};

export function formatMetricPercentage(value: number | null): string {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
}

export function metricDefinition(id: MetricId): MetricDefinition {
  return DEFINITIONS[id];
}

export function metricReasonLabel(reason: ReasonCode): string {
  return reason.replace(/_/g, " ");
}
