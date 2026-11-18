import { cardSchema, type Card } from "../../domain/schemas";
import { GgParseError } from "./diagnostics";
import type { SourceLine } from "./split";

const INTEGER = /^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/;
const BUY_IN = /^\$(\d+)(?:\.(\d{1,2}))?(?=$|\s|,\s)/;
const TIMESTAMP = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
const CARDS = /^\[([2-9TJQKA][shdc](?: [2-9TJQKA][shdc])*)\]$/;

export function parseChips(value: string, source: SourceLine): number {
  const chips = Number(value.replace(/,/g, ""));
  if (!INTEGER.test(value) || !Number.isSafeInteger(chips)) {
    throw new GgParseError(
      "invalid_action",
      `Invalid or unsafe integer chips: ${value}`,
      source,
    );
  }
  return chips;
}

export function parseBuyIn(title: string, source: SourceLine) {
  // Only the first source monetary token can be the observed buy-in.
  // Never skip an unsupported token and reinterpret a later guarantee.
  const firstSymbol = title.indexOf("$");
  const match = firstSymbol < 0 ? null : BUY_IN.exec(title.slice(firstSymbol));
  if (!match) return null;
  const minor = BigInt(match[1]!) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new GgParseError(
      "malformed_hand",
      "Buy-in exceeds safe minor-unit range",
      source,
    );
  }
  return {
    amountMinor: Number(minor),
    scale: 2 as const,
    currency: null,
    symbol: "$" as const,
  };
}

export function parseLocalTimestamp(value: string, source: SourceLine) {
  const match = TIMESTAMP.exec(value);
  if (match) {
    const [year, month, day, hour, minute, second] = match.slice(1).map(Number) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days =
      [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
    if (
      year > 0 &&
      day >= 1 &&
      day <= days &&
      hour < 24 &&
      minute < 60 &&
      second < 60
    ) {
      return {
        local: `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`,
        timezone: null,
      };
    }
  }
  throw new GgParseError("malformed_hand", `Invalid local timestamp: ${value}`, source);
}

export function parseCards(value: string, source: SourceLine): Card[] {
  const match = CARDS.exec(value);
  if (!match)
    throw new GgParseError("invalid_card", `Invalid card list: ${value}`, source);
  const codes = match[1]!.split(" ");
  if (new Set(codes).size !== codes.length) {
    throw new GgParseError(
      "invalid_card",
      "Duplicate physical card in a card list",
      source,
    );
  }
  return codes.map((code) => cardSchema.parse({ rank: code[0], suit: code[1] }));
}
