// @vitest-environment node
import { describe, expect, it } from "vitest";
import { splitGgHands } from "./split";
import { parseRawGgHand } from "./rawHand";
import { fixtureHand, readFixture } from "./fixtureTestUtils";

const original = fixtureHand(2, "TM6524471450");
const raw = (text: string) => parseRawGgHand(splitGgHands(text)[0]!);

describe("raw GG hand assembly", () => {
  it.each([
    [0, 222],
    [1, 191],
    [2, 28],
  ])("recognizes every line of fixture %i", (index, count) => {
    const hands = splitGgHands(readFixture(index!)).map(parseRawGgHand);
    expect(hands).toHaveLength(count!);
    expect(hands.every((h) => h.seats.length === h.summary.seats.length)).toBe(true);
  });
  it("retains real header, level, table, seats and cumulative board declarations", () => {
    const hand = raw(original);
    expect(hand.header).toMatchObject({
      handId: "TM6524471450",
      tournamentId: "317697722",
      name: "GGMasters $150, $1M GTD [2-Day Event]",
      game: "NLHE",
      levelNumber: 3,
      blindLevel: { smallBlindChips: 35, bigBlindChips: 70, anteChips: 8 },
    });
    expect(hand.table).toMatchObject({ name: "99", capacity: 8, buttonSeat: 7 });
    expect(hand.boards.map((b) => b.board.length)).toEqual([3, 4, 5]);
    expect(hand.summary.total.totalPotChips).toBe(20203);
  });
  it("retains a folded player's partial reveal in its source street", () => {
    const hand = raw(fixtureHand(0, "TM6469819712"));
    expect(
      hand.events.find(
        (e) => e.kind === "ACTION" && e.type === "SHOW" && e.name === "54df8316",
      ),
    ).toMatchObject({ street: "RIVER", cards: [{ rank: "T", suit: "s" }] });
  });
  it("keeps summary-only cards without inventing a timed show event", () => {
    const hand = raw(fixtureHand(1, "TM6470156513"));
    expect(hand.events.some((e) => e.kind === "ACTION" && e.type === "SHOW")).toBe(
      false,
    );
    expect(hand.summary.seats.find((s) => s.name === "13ab0373")).toMatchObject({
      outcome: "COLLECTED",
      collectedChips: 12600,
      cards: [
        { rank: "Q", suit: "h" },
        { rank: "A", suit: "c" },
      ],
    });
  });
  it.each([
    [original.replace("Hold'em No Limit", "Omaha Pot Limit"), "unsupported_game"],
    [original.replace("*** HOLE CARDS ***", ""), "malformed_hand"],
    [original.split("*** SUMMARY ***")[0]!, "incomplete_hand"],
    [original.replace(/Total pot .+\r?\n/, ""), "incomplete_hand"],
    [
      original.replace("*** HOLE CARDS ***", "*** HOLE CARDS ***\n*** HOLE CARDS ***"),
      "malformed_hand",
    ],
    [
      original.replace("*** FLOP *** [8c 2c 6s]", "*** RIVER *** [8c 2c 6s 3c] [Jd]"),
      "malformed_hand",
    ],
    [
      original.replace("Hero: bets 1,315", "Dealt to Hero [Ad Ah]\nHero: bets 1,315"),
      "malformed_hand",
    ],
    [
      original.replace(/Seat 8: 318625a8 \(small blind\) folded before Flop/, ""),
      "incomplete_hand",
    ],
  ])("rejects corrupted hand structure case %#", (text, type) => {
    expect(() => raw(text)).toThrow(expect.objectContaining({ type }));
  });
});
