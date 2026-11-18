// @vitest-environment node
import { expect, it } from "vitest";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import { toReplayHand } from "./replayAdapter";
import {
  buildReplayState,
  currentNavigationTarget,
  findShowdownCursor,
  findStreetCursor,
  flattenActions,
} from "./replay";
import type { Hand } from "./schemas";

function projected(index: number, id: string): Hand {
  const parsed = parseGgTournament(fixtureHand(index, id));
  if (!parsed.ok) throw new Error("Invalid fixture");
  return toReplayHand(parsed.tournament.hands[0]!).hand;
}
it("stops before the early source SHOW and derives navigation across runout boundaries", () => {
  const hand = projected(0, "TM6468725291"),
    before = structuredClone(hand);
  expect(findShowdownCursor(hand)).toBe(22);
  expect(
    buildReplayState(hand, 22).seats.find((p) => p.name === "ad116bad")?.revealedCards,
  ).toBeUndefined();
  expect(
    buildReplayState(hand, 23).seats.find((p) => p.name === "ad116bad")?.revealedCards,
  ).toEqual([
    { rank: "A", suit: "h" },
    { rank: "5", suit: "d" },
  ]);
  expect(buildReplayState(hand, 24).board).toEqual([]);
  expect(hand.heroHoleCards).toEqual([
    { rank: "K", suit: "d" },
    { rank: "K", suit: "c" },
  ]);
  for (const [cursor, target] of [
    [21, "PREFLOP"],
    [22, "SHOWDOWN"],
    [23, "SHOWDOWN"],
    [24, "SHOWDOWN"],
    [25, "FLOP"],
    [26, "TURN"],
    [27, "SHOWDOWN"],
    [28, "SHOWDOWN"],
    [29, "SHOWDOWN"],
  ] as const)
    expect(
      currentNavigationTarget(
        hand,
        cursor,
        buildReplayState(hand, cursor).currentStreet,
      ),
    ).toBe(target);
  expect(buildReplayState(hand, 27).currentStreet).toBe("RIVER");
  expect(
    ["PREFLOP", "FLOP", "TURN", "RIVER"].map((s) =>
      findStreetCursor(hand, s as "PREFLOP"),
    ),
  ).toEqual([0, 25, 26, 27]);
  findShowdownCursor(projected(3, "TM6378370688"));
  expect(findShowdownCursor(hand)).toBe(22);
  expect(hand).toEqual(before);
});
it("steps through three river reveals before marker and recorded awards", () => {
  const hand = projected(3, "TM6377255556"),
    actions = flattenActions(hand);
  expect(findShowdownCursor(hand)).toBe(27);
  expect(actions.slice(27).map((a) => a.type)).toEqual([
    "SHOW",
    "SHOW",
    "SHOW",
    "SHOWDOWN",
    "WIN",
    "WIN",
    "WIN",
  ]);
  expect(actions.slice(31).map((a) => a.amountChips)).toEqual([343, 343, 11058]);
  for (const cursor of [27, 28, 29, 30, 31, 34])
    expect(currentNavigationTarget(hand, cursor, "RIVER")).toBe("SHOWDOWN");
});
it("uses marker-only fallback without fabricating the summary partial reveal", () => {
  const hand = projected(3, "TM6378370688");
  expect(findShowdownCursor(hand)).toBe(34);
  expect(flattenActions(hand).some((a) => a.type === "SHOW")).toBe(false);
  expect(buildReplayState(hand, 35).seats.every((p) => !p.revealedCards)).toBe(true);
});
it("never invents a boundary or jumps through collection", () => {
  const source = projected(0, "TM6468725291");
  const without: Hand = {
    ...source,
    streets: source.streets.map((s) => ({
      ...s,
      actions: s.actions.filter((a) => a.type !== "SHOW" && a.type !== "SHOWDOWN"),
    })),
  };
  expect(findShowdownCursor(without)).toBeNull();
  const actions = flattenActions(source),
    win = actions.find((a) => a.type === "WIN")!;
  const collectedFirst: Hand = {
    ...source,
    streets: [
      {
        ...source.streets[0]!,
        actions: [
          { ...win, sequence: 0 },
          ...actions
            .filter((a) => a.type === "SHOW" || a.type === "SHOWDOWN")
            .map((a, i) => ({ ...a, sequence: i + 1 })),
        ],
      },
    ],
  };
  expect(findShowdownCursor(collectedFirst)).toBeNull();
  expect(currentNavigationTarget(collectedFirst, 1, "RIVER")).toBe("RIVER");
});
