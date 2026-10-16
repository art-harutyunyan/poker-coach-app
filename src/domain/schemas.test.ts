import { describe, expect, it } from "vitest";
import {
  aiUsageDesignPlaceholder,
  analyses,
  developmentMetrics,
  hands,
  reviewQueue,
  tournament,
  tournamentEvaluation,
} from "../data/mockTournament";
import {
  aiUsageSchema,
  developmentMetricSchema,
  handAnalysisSchema,
  handSchema,
  reviewQueueItemSchema,
  tournamentEvaluationSchema,
  tournamentSchema,
} from "./schemas";

describe("phase 0 mock contracts", () => {
  it("validates centralized typed mock fixtures", () => {
    expect(() => tournamentSchema.parse(tournament)).not.toThrow();
    expect(() => handSchema.parse(hands[0]!)).not.toThrow();
    expect(() => handAnalysisSchema.parse(analyses[0])).not.toThrow();
    expect(() => reviewQueueItemSchema.parse(reviewQueue[0])).not.toThrow();
    expect(() => tournamentEvaluationSchema.parse(tournamentEvaluation)).not.toThrow();
    expect(() => developmentMetricSchema.parse(developmentMetrics[0])).not.toThrow();
    expect(() => aiUsageSchema.parse(aiUsageDesignPlaceholder)).not.toThrow();
  });

  it("rejects invalid decision grades at runtime boundaries", () => {
    const invalid = {
      ...analyses[0],
      grade: "LUCKY_RIVER",
    };

    expect(() => handAnalysisSchema.parse(invalid)).toThrow();
  });
});
