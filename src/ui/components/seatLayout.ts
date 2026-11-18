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

export interface SeatAnchor {
  x: number;
  y: number;
  mx: number;
  my: number;
  archetype: SeatArchetype;
  betX: number;
  betY: number;
  mbetX: number;
  mbetY: number;
}

export const positionSets: Record<number, readonly Player["position"][]> = {
  6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "LJ", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG_PLUS_1", "LJ", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG_PLUS_1", "UTG_PLUS_2", "LJ", "HJ", "CO"],
};

// Each profile describes a plate center and an independent inward bet center.
// Compact profiles stagger the rail seats vertically instead of shrinking poker data.
type SeatPoint = readonly [x: number, y: number, betX: number, betY: number];
function slot(desktop: SeatPoint, compact: SeatPoint = desktop): SeatAnchor {
  const [x, y, betX, betY] = desktop;
  const [mx, my, mbetX, mbetY] = compact;
  const archetype: SeatArchetype =
    y < 35
      ? x === 50
        ? "top-center"
        : x < 50
          ? "upper-left"
          : "upper-right"
      : y < 65
        ? x < 50
          ? "left-side"
          : "right-side"
        : x === 50
          ? "hero"
          : x < 50
            ? "lower-left"
            : "lower-right";
  return { x, y, mx, my, betX, betY, mbetX, mbetY, archetype };
}

const hero = slot([50, 89, 50, 67], [50, 91, 50, 66]);
export const seatLayouts: Record<number, readonly SeatAnchor[]> = {
  6: [
    hero,
    slot([13, 70, 28, 60], [14, 76, 31, 65]),
    slot([22, 25, 28, 38], [15, 30, 35, 37]),
    slot([50, 15, 50, 28], [50, 15, 50, 28]),
    slot([78, 25, 72, 38], [85, 30, 65, 37]),
    slot([87, 70, 72, 60], [86, 76, 69, 65]),
  ],
  7: [
    hero,
    slot([17, 81, 28, 69], [14, 81, 27, 70]),
    slot([10, 49, 24, 50], [13, 55, 26, 65]),
    slot([32, 17, 35, 30], [31, 16, 34, 29]),
    slot([68, 17, 65, 30], [69, 16, 66, 29]),
    slot([90, 49, 76, 50], [87, 55, 74, 65]),
    slot([83, 81, 72, 69], [86, 81, 73, 70]),
  ],
  8: [
    hero,
    slot([17, 81, 28, 69], [14, 82, 33, 71]),
    slot([10, 51, 24, 53], [13, 58, 26, 68]),
    slot([23, 23, 29, 36], [15, 31, 35, 37]),
    slot([50, 15, 50, 28], [50, 14, 50, 27]),
    slot([77, 23, 71, 36], [85, 31, 65, 37]),
    slot([90, 51, 76, 53], [87, 58, 74, 68]),
    slot([83, 81, 72, 69], [86, 82, 67, 71]),
  ],
  9: [
    hero,
    slot([17, 81, 28, 69], [14, 82, 33, 71]),
    slot([10, 56, 24, 55], [13, 59, 26, 68]),
    slot([18, 31, 27, 43], [13, 35, 35, 37]),
    slot([39, 15, 39, 28], [36, 15, 36, 27]),
    slot([61, 15, 61, 28], [64, 15, 64, 27]),
    slot([82, 31, 73, 43], [87, 35, 65, 37]),
    slot([90, 56, 76, 55], [87, 59, 74, 68]),
    slot([83, 81, 72, 69], [86, 82, 67, 71]),
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
    players.length < 2 ||
    players.length > tableSize ||
    players.filter((player) => player.isHero).length !== 1 ||
    new Set(players.map((player) => player.position)).size !== players.length ||
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
