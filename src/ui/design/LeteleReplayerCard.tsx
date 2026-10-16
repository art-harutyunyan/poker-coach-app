import * as Deck from "@letele/playing-cards";
import type { Card } from "../../domain/schemas";

const suitKeys = { s: "S", h: "H", d: "D", c: "C" } as const;

export function LeteleReplayerCard({ card }: { card?: Card }) {
  // Package names use suit first, lowercase courts, and 10 rather than T.
  // An unmapped face must never silently become a card back.
  const key = card
    ? (`${suitKeys[card.suit]}${card.rank === "T" ? "10" : card.rank.toLowerCase()}` as keyof typeof Deck)
    : "B1";
  const CardComponent = Deck[key];
  if (!CardComponent) throw new Error(`Missing Letele card asset: ${key}`);
  return <CardComponent aria-label={card ? `${card.rank}${card.suit}` : "Card back"} />;
}
