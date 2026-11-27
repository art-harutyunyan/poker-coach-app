import {
  HandHistoryValidationError,
  type HandHistoryEvent,
  type SourceLocation,
} from "./handHistory";
import type { Player } from "./schemas";

export interface LedgerSnapshot {
  potChips: number;
  stacks: Record<string, number>;
  contributions: Record<string, number>;
  returns: Record<string, number>;
  awards: Record<string, number>;
}

function invalid(message: string, source?: SourceLocation): never {
  throw new HandHistoryValidationError("invalid_action", message, source);
}
function safe(value: number, source?: SourceLocation): number {
  if (!Number.isSafeInteger(value) || value < 0)
    invalid("Unsafe, negative, or fractional chip amount", source);
  return value;
}

export class HandLedger {
  private readonly stacks = new Map<string, number>();
  private readonly contributions = new Map<string, number>();
  private readonly returned = new Map<string, number>();
  private readonly awards = new Map<string, number>();
  private readonly live = new Map<string, number>();
  private readonly folded = new Set<string>();
  private readonly exhaustedByForcedPost = new Set<string>();
  private street: HandHistoryEvent["street"] | undefined;
  private pot = 0;
  private awarding = false;

  constructor(
    players: readonly Player[],
    private readonly bigBlindChips = 0,
  ) {
    safe(bigBlindChips);
    let total = 0;
    for (const player of players) {
      if (this.stacks.has(player.id)) invalid("Duplicate player ID in ledger");
      total = safe(total + safe(player.startingStackChips));
      this.stacks.set(player.id, player.startingStackChips);
      this.contributions.set(player.id, 0);
      this.returned.set(player.id, 0);
      this.awards.set(player.id, 0);
    }
  }

  commitment(actorId: string): number {
    if (!this.stacks.has(actorId)) invalid("Unknown ledger actor");
    return this.live.get(actorId) ?? 0;
  }

  beginStreet(street: HandHistoryEvent["street"]): void {
    this.setStreet(street);
  }

  currentBetChips(): number {
    return Math.max(
      this.street === "PREFLOP" ? this.bigBlindChips : 0,
      ...this.live.values(),
    );
  }

  facingAmountChips(actorId: string): number {
    return Math.max(0, this.currentBetChips() - this.commitment(actorId));
  }

  amountToCallChips(actorId: string): number {
    return Math.min(this.facingAmountChips(actorId), this.stacks.get(actorId)!);
  }

  apply(event: HandHistoryEvent): void {
    const source = event.source;
    safe(event.amountChips, source);
    if (event.type === "SHOWDOWN") {
      this.setStreet(event.street);
      return;
    }
    const actor = event.actorPlayerId;
    const stack = this.stacks.get(actor);
    if (stack === undefined) invalid("Action references an unknown actor", source);
    this.setStreet(event.street);
    if (event.type === "SHOW" || event.type === "MUCK") return;
    if (this.folded.has(actor))
      invalid("Folded player cannot bet, act, return, or collect", source);
    if (event.type === "COLLECT_POT") {
      if (event.amountChips <= 0 || event.amountChips > this.pot)
        invalid("Award exceeds pot or is zero", source);
      this.awarding = true;
      this.pot -= event.amountChips;
      this.stacks.set(actor, safe(stack + event.amountChips, source));
      this.awards.set(actor, safe(this.awards.get(actor)! + event.amountChips, source));
      return;
    }
    if (this.awarding) invalid("Betting or returns after pot collection", source);
    const committed = this.live.get(actor) ?? 0;
    // A short forced BB changes chips in the pot, not the declared preflop wager.
    const maximum = this.currentBetChips();
    if (event.type === "RETURN_UNCALLED") {
      const otherMaximum = Math.max(
        0,
        ...[...this.live].filter(([id]) => id !== actor).map(([, amount]) => amount),
      );
      if (
        event.amountChips <= 0 ||
        event.amountChips !== committed - otherMaximum ||
        event.amountChips > this.pot
      )
        invalid("Return does not equal the uncalled live contribution", source);
      this.live.set(actor, committed - event.amountChips);
      this.exhaustedByForcedPost.delete(actor);
      this.pot -= event.amountChips;
      this.stacks.set(actor, safe(stack + event.amountChips, source));
      this.returned.set(
        actor,
        safe(this.returned.get(actor)! + event.amountChips, source),
      );
      return;
    }
    // One supplied GG hand explicitly folds a player after a stack-exhausting SB.
    // Preserve that zero-movement source event; the normalizer reports its ambiguity.
    if (
      stack === 0 &&
      !(event.type === "FOLD" && this.exhaustedByForcedPost.has(actor))
    )
      invalid("Zero-stack player cannot take a betting action", source);
    if (event.type === "FOLD" || event.type === "CHECK") {
      if (event.amountChips !== 0) invalid("Fold/check cannot move chips", source);
      if (event.type === "CHECK" && committed !== maximum)
        invalid("Cannot check facing a bet", source);
      if (event.type === "FOLD") this.folded.add(actor);
      return;
    }
    if (event.amountChips <= 0 || event.amountChips > stack)
      invalid("Contribution is zero or exceeds stack", source);
    const remaining = stack - event.amountChips;
    if (event.isAllIn && remaining !== 0)
      invalid("All-in flag disagrees with remaining stack", source);
    if (event.type === "CALL") {
      const owed = maximum - committed;
      if (
        event.amountChips > owed ||
        (event.amountChips < owed && (!event.isAllIn || remaining !== 0))
      )
        invalid("Call amount does not match amount owed or a short all-in", source);
    } else if (event.type === "BET" && maximum !== 0)
      invalid("Bet facing an existing wager must be a raise", source);
    else if (event.type === "RAISE") {
      safe(event.raiseByChips, source);
      safe(event.raiseToChips, source);
      if (
        event.raiseToChips <= maximum ||
        event.raiseByChips !== event.raiseToChips - maximum ||
        event.amountChips !== event.raiseToChips - committed
      )
        invalid("Raise-by, raise-to, and contribution disagree", source);
    }
    this.stacks.set(actor, remaining);
    if (remaining === 0 && ["ANTE", "SMALL_BLIND", "BIG_BLIND"].includes(event.type))
      this.exhaustedByForcedPost.add(actor);
    else this.exhaustedByForcedPost.delete(actor);
    this.pot = safe(this.pot + event.amountChips, source);
    this.contributions.set(
      actor,
      safe(this.contributions.get(actor)! + event.amountChips, source),
    );
    if (event.type !== "ANTE")
      this.live.set(actor, safe(committed + event.amountChips, source));
  }

  snapshot(): LedgerSnapshot {
    return {
      potChips: this.pot,
      stacks: Object.fromEntries(this.stacks),
      contributions: Object.fromEntries(this.contributions),
      returns: Object.fromEntries(this.returned),
      awards: Object.fromEntries(this.awards),
    };
  }

  finish(totalPotChips: number): LedgerSnapshot {
    safe(totalPotChips);
    const sum = (amounts: Map<string, number>) =>
      [...amounts.values()].reduce((total, amount) => safe(total + amount), 0);
    if (
      sum(this.contributions) - sum(this.returned) !== totalPotChips ||
      sum(this.awards) !== totalPotChips ||
      this.pot !== 0
    )
      invalid("Declared pot, contributions, returns, and awards do not reconcile");
    return this.snapshot();
  }

  private setStreet(street: HandHistoryEvent["street"]): void {
    if (street !== this.street) {
      this.live.clear();
      this.street = street;
    }
  }
}
