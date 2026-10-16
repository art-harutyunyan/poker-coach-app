import { expect, it } from "vitest";
import { formatBB } from "./format";

it("keeps fractional large bets consistent with seat commitments", () => {
  expect(formatBB(39000, 2000)).toBe("19.5 BB");
  expect(formatBB(4500, 2000)).toBe("2.3 BB");
  expect(formatBB(2000, 2000)).toBe("1 BB");
});
