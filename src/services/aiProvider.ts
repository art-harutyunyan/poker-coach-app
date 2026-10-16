import type { AIUsage, DecisionContext, HandAnalysis } from "../domain/schemas";

export interface PokerCoachAIRequest {
  decision: DecisionContext;
  strategyVersion: string;
  analyzerVersion: string;
  developmentContextVersion?: string;
}

export interface PokerCoachAIResponse {
  analysis: HandAnalysis;
  usage: AIUsage;
  cacheKey: string;
}

export interface PokerCoachAIProvider {
  readonly id: string;
  analyzeDecision(request: PokerCoachAIRequest): Promise<PokerCoachAIResponse>;
}

export class PhaseZeroMockAIProvider implements PokerCoachAIProvider {
  readonly id = "phase-zero-mock-provider";

  async analyzeDecision(): Promise<PokerCoachAIResponse> {
    throw new Error(
      "Phase 0 does not permit real AI analysis. Use typed mock fixtures only.",
    );
  }
}
