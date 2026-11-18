import { describe, expect, it } from "vitest";
import { layoutPlayers, positionSets, seatLayouts } from "./seatLayout";
import { hands } from "../../data/mockTournament";
import { buildMultiSeatPreviewHand } from "../../data/previewHands";
import { parseGgTournament } from "../../parsers/gg";
import { readFixture } from "../../parsers/gg/fixtureTestUtils";

describe("Warm Dark clockwise seat geometry", () => {
  it.each([0, 1, 2, 3])(
    "preserves unique coordinates and Hero anchor for every real occupancy in fixture %i",
    (index) => {
      const parsed = parseGgTournament(readFixture(index));
      if (!parsed.ok) throw new Error("Fixture failed");
      const occupancies = new Set<number>();
      for (const source of parsed.tournament.hands) {
        const seats = layoutPlayers([...source.players].reverse(), source.tableSize);
        occupancies.add(seats.length);
        expect(seats).toHaveLength(source.occupiedSeatCount);
        expect(seats.find((p) => p.seat.isHero)?.anchor).toMatchObject({
          x: 50,
          y: 89,
          mx: 50,
          my: 91,
        });
        const coordinates = seats.map(
          (p) => `${p.anchor.x}:${p.anchor.y}:${p.anchor.mx}:${p.anchor.my}`,
        );
        expect(new Set(coordinates).size).toBe(seats.length);
        expect(
          layoutPlayers(source.players, source.tableSize)
            .map((p) => [p.seat.id, p.anchor])
            .sort(),
        ).toEqual(seats.map((p) => [p.seat.id, p.anchor]).sort());
      }
      if (index === 0)
        expect([...occupancies]).toEqual(expect.arrayContaining([5, 7, 8]));
    },
  );
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
          y: 89,
          mx: 50,
          my: 91,
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
  it("keeps bet anchors inward and distinct in each desktop and compact profile", () => {
    for (const count of [6, 8, 9]) {
      const slots = seatLayouts[count]!;
      for (const [x, y, bx, by] of [
        ["x", "y", "betX", "betY"],
        ["mx", "my", "mbetX", "mbetY"],
      ] as const) {
        expect(new Set(slots.map((s) => `${s[bx]}:${s[by]}`)).size).toBe(count);
        for (const seat of slots) {
          const distance = (px: number, py: number) => Math.hypot(px - 50, py - 50);
          expect(distance(seat[bx], seat[by])).toBeLessThan(distance(seat[x], seat[y]));
        }
      }
    }
  });
});
