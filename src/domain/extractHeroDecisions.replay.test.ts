// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import type { ImportedHand } from "./handHistory";
import { metricHand } from "./pokerMetricsTestUtils";
import { extractHeroDecisions } from "./extractHeroDecisions";
import { toReplayHand } from "./replayAdapter";
import { buildReplayState, findActionCursor, flattenActions } from "./replay";

function real(index: number, id: string): ImportedHand {
  const parsed = parseGgTournament(fixtureHand(index, id));
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
  return parsed.tournament.hands[0]!;
}

function checkExactPreAction(source: ImportedHand): number {
  const extraction = extractHeroDecisions(source);
  expect(extraction.status, source.id).toBe("ok");
  const replayHand = toReplayHand(source).hand;
  const actions = flattenActions(replayHand);
  for (const decision of extraction.decisions) {
    const cursor = findActionCursor(replayHand, decision.eventId);
    expect(actions[cursor]?.id, decision.eventId).toBe(decision.eventId);
    const frame = buildReplayState(replayHand, cursor);
    expect(frame.potChips, decision.eventId).toBe(decision.potBeforeActionChips);
    expect(
      frame.seats.find((seat) => seat.id === source.heroPlayerId)?.stackChips,
      decision.eventId,
    ).toBe(decision.heroStackBeforeChips);
    expect(frame.board, decision.eventId).toEqual(decision.board);
    expect(
      frame.seats
        .filter((seat) => !seat.isFolded)
        .map((seat) => seat.id)
        .sort(),
      decision.eventId,
    ).toEqual(decision.playersRemaining.map((p) => p.playerId).sort());
  }
  return extraction.decisions.length;
}

describe("A1 exact pre-action Replay cross-check", () => {
  it("matches curated synthetic blind, repeated-action, later-street, short-all-in, and multiway decisions", () => {
    const hands = [
      metricHand(
        [
          ["h", "FOLD"],
          ["a", "CALL", 100],
          ["s", "CALL", 50],
          ["b", "CHECK"],
        ],
        { hero: "b" },
      ),
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "CALL", 100],
          ["s", "CALL", 50],
          ["b", "CHECK"],
          ["h", "BET", 100, "FLOP"],
          ["a", "RAISE", 300, "FLOP"],
          ["h", "CALL", 200, "FLOP"],
          ["h", "CHECK", 0, "TURN"],
          ["h", "CHECK", 0, "RIVER"],
        ],
        { board: 5 },
      ),
      metricHand(
        [
          ["h", "RAISE", 300],
          ["a", "RAISE", 400],
          ["s", "RAISE", 500],
          ["h", "CALL", 200],
        ],
        { stacks: { a: 400, s: 500 } },
      ),
    ];
    expect(hands.map(checkExactPreAction)).toEqual([1, 5, 2]);
  });

  it.each([
    [2, "TM6524471450"],
    [1, "TM6471062694"],
    [3, "TM6376938342"],
    [0, "TM6469820465"],
  ] as const)("matches every Hero decision in real GG hand %s/%s", (index, id) => {
    expect(checkExactPreAction(real(index, id))).toBeGreaterThan(0);
  });

  it("reports the known zero-stack source anomaly separately", () => {
    const hand = real(1, "TM6471061841");
    const result = extractHeroDecisions(hand);
    expect(result.status).toBe("ok");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "ZERO_STACK_FOLD",
        severity: "recoverable",
      }),
    );
    checkExactPreAction(hand);
  });
});
