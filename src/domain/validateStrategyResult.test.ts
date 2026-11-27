// @vitest-environment node
import { describe, expect, it } from "vitest";
import { extractHeroDecisions } from "./extractHeroDecisions";
import type { HeroDecisionContext } from "./heroDecisionTypes";
import { metricHand, deepFreeze } from "./pokerMetricsTestUtils";
import { validateStrategyResult } from "./validateStrategyResult";

function context(): HeroDecisionContext {
  const extracted = extractHeroDecisions(metricHand([["h", "CALL", 100]]));
  if (extracted.status !== "ok" || !extracted.decisions[0])
    throw new Error("missing A1 test decision");
  return extracted.decisions[0];
}

function available(input = context()) {
  return {
    schemaVersion: "a2-v1",
    status: "available",
    decisionKey: {
      handId: input.handId,
      eventId: input.eventId,
      decisionIndex: input.decisionIndex,
    },
    engine: { engineId: "test-engine", engineVersion: "1" },
    capability: { status: "supported", engineId: "test-engine" },
    recommendation: { primaryAction: "CALL" },
    source: {
      id: "test-only-source",
      kind: "deterministic-rule",
      name: "Test-only source",
      version: "1",
      isExactReference: true,
      assumptions: [],
      determinism: "deterministic",
    },
    confidence: "supported",
  };
}

function resultBase(input: HeroDecisionContext) {
  const { schemaVersion, decisionKey, engine, capability } = available(input);
  return { schemaVersion, decisionKey, engine, capability };
}

function issueCodes(input: HeroDecisionContext, candidate: unknown) {
  const result = validateStrategyResult(input, candidate);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("unexpected recommendation");
  expect("result" in result).toBe(false);
  return result.issues.map((issue) => issue.code);
}

describe("A2 strategy result validation", () => {
  it("accepts an exact A1 key and known legal action", () => {
    const input = context();
    const result = validateStrategyResult(input, available(input));
    expect(result.ok).toBe(true);
    if (result.ok && result.result.status === "available") {
      expect(result.result.recommendation.primaryAction).toBe("CALL");
    }
  });

  it.each(["handId", "eventId", "decisionIndex"] as const)(
    "rejects a wrong %s",
    (field) => {
      const input = context();
      const candidate = available(input);
      candidate.decisionKey[field] =
        field === "decisionIndex" ? (42 as never) : ("wrong" as never);
      expect(issueCodes(input, candidate)).toContain("DECISION_KEY_MISMATCH");
    },
  );

  it("rejects whitespace-padded identity without rewriting it", () => {
    const input = context();
    const candidate = available(input);
    candidate.decisionKey.eventId = ` ${input.eventId} `;
    expect(issueCodes(input, candidate)).toContain("DECISION_KEY_MISMATCH");
    expect(candidate.decisionKey.eventId).toBe(` ${input.eventId} `);
  });

  it("reports malformed input as an issue", () => {
    expect(issueCodes(context(), { status: "available" })).toContain("INVALID_SHAPE");
  });

  it("checks legal actions in primary, mix, and alternatives", () => {
    const input = context();
    const candidate = available(input);
    candidate.recommendation = {
      primaryAction: "CALL",
      strategyMix: [
        { action: "CALL", frequency: 0.5 },
        { action: "CHECK", frequency: 0.5 },
      ],
      alternatives: [{ action: "BET" }],
    } as never;
    expect(issueCodes(input, candidate)).toContain("ILLEGAL_ACTION");
  });

  it("rejects available when A1 legality is unknown", () => {
    const input = { ...context(), legalActions: null };
    expect(issueCodes(input, available(input))).toContain("LEGAL_ACTIONS_UNKNOWN");
  });

  it("requires unsupported status to carry unsupported capability", () => {
    const input = context();
    const candidate = {
      ...resultBase(input),
      status: "unsupported",
      reason: "spot-not-covered",
    };
    expect(issueCodes(input, candidate)).toContain("CAPABILITY_STATUS_MISMATCH");
  });

  it("requires insufficient context to retain a non-unsupported capability", () => {
    const input = context();
    const candidate = {
      ...resultBase(input),
      status: "insufficient-context",
      reason: "required-field-unknown",
      missingFields: ["effectiveStackBeforeChips"],
      capability: { status: "unsupported", engineId: "test-engine" },
    };
    expect(issueCodes(input, candidate)).toContain("CAPABILITY_STATUS_MISMATCH");
  });

  it("rejects a capability that names a different engine", () => {
    const input = context();
    const candidate = available(input);
    candidate.capability.engineId = "other";
    expect(issueCodes(input, candidate)).toContain("CAPABILITY_ENGINE_MISMATCH");
  });

  it.each(["supported", "approximate", "limited"])(
    "accepts %s confidence with supported capability",
    (confidence) => {
      const input = context();
      expect(
        validateStrategyResult(input, { ...available(input), confidence }).ok,
      ).toBe(true);
    },
  );

  it("rejects a partial capability without limitations", () => {
    const input = context();
    const candidate = available(input);
    candidate.capability.status = "partial";
    candidate.confidence = "approximate";
    expect(issueCodes(input, candidate)).toContain("CAPABILITY_LIMITATIONS_REQUIRED");
  });

  it("rejects fully supported confidence for a partial capability", () => {
    const input = context();
    const candidate = available(input);
    candidate.capability = {
      status: "partial",
      engineId: "test-engine",
      limitations: [{ code: "scope-boundary", detail: "Test-only partial coverage" }],
    } as never;
    expect(issueCodes(input, candidate)).toContain("CONFIDENCE_CAPABILITY_MISMATCH");
  });

  it("rejects available with unsupported capability", () => {
    const input = context();
    const candidate = available(input);
    candidate.capability.status = "unsupported";
    expect(issueCodes(input, candidate)).toContain("CAPABILITY_STATUS_MISMATCH");
  });

  it("does not mutate deeply frozen A1 context or candidate on either path", () => {
    const input = deepFreeze(context());
    const good = deepFreeze(available(input));
    const bad = deepFreeze({
      ...available(input),
      decisionKey: { ...good.decisionKey, eventId: "wrong" },
    });
    const before = JSON.stringify([input, good, bad]);
    expect(validateStrategyResult(input, good).ok).toBe(true);
    expect(validateStrategyResult(input, bad).ok).toBe(false);
    expect(JSON.stringify([input, good, bad])).toBe(before);
  });
});

function sized(input: HeroDecisionContext, action: string, sizing: unknown) {
  return {
    ...available(input),
    recommendation: { primaryAction: action, primarySizing: sizing },
  };
}

describe("A2 sizing boundaries", () => {
  it.each([
    { kind: "chips-added", value: 150 },
    { kind: "bb-added", value: 1.5 },
    { kind: "raise-to-chips", value: 250 },
    { kind: "raise-to-bb", value: 2.5 },
    { kind: "pot-fraction-added", value: 0.75 },
    { kind: "all-in" },
  ])("accepts valid $kind sizing declared for RAISE", (sizing) => {
    const input = context();
    expect(validateStrategyResult(input, sized(input, "RAISE", sizing)).ok).toBe(true);
  });

  it.each([
    ["zero", { kind: "chips-added", value: 0 }],
    ["negative", { kind: "bb-added", value: -1 }],
    ["infinite", { kind: "raise-to-bb", value: Infinity }],
    ["fractional chips", { kind: "chips-added", value: 1.5 }],
    ["unsafe chips", { kind: "raise-to-chips", value: Number.MAX_SAFE_INTEGER + 1 }],
  ])("rejects %s numeric sizing", (_name, sizing) => {
    expect(issueCodes(context(), sized(context(), "RAISE", sizing))).toContain(
      "INVALID_SHAPE",
    );
  });

  it.each(["FOLD", "CHECK"])("rejects sizing for %s", (action) => {
    const input = {
      ...context(),
      legalActions: [
        "FOLD",
        "CHECK",
        "CALL",
        "RAISE",
      ] as HeroDecisionContext["legalActions"],
    };
    expect(
      issueCodes(input, sized(input, action, { kind: "chips-added", value: 100 })),
    ).toContain("INVALID_SIZING");
  });

  it.each(["CALL", "BET"])("rejects raise-to sizing for %s", (action) => {
    const input = {
      ...context(),
      legalActions: ["CALL", "BET", "RAISE"] as HeroDecisionContext["legalActions"],
    };
    expect(
      issueCodes(input, sized(input, action, { kind: "raise-to-chips", value: 250 })),
    ).toContain("INVALID_SIZING");
  });

  it("rejects numeric CALL sizing but accepts a stack-capped all-in call", () => {
    const input = { ...context(), heroStackBeforeChips: 100, amountToCallChips: 100 };
    expect(
      issueCodes(input, sized(input, "CALL", { kind: "chips-added", value: 100 })),
    ).toContain("INVALID_SIZING");
    expect(
      validateStrategyResult(input, sized(input, "CALL", { kind: "all-in" })).ok,
    ).toBe(true);
    expect(
      issueCodes(context(), sized(context(), "CALL", { kind: "all-in" })),
    ).toContain("INVALID_SIZING");
  });

  it("requires known BB normalization and a positive pot for relative sizes", () => {
    const noBb = { ...context(), heroStackBeforeBb: null };
    expect(
      issueCodes(noBb, sized(noBb, "RAISE", { kind: "bb-added", value: 2 })),
    ).toContain("INVALID_SIZING");
    const noPot = { ...context(), potBeforeActionChips: 0 };
    expect(
      issueCodes(
        noPot,
        sized(noPot, "RAISE", { kind: "pot-fraction-added", value: 0.5 }),
      ),
    ).toContain("INVALID_SIZING");
  });

  it("checks directly comparable chip bounds", () => {
    const input = context();
    expect(
      issueCodes(
        input,
        sized(input, "RAISE", {
          kind: "chips-added",
          value: input.heroStackBeforeChips + 1,
        }),
      ),
    ).toContain("INVALID_SIZING");
    expect(
      issueCodes(
        input,
        sized(input, "RAISE", { kind: "raise-to-chips", value: input.currentBetChips }),
      ),
    ).toContain("INVALID_SIZING");
  });
});

function mixed(input: HeroDecisionContext, recommendation: Record<string, unknown>) {
  return { ...available(input), recommendation };
}

describe("A2 mixed recommendation boundaries", () => {
  it("accepts a pure choice with a distinct alternative", () => {
    const input = context();
    expect(
      validateStrategyResult(
        input,
        mixed(input, {
          primaryAction: "CALL",
          alternatives: [
            { action: "RAISE", sizing: { kind: "raise-to-chips", value: 250 } },
          ],
        }),
      ).ok,
    ).toBe(true);
  });

  it("rejects a pure alternative identical to the primary choice", () => {
    const input = context();
    expect(
      issueCodes(
        input,
        mixed(input, {
          primaryAction: "CALL",
          alternatives: [{ action: "CALL" }],
        }),
      ),
    ).toContain("DUPLICATE_ALTERNATIVE");
  });

  it("accepts a two-action mix whose frequencies total one", () => {
    const input = context();
    expect(
      validateStrategyResult(
        input,
        mixed(input, {
          primaryAction: "CALL",
          strategyMix: [
            { action: "CALL", frequency: 0.6 },
            { action: "FOLD", frequency: 0.4 },
          ],
        }),
      ).ok,
    ).toBe(true);
  });

  it.each([0, 1.1])("rejects a %s mix frequency", (frequency) => {
    const input = context();
    expect(
      issueCodes(
        input,
        mixed(input, {
          primaryAction: "CALL",
          strategyMix: [
            { action: "CALL", frequency },
            { action: "FOLD", frequency: 1 - frequency },
          ],
        }),
      ),
    ).toContain(frequency === 0 ? "INVALID_MIX" : "INVALID_SHAPE");
  });

  it("uses an absolute 1e-6 tolerance for the mix total", () => {
    const input = context();
    const make = (frequency: number) =>
      mixed(input, {
        primaryAction: "CALL",
        strategyMix: [
          { action: "CALL", frequency },
          { action: "FOLD", frequency: 0.4 },
        ],
      });
    expect(validateStrategyResult(input, make(0.6000005)).ok).toBe(true);
    expect(issueCodes(input, make(0.600002))).toContain("INVALID_MIX");
  });

  it("rejects duplicate action/tag/value but keeps different units distinct", () => {
    const input = context();
    const duplicate = mixed(input, {
      primaryAction: "RAISE",
      strategyMix: [
        {
          action: "RAISE",
          sizing: { kind: "raise-to-chips", value: 250 },
          frequency: 0.5,
        },
        {
          action: "RAISE",
          sizing: { kind: "raise-to-chips", value: 250 },
          frequency: 0.5,
        },
      ],
    });
    expect(issueCodes(input, duplicate)).toContain("DUPLICATE_CHOICE");
    const distinct = mixed(input, {
      primaryAction: "RAISE",
      strategyMix: [
        {
          action: "RAISE",
          sizing: { kind: "raise-to-chips", value: 250 },
          frequency: 0.5,
        },
        {
          action: "RAISE",
          sizing: { kind: "raise-to-bb", value: 2.5 },
          frequency: 0.5,
        },
      ],
    });
    expect(validateStrategyResult(input, distinct).ok).toBe(true);
  });

  it("uses aggregate action frequency, rather than the largest individual entry", () => {
    const input = context();
    const entries = [
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 250 },
        frequency: 0.35,
      },
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 300 },
        frequency: 0.25,
      },
      { action: "CALL", frequency: 0.4 },
    ];
    expect(
      validateStrategyResult(
        input,
        mixed(input, { primaryAction: "RAISE", strategyMix: entries }),
      ).ok,
    ).toBe(true);
    expect(
      issueCodes(input, mixed(input, { primaryAction: "CALL", strategyMix: entries })),
    ).toContain("REPRESENTATIVE_MISMATCH");
  });

  it("allows either action on an aggregate tie", () => {
    const input = context();
    const strategyMix = [
      { action: "CALL", frequency: 0.5 },
      { action: "FOLD", frequency: 0.5 },
    ];
    expect(
      validateStrategyResult(
        input,
        mixed(input, { primaryAction: "CALL", strategyMix }),
      ).ok,
    ).toBe(true);
    expect(
      validateStrategyResult(
        input,
        mixed(input, { primaryAction: "FOLD", strategyMix }),
      ).ok,
    ).toBe(true);
  });

  it("rejects a near tie when the primary action has lower exact aggregate frequency", () => {
    const input = context();
    const strategyMix = [
      { action: "CALL", frequency: 0.5 },
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 250 },
        frequency: 0.25000000000025,
      },
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 300 },
        frequency: 0.25000000000025,
      },
    ];
    expect(
      issueCodes(input, mixed(input, { primaryAction: "CALL", strategyMix })),
    ).toContain("REPRESENTATIVE_MISMATCH");
    expect(
      validateStrategyResult(
        input,
        mixed(input, { primaryAction: "RAISE", strategyMix }),
      ).ok,
    ).toBe(true);
  });

  it("rejects a near tie when primary sizing has lower exact frequency", () => {
    const input = context();
    const strategyMix = [
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 250 },
        frequency: 0.5,
      },
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 300 },
        frequency: 0.5000000000005,
      },
    ];
    expect(
      issueCodes(
        input,
        mixed(input, {
          primaryAction: "RAISE",
          primarySizing: { kind: "raise-to-chips", value: 250 },
          strategyMix,
        }),
      ),
    ).toContain("REPRESENTATIVE_MISMATCH");
    expect(
      validateStrategyResult(
        input,
        mixed(input, {
          primaryAction: "RAISE",
          primarySizing: { kind: "raise-to-chips", value: 300 },
          strategyMix,
        }),
      ).ok,
    ).toBe(true);
  });

  it("requires primary sizing to select a highest-frequency size within its action", () => {
    const input = context();
    const strategyMix = [
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 250 },
        frequency: 0.4,
      },
      {
        action: "RAISE",
        sizing: { kind: "raise-to-chips", value: 300 },
        frequency: 0.2,
      },
      { action: "CALL", frequency: 0.4 },
    ];
    expect(
      validateStrategyResult(
        input,
        mixed(input, {
          primaryAction: "RAISE",
          primarySizing: { kind: "raise-to-chips", value: 250 },
          strategyMix,
        }),
      ).ok,
    ).toBe(true);
    expect(
      issueCodes(
        input,
        mixed(input, {
          primaryAction: "RAISE",
          primarySizing: { kind: "raise-to-chips", value: 300 },
          strategyMix,
        }),
      ),
    ).toContain("REPRESENTATIVE_MISMATCH");
  });

  it("rejects alternatives alongside a mix", () => {
    const input = context();
    expect(
      issueCodes(
        input,
        mixed(input, {
          primaryAction: "CALL",
          strategyMix: [{ action: "CALL", frequency: 1 }],
          alternatives: [{ action: "FOLD" }],
        }),
      ),
    ).toContain("INVALID_MIX");
  });

  it("requires approximate or limited confidence for a non-exact mixed source", () => {
    const input = context();
    const candidate = mixed(input, {
      primaryAction: "CALL",
      strategyMix: [{ action: "CALL", frequency: 1 }],
    });
    candidate.source = { ...candidate.source, isExactReference: false };
    expect(issueCodes(input, candidate)).toContain("SOURCE_CONFIDENCE_MISMATCH");
    expect(
      validateStrategyResult(input, { ...candidate, confidence: "approximate" }).ok,
    ).toBe(true);
  });
});
