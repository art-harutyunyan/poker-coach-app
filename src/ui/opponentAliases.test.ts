import { expect, it } from "vitest";
import { parseGgTournament } from "../parsers/gg";
import { readFixture } from "../parsers/gg/fixtureTestUtils";
import { buildOpponentAliases } from "./opponentAliases";
import { playerDisplayName } from "./format";

function tournament(index: number) {
  const parsed = parseGgTournament(readFixture(index));
  if (!parsed.ok) throw new Error("Invalid fixture");
  return parsed.tournament;
}
it("assigns unique sorted aliases across numbered cycles and excludes Hero", () => {
  const player = tournament(0).hands[0]!.players[0]!;
  const hands = Array.from({ length: 65 }, (_, i) => ({
    players: [{ ...player, id: `p${String(i).padStart(2, "0")}`, isHero: false }],
  }));
  hands.push({ players: [{ ...player, id: "hero", isHero: true }] });
  const before = structuredClone(hands);
  const aliases = buildOpponentAliases([...hands].reverse());
  expect(aliases.p00).toBe("Alex");
  expect(aliases.p15).toBe("Paul");
  expect(aliases.p16).toBe("Alex 2");
  expect(aliases.p64).toBe("Alex 5");
  expect(aliases.hero).toBeUndefined();
  expect(new Set(Object.values(aliases)).size).toBe(65);
  expect(buildOpponentAliases([...hands, ...hands])).toEqual(aliases);
  expect(hands).toEqual(before);
  expect(
    playerDisplayName({ ...player, id: "p00", isHero: false }, true, aliases),
  ).toBe("Alex");
  expect(playerDisplayName({ ...player, isHero: true }, true, aliases)).toBe("Hero");
  expect(playerDisplayName(player, false, aliases)).toBe(player.name);
});
it.each([0, 1, 2, 3])(
  "keeps fixture %i aliases deterministic across roster order and interleaving",
  (index) => {
    const source = tournament(index);
    const before = structuredClone(source);
    const first = buildOpponentAliases(source.hands);
    buildOpponentAliases(tournament((index + 1) % 4).hands);
    expect(
      buildOpponentAliases(
        [...source.hands].reverse().map((h) => ({ players: [...h.players].reverse() })),
      ),
    ).toEqual(first);
    expect(new Set(Object.values(first)).size).toBe(Object.keys(first).length);
    expect(source).toEqual(before);
  },
);
