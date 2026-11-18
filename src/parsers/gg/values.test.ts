// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseBuyIn, parseCards, parseChips, parseLocalTimestamp } from "./values";

const source = { number: 17, text: "source line" };

describe("exact GG lexical values", () => {
  it.each([
    ["16,000", 16000],
    ["0", 0],
    ["9007199254740991", Number.MAX_SAFE_INTEGER],
  ])("parses exact chips %s", (text, expected) => {
    expect(parseChips(String(text), source)).toBe(expected);
  });
  it.each(["1,00", "1,0000", "-1", "1.5", "9007199254740992", "", " 12", "12x"])(
    "rejects malformed/unsafe chips %s with context",
    (text) => {
      expect(() => parseChips(text, source)).toThrow(
        expect.objectContaining({
          type: "invalid_action",
          lineNumber: 17,
          rawLine: "source line",
        }),
      );
    },
  );
  it.each([
    ["Daily Monster Stack $2.50", 250],
    ["Fifty Stack $5.50", 550],
    ["GGMasters $150, $1M GTD [2-Day Event]", 15000],
  ])("preserves minor units and unresolved currency for %s", (title, amountMinor) => {
    expect(parseBuyIn(title, source)).toEqual({
      amountMinor,
      scale: 2,
      currency: null,
      symbol: "$",
    });
  });
  it("does not invent a missing buy-in", () => {
    expect(parseBuyIn("Unpriced tournament", source)).toBeNull();
  });
  it.each(["Tournament $2,500", "Tournament $2.500", "Tournament $1M GTD"])(
    "does not guess unsupported money tokens in %s",
    (title) => {
      expect(parseBuyIn(title, source)).toBeNull();
    },
  );
  it("preserves a local timestamp without inventing a timezone", () => {
    expect(parseLocalTimestamp("2026/09/29 02:40:11", source)).toEqual({
      local: "2026-09-29T02:40:11",
      timezone: null,
    });
    expect(parseLocalTimestamp("2024/02/29 00:00:00", source).local).toBe(
      "2024-02-29T00:00:00",
    );
  });
  it.each([
    "2026/02/29 01:00:00",
    "2026/04/31 01:00:00",
    "2026/13/01 01:00:00",
    "2026/01/01 24:00:00",
    "2026/01/01 01:60:00",
    "2026/01/01 01:00:60",
    "2026-01-01Z",
  ])("rejects invalid local calendar value %s", (value) => {
    expect(() => parseLocalTimestamp(value, source)).toThrow(
      expect.objectContaining({ type: "malformed_hand" }),
    );
  });
  it("parses rank/suit codes and one-card reveals using shared card types", () => {
    expect(parseCards("[Ah Ts]", source)).toEqual([
      { rank: "A", suit: "h" },
      { rank: "T", suit: "s" },
    ]);
    expect(parseCards("[2c]", source)).toEqual([{ rank: "2", suit: "c" }]);
  });
  it.each(["[1h]", "[As Xd]", "[AX]", "[]", "Ah Ts", "[Ah Ts", "[Ah Ah]"])(
    "rejects invalid cards/list %s",
    (value) => {
      expect(() => parseCards(value, source)).toThrow(
        expect.objectContaining({ type: "invalid_card" }),
      );
    },
  );
  it("does not skip an unsupported first price to consume a later guarantee", () => {
    expect(parseBuyIn("GGMasters $2,500, $100000 GTD", source)).toBeNull();
    expect(parseBuyIn("Event $1M GTD, $150", source)).toBeNull();
  });
});
