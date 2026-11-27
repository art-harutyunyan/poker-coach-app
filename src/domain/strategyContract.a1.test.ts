// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HeroDecisionContext } from "./heroDecisionTypes";
import { deepFreeze } from "./pokerMetricsTestUtils";
import { validateStrategyResult } from "./validateStrategyResult";

// Immutable A1 audit evidence is input only. All strategy objects here are test-only.
const saved = JSON.parse(
  readFileSync("docs/qa/a1/representative-decisions.json", "utf8"),
) as { context: HeroDecisionContext }[];
function decision(eventId: string): HeroDecisionContext {
  const found = saved.find(({ context }) => context.eventId === eventId)?.context;
  if (!found) throw new Error(`Missing A1 audit decision ${eventId}`);
  return deepFreeze(found);
}
function candidate(input: HeroDecisionContext, action: string) {
  return {
    schemaVersion: "a2-v1",
    status: "available",
    decisionKey: {
      handId: input.handId,
      eventId: input.eventId,
      decisionIndex: input.decisionIndex,
    },
    engine: { engineId: "test-only-engine", engineVersion: "1" },
    capability: { status: "supported", engineId: "test-only-engine" },
    recommendation: { primaryAction: action },
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
  const { schemaVersion, decisionKey, engine, capability } = candidate(input, "CALL");
  return { schemaVersion, decisionKey, engine, capability };
}

describe("A2 compatibility with saved real A1 decisions", () => {
  it("accepts the BB check option with the exact saved decision key", () => {
    const input = decision("TM6376938342:line:3808");
    const result = validateStrategyResult(input, deepFreeze(candidate(input, "CHECK")));
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.result.decisionKey).toEqual({
        handId: "TM6376938342",
        eventId: "TM6376938342:line:3808",
        decisionIndex: 0,
      });
  });

  it("permits a provider to cover multiway without a scalar effective stack", () => {
    const input = decision("TM6469820465:line:30");
    expect(input.effectiveStackBeforeChips).toBeNull();
    expect(validateStrategyResult(input, deepFreeze(candidate(input, "CALL"))).ok).toBe(
      true,
    );
  });

  it("accepts typed insufficiency when that scalar is required", () => {
    const input = decision("TM6469820465:line:30");
    const result = deepFreeze({
      ...resultBase(input),
      status: "insufficient-context",
      reason: "required-field-unknown",
      missingFields: ["effectiveStackBeforeChips"],
    });
    expect(validateStrategyResult(input, result).ok).toBe(true);
  });

  it("rejects claiming a known A1 field is missing", () => {
    const input = decision("TM6469820465:line:30");
    const result = {
      ...resultBase(input),
      status: "insufficient-context",
      reason: "required-field-unknown",
      missingFields: ["heroCards"],
    };
    const validated = validateStrategyResult(input, deepFreeze(result));
    expect(validated.ok).toBe(false);
    if (!validated.ok)
      expect(validated.issues.map(({ code }) => code)).toContain("MISSING_FIELD_KNOWN");
  });

  it("accepts a turn call and rejects a fake illegal action or wrong event", () => {
    const input = decision("TM6524471450:line:47");
    expect(input.street).toBe("TURN");
    expect(validateStrategyResult(input, deepFreeze(candidate(input, "CALL"))).ok).toBe(
      true,
    );
    const illegal = validateStrategyResult(
      input,
      deepFreeze(candidate(input, "CHECK")),
    );
    expect(illegal.ok).toBe(false);
    if (!illegal.ok)
      expect(illegal.issues.map(({ code }) => code)).toContain("ILLEGAL_ACTION");
    const wrong = candidate(input, "CALL");
    wrong.decisionKey.eventId = "TM6524471450:line:46";
    const mismatch = validateStrategyResult(input, deepFreeze(wrong));
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok)
      expect(mismatch.issues.map(({ code }) => code)).toContain(
        "DECISION_KEY_MISMATCH",
      );
  });

  it("preserves saved A1 facts and nested test candidate values", () => {
    const input = decision("TM6376938342:line:3808");
    const fake = deepFreeze(candidate(input, "CHECK"));
    const before = JSON.stringify([input, fake]);
    expect(validateStrategyResult(input, fake).ok).toBe(true);
    expect(JSON.stringify([input, fake])).toBe(before);
    expect(input.potBeforeActionChips).toBe(10150);
    expect(input.heroStackBeforeChips).toBe(91015);
  });
});
