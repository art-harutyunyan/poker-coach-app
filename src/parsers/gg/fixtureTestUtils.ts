import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const fixtureNames = [
  "GG20260928-1307 - Daily Monster Stack 2.50.txt",
  "GG20260928-1905 - Fifty Stack 5.50.txt",
  "GG20261011-1700 - GGMasters 150, 1M GTD [2-Day Event].txt",
  "GG20260905-2102 - Daily Classic 10.txt",
] as const;

export function readFixture(index: number): string {
  const name = fixtureNames[index];
  if (!name) throw new Error(`Unknown test fixture ${index}`);
  return readFileSync(resolve(process.cwd(), "tests/fixtures/gg", name), "utf8");
}

export function fixtureHand(index: number, id: string): string {
  const hand = readFixture(index)
    .split(/(?=^Poker Hand #)/m)
    .find((text) => text.startsWith(`Poker Hand #${id}:`));
  if (!hand) throw new Error(`Missing test hand ${id}`);
  return hand.trimEnd();
}
