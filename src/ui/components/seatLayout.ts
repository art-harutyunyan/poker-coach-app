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
  actionX: number;
  actionY: number;
  mactionX: number;
  mactionY: number;
}

export const positionSets: Record<number, readonly Player["position"][]> = {
  6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "LJ", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG_PLUS_1", "LJ", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG_PLUS_1", "UTG_PLUS_2", "LJ", "HJ", "CO"],
};

// The Hero-relative clockwise index follows the same ellipse at every table
// size. Compact lower neighbors move upward so their plates clear Hero.
function slot(tableSize: number, index: number): SeatAnchor {
  const angle = Math.PI / 2 + (index * 2 * Math.PI) / tableSize;
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const desktopX = 50 + 41 * Math.cos(angle);
  const x = round(
    tableSize === 9 && index === 1
      ? desktopX + 2
      : tableSize === 9 && index === tableSize - 1
        ? desktopX - 2
        : desktopX,
  );
  const desktopY = 54 + 34 * Math.sin(angle);
  const y = round(
    tableSize === 9 && (index === 1 || index === tableSize - 1)
      ? desktopY + 4
      : tableSize === 9 && (index === 2 || index === tableSize - 2)
        ? desktopY + 2
        : desktopY,
  );
  const mobileX = 50 + 35 * Math.cos(angle);
  const mx = round(
    tableSize === 9 && index === 2
      ? 13
      : tableSize === 9 && index === 7
        ? 87
        : tableSize === 9 && index === 4
          ? 37
          : tableSize === 9 && index === 5
            ? 63
            : index === 1
              ? Math.min(mobileX, 22)
              : index === tableSize - 1
                ? Math.max(mobileX, 78)
                : mobileX,
  );
  const mobileEllipseY = 55 + 36 * Math.sin(angle);
  const my = round(
    index === 1 || index === tableSize - 1
      ? tableSize === 9
        ? 80
        : Math.min(mobileEllipseY, 73)
      : tableSize === 9 && (index === 4 || index === 5)
        ? 10
        : tableSize === 9 && (index === 3 || index === 6)
          ? 30
          : tableSize === 6 && (index === 2 || index === 4)
            ? 29
            : mobileEllipseY,
  );
  const inward = (coordinate: number, center: number) =>
    round(center + (coordinate - center) * 0.58);
  const betX =
    index === 0
      ? tableSize === 9
        ? 27
        : 37
      : index === 1
        ? tableSize === 9
          ? 36
          : 32
        : index === tableSize - 1
          ? tableSize <= 7
            ? 66
            : 63
          : inward(x, 50);
  const betY = index === 0 ? (tableSize === 9 ? 61.5 : 76) : inward(y, 54);
  const mbetX = index === 1 ? 25 : index === tableSize - 1 ? 75 : inward(mx, 50);
  const mbetY =
    index === 0 ? 37 : index === 1 || index === tableSize - 1 ? 39 : inward(my, 55);
  const actionX =
    index === 0
      ? tableSize === 9
        ? 27
        : 36
      : tableSize === 9 && index === 1
        ? 36
        : index === tableSize - 1
          ? 65
          : round(50 + (x - 50) * 0.32);
  const actionY =
    index === 0 || index === tableSize - 1
      ? 50
      : tableSize === 9 && index === 1
        ? 60
        : round(54 + (y - 54) * 0.4);
  const mactionX = index === tableSize - 1 ? 50 : round(50 + (mx - 50) * 0.4);
  const mactionY =
    index === tableSize - 1
      ? 65
      : tableSize === 8 && index === 6
        ? 64
        : round(55 + (my - 55) * 0.4);
  const archetype: SeatArchetype =
    index === 0
      ? "hero"
      : y < 35
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
  return {
    x,
    y,
    mx,
    my,
    betX,
    betY,
    mbetX,
    mbetY,
    actionX,
    actionY,
    mactionX,
    mactionY,
    archetype,
  };
}

function ellipseSlots(tableSize: number): readonly SeatAnchor[] {
  return Array.from({ length: tableSize }, (_, index) => slot(tableSize, index));
}

export const seatLayouts: Record<number, readonly SeatAnchor[]> = {
  6: ellipseSlots(6),
  7: ellipseSlots(7),
  8: ellipseSlots(8),
  9: ellipseSlots(9),
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
