import type { Street } from "../../domain/schemas";
import { GgParseError, type ParseErrorType } from "./diagnostics";
import type { HandBlock, SourceLine } from "./split";
import {
  tokenizeGgLine,
  type GgToken,
  type ActionToken,
  type SummarySeatToken,
} from "./tokens";

type Token<K extends GgToken["kind"]> = Extract<GgToken, { kind: K }>;
export type RawGgEvent =
  | (ActionToken & { street: Street | "SHOWDOWN" })
  | { kind: "SHOWDOWN"; street: "SHOWDOWN"; source: SourceLine };
export interface RawGgHand {
  source: HandBlock;
  header: Token<"HEADER">;
  table: Token<"TABLE">;
  seats: Token<"SEAT">[];
  deals: Token<"DEAL">[];
  boards: Token<"BOARD_STREET">[];
  events: RawGgEvent[];
  summary: {
    total: Token<"TOTAL_POT">;
    board?: Token<"SUMMARY_BOARD">;
    seats: SummarySeatToken[];
  };
}

function reject(
  message: string,
  source?: SourceLine,
  type: ParseErrorType = "malformed_hand",
): never {
  throw new GgParseError(type, message, source);
}

export function parseRawGgHand(block: HandBlock): RawGgHand {
  const tokens = block.lines.filter((line) => line.text.trim()).map(tokenizeGgLine);
  const [header, table] = tokens;
  if (!header || header.kind !== "HEADER")
    reject("Missing hand header", header?.source);
  if (!table || table.kind !== "TABLE")
    reject("Missing or misplaced table declaration", table?.source ?? header.source);
  const seats: Token<"SEAT">[] = [];
  const deals: Token<"DEAL">[] = [];
  const boards: Token<"BOARD_STREET">[] = [];
  const events: RawGgEvent[] = [];
  const summarySeats: SummarySeatToken[] = [];
  let total: Token<"TOTAL_POT"> | undefined;
  let summaryBoard: Token<"SUMMARY_BOARD"> | undefined;
  let state: "SETUP" | Street | "SHOWDOWN" | "SUMMARY" = "SETUP";
  let setupPosted = false;
  let bettingStarted = false;
  const order = ["PREFLOP", "FLOP", "TURN", "RIVER"];
  for (const token of tokens.slice(2)) {
    if (token.kind === "SEAT") {
      if (state !== "SETUP" || setupPosted)
        reject("Seat declaration outside initial seating", token.source);
      seats.push(token);
    } else if (token.kind === "SECTION") {
      if (token.section === "HOLE_CARDS" && state === "SETUP") state = "PREFLOP";
      else if (token.section === "SHOWDOWN" && order.includes(state)) {
        state = "SHOWDOWN";
        events.push({ kind: "SHOWDOWN", street: "SHOWDOWN", source: token.source });
      } else if (token.section === "SUMMARY" && state === "SHOWDOWN") state = "SUMMARY";
      else reject("Duplicated or out-of-order section", token.source);
    } else if (token.kind === "DEAL") {
      if (state !== "PREFLOP" || bettingStarted)
        reject("Deal outside initial hole cards", token.source);
      deals.push(token);
    } else if (token.kind === "BOARD_STREET") {
      if (
        order.indexOf(token.street) !== order.indexOf(state) + 1 ||
        !order.includes(state)
      )
        reject("Out-of-order board street", token.source);
      state = token.street;
      bettingStarted = true;
      boards.push(token);
    } else if (token.kind === "ACTION") {
      const posting = ["ANTE", "SMALL_BLIND", "BIG_BLIND"].includes(token.type);
      if (state === "SETUP") {
        if (!posting) reject("Non-posting action before hole cards", token.source);
        setupPosted = true;
      } else if (
        state === "SUMMARY" ||
        posting ||
        (state === "SHOWDOWN" && !["SHOW", "COLLECT_POT"].includes(token.type)) ||
        (state !== "SHOWDOWN" && token.type === "COLLECT_POT")
      ) {
        reject("Action in the wrong section", token.source);
      } else bettingStarted = true;
      events.push({ ...token, street: state === "SETUP" ? "PREFLOP" : state });
    } else if (token.kind === "TOTAL_POT") {
      if (state !== "SUMMARY" || total || summarySeats.length)
        reject("Misplaced or repeated total pot", token.source);
      // TODO: Add real fixtures and an explicit policy before accepting nonzero deductions.
      if (Object.values(token.deductions).some((amount) => amount !== 0))
        reject(
          "Nonzero GG deductions are not supported by the supplied fixtures",
          token.source,
          "unsupported_format",
        );
      total = token;
    } else if (token.kind === "SUMMARY_BOARD") {
      if (state === "SUMMARY" && !total)
        reject(
          "Missing total pot before summary board",
          token.source,
          "incomplete_hand",
        );
      if (state !== "SUMMARY" || summaryBoard || summarySeats.length)
        reject("Misplaced or repeated summary board", token.source);
      summaryBoard = token;
    } else if (token.kind === "SUMMARY_SEAT") {
      if (state !== "SUMMARY" || !total)
        reject("Seat summary before total pot", token.source, "incomplete_hand");
      summarySeats.push(token);
    } else reject("Unexpected header/table in hand body", token.source);
  }
  const last = tokens.at(-1)?.source ?? header.source;
  if (
    state !== "SUMMARY" ||
    !total ||
    !deals.length ||
    seats.length < 2 ||
    summarySeats.length !== seats.length ||
    (boards.length > 0 && !summaryBoard)
  ) {
    reject(
      "Incomplete hand: required sections, deals, or seat summaries are missing",
      last,
      "incomplete_hand",
    );
  }
  return {
    source: block,
    header,
    table,
    seats,
    deals,
    boards,
    events,
    summary: {
      total,
      ...(summaryBoard ? { board: summaryBoard } : {}),
      seats: summarySeats,
    },
  };
}
