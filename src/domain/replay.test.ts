import { describe, expect, it } from "vitest";
import { hands } from "../data/mockTournament";
import { buildAllInPreviewHand, buildMultiSeatPreviewHand } from "../data/previewHands";
import { buildReplayState, findActionCursor, flattenActions } from "./replay";

const hand = hands[0]!;

describe("replay state reconstruction", () => {
  for (const count of [6, 8, 9] as const) {
    const fixture = count === 6 ? hand : buildMultiSeatPreviewHand(hand, count);
    it(`${count}-max has unique sequences, valid actors and conserves chips at every cursor`, () => {
      const actions = flattenActions(fixture);
      expect(actions.map((action) => action.sequence)).toEqual(
        actions.map((_, index) => index),
      );
      expect(new Set(fixture.players.map((player) => player.position)).size).toBe(
        count,
      );
      const total = fixture.players.reduce(
        (sum, player) => sum + player.startingStackChips,
        0,
      );
      for (let cursor = 0; cursor <= actions.length; cursor++) {
        const frame = buildReplayState(fixture, cursor);
        expect(
          frame.potChips + frame.seats.reduce((sum, seat) => sum + seat.stackChips, 0),
        ).toBe(total);
        expect(frame.seats.every((seat) => seat.stackChips >= 0)).toBe(true);
        expect(
          frame.seats
            .filter((seat) => seat.isActive)
            .every((seat) => !seat.isFolded && !seat.isAllIn),
        ).toBe(true);
        if (frame.nextAction)
          expect(
            frame.seats.some((seat) => seat.id === frame.nextAction?.actorPlayerId),
          ).toBe(true);
      }
      expect(buildReplayState(fixture, actions.length).potChips).toBe(0);
    });
  }
  it("tracks live street totals separately from antes and clears them on the flop", () => {
    const beforeCall = buildReplayState(hand, 12);
    expect(beforeCall.seats.find((seat) => seat.isHero)?.committedThisStreetChips).toBe(
      1000,
    );
    expect(
      buildReplayState(hand, 13).seats.find((seat) => seat.isHero)
        ?.committedThisStreetChips,
    ).toBe(4500);
    expect(
      buildReplayState(hand, 14).seats.every(
        (seat) => seat.committedThisStreetChips === 0,
      ),
    ).toBe(true);
    expect(
      buildReplayState(hand, 14).seats.find((seat) => seat.position === "BTN")
        ?.displayAction,
    ).toBeUndefined();
    expect(
      buildReplayState(hand, 14).seats.find((seat) => seat.position === "UTG")
        ?.displayAction?.type,
    ).toBe("FOLD");
  });
  it("represents check, call, bet and raise as applied actions, never future actions", () => {
    for (const [id, type] of [
      ["a-btn-open", "RAISE"],
      ["a-hero-call", "CALL"],
      ["a-hero-check-flop", "CHECK"],
      ["a-btn-cbet", "BET"],
    ]) {
      const cursor = findActionCursor(hand, id!);
      const before = buildReplayState(hand, cursor);
      const after = buildReplayState(hand, cursor + 1);
      expect(before.lastAction?.id).not.toBe(id);
      expect(
        after.seats.find((seat) => seat.id === before.nextAction?.actorPlayerId)
          ?.displayAction?.type,
      ).toBe(type);
    }
  });
  it("keeps zero-stack callers all-in across streets and does not highlight payout as an actor", () => {
    const fixture = buildAllInPreviewHand(hand);
    const state = buildReplayState(
      fixture,
      findActionCursor(fixture, "qa-showdown-win"),
    );
    expect(state.seats.filter((seat) => seat.isAllIn)).toHaveLength(2);
    expect(state.seats.filter((seat) => seat.isActive)).toHaveLength(0);
    expect(state.seats.find((seat) => seat.isHero)?.displayActionTotalChips).toBe(
      39000,
    );
  });
  it("rejects overcommits and unseated actors instead of manufacturing chips", () => {
    const bad = structuredClone(hand);
    bad.streets[0]!.actions[0]!.amountChips = 1000000;
    expect(() => buildReplayState(bad, 1)).toThrow(/stack/);
    bad.streets[0]!.actions[0]!.actorPlayerId = "missing";
    expect(() => buildReplayState(bad, 1)).toThrow(/unseated/);
  });
  it("flattens actions in deterministic sequence order", () => {
    const actions = flattenActions(hand);

    expect(actions).toHaveLength(22);
    expect(actions[0]?.id).toBe("a-ante-hero");
    expect(actions.at(-1)?.id).toBe("a-hero-win");
  });

  it("moves pot and stacks after action cursor advances", () => {
    const beforeAction = buildReplayState(hand, 12);
    const afterHeroCall = buildReplayState(hand, 13);
    const heroBefore = beforeAction.seats.find((seat) => seat.isHero);
    const heroAfter = afterHeroCall.seats.find((seat) => seat.isHero);

    expect(beforeAction.nextAction?.id).toBe("a-hero-call");
    expect(afterHeroCall.lastAction?.id).toBe("a-hero-call");
    expect(afterHeroCall.potChips).toBe(beforeAction.potChips + 3500);
    expect(heroAfter?.stackChips).toBe((heroBefore?.stackChips ?? 0) - 3500);
  });

  it("can position the replayer at a review queue action", () => {
    const cursor = findActionCursor(hand, "a-hero-call");
    const state = buildReplayState(hand, cursor);

    expect(state.nextAction?.decisionId).toBe("decision-a5s-sb-vs-btn-open");
    expect(state.currentStreet).toBe("PREFLOP");
  });

  it("keeps cursor state as pre-action state across key replay steps", () => {
    const beforeSmallBlind = buildReplayState(hand, 6);
    const beforeButtonOpen = buildReplayState(hand, 11);
    const beforeHeroDecision = buildReplayState(hand, 12);
    const beforeBigBlindDecision = buildReplayState(hand, 13);
    const beforeFlopAction = buildReplayState(hand, 14);
    const beforeTurnButtonAction = buildReplayState(hand, 18);

    expect(beforeSmallBlind.nextAction?.id).toBe("a-sb");
    expect(beforeSmallBlind.potChips).toBe(1500);

    expect(beforeButtonOpen.nextAction?.id).toBe("a-btn-open");
    expect(
      beforeButtonOpen.seats.find((seat) => seat.position === "CO")?.isFolded,
    ).toBe(true);

    expect(beforeHeroDecision.nextAction?.id).toBe("a-hero-call");
    expect(beforeHeroDecision.potChips).toBe(9000);
    expect(
      beforeHeroDecision.seats.find((seat) => seat.position === "BTN")?.stackBB,
    ).toBe(34.9);

    expect(beforeBigBlindDecision.nextAction?.id).toBe("a-bb-fold");
    expect(beforeBigBlindDecision.potChips).toBe(12500);
    expect(beforeBigBlindDecision.seats.find((seat) => seat.isHero)?.stackBB).toBe(29);

    expect(beforeFlopAction.nextAction?.id).toBe("a-hero-check-flop");
    expect(beforeFlopAction.currentStreet).toBe("FLOP");
    expect(beforeFlopAction.board).toHaveLength(3);

    expect(beforeTurnButtonAction.nextAction?.id).toBe("a-btn-check-turn");
    expect(beforeTurnButtonAction.currentStreet).toBe("TURN");
    expect(beforeTurnButtonAction.board).toHaveLength(4);
  });
});
