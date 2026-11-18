import type { Card, Player } from "../../domain/schemas";
import { CardRegistry } from "../../domain/cardRegistry";
import { HandLedger, type LedgerSnapshot } from "../../domain/handLedger";
import { assignPositions } from "../../domain/positions";
import {
  HandHistoryValidationError,
  handHistoryEventSchema,
  historyBlindLevelSchema,
  historyBoardSchema,
  historyPlayerSchema,
  importedHandSchema,
  type HandHistoryEvent,
  type ImportedHand,
  type SourceLocation,
} from "../../domain/handHistory";
import { GgParseError, type ParseErrorType } from "./diagnostics";
import type { SourceLine } from "./split";
import type { RawGgHand } from "./rawHand";

const location = (source: SourceLine): SourceLocation => ({
  lineNumber: source.number,
  rawLine: source.text,
});
function reject(type: ParseErrorType, message: string, source: SourceLine): never {
  throw new GgParseError(type, message, source);
}
function sameCards(left: readonly Card[], right: readonly Card[]): boolean {
  return (
    left.length === right.length &&
    left.every((c, i) => c.rank === right[i]?.rank && c.suit === right[i]?.suit)
  );
}

function normalizePlayers(raw: RawGgHand): Player[] {
  const names = new Set<string>();
  const seats = new Set<number>();
  for (const player of raw.seats) {
    if (names.has(player.name) || seats.has(player.seatNumber))
      reject("inconsistent_seats", "Duplicate player name or seat", player.source);
    names.add(player.name);
    seats.add(player.seatNumber);
  }
  let positions: ReturnType<typeof assignPositions>;
  try {
    positions = assignPositions(
      raw.seats.map((p) => p.seatNumber),
      raw.table.buttonSeat,
      raw.table.capacity,
    );
  } catch (error) {
    if (error instanceof HandHistoryValidationError)
      reject(error.type, error.message, raw.table.source);
    throw error;
  }
  return raw.seats.map((p) => {
    const parsed = historyPlayerSchema.safeParse({
      id: `gg:${raw.header.tournamentId}:${encodeURIComponent(p.name)}`,
      name: p.name,
      seatNumber: p.seatNumber,
      position: positions[p.seatNumber],
      startingStackChips: p.startingStackChips,
      isHero: p.name === "Hero",
    });
    if (!parsed.success)
      reject("inconsistent_seats", "Invalid player/seat/stack record", p.source);
    return parsed.data;
  });
}

function lookupPlayer(
  players: readonly Player[],
  name: string,
  source: SourceLine,
): Player {
  const player = players.find((p) => p.name === name);
  if (!player) reject("invalid_action", `Unknown actor: ${name}`, source);
  return player;
}

function validatePosts(
  raw: RawGgHand,
  players: readonly Player[],
  warnings: ImportedHand["warnings"],
): void {
  const actions = raw.events.filter((e) => e.kind === "ACTION");
  for (const action of actions) lookupPlayer(players, action.name, action.source);
  const antes = new Set<string>();
  for (const action of actions) {
    if (action.type !== "ANTE") continue;
    if (
      !raw.header.blindLevel.anteChips ||
      action.amountChips !== raw.header.blindLevel.anteChips ||
      antes.has(action.name)
    )
      reject("invalid_action", "Duplicate or contradictory ante post", action.source);
    if (action.isAllIn)
      reject(
        "unsupported_format",
        "Short/all-in posting policy needs a real GG fixture",
        action.source,
      );
    antes.add(action.name);
  }
  if (raw.header.blindLevel.anteChips > 0 && antes.size !== players.length)
    reject(
      "invalid_action",
      "Missing ante post for an occupied player",
      raw.header.source,
    );
  for (const [type, position, amount] of [
    ["SMALL_BLIND", "SB", raw.header.blindLevel.smallBlindChips],
    ["BIG_BLIND", "BB", raw.header.blindLevel.bigBlindChips],
  ] as const) {
    const posts = actions.filter((e) => e.type === type);
    const post = posts[0];
    if (posts.length !== 1 || !post)
      reject(
        "invalid_action",
        "Missing or repeated blind post",
        posts[1]?.source ?? raw.table.source,
      );
    const player = lookupPlayer(players, post.name, post.source);
    const available = player.startingStackChips - raw.header.blindLevel.anteChips;
    if (
      !("amountChips" in post) ||
      post.amountChips !== Math.min(amount, available) ||
      player.position !== position
    )
      reject(
        "inconsistent_seats",
        "Blind post disagrees with level, remaining stack, or occupied-seat role",
        post.source,
      );
    if (post.amountChips < amount)
      warnings.push({
        code: "SHORT_BLIND_POST",
        message:
          "Source posts the remaining stack below the level blind without an all-in suffix; source flag is preserved",
        source: location(post.source),
      });
    if ("isAllIn" in post && post.isAllIn)
      reject(
        "unsupported_format",
        "Short/all-in posting policy needs a real GG fixture",
        post.source,
      );
  }
}

function normalizeDeals(
  raw: RawGgHand,
  players: readonly Player[],
  registry: CardRegistry,
): [Card, Card] {
  const dealt = new Set<string>();
  let heroCards: [Card, Card] | undefined;
  for (const deal of raw.deals) {
    const player = lookupPlayer(players, deal.name, deal.source);
    if (dealt.has(deal.name))
      reject("malformed_hand", "Repeated deal for the same player", deal.source);
    dealt.add(deal.name);
    if (deal.cards) {
      // TODO: Add an explicit normalized contract before supporting visible opponent deals.
      if (!player.isHero)
        reject(
          "unsupported_format",
          "Visible opponent deals are not supported by the supplied GG fixtures",
          deal.source,
        );
      if (deal.cards.length !== 2)
        reject(
          "invalid_card",
          "A visible hole-card deal requires two cards",
          deal.source,
        );
      registry.observe(player.id, deal.cards, location(deal.source));
      if (player.isHero) heroCards = [deal.cards[0]!, deal.cards[1]!];
    }
  }
  if (!heroCards)
    reject(
      "incomplete_hand",
      "Hero identity or two Hero hole cards are missing",
      raw.header.source,
    );
  return heroCards;
}

function normalizeBoards(
  raw: RawGgHand,
  registry: CardRegistry,
): ImportedHand["streets"] {
  const streets: ImportedHand["streets"] = [{ street: "PREFLOP", board: [] }];
  let previous: Card[] = [];
  for (const declaration of raw.boards) {
    const parsed = historyBoardSchema.safeParse({
      street: declaration.street,
      board: declaration.board,
    });
    if (
      !parsed.success ||
      !sameCards(previous, declaration.board.slice(0, previous.length))
    )
      reject(
        "invalid_card",
        "Invalid board size, duplicate, or repeated street prefix",
        declaration.source,
      );
    registry.observe("board", declaration.board, location(declaration.source), 5);
    streets.push(parsed.data);
    previous = declaration.board;
  }
  if (raw.summary.board && !sameCards(previous, raw.summary.board.board))
    reject(
      "invalid_card",
      "Summary board disagrees with dealt board",
      raw.summary.board.source,
    );
  return streets;
}

function normalizeEvents(
  raw: RawGgHand,
  players: readonly Player[],
  ledger: HandLedger,
  registry: CardRegistry,
  warnings: ImportedHand["warnings"],
): HandHistoryEvent[] {
  const events: HandHistoryEvent[] = [];
  let previousStreet: HandHistoryEvent["street"] | undefined;
  for (const sourceEvent of raw.events) {
    const base = {
      id: `${raw.header.handId}:line:${sourceEvent.source.number}`,
      sequence: events.length,
      street: sourceEvent.street,
      source: location(sourceEvent.source),
    };
    let candidate: unknown;
    if (sourceEvent.kind === "SHOWDOWN")
      candidate = {
        ...base,
        type: "SHOWDOWN",
        actorPlayerId: null,
        amountChips: 0,
        isAllIn: false,
      };
    else {
      const player = lookupPlayer(players, sourceEvent.name, sourceEvent.source);
      if (sourceEvent.type === "SHOW") {
        if (sourceEvent.cards.length > 2)
          reject(
            "invalid_card",
            "A show can reveal only one or two hole cards",
            sourceEvent.source,
          );
        registry.observe(player.id, sourceEvent.cards, location(sourceEvent.source));
        candidate = {
          ...base,
          type: "SHOW",
          actorPlayerId: player.id,
          amountChips: 0,
          isAllIn: false,
          cards: sourceEvent.cards,
          ...(sourceEvent.description ? { description: sourceEvent.description } : {}),
        };
      } else if (sourceEvent.type === "RAISE") {
        const committed =
          previousStreet === sourceEvent.street ? ledger.commitment(player.id) : 0;
        candidate = {
          ...base,
          type: "RAISE",
          actorPlayerId: player.id,
          amountChips: sourceEvent.raiseToChips - committed,
          raiseByChips: sourceEvent.raiseByChips,
          raiseToChips: sourceEvent.raiseToChips,
          isAllIn: sourceEvent.isAllIn,
        };
      } else
        candidate = {
          ...base,
          type: sourceEvent.type,
          actorPlayerId: player.id,
          amountChips: sourceEvent.amountChips,
          isAllIn: sourceEvent.isAllIn,
        };
    }
    const parsed = handHistoryEventSchema.safeParse(candidate);
    if (!parsed.success)
      reject(
        "invalid_action",
        "Invalid normalized event fields or amounts",
        sourceEvent.source,
      );
    // TODO: Obtain GG documentation/another fixture explaining this recorded fold.
    // Do not infer a sit-out, eligibility, or an all-in decision from the ambiguity.
    if (
      parsed.data.type === "FOLD" &&
      ledger.snapshot().stacks[parsed.data.actorPlayerId] === 0
    )
      warnings.push({
        code: "ZERO_STACK_FOLD",
        message:
          "Source records a fold at zero stack after a forced post; reason/eligibility is unresolved",
        source: parsed.data.source,
      });
    ledger.apply(parsed.data);
    events.push(parsed.data);
    previousStreet = sourceEvent.street;
  }
  return events;
}

function normalizeSummary(
  raw: RawGgHand,
  players: readonly Player[],
  events: readonly HandHistoryEvent[],
  state: LedgerSnapshot,
  registry: CardRegistry,
): ImportedHand["summary"] {
  const seen = new Set<number>();
  const summaries = raw.summary.seats.map((seat) => {
    const player = players.find(
      (p) => p.seatNumber === seat.seatNumber && p.name === seat.name,
    );
    if (!player || seen.has(seat.seatNumber))
      reject(
        "inconsistent_seats",
        "Summary player/seat does not match starting seats",
        seat.source,
      );
    seen.add(seat.seatNumber);
    if (
      (seat.role === "button" && seat.seatNumber !== raw.table.buttonSeat) ||
      (seat.role === "small blind" && player.position !== "SB") ||
      (seat.role === "big blind" && player.position !== "BB")
    )
      reject(
        "inconsistent_seats",
        "Summary role contradicts button/blind seats",
        seat.source,
      );
    const folded = events.find(
      (e) => e.actorPlayerId === player.id && e.type === "FOLD",
    );
    if (
      (seat.outcome === "FOLDED") !== !!folded ||
      (folded && seat.foldStreet !== folded.street)
    )
      reject(
        "malformed_hand",
        "Summary fold disagrees with action history",
        seat.source,
      );
    if (
      seat.collectedChips !== state.awards[player.id] ||
      ((seat.outcome === "WON" || seat.outcome === "COLLECTED") &&
        seat.collectedChips <= 0)
    )
      reject(
        "malformed_hand",
        "Summary collection disagrees with awarded chips",
        seat.source,
      );
    if (seat.cards) registry.observe(player.id, seat.cards, location(seat.source));
    return {
      playerId: player.id,
      seatNumber: seat.seatNumber,
      outcome: seat.outcome,
      collectedChips: seat.collectedChips,
      cards: seat.cards,
      ...(seat.foldStreet ? { foldStreet: seat.foldStreet } : {}),
      ...(seat.description ? { description: seat.description } : {}),
      source: location(seat.source),
    };
  });
  return {
    totalPotChips: raw.summary.total.totalPotChips,
    deductions: raw.summary.total.deductions,
    players: summaries,
  };
}

export function normalizeGgHand(raw: RawGgHand): ImportedHand {
  if (
    !historyBlindLevelSchema.safeParse(raw.header.blindLevel).success ||
    raw.header.levelNumber < 1 ||
    raw.header.blindLevel.smallBlindChips > raw.header.blindLevel.bigBlindChips
  )
    reject("malformed_hand", "Invalid level/blind amounts", raw.header.source);
  const players = normalizePlayers(raw);
  const hero = players.find((p) => p.isHero);
  if (!hero)
    reject(
      "incomplete_hand",
      "Hero identity missing from occupied seats",
      raw.table.source,
    );
  const warnings: ImportedHand["warnings"] = [];
  validatePosts(raw, players, warnings);
  const registry = new CardRegistry();
  const heroHoleCards = normalizeDeals(raw, players, registry);
  const streets = normalizeBoards(raw, registry);
  const ledger = new HandLedger(players, raw.header.blindLevel.bigBlindChips);
  const events = normalizeEvents(raw, players, ledger, registry, warnings);
  let state: LedgerSnapshot;
  try {
    state = ledger.finish(raw.summary.total.totalPotChips);
  } catch (error) {
    if (error instanceof HandHistoryValidationError && error.lineNumber === undefined)
      reject(error.type, error.message, raw.summary.total.source);
    throw error;
  }
  const summary = normalizeSummary(raw, players, events, state, registry);
  const parsed = importedHandSchema.safeParse({
    id: raw.header.handId,
    tournamentId: raw.header.tournamentId,
    handNumber: raw.source.sourceHandNumber,
    tableSize: raw.table.capacity,
    occupiedSeatCount: players.length,
    table: { id: raw.table.id, name: raw.table.name, capacity: raw.table.capacity },
    buttonSeat: raw.table.buttonSeat,
    heroPlayerId: hero.id,
    heroHoleCards,
    timestamp: raw.header.timestamp,
    levelNumber: raw.header.levelNumber,
    blindLevel: raw.header.blindLevel,
    players,
    streets,
    events,
    warnings,
    summary,
    resultSummary: raw.summary.total.source.text,
    source: {
      sourceHandNumber: raw.source.sourceHandNumber,
      startLine: raw.source.startLine,
      endLine: raw.source.endLine,
      rawText: raw.source.rawText,
    },
    results: players.map((p) => ({
      playerId: p.id,
      finalStackChips: state.stacks[p.id],
      netChips: state.stacks[p.id]! - p.startingStackChips,
      grossContributedChips: state.contributions[p.id],
      returnedChips: state.returns[p.id],
      collectedChips: state.awards[p.id],
    })),
  });
  if (!parsed.success)
    reject(
      "malformed_hand",
      `Normalized hand validation failed: ${parsed.error.issues[0]?.message}`,
      raw.header.source,
    );
  return parsed.data;
}
