import { describe, expect, it } from "vitest";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand, readFixture } from "../parsers/gg/fixtureTestUtils";
import {
  filterHandBrowserRows,
  presentHandBrowserRow,
} from "./handBrowserPresentation";

function parsedHands() {
  const result = parseGgTournament(readFixture(0));
  if (!result.ok) throw new Error("Fixture did not parse");
  return result.tournament.hands;
}

describe("source-backed tournament hand browser rows", () => {
  it("retains import order and real fields without inventing analysis or effective stacks", () => {
    const hands = parsedHands();
    const rows = hands.map(presentHandBrowserRow);
    expect(rows).toHaveLength(222);
    expect(rows.map((row) => row.handId)).toEqual(hands.map((hand) => hand.id));
    const single = parseGgTournament(fixtureHand(0, "TM6468725291"));
    if (!single.ok) throw new Error("Fixture did not parse");
    const row = presentHandBrowserRow(single.tournament.hands[0]!);
    expect(row).toMatchObject({
      handId: "TM6468725291",
      handNumber: 1,
      position: "BB",
      effectiveStack: "—",
      grade: "Not analysed",
      status: "—",
    });
    expect(row.cards).toEqual([
      { rank: "K", suit: "d" },
      { rank: "K", suit: "c" },
    ]);
    expect(row.finalPot).toBe(
      single.tournament.hands[0]!.summary.totalPotChips.toLocaleString("en-US"),
    );
    expect(row.spot).toContain("BB");
    expect(["Preflop", "Flop", "Turn", "River"]).toContain(row.street);
  });

  it("uses source-backed fields for search and keeps source order through filters", () => {
    const rows = parsedHands().map(presentHandBrowserRow);
    expect(
      filterHandBrowserRows(rows, { query: "47", position: "any", street: "any" }).some(
        (row) => row.handNumber === 47,
      ),
    ).toBe(true);
    expect(
      filterHandBrowserRows(rows, { query: "KK", position: "any", street: "any" }).some(
        (row) => row.handId === "TM6468725291",
      ),
    ).toBe(true);
    expect(
      filterHandBrowserRows(rows, { query: "BB", position: "any", street: "any" }).some(
        (row) => row.handId === "TM6468725291",
      ),
    ).toBe(true);
    const filtered = filterHandBrowserRows(rows, {
      query: "",
      position: "BB",
      street: "FLOP",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((row) => row.position === "BB" && row.street === "Flop"),
    ).toBe(true);
    expect(filtered.map((row) => rows.indexOf(row))).toEqual(
      [...filtered.map((row) => rows.indexOf(row))].sort((a, b) => a - b),
    );
    expect(
      filterHandBrowserRows(rows, {
        query: "no such hand",
        position: "any",
        street: "any",
      }),
    ).toEqual([]);
  });

  it("formats ten as 10 for card search without altering source cards", () => {
    const parsed = parseGgTournament(fixtureHand(0, "TM6468725291"));
    if (!parsed.ok) throw new Error("Fixture did not parse");
    const hand = parsed.tournament.hands[0]!;
    const row = presentHandBrowserRow({
      ...hand,
      heroHoleCards: [
        { rank: "T", suit: "h" },
        { rank: "7", suit: "s" },
      ],
    });
    expect(
      filterHandBrowserRows([row], { query: "107", position: "any", street: "any" }),
    ).toEqual([row]);
  });
});
