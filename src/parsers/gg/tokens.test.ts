// @vitest-environment node
import { describe, expect, it } from "vitest";
import { tokenizeGgLine } from "./tokens";

function token(text: string) {
  return tokenizeGgLine({ number: 41, text });
}

describe("observed GG line grammar", () => {
  it("accepts a partial-reveal winning summary without a hand description", () => {
    expect(
      token("Seat 2: f5cbea50 (big blind) showed [Ah] and won (106,400)"),
    ).toMatchObject({
      kind: "SUMMARY_SEAT",
      seatNumber: 2,
      name: "f5cbea50",
      role: "big blind",
      outcome: "WON",
      collectedChips: 106400,
      cards: [{ rank: "A", suit: "h" }],
    });
  });
  it.each([
    ["Hero: posts the ante 2,000", { type: "ANTE", amountChips: 2000 }],
    ["Hero: posts small blind 50", { type: "SMALL_BLIND", amountChips: 50 }],
    ["Hero: posts big blind 100", { type: "BIG_BLIND", amountChips: 100 }],
    ["Hero: folds", { type: "FOLD", amountChips: 0 }],
    ["Hero: checks", { type: "CHECK", amountChips: 0 }],
    ["Hero: calls 232,050", { type: "CALL", amountChips: 232050 }],
    [
      "Hero: calls 3,852 and is all-in",
      { type: "CALL", amountChips: 3852, isAllIn: true },
    ],
    ["Hero: bets 8,000", { type: "BET", amountChips: 8000 }],
    [
      "Hero: bets 8,000 and is all-in",
      { type: "BET", amountChips: 8000, isAllIn: true },
    ],
    [
      "Hero: raises 240 to 440",
      { type: "RAISE", raiseByChips: 240, raiseToChips: 440 },
    ],
    [
      "Hero: raises 232,050 to 316,050 and is all-in",
      { type: "RAISE", raiseByChips: 232050, raiseToChips: 316050, isAllIn: true },
    ],
    [
      "Uncalled bet (8,000) returned to Hero",
      { type: "RETURN_UNCALLED", amountChips: 8000 },
    ],
    ["Hero collected 16,356 from pot", { type: "COLLECT_POT", amountChips: 16356 }],
    [
      "Hero: shows [7c 7h]",
      {
        type: "SHOW",
        cards: [
          { rank: "7", suit: "c" },
          { rank: "7", suit: "h" },
        ],
      },
    ],
    [
      "54df8316: shows [Ts] (a pair of Tens)",
      {
        type: "SHOW",
        description: "a pair of Tens",
        cards: [{ rank: "T", suit: "s" }],
      },
    ],
  ])("recognizes %s without ambiguous raise amounts", (line, expected) => {
    expect(token(line as string)).toMatchObject({
      kind: "ACTION",
      ...(expected as object),
      source: { number: 41, text: line },
    });
  });
  it.each([
    "Seat 1: Hero folded before Flop",
    "Seat 1: Hero (button) folded on the Turn",
    "Seat 1: Hero (small blind) collected (575)",
    "Seat 1: Hero (big blind) won (575)",
    "Seat 1: Hero showed [Qh Ac] and collected (12,600)",
    "Seat 1: Hero showed [Qh Ac] and won (12,600)",
    "Seat 1: Hero showed [7c 7h] and lost with two pair, Sevens and Sixes",
    "Seat 1: Hero showed [Ac As] and won (672,100) with a full house, Aces full of Sixes",
  ])("recognizes summary variant %s", (line) => {
    expect(token(line)).toMatchObject({
      kind: "SUMMARY_SEAT",
      name: "Hero",
      seatNumber: 1,
    });
  });
  it("preserves empty opponent deals", () => {
    expect(token("Dealt to 3521ffc ")).toMatchObject({
      kind: "DEAL",
      name: "3521ffc",
      cards: null,
    });
  });
  it.each(["Hero: dances", "*** FIRST FLOP *** [As Ks Qs]"])(
    "rejects unobserved syntax %s",
    (line) => {
      expect(() => token(line)).toThrow(expect.objectContaining({ lineNumber: 41 }));
    },
  );
});
