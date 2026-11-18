import {
  importedHandSchema,
  type HandHistoryEvent,
  type ImportedHand,
} from "./handHistory";
import type { Card } from "./schemas";

// Test-only canonical builder. Amounts are incremental except RAISE's target.
export type TestAction = [
  actor: string,
  type: HandHistoryEvent["type"],
  amount?: number,
  street?: HandHistoryEvent["street"],
];
export function metricHand(
  actions: TestAction[] = [["h", "FOLD"]],
  options: {
    hero?: string;
    stacks?: Partial<Record<string, number>>;
    board?: 0 | 3 | 4 | 5;
    show?: string[];
    awards?: [string, number][];
    id?: string;
  } = {},
): ImportedHand {
  const hero = options.hero ?? "h";
  const players = ["h", "a", "s", "b"].map((id, i) => ({
    id,
    name: id,
    seatNumber: i + 1,
    position: (["CO", "BTN", "SB", "BB"] as const)[i]!,
    startingStackChips: options.stacks?.[id] ?? 1000,
    isHero: id === hero,
  }));
  const cards: Card[] = [
    { rank: "2", suit: "c" },
    { rank: "3", suit: "d" },
    { rank: "4", suit: "h" },
    { rank: "5", suit: "s" },
    { rank: "9", suit: "c" },
  ];
  const heroCards: [Card, Card] = [
    { rank: "A", suit: "s" },
    { rank: "K", suit: "s" },
  ];
  const remaining = Object.fromEntries(
    players.map((p) => [p.id, p.startingStackChips]),
  );
  const gross = Object.fromEntries(players.map((p) => [p.id, 0]));
  const returns = { ...gross };
  const wins = { ...gross };
  let live = { ...gross };
  let street: HandHistoryEvent["street"] = "PREFLOP";
  let wager = 100;
  const folded = new Set<string>();
  const events: HandHistoryEvent[] = [];
  const add = ([actor, type, amount = 0, nextStreet = "PREFLOP"]: TestAction) => {
    if (street !== nextStreet) {
      live = Object.fromEntries(players.map((p) => [p.id, 0]));
      wager = nextStreet === "PREFLOP" ? 100 : 0;
      street = nextStreet;
    }
    const base = {
      id: `event-${events.length}`,
      sequence: events.length,
      street,
      source: { lineNumber: events.length + 10, rawLine: `${actor} ${type}` },
    };
    if (type === "SHOWDOWN") {
      events.push({
        ...base,
        type,
        street: "SHOWDOWN",
        actorPlayerId: null,
        amountChips: 0,
        isAllIn: false,
      });
      return;
    }
    if (type === "SHOW") {
      events.push({
        ...base,
        type,
        actorPlayerId: actor,
        amountChips: 0,
        isAllIn: false,
        cards: actor === hero ? heroCards : [{ rank: "Q", suit: "h" }],
      });
      return;
    }
    if (type === "FOLD" || type === "CHECK" || type === "MUCK") {
      if (type === "FOLD") folded.add(actor);
      events.push({
        ...base,
        type,
        actorPlayerId: actor,
        amountChips: 0,
        isAllIn: false,
      });
      return;
    }
    const chips = type === "RAISE" ? amount - live[actor]! : amount;
    const event = {
      ...base,
      actorPlayerId: actor,
      amountChips: chips,
      isAllIn: remaining[actor] === chips,
    };
    if (type === "RAISE")
      events.push({
        ...event,
        type,
        raiseByChips: amount - wager,
        raiseToChips: amount,
      });
    else events.push({ ...event, type });
    if (type === "COLLECT_POT") {
      remaining[actor]! += chips;
      wins[actor]! += chips;
    } else if (type === "RETURN_UNCALLED") {
      remaining[actor]! += chips;
      returns[actor]! += chips;
      live[actor]! -= chips;
    } else {
      remaining[actor]! -= chips;
      gross[actor]! += chips;
      if (type !== "ANTE") {
        live[actor]! += chips;
        wager = Math.max(wager, live[actor]!);
      }
    }
  };
  add(["s", "SMALL_BLIND", Math.min(50, remaining.s!)]);
  add(["b", "BIG_BLIND", Math.min(100, remaining.b!)]);
  actions.forEach(add);
  const count = options.board ?? 0;
  const streets: ImportedHand["streets"] = [{ street: "PREFLOP", board: [] }];
  if (count >= 3) streets.push({ street: "FLOP", board: cards.slice(0, 3) });
  if (count >= 4) streets.push({ street: "TURN", board: cards.slice(0, 4) });
  if (count >= 5) streets.push({ street: "RIVER", board: cards });
  add(["h", "SHOWDOWN", 0, "SHOWDOWN"]);
  options.show?.forEach((id) => add([id, "SHOW", 0, "SHOWDOWN"]));
  const pot =
    Object.values(gross).reduce((a, b) => a + b, 0) -
    Object.values(returns).reduce((a, b) => a + b, 0);
  const awards = options.awards ?? [[players.find((p) => !folded.has(p.id))!.id, pot]];
  awards.forEach(([id, n]) => {
    if (n) add([id, "COLLECT_POT", n, "SHOWDOWN"]);
  });
  return importedHandSchema.parse({
    id: options.id ?? "synthetic",
    tournamentId: "test",
    handNumber: 1,
    tableSize: 4,
    heroPlayerId: hero,
    heroHoleCards: heroCards,
    timestamp: { local: "2026-11-11T12:00:00", timezone: null },
    table: { id: "table", name: "table", capacity: 4 },
    occupiedSeatCount: 4,
    buttonSeat: 2,
    levelNumber: 1,
    blindLevel: { smallBlindChips: 50, bigBlindChips: 100, anteChips: 0 },
    players,
    source: {
      sourceHandNumber: 1,
      startLine: 1,
      endLine: 100,
      rawText: "Synthetic canonical test hand",
    },
    streets,
    events,
    warnings: [],
    resultSummary: "Synthetic",
    summary: {
      totalPotChips: pot,
      deductions: {
        rakeChips: 0,
        jackpotChips: 0,
        bingoChips: 0,
        fortuneChips: 0,
        taxChips: 0,
      },
      players: players.map((p) => ({
        playerId: p.id,
        seatNumber: p.seatNumber,
        outcome: folded.has(p.id) ? "FOLDED" : wins[p.id]! > 0 ? "WON" : "LOST",
        collectedChips: wins[p.id],
        cards: p.id === hero ? heroCards : null,
        source: { lineNumber: 90 + p.seatNumber, rawLine: "Synthetic summary" },
      })),
    },
    results: players.map((p) => ({
      playerId: p.id,
      finalStackChips: remaining[p.id],
      netChips: remaining[p.id]! - p.startingStackChips,
      grossContributedChips: gross[p.id],
      returnedChips: returns[p.id],
      collectedChips: wins[p.id],
    })),
  });
}
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
