import type { Player } from "../domain/schemas";
import type { OpponentAliases } from "./opponentAliases";

export function playerDisplayName(
  player: Pick<Player, "id" | "isHero" | "name">,
  imported: boolean,
  aliases?: OpponentAliases,
): string {
  return imported
    ? player.isHero
      ? "Hero"
      : (aliases?.[player.id] ?? `Opponent ${player.name}`)
    : player.name;
}

export function formatChips(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return value.toLocaleString("en-US");
}

export function formatBB(chips: number, bigBlindChips: number): string {
  const bb = chips / bigBlindChips;

  return `${bb.toFixed(Number.isInteger(bb) ? 0 : 1)} BB`;
}
