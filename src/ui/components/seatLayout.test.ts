import { describe, expect, it } from "vitest";
import { layoutPlayers, positionSets, seatLayouts } from "./seatLayout";
import { hands } from "../../data/mockTournament";
import { buildMultiSeatPreviewHand } from "../../data/previewHands";

describe("approved clockwise seat geometry", () => {
  for (const count of [6, 8, 9] as const) {
    const hand = count === 6 ? hands[0]! : buildMultiSeatPreviewHand(hands[0]!, count);
    it(`${count}-max preserves clockwise poker order for every Hero position`, () => {
      const positions = positionSets[count]!;
      for (const hero of positions) {
        const result = layoutPlayers(
          hand.players.map((player) => ({
            ...player,
            isHero: player.position === hero,
          })),
          count,
        );
        const slots = seatLayouts[count]!;
        expect(result.find((item) => item.seat.isHero)?.anchor).toMatchObject({
          x: 50,
          y: 85,
          mx: 50,
          my: 85,
        });
        expect(
          slots.map(
            (slot) => result.find((item) => item.anchor === slot)?.seat.position,
          ),
        ).toEqual(
          positions.map(
            (_, index) => positions[(positions.indexOf(hero) + index) % count],
          ),
        );
        expect(
          new Set(result.map((item) => `${item.anchor.x}:${item.anchor.y}`)).size,
        ).toBe(count);
        expect(
          new Set(result.map((item) => `${item.anchor.mx}:${item.anchor.my}`)).size,
        ).toBe(count);
      }
    });
  }
  it("rejects unsupported/duplicate positions rather than silently stacking seats", () => {
    const players = hands[0]!.players.map((player) => ({
      ...player,
      position: "SB" as const,
    }));
    expect(() => layoutPlayers(players, 6)).toThrow();
  });
});
