import type { ImportedHand } from "../domain/handHistory";

export type OpponentAliases = Readonly<Record<string, string>>;

const names = [
  "Alex",
  "Ben",
  "Chris",
  "Daniel",
  "Ethan",
  "Felix",
  "George",
  "Henry",
  "Ivan",
  "Jack",
  "Kevin",
  "Leo",
  "Max",
  "Nick",
  "Oscar",
  "Paul",
] as const;

/** Stable within the observed tournament roster; partial exports may have different rosters. */
export function buildOpponentAliases(
  hands: readonly Pick<ImportedHand, "players">[],
): OpponentAliases {
  const ids = [
    ...new Set(
      hands.flatMap((hand) => hand.players.filter((p) => !p.isHero).map((p) => p.id)),
    ),
  ].sort();
  return Object.fromEntries(
    ids.map((id, index) => [
      id,
      `${names[index % names.length]}${index >= names.length ? ` ${Math.floor(index / names.length) + 1}` : ""}`,
    ]),
  );
}
