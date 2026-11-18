import type { Card, Street } from "../../domain/schemas";
import { GgParseError } from "./diagnostics";
import type { SourceLine } from "./split";
import { parseBuyIn, parseCards, parseChips, parseLocalTimestamp } from "./values";

type Sourced<T> = T & { source: SourceLine };
type AmountType =
  | "ANTE"
  | "SMALL_BLIND"
  | "BIG_BLIND"
  | "FOLD"
  | "CHECK"
  | "CALL"
  | "BET"
  | "RETURN_UNCALLED"
  | "COLLECT_POT";
type ActionFields =
  | { type: AmountType; amountChips: number; isAllIn: boolean }
  | { type: "RAISE"; raiseByChips: number; raiseToChips: number; isAllIn: boolean }
  | { type: "SHOW"; cards: Card[]; description?: string };
export type ActionToken = Sourced<{ kind: "ACTION"; name: string } & ActionFields>;
export type SummarySeatToken = Sourced<{
  kind: "SUMMARY_SEAT";
  seatNumber: number;
  name: string;
  role?: "button" | "small blind" | "big blind";
  outcome: "FOLDED" | "WON" | "LOST" | "COLLECTED";
  foldStreet?: Street;
  collectedChips: number;
  cards: Card[] | null;
  description?: string;
}>;
export type GgToken =
  | ActionToken
  | SummarySeatToken
  | Sourced<
      | {
          kind: "HEADER";
          handId: string;
          tournamentId: string;
          name: string;
          game: "NLHE";
          levelNumber: number;
          blindLevel: {
            smallBlindChips: number;
            bigBlindChips: number;
            anteChips: number;
          };
          buyIn: ReturnType<typeof parseBuyIn>;
          timestamp: ReturnType<typeof parseLocalTimestamp>;
        }
      | {
          kind: "TABLE";
          id: string;
          name: string;
          capacity: number;
          buttonSeat: number;
        }
      | { kind: "SEAT"; seatNumber: number; name: string; startingStackChips: number }
      | { kind: "SECTION"; section: "HOLE_CARDS" | "SHOWDOWN" | "SUMMARY" }
      | { kind: "DEAL"; name: string; cards: Card[] | null }
      | { kind: "BOARD_STREET"; street: "FLOP" | "TURN" | "RIVER"; board: Card[] }
      | { kind: "SUMMARY_BOARD"; board: Card[] }
      | {
          kind: "TOTAL_POT";
          totalPotChips: number;
          deductions: {
            rakeChips: number;
            jackpotChips: number;
            bingoChips: number;
            fortuneChips: number;
            taxChips: number;
          };
        }
    >;

const HEADER =
  /^Poker Hand #([A-Za-z0-9]+): Tournament #(\d+), (.+) - Level(\d+)\(([^/]+)\/([^(]+)\(([^)]+)\)\) - (.+)$/;
const TABLE = /^Table '([^']+)' (\d+)-max Seat #(\d+) is the button$/;
const SEAT = /^Seat (\d+): (.+) \(([^)]+) in chips\)$/;
const DEAL = /^Dealt to (.+?)(?: (\[[^\]]*\]))?$/;
const BOARD_STREET = /^\*\*\* (FLOP|TURN|RIVER) \*\*\* (.+)$/;
const AMOUNT_ACTION =
  /^(.+): (posts the ante|posts small blind|posts big blind|calls|bets) (\S+)( and is all-in)?$/;
const RAISE = /^(.+): raises (\S+) to (\S+)( and is all-in)?$/;
const ZERO_ACTION = /^(.+): (folds|checks)$/;
const SHOW = /^(.+): shows (\[[^\]]*\])(?: \((.+)\))?$/;
const RETURN = /^Uncalled bet \(([^)]+)\) returned to (.+)$/;
const COLLECT = /^(.+) collected (\S+) from pot$/;
const TOTAL =
  /^Total pot (\S+) \| Rake (\S+) \| Jackpot (\S+) \| Bingo (\S+) \| Fortune (\S+) \| Tax (\S+)$/;
const SUMMARY_SEAT =
  /^Seat (\d+): (.+?)(?: \((button|small blind|big blind)\))? (folded before Flop|folded on the (?:Flop|Turn|River)|showed .+|collected \([^)]+\)|won \([^)]+\))$/;
const SUMMARY_SHOW =
  /^showed (\[[^\]]*\]) and (?:won \(([^)]+)\)(?: with (.+))?|lost with (.+)|collected \(([^)]+)\))$/;
const AMOUNT_TYPES = {
  "posts the ante": "ANTE",
  "posts small blind": "SMALL_BLIND",
  "posts big blind": "BIG_BLIND",
  calls: "CALL",
  bets: "BET",
} as const;

function headerToken(source: SourceLine): Extract<GgToken, { kind: "HEADER" }> {
  const m = HEADER.exec(source.text);
  if (!m)
    throw new GgParseError("malformed_hand", "Malformed GG tournament header", source);
  const gameSuffix = " Hold'em No Limit";
  if (!m[3]!.endsWith(gameSuffix))
    throw new GgParseError(
      "unsupported_game",
      "Only observed tournament Hold'em No Limit is supported",
      source,
    );
  const name = m[3]!.slice(0, -gameSuffix.length);
  return {
    kind: "HEADER",
    source,
    handId: m[1]!,
    tournamentId: m[2]!,
    name,
    game: "NLHE",
    levelNumber: parseChips(m[4]!, source),
    blindLevel: {
      smallBlindChips: parseChips(m[5]!, source),
      bigBlindChips: parseChips(m[6]!, source),
      anteChips: parseChips(m[7]!, source),
    },
    buyIn: parseBuyIn(name, source),
    timestamp: parseLocalTimestamp(m[8]!, source),
  };
}

function actionToken(source: SourceLine, text: string): ActionToken | undefined {
  let m = AMOUNT_ACTION.exec(text);
  if (m)
    return {
      kind: "ACTION",
      source,
      name: m[1]!,
      type: AMOUNT_TYPES[m[2] as keyof typeof AMOUNT_TYPES],
      amountChips: parseChips(m[3]!, source),
      isAllIn: !!m[4],
    };
  m = RAISE.exec(text);
  if (m)
    return {
      kind: "ACTION",
      source,
      name: m[1]!,
      type: "RAISE",
      raiseByChips: parseChips(m[2]!, source),
      raiseToChips: parseChips(m[3]!, source),
      isAllIn: !!m[4],
    };
  m = ZERO_ACTION.exec(text);
  if (m)
    return {
      kind: "ACTION",
      source,
      name: m[1]!,
      type: m[2] === "folds" ? "FOLD" : "CHECK",
      amountChips: 0,
      isAllIn: false,
    };
  m = SHOW.exec(text);
  if (m)
    return {
      kind: "ACTION",
      source,
      name: m[1]!,
      type: "SHOW",
      cards: parseCards(m[2]!, source),
      ...(m[3] ? { description: m[3] } : {}),
    };
  m = RETURN.exec(text);
  if (m)
    return {
      kind: "ACTION",
      source,
      name: m[2]!,
      type: "RETURN_UNCALLED",
      amountChips: parseChips(m[1]!, source),
      isAllIn: false,
    };
  m = COLLECT.exec(text);
  if (m)
    return {
      kind: "ACTION",
      source,
      name: m[1]!,
      type: "COLLECT_POT",
      amountChips: parseChips(m[2]!, source),
      isAllIn: false,
    };
  return undefined;
}

function summarySeatToken(
  source: SourceLine,
  text: string,
): SummarySeatToken | undefined {
  const m = SUMMARY_SEAT.exec(text);
  if (!m) return undefined;
  const base = {
    kind: "SUMMARY_SEAT" as const,
    source,
    seatNumber: Number(m[1]),
    name: m[2]!,
    ...(m[3] ? { role: m[3] as SummarySeatToken["role"] } : {}),
  };
  const result = m[4]!;
  if (result.startsWith("folded")) {
    const foldStreet: Street =
      result === "folded before Flop"
        ? "PREFLOP"
        : result.endsWith("Flop")
          ? "FLOP"
          : result.endsWith("Turn")
            ? "TURN"
            : "RIVER";
    return { ...base, outcome: "FOLDED", foldStreet, cards: null, collectedChips: 0 };
  }
  const shown = SUMMARY_SHOW.exec(result);
  if (shown)
    return {
      ...base,
      cards: parseCards(shown[1]!, source),
      outcome: shown[2] ? "WON" : shown[5] ? "COLLECTED" : "LOST",
      collectedChips: parseChips(shown[2] ?? shown[5] ?? "0", source),
      ...(shown[3] || shown[4] ? { description: shown[3] ?? shown[4] } : {}),
    };
  const award = /^(won|collected) \(([^)]+)\)$/.exec(result);
  if (award)
    return {
      ...base,
      outcome: award[1] === "won" ? "WON" : "COLLECTED",
      collectedChips: parseChips(award[2]!, source),
      cards: null,
    };
  throw new GgParseError("malformed_hand", "Malformed GG seat summary", source);
}

export function tokenizeGgLine(source: SourceLine): GgToken {
  const text = source.text.trimEnd();
  if (text.startsWith("Poker Hand #")) return headerToken(source);
  let m = TABLE.exec(text);
  if (m)
    return {
      kind: "TABLE",
      source,
      id: m[1]!,
      name: m[1]!,
      capacity: Number(m[2]),
      buttonSeat: Number(m[3]),
    };
  m = SEAT.exec(text);
  if (m)
    return {
      kind: "SEAT",
      source,
      seatNumber: Number(m[1]),
      name: m[2]!,
      startingStackChips: parseChips(m[3]!, source),
    };
  const section =
    text === "*** HOLE CARDS ***"
      ? "HOLE_CARDS"
      : text === "*** SHOWDOWN ***"
        ? "SHOWDOWN"
        : text === "*** SUMMARY ***"
          ? "SUMMARY"
          : undefined;
  if (section) return { kind: "SECTION", source, section };
  m = DEAL.exec(text);
  if (m)
    return {
      kind: "DEAL",
      source,
      name: m[1]!,
      cards: m[2] ? parseCards(m[2], source) : null,
    };
  m = BOARD_STREET.exec(text);
  if (m) {
    const street = m[1] as "FLOP" | "TURN" | "RIVER";
    const groups = m[2]!.match(/\[[^\]]*\]/g) ?? [];
    const remaining = m[2]!.replace(/\[[^\]]*\]/g, "").trim();
    const expected = street === "FLOP" ? 1 : 2;
    if (groups.length !== expected || remaining)
      throw new GgParseError("invalid_card", "Malformed board declaration", source);
    const cards = groups.map((g) => parseCards(g, source));
    const sizes = street === "FLOP" ? [3] : street === "TURN" ? [3, 1] : [4, 1];
    if (cards.some((list, index) => list.length !== sizes[index]))
      throw new GgParseError("invalid_card", "Impossible board size", source);
    return { kind: "BOARD_STREET", source, street, board: cards.flat() };
  }
  m = /^Board (\[[^\]]*\])$/.exec(text);
  if (m) return { kind: "SUMMARY_BOARD", source, board: parseCards(m[1]!, source) };
  m = TOTAL.exec(text);
  if (m) {
    const amounts = m.slice(1).map((amount) => parseChips(amount, source));
    return {
      kind: "TOTAL_POT",
      source,
      totalPotChips: amounts[0]!,
      deductions: {
        rakeChips: amounts[1]!,
        jackpotChips: amounts[2]!,
        bingoChips: amounts[3]!,
        fortuneChips: amounts[4]!,
        taxChips: amounts[5]!,
      },
    };
  }
  const summary = summarySeatToken(source, text);
  if (summary) return summary;
  const action = actionToken(source, text);
  if (action) return action;
  throw new GgParseError(
    text.includes(": ") ? "invalid_action" : "unsupported_format",
    "Unrecognized GG source line",
    source,
  );
}
