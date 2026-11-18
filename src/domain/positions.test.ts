// @vitest-environment node
import { describe, expect, it } from "vitest";
import { assignPositions } from "./positions";

describe("button-derived occupied-seat positions", () => {
  it.each([
    [6, ["UTG", "HJ", "CO", "BTN", "SB", "BB"]],
    [8, ["UTG", "UTG_PLUS_1", "LJ", "HJ", "CO", "BTN", "SB", "BB"]],
    [9, ["UTG", "UTG_PLUS_1", "UTG_PLUS_2", "LJ", "HJ", "CO", "BTN", "SB", "BB"]],
  ] as const)("assigns exact %i-max positions around the button", (size, expected) => {
    const seats = Array.from({ length: size }, (_, i) => i + 1);
    expect(Object.values(assignPositions(seats, size - 2, size))).toEqual(expected);
  });
  it("skips physical seat gaps and ignores source player ordering", () => {
    expect(assignPositions([8, 2, 7, 1, 6], 2, 8)).toEqual({
      1: "CO",
      2: "BTN",
      6: "SB",
      7: "BB",
      8: "HJ",
    });
    expect(assignPositions([8, 6, 5, 7], 6, 8)).toEqual({
      5: "CO",
      6: "BTN",
      7: "SB",
      8: "BB",
    });
  });
  it("wraps blinds from the last occupied seat to the first", () => {
    expect(assignPositions([1, 2, 3, 4, 6, 7, 8], 8, 8)).toEqual({
      1: "SB",
      2: "BB",
      3: "UTG",
      4: "LJ",
      6: "HJ",
      7: "CO",
      8: "BTN",
    });
  });
  it.each([
    [[1, 2, 2, 4], 4, 6],
    [[1, 2, 3, 7], 3, 6],
    [[1, 2, 3, 4], 5, 6],
    [[0, 1, 2, 3], 3, 6],
    [[1, 2, 3, 4], 0, 6],
    [[1, 2, 3.5, 4], 4, 6],
  ] as const)("rejects inconsistent seating case %#", (seats, button, size) => {
    expect(() => assignPositions(seats, button, size)).toThrow(
      expect.objectContaining({ type: "inconsistent_seats" }),
    );
  });
  it.each([
    ["beginning", 0],
    ["middle", 2],
    ["end", 5],
  ] as const)("rejects a sparse seat array with a hole at the %s", (_, index) => {
    const seats = [1, 2, 3, 4, 5, 6];
    delete seats[index];

    expect(() => assignPositions(seats, 4, 6)).toThrow(
      expect.objectContaining({ type: "inconsistent_seats" }),
    );
  });
  it("rejects an explicitly undefined seat", () => {
    const seats = [1, 2, undefined, 4, 5, 6] as unknown as number[];

    expect(() => assignPositions(seats, 4, 6)).toThrow(
      expect.objectContaining({ type: "inconsistent_seats" }),
    );
  });
  it("does not silently guess unimplemented short-table policy", () => {
    expect(() => assignPositions([1, 2], 1, 6)).toThrow(
      expect.objectContaining({ type: "unsupported_format" }),
    );
  });
});
