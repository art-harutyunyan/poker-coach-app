import type { HandHistoryEvent } from "./handHistory";

export const METRIC_VERSION = "phase1c-v1" as const;
export const METRIC_IDS = [
  "vpip",
  "pfr",
  "threeBet",
  "sawFlop",
  "wtsd",
  "wsd",
] as const;
export type MetricId = (typeof METRIC_IDS)[number];
export type ReasonCode =
  | "invalid_hand"
  | "missing_hero"
  | "incomplete_hand"
  | "unsupported_source_warning"
  | "zero_stack_fold"
  | "forced_post_exhausted"
  | "missing_preflop_decision"
  | "missing_hero_reveal"
  | "incomplete_runout"
  | "unsupported_muck"
  | "award_mismatch"
  | "short_open"
  | "ambiguous_reopening"
  | "unsupported_raise";
export interface EvidenceRef {
  eventId?: string;
  lineNumber?: number;
  street?: HandHistoryEvent["street"];
}
export type Fact =
  | {
      status: "known";
      value: boolean;
      reason?: ReasonCode;
      evidence: readonly EvidenceRef[];
    }
  | {
      status: "unknown";
      reasons: readonly ReasonCode[];
      evidence: readonly EvidenceRef[];
    };
export type MetricContribution =
  | {
      status: "eligible";
      numerator: 0 | 1;
      denominator: 1;
      evidence: readonly EvidenceRef[];
    }
  | { status: "not-opportunity"; evidence: readonly EvidenceRef[] }
  | {
      status: "excluded";
      reasons: readonly ReasonCode[];
      evidence: readonly EvidenceRef[];
    };
export interface HandFacts {
  definitionVersion: typeof METRIC_VERSION;
  key: string;
  room: string;
  tournamentId: string;
  heroPlayerId: string;
  handId: string;
  handNumber: number;
  eligiblePreflop: Fact;
  voluntaryPreflop: Fact;
  preflopRaise: Fact;
  sawFlop: Fact;
  heroShowdown: Fact;
  collectedShare: Fact;
  played: Fact;
}
export interface MetricInput {
  facts: HandFacts;
  threeBet: MetricContribution;
}
export interface MetricAuditRow {
  key: string;
  handId: string;
  handNumber: number;
  metric: MetricId;
  definitionVersion: typeof METRIC_VERSION;
  contribution: MetricContribution;
}
export interface MetricSummary {
  numerator: number;
  denominator: number;
  percentage: number | null;
  excluded: number;
  notOpportunity: number;
  reasons: Readonly<Partial<Record<ReasonCode, number>>>;
}
export interface PokerMetrics {
  definitionVersion: typeof METRIC_VERSION;
  importedHands: number;
  metrics: Readonly<Record<MetricId, MetricSummary>>;
}
