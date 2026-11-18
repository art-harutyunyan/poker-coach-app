// @vitest-environment node
import { describe, expect, it } from "vitest";
import { derivePreflopOpportunities } from "./preflopOpportunities";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import { deepFreeze, metricHand, type TestAction } from "./pokerMetricsTestUtils";

describe("bounded observed 3-bet opportunities", () => {
  it("a later non-all-in under-raise invalidates an earlier opportunity, but a legal short all-in does not", () => {
    const actions: TestAction[] = [
      ["a", "RAISE", 300],
      ["h", "CALL", 300],
      ["s", "RAISE", 350],
      ["a", "CALL", 50],
      ["h", "CALL", 50],
      ["b", "FOLD"],
    ];
    expect(
      derivePreflopOpportunities(metricHand(actions, { board: 5, show: ["h"] })),
    ).toMatchObject({ status: "excluded", reasons: ["unsupported_raise"] });
    expect(
      derivePreflopOpportunities(
        metricHand(actions, { stacks: { s: 350 }, board: 5, show: ["h"] }),
      ),
    ).toMatchObject({ status: "eligible", numerator: 0, denominator: 1 });
  });
  it("TM6471059891 original raiser facing a short re-raise is not a 3-bet opportunity", () => {
    const parsed = parseGgTournament(fixtureHand(1, "TM6471059891"));
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
    expect(derivePreflopOpportunities(parsed.tournament.hands[0]!).status).toBe(
      "not-opportunity",
    );
  });
  it.each<[string, TestAction[], 0 | 1]>([
    [
      "fold",
      [
        ["a", "RAISE", 300],
        ["h", "FOLD"],
      ],
      0,
    ],
    [
      "call",
      [
        ["a", "RAISE", 300],
        ["h", "CALL", 300],
      ],
      0,
    ],
    [
      "raise",
      [
        ["a", "RAISE", 300],
        ["h", "RAISE", 700],
      ],
      1,
    ],
    [
      "squeeze",
      [
        ["a", "RAISE", 300],
        ["s", "CALL", 250],
        ["h", "RAISE", 700],
      ],
      1,
    ],
    [
      "limper facing open",
      [
        ["h", "CALL", 100],
        ["a", "RAISE", 300],
        ["h", "RAISE", 700],
      ],
      1,
    ],
    [
      "repeat turns count once",
      [
        ["a", "RAISE", 200],
        ["h", "CALL", 200],
        ["s", "RAISE", 400],
        ["h", "RAISE", 1000],
      ],
      0,
    ],
  ])("%s contributes exact n/1", (_, actions, n) => {
    const result = derivePreflopOpportunities(metricHand(actions));
    expect(result).toMatchObject({ status: "eligible", numerator: n, denominator: 1 });
    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventId: "event-2", lineNumber: 12 }),
      ]),
    );
  });
  it.each<[string, TestAction[]]>([
    ["unopened", [["h", "FOLD"]]],
    [
      "original raiser",
      [
        ["h", "RAISE", 200],
        ["a", "RAISE", 400],
        ["h", "CALL", 200],
      ],
    ],
    [
      "two full raises before Hero",
      [
        ["a", "RAISE", 200],
        ["s", "RAISE", 400],
        ["h", "CALL", 400],
      ],
    ],
  ])("%s is not an opportunity", (_, actions) =>
    expect(derivePreflopOpportunities(metricHand(actions)).status).toBe(
      "not-opportunity",
    ),
  );
  it("walk and stack only able to call are not opportunities", () => {
    expect(
      derivePreflopOpportunities(
        metricHand(
          [
            ["h", "FOLD"],
            ["a", "FOLD"],
            ["s", "FOLD"],
          ],
          { hero: "b" },
        ),
      ).status,
    ).toBe("not-opportunity");
    expect(
      derivePreflopOpportunities(
        metricHand(
          [
            ["a", "RAISE", 300],
            ["h", "CALL", 300],
          ],
          { stacks: { h: 300 } },
        ),
      ).status,
    ).toBe("not-opportunity");
  });
  it("short all-in second raise qualifies but short open does not", () => {
    expect(
      derivePreflopOpportunities(
        metricHand(
          [
            ["a", "RAISE", 300],
            ["h", "RAISE", 400],
          ],
          { stacks: { h: 400 } },
        ),
      ),
    ).toMatchObject({ status: "eligible", numerator: 1, denominator: 1 });
    expect(
      derivePreflopOpportunities(
        metricHand(
          [
            ["a", "RAISE", 150],
            ["h", "CALL", 150],
          ],
          { stacks: { a: 150 } },
        ),
      ),
    ).toMatchObject({ status: "excluded", reasons: ["short_open"] });
  });
  it("non-all-in undersized raise and ambiguous reopening are excluded", () => {
    expect(
      derivePreflopOpportunities(
        metricHand([
          ["a", "RAISE", 300],
          ["h", "RAISE", 400],
        ]),
      ),
    ).toMatchObject({ status: "excluded", reasons: ["unsupported_raise"] });
    expect(
      derivePreflopOpportunities(
        metricHand(
          [
            ["a", "RAISE", 300],
            ["s", "RAISE", 350],
            ["h", "CALL", 350],
          ],
          { stacks: { s: 350 } },
        ),
      ),
    ).toMatchObject({ status: "excluded", reasons: ["ambiguous_reopening"] });
  });
  it.each([100, 300, 301])(
    "opponent capacity %i must exceed opening wager, not merely be positive",
    (capacity) => {
      const h = metricHand(
        [
          ["s", "FOLD"],
          ["a", "RAISE", 300],
          ["h", "CALL", 300],
        ],
        { stacks: { a: 300, b: capacity } },
      );
      expect(derivePreflopOpportunities(h).status).toBe(
        capacity > 300 ? "eligible" : "not-opportunity",
      );
    },
  );
  it("single remaining all-in opponent cannot contest another raise", () => {
    expect(
      derivePreflopOpportunities(
        metricHand(
          [
            ["s", "FOLD"],
            ["b", "FOLD"],
            ["a", "RAISE", 300],
            ["h", "CALL", 300],
          ],
          { stacks: { a: 300 } },
        ),
      ).status,
    ).toBe("not-opportunity");
  });
  it("nominal BB, not short post, determines a full open", () => {
    const hand = metricHand(
      [
        ["a", "RAISE", 200],
        ["h", "CALL", 200],
      ],
      { stacks: { b: 60 } },
    );
    hand.warnings.push({
      code: "SHORT_BLIND_POST",
      message: "short",
      source: hand.events[1]!.source,
    });
    expect(derivePreflopOpportunities(hand)).toMatchObject({
      status: "eligible",
      numerator: 0,
      denominator: 1,
    });
  });
  it("warning and later inconsistent action override apparent opportunity", () => {
    const hand = metricHand([
      ["a", "RAISE", 300],
      ["h", "CALL", 300],
    ]);
    hand.warnings.push({
      code: "ZERO_STACK_FOLD",
      message: "unknown",
      source: hand.events[0]!.source,
    });
    expect(derivePreflopOpportunities(hand)).toMatchObject({
      status: "excluded",
      reasons: ["zero_stack_fold"],
    });
    hand.warnings = [];
    hand.events.find((e) => e.type === "COLLECT_POT")!.amountChips = 999999;
    expect(derivePreflopOpportunities(hand).status).toBe("excluded");
  });
  it("does not mutate or depend on call order", () => {
    const hand = deepFreeze(
      metricHand([
        ["a", "RAISE", 300],
        ["h", "CALL", 300],
      ]),
    );
    const result = derivePreflopOpportunities(hand);
    derivePreflopOpportunities(metricHand());
    expect(derivePreflopOpportunities(hand)).toEqual(result);
  });
});
