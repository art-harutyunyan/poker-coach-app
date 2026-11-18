// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  handHistoryEventSchema,
  historyBoardSchema,
  exactMoneySchema,
} from "./handHistory";

const base = {
  id: "raise",
  sequence: 0,
  actorPlayerId: "hero",
  street: "PREFLOP",
  source: { lineNumber: 10, rawLine: "Hero: raises 240 to 440" },
  isAllIn: false,
};
describe("normalized history contracts", () => {
  it("keeps raise contribution, raise-by and raise-to distinct", () => {
    expect(
      handHistoryEventSchema.parse({
        ...base,
        type: "RAISE",
        amountChips: 340,
        raiseByChips: 240,
        raiseToChips: 440,
      }),
    ).toMatchObject({ amountChips: 340, raiseByChips: 240, raiseToChips: 440 });
  });
  it.each([
    { type: "RAISE", amountChips: 340 },
    { type: "BET", amountChips: 1.25 },
    { type: "BET", amountChips: Number.MAX_SAFE_INTEGER + 1 },
    { type: "CHECK", amountChips: 10 },
    { type: "DANCE", amountChips: 0 },
    { type: "COLLECT_POT", amountChips: -1 },
  ])("rejects invalid event case %#", (value) => {
    expect(handHistoryEventSchema.safeParse({ ...base, ...value }).success).toBe(false);
  });
  it("represents a return separately from a pot award", () => {
    expect(
      handHistoryEventSchema.parse({
        ...base,
        type: "RETURN_UNCALLED",
        amountChips: 240,
      }).type,
    ).toBe("RETURN_UNCALLED");
  });
  it("allows partial shows and actorless showdown boundaries", () => {
    expect(
      handHistoryEventSchema.safeParse({
        ...base,
        type: "SHOW",
        amountChips: 0,
        cards: [{ rank: "T", suit: "s" }],
      }).success,
    ).toBe(true);
    expect(
      handHistoryEventSchema.safeParse({
        ...base,
        actorPlayerId: null,
        street: "SHOWDOWN",
        type: "SHOWDOWN",
        amountChips: 0,
      }).success,
    ).toBe(true);
  });
  it("validates cumulative boards independently of replay's incremental boards", () => {
    const flop = [
      { rank: "A", suit: "h" },
      { rank: "7", suit: "c" },
      { rank: "2", suit: "d" },
    ];
    expect(historyBoardSchema.safeParse({ street: "FLOP", board: flop }).success).toBe(
      true,
    );
    expect(historyBoardSchema.safeParse({ street: "TURN", board: flop }).success).toBe(
      false,
    );
    expect(
      historyBoardSchema.safeParse({
        street: "FLOP",
        board: [flop[0], flop[0], flop[2]],
      }).success,
    ).toBe(false);
  });
  it("keeps unknown ISO currency explicit while validating exact minor units", () => {
    expect(
      exactMoneySchema.safeParse({
        amountMinor: 250,
        scale: 2,
        currency: null,
        symbol: "$",
      }).success,
    ).toBe(true);
    expect(
      exactMoneySchema.safeParse({
        amountMinor: 2.5,
        scale: 2,
        currency: null,
        symbol: "$",
      }).success,
    ).toBe(false);
  });
});
