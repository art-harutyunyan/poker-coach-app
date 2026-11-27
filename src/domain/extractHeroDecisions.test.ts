// @vitest-environment node
import { describe, expect, it } from "vitest";
import { metricHand, deepFreeze } from "./pokerMetricsTestUtils";
import { extractHeroDecisions } from "./extractHeroDecisions";
import type { ImportedHand } from "./handHistory";

describe("canonical Hero decision extraction", () => {
  it("records a source-backed pre-action open, not forced or settlement events", () => {
    const hand = deepFreeze(
      metricHand([
        ["a", "FOLD"],
        ["h", "RAISE", 250],
        ["s", "FOLD"],
        ["b", "FOLD"],
        ["h", "RETURN_UNCALLED", 150],
      ]),
    );
    const before = JSON.stringify(hand);
    const result = extractHeroDecisions(hand);
    expect(result.status).toBe("ok");
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]).toMatchObject({
      handId: hand.id,
      eventId: hand.events.find((e) => e.type === "RAISE")?.id,
      decisionIndex: 0,
      street: "PREFLOP",
      heroPosition: "CO",
      board: [],
      playersDealt: 4,
      playersInHand: 3,
      heroStackBeforeChips: 1000,
      potBeforeActionChips: 150,
      currentBetChips: 100,
      facingAmountChips: 100,
      amountToCallChips: 100,
      contributionsByPlayerChips: { h: 0, a: 0, s: 50, b: 100 },
      actualAction: {
        kind: "RAISE",
        amountAddedChips: 250,
        raiseToChips: 250,
        isAllIn: false,
      },
    });
    expect(JSON.stringify(hand)).toBe(before);
  });

  it("keeps two Hero flop decisions distinct and reads the new street before acting", () => {
    const hand = metricHand(
      [
        ["h", "CALL", 100],
        ["a", "CALL", 100],
        ["s", "CALL", 50],
        ["b", "CHECK"],
        ["h", "BET", 100, "FLOP"],
        ["a", "RAISE", 300, "FLOP"],
        ["h", "CALL", 200, "FLOP"],
      ],
      { board: 3 },
    );
    const result = extractHeroDecisions(hand);
    expect(result.status).toBe("ok");
    expect(
      result.decisions.map((d) => [d.decisionIndex, d.street, d.actualAction.kind]),
    ).toEqual([
      [0, "PREFLOP", "CALL"],
      [1, "FLOP", "BET"],
      [2, "FLOP", "CALL"],
    ]);
    expect(result.decisions[1]).toMatchObject({
      heroStackBeforeChips: 900,
      potBeforeActionChips: 400,
      currentBetChips: 0,
      amountToCallChips: 0,
      board: hand.streets[1]?.board,
      actualAction: { amountAddedChips: 100 },
    });
    expect(result.decisions[2]).toMatchObject({
      heroStackBeforeChips: 800,
      potBeforeActionChips: 800,
      currentBetChips: 300,
      facingAmountChips: 200,
      actualAction: { amountAddedChips: 200 },
    });
  });

  it("excludes the whole hand after a later fatal ledger error", () => {
    const hand = metricHand([
      ["h", "CALL", 100],
      ["a", "FOLD"],
    ]);
    const bad = structuredClone(hand);
    const award = bad.events.find((e) => e.type === "COLLECT_POT")!;
    award.amountChips += 1;
    const result = extractHeroDecisions(bad);
    expect(result).toMatchObject({ status: "excluded", decisions: [] });
    expect(result.diagnostics.some((d) => d.severity === "fatal")).toBe(true);
  });

  it("rejects invalid structure without fabricating a decision", () => {
    const hand = metricHand([["h", "FOLD"]]);
    const invalid: ImportedHand[] = [
      { ...hand, heroHoleCards: null } as unknown as ImportedHand,
      {
        ...hand,
        events: hand.events.map((e, i) =>
          i === 2 ? { ...e, actorPlayerId: "ghost" } : e,
        ),
      } as ImportedHand,
      {
        ...hand,
        events: hand.events.map((e, i) => (i === 2 ? { ...e, sequence: 0 } : e)),
      } as ImportedHand,
    ];
    for (const bad of invalid)
      expect(extractHeroDecisions(bad)).toMatchObject({
        status: "excluded",
        decisions: [],
      });
  });

  it("reports a known zero-stack forced-post fold without losing other decisions", () => {
    const hand = metricHand(
      [
        ["s", "FOLD"],
        ["h", "FOLD"],
      ],
      { stacks: { s: 50 } },
    );
    const anomaly = hand.events.find(
      (e) => e.type === "FOLD" && e.actorPlayerId === "s",
    )!;
    const source = {
      ...hand,
      warnings: [
        {
          code: "ZERO_STACK_FOLD" as const,
          message: "Source zero-stack forced-post fold",
          source: anomaly.source,
        },
      ],
    };
    const result = extractHeroDecisions(source);
    expect(result.status).toBe("ok");
    expect(result.decisions.map((d) => d.actualAction.kind)).toEqual(["FOLD"]);
    expect(result.decisions[0]?.preflopSequence).toEqual([]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "recoverable",
        code: "ZERO_STACK_FOLD",
        eventId: anomaly.id,
        lineNumber: anomaly.source.lineNumber,
      }),
    );
    expect(extractHeroDecisions(hand)).toMatchObject({
      status: "excluded",
      decisions: [],
    });
  });

  it("does not turn partial reveals or split awards into decisions", () => {
    const hand = metricHand([["h", "FOLD"]], {
      show: ["a"],
      awards: [
        ["a", 100],
        ["b", 50],
      ],
    });
    const result = extractHeroDecisions(hand);
    expect(result.status).toBe("ok");
    expect(result.decisions.map((decision) => decision.actualAction.kind)).toEqual([
      "FOLD",
    ]);
  });
});

describe("reviewed extraction boundaries", () => {
  it("marks the current non-all-in under-raise and under-minimum bet unknown", () => {
    const underRaise = extractHeroDecisions(metricHand([["h", "RAISE", 150]]));
    expect(underRaise.status).toBe("ok");
    expect(underRaise.decisions[0]).toMatchObject({
      legalActions: null,
      sourceConfidence: "unknown",
    });
    expect(underRaise.decisions[0]?.unknownReasons).toContainEqual({
      field: "legalActions",
      code: "UNSUPPORTED_RAISE_SEQUENCE",
    });

    const underBet = extractHeroDecisions(
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "CALL", 100],
          ["s", "CALL", 50],
          ["b", "CHECK"],
          ["h", "BET", 50, "FLOP"],
        ],
        { board: 3 },
      ),
    );
    expect(underBet.status).toBe("ok");
    expect(underBet.decisions[1]).toMatchObject({
      legalActions: null,
      sourceConfidence: "unknown",
    });
    expect(underBet.decisions[1]?.unknownReasons).toContainEqual({
      field: "legalActions",
      code: "UNSUPPORTED_RAISE_SEQUENCE",
    });
  });

  it("keeps later legality known after a valid short all-in opening bet", () => {
    const result = extractHeroDecisions(
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "CALL", 100],
          ["s", "CALL", 50],
          ["b", "CHECK"],
          ["a", "BET", 25, "FLOP"],
          ["h", "CALL", 25, "FLOP"],
        ],
        { board: 3, stacks: { a: 125 } },
      ),
    );
    expect(result.status).toBe("ok");
    expect(result.decisions[1]).toMatchObject({
      legalActions: ["FOLD", "CALL", "RAISE"],
      minimumRaiseToChips: 125,
    });
  });

  it("excludes duplicate physical cards and mismatched final results", () => {
    const hand = metricHand([["h", "FOLD"]], { board: 3 });
    const duplicate = structuredClone(hand);
    duplicate.streets[1]!.board[0] = duplicate.heroHoleCards![0];
    expect(extractHeroDecisions(duplicate)).toMatchObject({
      status: "excluded",
      decisions: [],
    });

    const mismatch = structuredClone(hand);
    mismatch.results[0]!.finalStackChips += 1;
    expect(extractHeroDecisions(mismatch)).toMatchObject({
      status: "excluded",
      decisions: [],
    });
  });
});

describe("betting and structural context", () => {
  it("classifies an unopened preflop choice and its legal actions", () => {
    const hand = metricHand([["h", "FOLD"]]);
    const result = extractHeroDecisions(hand);
    expect(result.status).toBe("ok");
    expect(result.decisions[0]).toMatchObject({
      facingAction: "UNOPENED",
      potType: "UNOPENED",
      legalActions: ["FOLD", "CALL", "RAISE"],
      minimumRaiseToChips: 200,
      preflopSequence: [],
      heroStackBeforeBb: 10,
      effectiveStackBeforeChips: null,
      sourceConfidence: "partial",
    });
    expect(result.decisions[0]?.unknownReasons).toContainEqual({
      field: "effectiveStackBeforeChips",
      code: "MULTIWAY_EFFECTIVE_STACK_AMBIGUOUS",
    });
  });

  it("offers BB check or raise after limps and preserves ordered preflop actions", () => {
    const hand = metricHand(
      [
        ["h", "FOLD"],
        ["a", "CALL", 100],
        ["s", "CALL", 50],
        ["b", "CHECK"],
      ],
      { hero: "b" },
    );
    const result = extractHeroDecisions(hand);
    expect(result.status).toBe("ok");
    expect(result.decisions[0]).toMatchObject({
      facingAction: "LIMPED",
      potType: "LIMPED",
      currentBetChips: 100,
      facingAmountChips: 0,
      legalActions: ["CHECK", "RAISE"],
      minimumRaiseToChips: 200,
      preflopSequence: [
        { playerId: "h", action: "FOLD" },
        { playerId: "a", action: "CALL", amountAddedChips: 100 },
        { playerId: "s", action: "CALL", amountAddedChips: 50 },
      ],
    });
  });

  it("distinguishes a 3-bet and a 4-bet before Hero responds", () => {
    const three = extractHeroDecisions(
      metricHand([
        ["h", "RAISE", 250],
        ["a", "RAISE", 700],
        ["h", "CALL", 450],
      ]),
    );
    expect(three.status).toBe("ok");
    expect(three.decisions[1]).toMatchObject({
      facingAction: "FACING_3BET",
      potType: "THREE_BET",
      currentBetChips: 700,
      facingAmountChips: 450,
      legalActions: ["FOLD", "CALL", "RAISE"],
      minimumRaiseToChips: 1150,
    });
    expect(three.decisions[1]?.preflopSequence.map((e) => e.action)).toEqual([
      "RAISE",
      "RAISE",
    ]);
    const four = extractHeroDecisions(
      metricHand([
        ["h", "RAISE", 250],
        ["a", "RAISE", 600],
        ["s", "RAISE", 950],
        ["h", "FOLD"],
      ]),
    );
    expect(four.status).toBe("ok");
    expect(four.decisions[1]).toMatchObject({
      facingAction: "FACING_4BET",
      potType: "FOUR_BET_PLUS",
    });
  });

  it("distinguishes a flop check from facing a bet and a raise", () => {
    const base = [
      ["h", "CALL", 100],
      ["a", "CALL", 100],
      ["s", "CALL", 50],
      ["b", "CHECK"],
    ] as const;
    const checked = extractHeroDecisions(
      metricHand(
        [
          ...base.map((step) => [...step] as [string, "CALL" | "CHECK", number?]),
          ["a", "CHECK", 0, "FLOP"],
          ["h", "CHECK", 0, "FLOP"],
        ],
        { board: 3 },
      ),
    );
    expect(checked.status).toBe("ok");
    expect(checked.decisions[1]).toMatchObject({
      facingAction: "CHECKED_TO",
      legalActions: ["CHECK", "BET"],
      potType: "LIMPED",
    });
    const raised = extractHeroDecisions(
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "CALL", 100],
          ["s", "CALL", 50],
          ["b", "CHECK"],
          ["h", "BET", 100, "FLOP"],
          ["a", "RAISE", 300, "FLOP"],
          ["h", "CALL", 200, "FLOP"],
        ],
        { board: 3 },
      ),
    );
    expect(raised.status).toBe("ok");
    expect(raised.decisions[1]).toMatchObject({
      facingAction: "CHECKED_TO",
      legalActions: ["CHECK", "BET"],
    });
    expect(raised.decisions[2]).toMatchObject({
      facingAction: "FACING_RAISE",
      legalActions: ["FOLD", "CALL", "RAISE"],
      minimumRaiseToChips: 500,
    });
  });

  it("does not reopen betting for one short all-in raise but does for two", () => {
    const one = extractHeroDecisions(
      metricHand(
        [
          ["h", "RAISE", 300],
          ["a", "RAISE", 400],
          ["h", "CALL", 100],
        ],
        { stacks: { a: 400 } },
      ),
    );
    expect(one.status).toBe("ok");
    expect(one.decisions[1]).toMatchObject({
      legalActions: ["FOLD", "CALL"],
      minimumRaiseToChips: null,
    });
    const two = extractHeroDecisions(
      metricHand(
        [
          ["h", "RAISE", 300],
          ["a", "RAISE", 400],
          ["s", "RAISE", 500],
          ["h", "CALL", 200],
        ],
        { stacks: { a: 400, s: 500 } },
      ),
    );
    expect(two.status).toBe("ok");
    expect(two.decisions[1]).toMatchObject({
      legalActions: ["FOLD", "CALL", "RAISE"],
      minimumRaiseToChips: 700,
    });
  });

  it("keeps an all-in opponent in the HU pot and excludes a futile raise", () => {
    const result = extractHeroDecisions(
      metricHand([
        ["h", "CALL", 100],
        ["a", "FOLD"],
        ["s", "FOLD"],
        ["b", "RAISE", 1000],
        ["h", "CALL", 900],
      ]),
    );
    expect(result.status).toBe("ok");
    expect(result.decisions[1]).toMatchObject({
      playersInHand: 2,
      playersRemaining: [
        { playerId: "h", state: "active" },
        { playerId: "b", state: "all-in", stackBeforeChips: 0 },
      ],
      effectiveStackBeforeChips: 900,
      effectiveStackBeforeBb: 9,
      legalActions: ["FOLD", "CALL"],
    });
  });

  it("marks unsupported non-all-in under-raises as unknown legality", () => {
    const result = extractHeroDecisions(
      metricHand([
        ["h", "RAISE", 300],
        ["a", "RAISE", 400],
        ["h", "CALL", 100],
      ]),
    );
    expect(result.status).toBe("ok");
    expect(result.decisions[1]).toMatchObject({
      legalActions: null,
      sourceConfidence: "unknown",
    });
    expect(result.decisions[1]?.unknownReasons).toContainEqual({
      field: "legalActions",
      code: "UNSUPPORTED_RAISE_SEQUENCE",
    });
  });

  it("caps a short all-in call and allows a source-backed short all-in raise", () => {
    const call = extractHeroDecisions(
      metricHand(
        [
          ["a", "RAISE", 300],
          ["h", "CALL", 250],
        ],
        { stacks: { h: 250 } },
      ),
    );
    expect(call.status).toBe("ok");
    expect(call.decisions[0]).toMatchObject({
      facingAmountChips: 300,
      amountToCallChips: 250,
      legalActions: ["FOLD", "CALL"],
      actualAction: { kind: "CALL", isAllIn: true, amountAddedChips: 250 },
    });
    const raise = extractHeroDecisions(
      metricHand(
        [
          ["a", "RAISE", 300],
          ["h", "RAISE", 350],
        ],
        { stacks: { h: 350 } },
      ),
    );
    expect(raise.status).toBe("ok");
    expect(raise.decisions[0]).toMatchObject({
      legalActions: ["FOLD", "CALL", "RAISE"],
      minimumRaiseToChips: 500,
      actualAction: {
        kind: "RAISE",
        isAllIn: true,
        amountAddedChips: 350,
        raiseToChips: 350,
      },
    });
  });

  it("keeps turn and river boards and preflop pot type at each decision", () => {
    const hand = metricHand(
      [
        ["h", "CALL", 100],
        ["a", "CALL", 100],
        ["s", "CALL", 50],
        ["b", "CHECK"],
        ["h", "CHECK", 0, "FLOP"],
        ["h", "CHECK", 0, "TURN"],
        ["h", "CHECK", 0, "RIVER"],
      ],
      { board: 5 },
    );
    const result = extractHeroDecisions(hand);
    expect(result.status).toBe("ok");
    expect(result.decisions.map((d) => [d.street, d.board.length, d.potType])).toEqual([
      ["PREFLOP", 0, "UNOPENED"],
      ["FLOP", 3, "LIMPED"],
      ["TURN", 4, "LIMPED"],
      ["RIVER", 5, "LIMPED"],
    ]);
  });

  it("keeps bet sizing source-backed and warns on a short blind", () => {
    const bet = extractHeroDecisions(
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "CALL", 100],
          ["s", "CALL", 50],
          ["b", "CHECK"],
          ["h", "BET", 100, "FLOP"],
        ],
        { board: 3 },
      ),
    );
    expect(bet.status).toBe("ok");
    expect(bet.decisions[1]?.actualAction).toMatchObject({
      kind: "BET",
      amountAddedChips: 100,
      amountAddedBb: 1,
      potFraction: 0.25,
    });
    const hand = metricHand([["h", "FOLD"]], { stacks: { b: 40 } });
    const blind = hand.events.find((event) => event.type === "BIG_BLIND")!;
    const warned = extractHeroDecisions({
      ...hand,
      warnings: [
        {
          code: "SHORT_BLIND_POST",
          message: "Short posted BB",
          source: blind.source,
        },
      ],
    });
    expect(warned.status).toBe("ok");
    expect(warned.decisions[0]).toMatchObject({
      currentBetChips: 100,
      facingAmountChips: 100,
      sourceConfidence: "partial",
    });
    expect(warned.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        code: "SHORT_BLIND_POST",
      }),
    );
  });
});
