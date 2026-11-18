// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeGgHand } from "./normalize";
import { parseRawGgHand } from "./rawHand";
import { splitGgHands } from "./split";
import { fixtureHand } from "./fixtureTestUtils";
const normalize = (index: number, id: string) =>
  normalizeGgHand(parseRawGgHand(splitGgHands(fixtureHand(index, id))[0]!));

describe("GG hand normalization goldens", () => {
  it("normalizes the Daily bust hand without confusing raise-by/to/contribution", () => {
    const hand = normalize(0, "TM6469820465");
    const hero = hand.players.find((p) => p.isHero)!;
    expect(hero).toMatchObject({
      seatNumber: 8,
      position: "UTG",
      startingStackChips: 318050,
    });
    expect(hand).toMatchObject({
      buttonSeat: 5,
      tableSize: 8,
      occupiedSeatCount: 8,
      blindLevel: { smallBlindChips: 8000, bigBlindChips: 16000, anteChips: 2000 },
    });
    expect(hand.heroHoleCards).toEqual([
      { rank: "7", suit: "c" },
      { rank: "7", suit: "h" },
    ]);
    expect(
      hand.events.filter((e) => e.actorPlayerId === hero.id && e.type === "RAISE"),
    ).toMatchObject([
      { amountChips: 32000, raiseByChips: 16000, raiseToChips: 32000, isAllIn: false },
      {
        amountChips: 284050,
        raiseByChips: 232050,
        raiseToChips: 316050,
        isAllIn: true,
      },
    ]);
    expect(hand.streets.map((s) => s.board.map((c) => c.rank + c.suit))).toEqual([
      [],
      ["Ad", "6d", "6h"],
      ["Ad", "6d", "6h", "3s"],
      ["Ad", "6d", "6h", "3s", "5h"],
    ]);
    expect(hand.summary.totalPotChips).toBe(672100);
    expect(hand.results.find((r) => r.playerId === hero.id)).toMatchObject({
      finalStackChips: 0,
      netChips: -318050,
    });
    const winner = hand.players.find((p) => p.name === "54df8316")!;
    expect(hand.results.find((r) => r.playerId === winner.id)?.finalStackChips).toBe(
      757980,
    );
  });
  it("keeps a folded one-card reveal and Hero's return as distinct facts", () => {
    const hand = normalize(0, "TM6469819712");
    const player = hand.players.find((p) => p.name === "54df8316")!;
    expect(
      hand.events.find((e) => e.type === "SHOW" && e.actorPlayerId === player.id),
    ).toMatchObject({ street: "RIVER", cards: [{ rank: "T", suit: "s" }] });
    expect(hand.events.find((e) => e.type === "RETURN_UNCALLED")).toMatchObject({
      actorPlayerId: hand.heroPlayerId,
      amountChips: 171130,
    });
  });
  it("preserves separate unlabeled awards and short all-in contributions", () => {
    const hand = normalize(0, "TM6468777751");
    expect(
      hand.events.filter((e) => e.type === "COLLECT_POT").map((e) => e.amountChips),
    ).toEqual([16356, 2296]);
    expect(hand.events.find((e) => e.type === "CALL" && e.isAllIn)).toMatchObject({
      amountChips: 3852,
    });
    expect(hand.events.find((e) => e.type === "RETURN_UNCALLED")).toMatchObject({
      amountChips: 8000,
      street: "FLOP",
    });
    expect(hand.results.find((r) => r.playerId === hand.heroPlayerId)).toMatchObject({
      finalStackChips: 103662,
      returnedChips: 8000,
      collectedChips: 18652,
    });
  });
  it("normalizes Fifty's all-in call, returned reraise and final stacks", () => {
    const hand = normalize(1, "TM6471062694");
    expect(hand.players.find((p) => p.isHero)).toMatchObject({
      position: "BB",
      seatNumber: 4,
    });
    expect(hand.heroHoleCards).toEqual([
      { rank: "Q", suit: "c" },
      { rank: "A", suit: "h" },
    ]);
    expect(
      hand.events.find(
        (e) => e.actorPlayerId === hand.heroPlayerId && e.type === "CALL",
      ),
    ).toMatchObject({ amountChips: 160225, isAllIn: true });
    expect(hand.events.find((e) => e.type === "RETURN_UNCALLED")).toMatchObject({
      amountChips: 129067,
    });
    const opponent = hand.players.find((p) => p.name === "f6d234a1")!;
    expect(hand.results.find((r) => r.playerId === opponent.id)).toMatchObject({
      finalStackChips: 549517,
      collectedChips: 420450,
    });
    expect(
      hand.results.find((r) => r.playerId === hand.heroPlayerId)?.finalStackChips,
    ).toBe(0);
  });
  it("distinguishes table capacity, occupied count and a blind player's raise contribution", () => {
    const hand = normalize(1, "TM6470172527");
    expect(hand).toMatchObject({ tableSize: 8, occupiedSeatCount: 7, buttonSeat: 1 });
    expect(hand.players.find((p) => p.isHero)).toMatchObject({
      position: "SB",
      seatNumber: 2,
    });
    expect(hand.events.find((e) => e.type === "RAISE")).toMatchObject({
      amountChips: 340,
      raiseByChips: 240,
      raiseToChips: 440,
    });
    expect(hand.summary.totalPotChips).toBe(575);
    expect(hand.streets).toEqual([{ street: "PREFLOP", board: [] }]);
  });
  it("preserves summary-only cards with no invented reveal timing", () => {
    const hand = normalize(1, "TM6470156513");
    expect(hand.events.some((e) => e.type === "SHOW")).toBe(false);
    expect(hand.summary.players.find((p) => p.outcome === "COLLECTED")).toMatchObject({
      collectedChips: 12600,
      cards: [
        { rank: "Q", suit: "h" },
        { rank: "A", suit: "c" },
      ],
      source: { rawLine: expect.stringContaining("showed [Qh Ac] and collected") },
    });
  });
  it("accounts for a prior big blind in GGMasters' reraise and turn all-in", () => {
    const hand = normalize(2, "TM6524471450");
    expect(
      hand.events.find(
        (e) => e.type === "RAISE" && e.actorPlayerId === hand.heroPlayerId,
      ),
    ).toMatchObject({ amountChips: 586, raiseByChips: 495, raiseToChips: 656 });
    expect(hand.events.find((e) => e.type === "CALL" && e.isAllIn)).toMatchObject({
      street: "TURN",
      amountChips: 5874,
    });
    expect(hand.events.find((e) => e.type === "RETURN_UNCALLED")).toMatchObject({
      street: "TURN",
      amountChips: 417,
    });
    expect(hand.summary.totalPotChips).toBe(20203);
  });
  it("retains the observed odd chip in a split pot", () => {
    const hand = normalize(2, "TM6524470976");
    expect(
      hand.events.filter((e) => e.type === "COLLECT_POT").map((e) => e.amountChips),
    ).toEqual([628, 629]);
    expect(hand.summary.totalPotChips).toBe(1257);
    expect(hand.results.find((r) => r.playerId === hand.heroPlayerId)).toMatchObject({
      finalStackChips: 9756,
      netChips: 76,
    });
  });
  it("preserves GG's short forced blind and explicit zero-stack fold with warnings", () => {
    const hand = normalize(1, "TM6471061841");
    const player = hand.players.find((p) => p.name === "e66bbe34")!;
    expect(hand.events.find((e) => e.type === "SMALL_BLIND")).toMatchObject({
      actorPlayerId: player.id,
      amountChips: 4243,
      isAllIn: false,
    });
    expect(
      hand.events.find((e) => e.type === "FOLD" && e.actorPlayerId === player.id),
    ).toBeDefined();
    expect(hand.results.find((r) => r.playerId === player.id)?.finalStackChips).toBe(0);
    expect(hand.summary.totalPotChips).toBe(34243);
    expect(hand.warnings.map((w) => w.code)).toEqual([
      "SHORT_BLIND_POST",
      "ZERO_STACK_FOLD",
    ]);
  });
});
