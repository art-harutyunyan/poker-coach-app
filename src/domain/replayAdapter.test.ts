// @vitest-environment node
import { describe, expect, it } from "vitest";
import { toReplayHand } from "./replayAdapter";
import { buildReplayState, flattenActions } from "./replay";
import * as replay from "./replay";
import { HandLedger } from "./handLedger";
import { handSchema } from "./schemas";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand, readFixture } from "../parsers/gg/fixtureTestUtils";

function parsed(text: string) {
  const result = parseGgTournament(text);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.tournament;
}

describe("source-complete replay adapter", () => {
  it("projects cumulative boards, incremental raises and source mappings", () => {
    const source = parsed(fixtureHand(2, "TM6524471450")).hands[0]!;
    const adapted = toReplayHand(source);
    expect(handSchema.safeParse(adapted.hand).success).toBe(true);
    expect(adapted.hand.streets.map((s) => s.board.length)).toEqual([0, 3, 1, 1]);
    const raise = flattenActions(adapted.hand).find(
      (a) => a.type === "RAISE" && a.actorPlayerId === source.heroPlayerId,
    )!;
    expect(raise.amountChips).toBe(586);
    expect(raise).toMatchObject({ raiseByChips: 495, raiseToChips: 656 });
    expect(
      source.events.find((e) => e.id === adapted.sourceEventIds[raise.id]),
    ).toMatchObject({ type: "RAISE", raiseByChips: 495, raiseToChips: 656 });
  });
  it("keeps canonical refunds separate from winnings while adapting chip transfers", () => {
    const source = parsed(fixtureHand(1, "TM6471062694")).hands[0]!;
    const adapted = toReplayHand(source);
    const refund = source.events.find((e) => e.type === "RETURN_UNCALLED")!;
    const transfer = flattenActions(adapted.hand).find(
      (a) => adapted.sourceEventIds[a.id] === refund.id,
    )!;
    expect(refund.type).toBe("RETURN_UNCALLED");
    expect(transfer).toMatchObject({
      type: "RETURN_UNCALLED",
      amountChips: 129067,
    });
    expect(adapted.diagnostics).toEqual([]);
    const after = buildReplayState(adapted.hand, transfer.sequence + 1);
    expect(after.seats.find((p) => p.id === refund.actorPlayerId)).toMatchObject({
      stackChips: 129067,
      isAllIn: false,
    });
    expect(after.seats.some((p) => p.isActive)).toBe(false);
    expect(
      flattenActions(adapted.hand).findIndex((a) => a.type === "WIN"),
    ).toBeGreaterThan(transfer.sequence);
  });
  it("retains all-in board runout and places actual awards on the final dealt street", () => {
    const source = parsed(fixtureHand(0, "TM6469820465")).hands[0]!;
    const adapted = toReplayHand(source);
    expect(
      adapted.hand.streets
        .filter((s) => s.street === "FLOP" || s.street === "TURN")
        .every((s) => s.actions.length === 1 && s.actions[0]?.type === "DEAL_BOARD"),
    ).toBe(true);
    const actions = flattenActions(adapted.hand);
    expect(buildReplayState(adapted.hand, 0)).toMatchObject({ board: [], potChips: 0 });
    for (const [street, size] of [
      ["FLOP", 3],
      ["TURN", 4],
      ["RIVER", 5],
    ] as const) {
      const deal = actions.find((a) => a.type === "DEAL_BOARD" && a.street === street)!;
      expect(deal).toMatchObject({ actorPlayerId: null, amountChips: 0 });
      expect(adapted.sourceEventIds[deal.id]).toBeUndefined();
      expect(buildReplayState(adapted.hand, deal.sequence).board).toHaveLength(
        size === 3 ? 0 : size - 1,
      );
      expect(buildReplayState(adapted.hand, deal.sequence + 1).board).toHaveLength(
        size,
      );
    }
    expect(actions.at(-1)).toMatchObject({
      type: "WIN",
      street: "RIVER",
      amountChips: 672100,
    });
    const final = buildReplayState(adapted.hand, actions.length);
    expect(final.board.map((c) => c.rank + c.suit)).toEqual([
      "Ad",
      "6d",
      "6h",
      "3s",
      "5h",
    ]);
    expect(final.potChips).toBe(0);
    expect(final).toMatchObject({ phase: "COMPLETE" });
  });
  it("projects folded one-card shows at their source cursor, never summary-only cards", () => {
    const source = parsed(fixtureHand(0, "TM6469819712")).hands[0]!;
    const adapted = toReplayHand(source);
    const player = source.players.find((p) => p.name === "54df8316")!;
    const show = source.events.find(
      (e) => e.type === "SHOW" && e.actorPlayerId === player.id,
    )!;
    const action = flattenActions(adapted.hand).find((a) => a.id === show.id)!;
    expect(action).toMatchObject({
      type: "SHOW",
      cards: [{ rank: "T", suit: "s" }],
      amountChips: 0,
    });
    const before = buildReplayState(adapted.hand, action.sequence);
    const after = buildReplayState(adapted.hand, action.sequence + 1);
    expect(
      before.seats.find((s) => s.id === show.actorPlayerId)?.revealedCards,
    ).toBeUndefined();
    expect(after.seats.find((s) => s.id === show.actorPlayerId)).toMatchObject({
      isFolded: true,
      revealedCards: [{ rank: "T", suit: "s" }],
    });
    expect(
      flattenActions(
        toReplayHand(parsed(fixtureHand(1, "TM6470156513")).hands[0]!).hand,
      ).some((a) => a.type === "SHOW"),
    ).toBe(false);
  });
  it("exposes collection and dealt-street navigation without skipping runouts", () => {
    const hand = toReplayHand(parsed(fixtureHand(0, "TM6469820465")).hands[0]!).hand;
    const actions = flattenActions(hand);
    expect(replay.findCollectionCursor(hand)).toBe(
      actions.findIndex((a) => a.type === "WIN"),
    );
    expect(replay.findStreetCursor(hand, "PREFLOP")).toBe(0);
    for (const street of ["FLOP", "TURN", "RIVER"] as const) {
      expect(replay.findStreetCursor(hand, street)).toBe(
        actions.findIndex((a) => a.type === "DEAL_BOARD" && a.street === street) + 1,
      );
    }
  });
  it("rejects malformed source boundaries while keeping schemas composable", () => {
    const hand = toReplayHand(parsed(fixtureHand(0, "TM6469820465")).hands[0]!).hand;
    const actions = flattenActions(hand);
    const deal = actions.find((a) => a.type === "DEAL_BOARD")!;
    expect(deal).toBeDefined();
    for (const invalid of [
      { ...deal, actorPlayerId: hand.heroPlayerId },
      { ...deal, amountChips: 1 },
      { ...deal, cards: [] },
    ]) {
      const bad = structuredClone(hand);
      bad.streets.find((s) => s.street === "FLOP")!.actions = [invalid];
      expect(handSchema.safeParse(bad).success).toBe(false);
    }
  });
  it("carries the source ambiguity diagnostic to adapter callers", () => {
    const hand = parsed(fixtureHand(1, "TM6471061841")).hands[0]!;
    expect(toReplayHand(hand).diagnostics).toContainEqual(
      expect.objectContaining({ code: "SOURCE_WARNING" }),
    );
  });
  it.each([0, 1, 2, 3])(
    "matches normalized finances at every cursor of every hand in fixture %i",
    (index) => {
      const tournament = parsed(readFixture(index));
      const before = JSON.stringify(tournament.hands);
      for (const hand of tournament.hands) {
        const adapted = toReplayHand(hand);
        const projectedBefore = JSON.stringify(adapted);
        const actions = flattenActions(adapted.hand);
        const ledger = new HandLedger(hand.players, hand.blindLevel.bigBlindChips);
        const total = hand.players.reduce((sum, p) => sum + p.startingStackChips, 0);
        let nextEvent = 0;
        for (let cursor = 0; cursor <= actions.length; cursor++) {
          if (cursor > 0 && adapted.sourceEventIds[actions[cursor - 1]!.id]) {
            const target = adapted.sourceEventIds[actions[cursor - 1]!.id];
            let reached = false;
            while (nextEvent < hand.events.length) {
              const e = hand.events[nextEvent++]!;
              ledger.apply(e);
              if (e.id === target) {
                reached = true;
                break;
              }
            }
            expect(reached).toBe(true);
          }
          const expected = ledger.snapshot();
          const frame = buildReplayState(adapted.hand, cursor);
          expect(frame.potChips).toBe(expected.potChips);
          expect(
            Object.fromEntries(frame.seats.map((s) => [s.id, s.stackChips])),
          ).toEqual(expected.stacks);
          expect(
            frame.potChips + frame.seats.reduce((sum, s) => sum + s.stackChips, 0),
          ).toBe(total);
          const preserved = structuredClone(frame);
          buildReplayState(adapted.hand, actions.length - cursor);
          expect(buildReplayState(adapted.hand, cursor)).toEqual(preserved);
          expect(frame).toEqual(preserved);
        }
        const final = buildReplayState(adapted.hand, actions.length);
        expect(final.potChips).toBe(0);
        expect(final.board).toEqual(hand.streets.at(-1)!.board);
        expect(
          Object.fromEntries(final.seats.map((s) => [s.id, s.stackChips])),
        ).toEqual(
          Object.fromEntries(hand.results.map((r) => [r.playerId, r.finalStackChips])),
        );
        expect(toReplayHand(hand)).toEqual(adapted);
        expect(JSON.stringify(adapted)).toBe(projectedBefore);
        expect(Object.values(adapted.sourceEventIds)).toEqual(
          hand.events.map((e) => e.id),
        );
      }
      expect(JSON.stringify(tournament.hands)).toBe(before);
    },
    30000,
  );
});
