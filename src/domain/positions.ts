import { HandHistoryValidationError, type Position } from "./handHistory";

const POSITIONS: Record<number, readonly Position[]> = {
  4: ["CO", "BTN", "SB", "BB"],
  5: ["HJ", "CO", "BTN", "SB", "BB"],
  6: ["UTG", "HJ", "CO", "BTN", "SB", "BB"],
  7: ["UTG", "LJ", "HJ", "CO", "BTN", "SB", "BB"],
  8: ["UTG", "UTG_PLUS_1", "LJ", "HJ", "CO", "BTN", "SB", "BB"],
  9: ["UTG", "UTG_PLUS_1", "UTG_PLUS_2", "LJ", "HJ", "CO", "BTN", "SB", "BB"],
};

export function assignPositions(
  seats: readonly number[],
  buttonSeat: number,
  tableSize: number,
): Record<number, Position> {
  if (
    !Number.isInteger(tableSize) ||
    tableSize < 2 ||
    tableSize > 9 ||
    [...seats].some((s) => !Number.isInteger(s) || s < 1 || s > tableSize) ||
    new Set(seats).size !== seats.length ||
    !seats.includes(buttonSeat)
  ) {
    throw new HandHistoryValidationError(
      "inconsistent_seats",
      "Seats/capacity/button are inconsistent",
    );
  }
  const positions = POSITIONS[seats.length];
  // TODO: Add real short-table fixtures and a deliberate heads-up/three-handed policy.
  if (!positions)
    throw new HandHistoryValidationError(
      "unsupported_format",
      "Only 4–9 occupied players currently have a supported position policy",
    );
  const ordered = [...seats].sort((a, b) => a - b);
  const buttonIndex = ordered.indexOf(buttonSeat);
  const firstAfterBigBlind = (buttonIndex + 3) % ordered.length;
  return Object.fromEntries(
    positions.map((position, i) => [
      ordered[(firstAfterBigBlind + i) % ordered.length]!,
      position,
    ]),
  );
}
