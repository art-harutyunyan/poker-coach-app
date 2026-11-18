import {
  importedHandSchema,
  type ImportedHand,
  type HandHistoryEvent,
} from "./handHistory";
import { HandLedger } from "./handLedger";
import { CardRegistry } from "./cardRegistry";
import type { EvidenceRef, ReasonCode } from "./pokerMetricTypes";

export const eventEvidence = (events: readonly HandHistoryEvent[]): EvidenceRef[] =>
  events.map((e) => ({
    eventId: e.id,
    lineNumber: e.source.lineNumber,
    street: e.street,
  }));
type Inspection =
  | { ok: false; reason: ReasonCode; evidence: EvidenceRef[] }
  | { ok: true; hand: ImportedHand; awardsReconciled: boolean };

/** Defensive consumer boundary; never modifies parser or ledger contracts. */
export function inspectMetricHand(input: ImportedHand): Inspection {
  const fail = (reason: ReasonCode, evidence: EvidenceRef[] = []): Inspection => ({
    ok: false,
    reason,
    evidence,
  });
  if (!input || typeof input !== "object") return fail("invalid_hand");
  if (Array.isArray(input.warnings)) {
    for (const warning of input.warnings) {
      if (warning?.code !== "SHORT_BLIND_POST" && warning?.code !== "ZERO_STACK_FOLD")
        return fail("unsupported_source_warning");
      if (warning.code === "ZERO_STACK_FOLD")
        return fail(
          "zero_stack_fold",
          warning.source ? [{ lineNumber: warning.source.lineNumber }] : [],
        );
    }
  }
  const parsed = importedHandSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_hand");
  const hand = parsed.data;
  if (
    hand.players.filter((p) => p.isHero).length !== 1 ||
    !hand.players.some((p) => p.isHero && p.id === hand.heroPlayerId)
  )
    return fail("missing_hero");
  if (
    new Set(hand.players.map((p) => p.id)).size !== hand.players.length ||
    new Set(hand.players.map((p) => p.seatNumber)).size !== hand.players.length ||
    hand.occupiedSeatCount !== hand.players.length
  )
    return fail("invalid_hand");
  const streets = ["PREFLOP", "FLOP", "TURN", "RIVER"];
  if (
    hand.streets.some(
      (s, i) =>
        s.street !== streets[i] ||
        (i > 0 &&
          hand.streets[i - 1]!.board.some(
            (c, n) => JSON.stringify(c) !== JSON.stringify(s.board[n]),
          )),
    )
  )
    return fail("incomplete_hand");
  const ids = new Set<string>();
  let sequence = -1;
  let priorStreet = 0;
  for (const event of hand.events) {
    const index = event.street === "SHOWDOWN" ? 4 : streets.indexOf(event.street);
    if (
      ids.has(event.id) ||
      event.sequence <= sequence ||
      index < priorStreet ||
      (index < 4 && !hand.streets.some((s) => s.street === event.street))
    )
      return fail("invalid_hand", eventEvidence([event]));
    ids.add(event.id);
    sequence = event.sequence;
    priorStreet = index;
  }
  let awardsReconciled = true;
  try {
    const cards = new CardRegistry();
    const source = { lineNumber: hand.source.startLine, rawLine: "" };
    cards.observe(hand.heroPlayerId, hand.heroHoleCards, source);
    for (const street of hand.streets) cards.observe("board", street.board, source, 5);
    for (const event of hand.events)
      if (event.type === "SHOW")
        cards.observe(event.actorPlayerId, event.cards, event.source);
    for (const summary of hand.summary.players)
      if (summary.cards) cards.observe(summary.playerId, summary.cards, summary.source);
    const ledger = new HandLedger(hand.players, hand.blindLevel.bigBlindChips);
    for (const event of hand.events) ledger.apply(event);
    try {
      ledger.finish(hand.summary.totalPotChips);
    } catch {
      return fail(
        ledger.snapshot().potChips > 0 ? "incomplete_hand" : "award_mismatch",
      );
    }
    const final = ledger.snapshot();
    if (
      Object.values(hand.summary.deductions).some((n) => n !== 0) ||
      hand.results.length !== hand.players.length ||
      new Set(hand.results.map((r) => r.playerId)).size !== hand.players.length ||
      hand.summary.players.length !== hand.players.length ||
      new Set(hand.summary.players.map((p) => p.playerId)).size !== hand.players.length
    )
      awardsReconciled = false;
    for (const player of hand.players) {
      const r = hand.results.find((r) => r.playerId === player.id);
      const s = hand.summary.players.find((p) => p.playerId === player.id);
      if (
        !r ||
        !s ||
        r.finalStackChips !== final.stacks[player.id] ||
        r.netChips !== final.stacks[player.id]! - player.startingStackChips ||
        r.grossContributedChips !== final.contributions[player.id] ||
        r.returnedChips !== final.returns[player.id] ||
        r.collectedChips !== final.awards[player.id] ||
        s.collectedChips !== final.awards[player.id]
      )
        awardsReconciled = false;
    }
  } catch {
    return fail("invalid_hand");
  }
  if (!awardsReconciled) return fail("award_mismatch");
  return { ok: true, hand, awardsReconciled };
}
