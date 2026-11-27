import type { Card } from "../../domain/schemas";

const suitNames: Record<Card["suit"], string> = {
  s: "spades",
  h: "hearts",
  d: "diamonds",
  c: "clubs",
};

const rankNames: Record<Card["rank"], string> = {
  A: "Ace",
  K: "King",
  Q: "Queen",
  J: "Jack",
  T: "Ten",
  "9": "Nine",
  "8": "Eight",
  "7": "Seven",
  "6": "Six",
  "5": "Five",
  "4": "Four",
  "3": "Three",
  "2": "Two",
};

export function cardAccessibilityLabel(card: Card): string {
  return `${rankNames[card.rank]} of ${suitNames[card.suit]}`;
}
