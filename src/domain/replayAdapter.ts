import { handSchema, type Action, type Hand } from "./schemas";
import type { ImportedHand } from "./handHistory";

export interface ReplayDiagnostic {
  code: "NON_FINANCIAL_EVENTS_OMITTED" | "SOURCE_WARNING";
  message: string;
  eventIds?: string[];
  lineNumber?: number;
}
export interface ReplayAdaptation {
  hand: Hand;
  diagnostics: ReplayDiagnostic[];
  sourceEventIds: Record<string, string>;
}

/** Project canonical truth into the existing replay contract without reparsing. */
export function toReplayHand(source: ImportedHand): ReplayAdaptation {
  const diagnostics: ReplayDiagnostic[] = source.warnings.map((warning) => ({
    code: "SOURCE_WARNING",
    message: warning.message,
    lineNumber: warning.source.lineNumber,
  }));
  const sourceEventIds: Record<string, string> = {};
  const actions: Action[] = [];
  let dealt = 0;
  const dealThrough = (index: number) => {
    while (dealt < index) {
      const street = source.streets[++dealt]!;
      actions.push({
        id: `${source.id}:board:${street.street}`,
        sequence: actions.length,
        street: street.street,
        type: "DEAL_BOARD",
        actorPlayerId: null,
        amountChips: 0,
        cards: street.board,
      });
    }
  };
  for (const event of source.events) {
    if (event.type === "MUCK") {
      diagnostics.push({
        code: "NON_FINANCIAL_EVENTS_OMITTED",
        message: "Reserved MUCK event is not projected",
        eventIds: [event.id],
      });
      continue;
    }
    const index =
      event.street === "SHOWDOWN"
        ? source.streets.length - 1
        : source.streets.findIndex((s) => s.street === event.street);
    if (index < 0) throw new Error("Source event has no parsed street");
    dealThrough(index);
    actions.push({
      id: event.id,
      sequence: actions.length,
      actorPlayerId: event.actorPlayerId,
      street: source.streets[index]!.street,
      type: event.type === "COLLECT_POT" ? "WIN" : event.type,
      amountChips: event.amountChips,
      isAllIn: event.isAllIn,
      ...(event.type === "RAISE"
        ? { raiseByChips: event.raiseByChips, raiseToChips: event.raiseToChips }
        : {}),
      ...(event.type === "SHOW" ? { cards: event.cards } : {}),
    });
    sourceEventIds[event.id] = event.id;
  }
  dealThrough(source.streets.length - 1);
  let previousBoardSize = 0;
  const streets = source.streets.map((s) => {
    const board = s.board.slice(previousBoardSize);
    previousBoardSize = s.board.length;
    return {
      street: s.street,
      board,
      actions: actions.filter((a) => a.street === s.street),
    };
  });
  const hand = handSchema.parse({
    replayMode: "source-events",
    id: source.id,
    tournamentId: source.tournamentId,
    handNumber: source.handNumber,
    tableSize: source.tableSize,
    heroPlayerId: source.heroPlayerId,
    heroHoleCards: source.heroHoleCards,
    blindLevel: source.blindLevel,
    players: source.players,
    streets,
    resultSummary: `Pot: ${source.summary.totalPotChips} chips`,
  });
  return { hand, diagnostics, sourceEventIds };
}
