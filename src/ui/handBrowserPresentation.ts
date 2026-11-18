import type { ImportedHand } from "../domain/handHistory";
import type { Card } from "../domain/schemas";
import { positionLabel } from "./components/seatLayout";

export interface HandBrowserRow {
  handId: string;
  handNumber: number;
  cards: readonly Card[];
  position: string;
  spot: string;
  street: string;
  streetCode: "PREFLOP" | "FLOP" | "TURN" | "RIVER";
  effectiveStack: string;
  finalPot: string;
  grade: string;
  status: string;
}

export interface HandBrowserFilters {
  query: string;
  position: string;
  street: string;
}

const streetLabels = {
  PREFLOP: "Preflop",
  FLOP: "Flop",
  TURN: "Turn",
  RIVER: "River",
} as const;

const heroActionLabels = {
  FOLD: "folded",
  CHECK: "checked",
  CALL: "called",
  BET: "bet",
  RAISE: "raised",
} as const;

export function presentHandBrowserRow(hand: ImportedHand): HandBrowserRow {
  const hero = hand.players.find((player) => player.isHero);
  if (!hero) throw new Error(`Hand ${hand.id} has no Hero`);
  const position = positionLabel(hero.position);
  const streetCode = hand.streets.at(-1)?.street ?? "PREFLOP";
  const firstAction = hand.events.find(
    (event) => event.actorPlayerId === hero.id && event.type in heroActionLabels,
  );
  const action = firstAction?.type as keyof typeof heroActionLabels | undefined;
  const actionStreet =
    firstAction?.street === "SHOWDOWN"
      ? "showdown"
      : streetLabels[firstAction?.street ?? "PREFLOP"].toLowerCase();
  const spot = action
    ? `${position} · ${heroActionLabels[action]} ${actionStreet}`
    : `${position} · ${streetLabels[streetCode].toLowerCase()}`;
  return {
    handId: hand.id,
    handNumber: hand.handNumber,
    cards: hand.heroHoleCards,
    position,
    spot,
    street: streetLabels[streetCode],
    streetCode,
    effectiveStack: "—",
    finalPot: hand.summary.totalPotChips.toLocaleString("en-US"),
    grade: "Not analysed",
    status: "—",
  };
}

export function filterHandBrowserRows(
  rows: readonly HandBrowserRow[],
  filters: HandBrowserFilters,
): HandBrowserRow[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.position !== "any" && row.position !== filters.position) return false;
    if (filters.street !== "any" && row.streetCode !== filters.street) return false;
    if (!query) return true;
    const cards = row.cards.map((card) => (card.rank === "T" ? "10" : card.rank));
    const cardSearch = [cards.join(""), [...cards].reverse().join("")];
    return [
      String(row.handNumber),
      row.position,
      row.spot,
      ...cardSearch,
      ...row.cards.map((card) => `${card.rank}${card.suit}`),
    ].some((value) => value.toLowerCase().includes(query));
  });
}
