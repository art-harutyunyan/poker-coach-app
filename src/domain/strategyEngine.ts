import type { HeroDecisionContext } from "./heroDecisionTypes";
import type {
  StrategyCapability,
  StrategyRecommendationResult,
} from "./strategyContract";

export interface StrategyEngine {
  readonly id: string;
  readonly version: string;
  supports(context: HeroDecisionContext): StrategyCapability;
  analyze(context: HeroDecisionContext): StrategyRecommendationResult;
}

export interface StrategyEngineCandidate {
  engine: StrategyEngine;
  capability: StrategyCapability;
  priority: number;
}

export type StrategySelection =
  | { status: "selected"; candidate: StrategyEngineCandidate }
  | { status: "none" }
  | { status: "tie"; candidates: StrategyEngineCandidate[] };

/** A3 implements selection: supported before partial, then higher integer priority; equal rank ties. */
export interface StrategyEngineSelector {
  select(
    context: HeroDecisionContext,
    candidates: readonly StrategyEngineCandidate[],
  ): StrategySelection;
}
