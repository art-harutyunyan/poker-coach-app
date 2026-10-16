import type { Player } from "../../domain/schemas";

export type SeatArchetype =
  | "top-center"
  | "upper-left"
  | "upper-right"
  | "left-side"
  | "right-side"
  | "lower-left"
  | "lower-right"
  | "hero";
type Facing = "up" | "down" | "left" | "right";

export interface SeatAnchor {
  x: number;
  y: number;
  mx: number;
  my: number;
  archetype: SeatArchetype;
}

export const positionSets: Record<number, readonly Player["position"][]> = {
  6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "LJ", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG_PLUS_1", "LJ", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG_PLUS_1", "UTG_PLUS_2", "LJ", "HJ", "CO"],
};

function slot(x: number, y: number, facing: Facing, mx = x, my = y): SeatAnchor {
  const archetype: SeatArchetype =
    facing === "down"
      ? x === 50
        ? "top-center"
        : x < 50
          ? "upper-left"
          : "upper-right"
      : facing === "right"
        ? "left-side"
        : facing === "left"
          ? "right-side"
          : x === 50
            ? "hero"
            : x < 50
              ? "lower-left"
              : "lower-right";
  return { x, y, mx, my, archetype };
}

const hero = slot(50, 85, "up");
// Approved prototype coordinates locate plates only. Cards/actions never get table coordinates.
export const seatLayouts: Record<number, readonly SeatAnchor[]> = {
  6: [
    hero,
    slot(15, 78, "up", 14, 79),
    slot(24, 22, "down", 24, 23),
    slot(50, 13, "down", 50, 14),
    slot(76, 22, "down", 76, 23),
    slot(85, 78, "up", 86, 79),
  ],
  7: [
    hero,
    slot(15, 78, "up", 14, 79),
    slot(8, 46, "right", 11, 47),
    slot(30, 17, "down", 30, 16),
    slot(70, 17, "down", 70, 16),
    slot(92, 46, "left", 89, 47),
    slot(85, 78, "up", 86, 79),
  ],
  8: [
    hero,
    slot(15, 78, "up", 14, 79),
    slot(8, 46, "right", 11, 47),
    slot(23, 19, "down", 24, 16),
    slot(50, 13, "down", 50, 14),
    slot(77, 19, "down", 76, 16),
    slot(92, 46, "left", 89, 47),
    slot(85, 78, "up", 86, 79),
  ],
  9: [
    hero,
    slot(15, 79, "up", 14, 79),
    slot(8, 49, "right", 11, 47),
    slot(18, 24, "down", 17, 16),
    slot(39, 13, "down", 39, 14),
    slot(61, 13, "down", 61, 14),
    slot(82, 24, "down", 83, 16),
    slot(92, 49, "left", 89, 47),
    slot(85, 79, "up", 86, 79),
  ],
};

export function heroRelativeCoords(
  tableSize: number,
  relativeIndex: number,
): SeatAnchor {
  const anchor = seatLayouts[tableSize]?.[relativeIndex];
  if (!anchor)
    throw new Error(`Unsupported seat layout: ${tableSize}/${relativeIndex}`);
  return anchor;
}

export function layoutPlayers<T extends Player>(
  players: readonly T[],
  tableSize: number,
) {
  const positions = positionSets[tableSize];
  const heroPlayer = players.find((player) => player.isHero);
  if (
    !positions ||
    !heroPlayer ||
    players.length !== tableSize ||
    new Set(players.map((player) => player.position)).size !== tableSize ||
    players.some((player) => !positions.includes(player.position))
  ) {
    throw new Error("Seat layout requires one player per supported clockwise position");
  }
  const heroIndex = positions.indexOf(heroPlayer.position);
  return players.map((player) => {
    const relativeIndex =
      (positions.indexOf(player.position) - heroIndex + tableSize) % tableSize;
    return { seat: player, anchor: heroRelativeCoords(tableSize, relativeIndex) };
  });
}

export function positionLabel(position: Player["position"]): string {
  return position.replace("_PLUS_", "+");
}
