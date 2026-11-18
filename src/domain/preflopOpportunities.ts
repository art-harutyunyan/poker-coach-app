import type { ImportedHand, HandHistoryEvent } from "./handHistory";
import { HandLedger } from "./handLedger";
import { inspectMetricHand, eventEvidence } from "./metricHandValidation";
import type { MetricContribution, ReasonCode } from "./pokerMetricTypes";

export function derivePreflopOpportunities(input: ImportedHand): MetricContribution {
  const checked = inspectMetricHand(input);
  if (!checked.ok)
    return {
      status: "excluded",
      reasons: [checked.reason],
      evidence: checked.evidence,
    };
  const { hand } = checked;
  const ledger = new HandLedger(hand.players, hand.blindLevel.bigBlindChips);
  const folded = new Set<string>();
  const history: HandHistoryEvent[] = [];
  let raises = 0;
  let wager = hand.blindLevel.bigBlindChips;
  let increment = wager;
  let heroRaised = false;
  let unsupported: ReasonCode | undefined;
  let candidate: MetricContribution | undefined;
  const excluded = (reason: ReasonCode): MetricContribution => ({
    status: "excluded",
    reasons: [reason],
    evidence: eventEvidence(history),
  });
  for (const event of hand.events) {
    if (event.street !== "PREFLOP") break;
    history.push(event);
    const actor = event.actorPlayerId;
    if (
      !candidate &&
      actor === hand.heroPlayerId &&
      ["FOLD", "CALL", "RAISE"].includes(event.type)
    ) {
      // An original Hero raiser now faces a potential 4-bet, even after a short re-raise.
      if (heroRaised)
        candidate = { status: "not-opportunity", evidence: eventEvidence(history) };
      else if (unsupported) candidate = excluded(unsupported);
      if (!candidate && raises === 1 && !heroRaised && !folded.has(actor)) {
        const state = ledger.snapshot();
        const canRaise = state.stacks[actor]! > wager - ledger.commitment(actor);
        const contestable = hand.players.some(
          (p) =>
            p.id !== actor &&
            !folded.has(p.id) &&
            ledger.commitment(p.id) + state.stacks[p.id]! > wager,
        );
        if (canRaise && contestable) {
          if (
            event.type === "RAISE" &&
            event.raiseByChips < increment &&
            !(event.isAllIn && event.amountChips === state.stacks[actor])
          )
            return excluded("unsupported_raise");
          candidate = {
            status: "eligible",
            numerator: event.type === "RAISE" ? 1 : 0,
            denominator: 1,
            evidence: eventEvidence(history),
          };
        }
      }
      if (!candidate && event.type === "FOLD")
        candidate = { status: "not-opportunity", evidence: eventEvidence(history) };
    }
    if (event.type === "RAISE") {
      // Finish checking the record even after observing Hero's opportunity.
      // A legal later short all-in does not erase that earlier opportunity.
      if (
        event.raiseByChips < increment &&
        !(event.isAllIn && event.amountChips === ledger.snapshot().stacks[actor!])
      )
        return excluded("unsupported_raise");
      if (event.raiseByChips < increment)
        unsupported =
          raises === 0
            ? "short_open"
            : event.isAllIn
              ? "ambiguous_reopening"
              : "unsupported_raise";
      else increment = event.raiseByChips;
      wager = event.raiseToChips;
      raises++;
      if (actor === hand.heroPlayerId) heroRaised = true;
    }
    if (event.type === "FOLD" && actor) folded.add(actor);
    ledger.apply(event);
  }
  return candidate ?? { status: "not-opportunity", evidence: eventEvidence(history) };
}
