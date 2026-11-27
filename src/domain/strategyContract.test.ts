// @vitest-environment node
import { describe, expect, expectTypeOf, it } from "vitest";
import type { HeroBettingAction } from "./heroDecisionTypes";
import {
  STRATEGY_SCHEMA_VERSION,
  strategyRecommendationResultSchema,
  type StrategyAction,
  type StrategyRecommendationResult,
} from "./strategyContract";
import type { StrategyEngineSelector, StrategySelection } from "./strategyEngine";

const decisionKey = {
  handId: "test-hand",
  eventId: "test-event",
  decisionIndex: 2,
};
const shared = {
  schemaVersion: "a2-v1",
  decisionKey,
  engine: { engineId: "test-engine", engineVersion: "1.0.0" },
  capability: { status: "supported", engineId: "test-engine" },
};
const available = {
  ...shared,
  status: "available",
  recommendation: { primaryAction: "CHECK" },
  confidence: "supported",
  source: {
    id: "test-source",
    kind: "deterministic-rule",
    name: "Test-only source",
    version: "1",
    isExactReference: true,
    assumptions: [],
    determinism: "deterministic",
  },
};

describe("A2 strategy contract shape", () => {
  it("keeps strategy actions identical to A1 betting actions", () => {
    expectTypeOf<StrategyAction>().toEqualTypeOf<HeroBettingAction>();
    expect(STRATEGY_SCHEMA_VERSION).toBe("a2-v1");
  });

  it("parses all three result statuses with exact decision identity", () => {
    const candidates = [
      available,
      {
        ...shared,
        status: "unsupported",
        capability: { status: "unsupported", engineId: "test-engine" },
        reason: "spot-not-covered",
      },
      {
        ...shared,
        status: "insufficient-context",
        reason: "required-field-unknown",
        missingFields: ["effectiveStackBeforeChips"],
      },
    ];
    for (const candidate of candidates) {
      const parsed = strategyRecommendationResultSchema.safeParse(candidate);
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.decisionKey).toEqual(decisionKey);
    }
    expectTypeOf<StrategyRecommendationResult["status"]>().toEqualTypeOf<
      "available" | "unsupported" | "insufficient-context"
    >();
  });

  it.each([
    ["missing source", { ...available, source: undefined }],
    ["unknown action", { ...available, recommendation: { primaryAction: "WAIT" } }],
    [
      "blank engine version",
      { ...available, engine: { engineId: "test-engine", engineVersion: " " } },
    ],
    [
      "blank source version",
      { ...available, source: { ...available.source, version: " " } },
    ],
    [
      "nonfinite sizing",
      {
        ...available,
        recommendation: {
          primaryAction: "BET",
          primarySizing: { kind: "chips-added", value: Infinity },
        },
      },
    ],
    [
      "out-of-range frequency",
      {
        ...available,
        recommendation: {
          primaryAction: "CHECK",
          strategyMix: [{ action: "CHECK", frequency: 1.1 }],
        },
      },
    ],
    [
      "empty missing fields",
      {
        ...shared,
        status: "insufficient-context",
        reason: "required-field-unknown",
        missingFields: [],
      },
    ],
    ["unknown status", { ...shared, status: "pending" }],
  ])("rejects %s", (_name, candidate) => {
    expect(strategyRecommendationResultSchema.safeParse(candidate).success).toBe(false);
  });

  it("exposes a selector outcome contract without choosing a winner", () => {
    expectTypeOf<StrategySelection["status"]>().toEqualTypeOf<
      "selected" | "none" | "tie"
    >();
    expectTypeOf<StrategyEngineSelector["select"]>().toBeFunction();
  });

  it("preserves nonblank provenance text exactly", () => {
    const candidate = {
      ...available,
      engine: { engineId: "test-engine", engineVersion: " 1.0.0 " },
      source: { ...available.source, version: " 1 " },
    };
    const parsed = strategyRecommendationResultSchema.safeParse(candidate);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.status === "available") {
      expect(parsed.data.engine.engineVersion).toBe(" 1.0.0 ");
      expect(parsed.data.source.version).toBe(" 1 ");
    }
  });

  it.each([
    [
      "all-in value",
      {
        ...available,
        recommendation: {
          primaryAction: "CALL",
          primarySizing: { kind: "all-in", value: 100 },
        },
      },
    ],
    [
      "unsupported recommendation",
      {
        ...shared,
        status: "unsupported",
        reason: "spot-not-covered",
        recommendation: { primaryAction: "CALL" },
      },
    ],
    [
      "nested source field",
      { ...available, source: { ...available.source, undocumented: true } },
    ],
    [
      "inverted scope range",
      {
        ...available,
        capability: {
          ...available.capability,
          scope: { stackDepthBb: { min: 100, max: 10 } },
        },
      },
    ],
  ])("rejects %s instead of silently changing it", (_name, candidate) => {
    expect(strategyRecommendationResultSchema.safeParse(candidate).success).toBe(false);
  });
});
