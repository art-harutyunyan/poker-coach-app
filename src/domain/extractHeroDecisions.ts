import {
  importedHandSchema,
  type HandHistoryEvent,
  type ImportedHand,
} from "./handHistory";
import { HandLedger } from "./handLedger";
import { CardRegistry } from "./cardRegistry";
import type {
  DecisionDiagnostic,
  DecisionExtractionResult,
  DecisionPlayerContext,
  DecisionUnknownReason,
  FacingAction,
  HeroBettingAction,
  HeroDecisionContext,
  PotType,
  PreflopDecisionAction,
} from "./heroDecisionTypes";

const BETTING_ACTIONS = new Set<HandHistoryEvent["type"]>([
  "FOLD",
  "CHECK",
  "CALL",
  "BET",
  "RAISE",
]);
const STREETS = ["PREFLOP", "FLOP", "TURN", "RIVER"] as const;

type ActedWager = { wagerChips: number; fullIncrementChips: number };

function canRaiseAfterActing(
  last: ActedWager | undefined,
  currentBetChips: number,
): boolean {
  if (!last) return true;
  if (last.wagerChips === 0 && currentBetChips > 0) return true;
  return currentBetChips - last.wagerChips >= last.fullIncrementChips;
}

function classifyPot(raises: number, calls: number): PotType {
  if (raises >= 3) return "FOUR_BET_PLUS";
  if (raises === 2) return "THREE_BET";
  if (raises === 1) return "SINGLE_RAISED";
  return calls > 0 ? "LIMPED" : "UNOPENED";
}

function classifyFacing(
  street: HandHistoryEvent["street"],
  facingAmountChips: number,
  raises: number,
  calls: number,
  aggressive: { type: "BET" | "RAISE"; isAllIn: boolean } | null,
): FacingAction {
  if (facingAmountChips === 0)
    return street === "PREFLOP"
      ? calls > 0 && raises === 0
        ? "LIMPED"
        : "UNOPENED"
      : "CHECKED_TO";
  if (aggressive?.isAllIn) return "FACING_ALL_IN";
  if (street === "PREFLOP") {
    if (raises >= 3) return "FACING_4BET";
    if (raises === 2) return "FACING_3BET";
    if (raises === 1) return "FACING_RAISE";
    return calls > 0 ? "LIMPED" : "UNOPENED";
  }
  return aggressive?.type === "RAISE" ? "FACING_RAISE" : "FACING_BET";
}

function legalBettingActions(
  actorId: string,
  currentBetChips: number,
  facingAmountChips: number,
  amountToCallChips: number,
  heroStackChips: number,
  heroCommitmentChips: number,
  remaining: DecisionPlayerContext[],
  lastActed: Map<string, ActedWager>,
  fullIncrementChips: number,
): { actions: HeroBettingAction[]; minimumRaiseToChips: number | null } {
  const contestable = remaining.some(
    (player) =>
      player.playerId !== actorId &&
      player.streetCommitmentChips + player.stackBeforeChips > currentBetChips,
  );
  const canIncrease = heroCommitmentChips + heroStackChips > currentBetChips;
  const canRaise =
    contestable &&
    canIncrease &&
    canRaiseAfterActing(lastActed.get(actorId), currentBetChips);
  if (facingAmountChips > 0) {
    const actions: HeroBettingAction[] = ["FOLD", "CALL"];
    if (heroStackChips > amountToCallChips && canRaise) actions.push("RAISE");
    return {
      actions,
      minimumRaiseToChips: actions.includes("RAISE")
        ? currentBetChips + fullIncrementChips
        : null,
    };
  }
  const actions: HeroBettingAction[] = ["CHECK"];
  if (canRaise) actions.push(currentBetChips === 0 ? "BET" : "RAISE");
  return {
    actions,
    minimumRaiseToChips: actions.includes("RAISE")
      ? currentBetChips + fullIncrementChips
      : null,
  };
}

function fatal(
  code: string,
  message: string,
  event?: HandHistoryEvent,
): DecisionExtractionResult {
  return {
    status: "excluded",
    decisions: [],
    diagnostics: [
      {
        severity: "fatal",
        code,
        message,
        ...(event ? { eventId: event.id, lineNumber: event.source.lineNumber } : {}),
      },
    ],
  };
}

function structuralError(hand: ImportedHand): DecisionDiagnostic | null {
  const hero = hand.players.filter((player) => player.isHero);
  if (hero.length !== 1 || hero[0]?.id !== hand.heroPlayerId)
    return {
      severity: "fatal",
      code: "INVALID_HERO",
      message: "Hero identity is inconsistent",
    };
  if (
    new Set(hand.players.map((player) => player.id)).size !== hand.players.length ||
    new Set(hand.players.map((player) => player.seatNumber)).size !==
      hand.players.length ||
    hand.occupiedSeatCount !== hand.players.length
  )
    return {
      severity: "fatal",
      code: "INVALID_SEATS",
      message: "Seated players are inconsistent",
    };
  for (const [index, street] of hand.streets.entries()) {
    if (
      street.street !== STREETS[index] ||
      (index > 0 &&
        hand.streets[index - 1]!.board.some(
          (card, n) => JSON.stringify(card) !== JSON.stringify(street.board[n]),
        ))
    )
      return {
        severity: "fatal",
        code: "INVALID_BOARD",
        message: "Cumulative board is inconsistent",
      };
  }
  try {
    const cards = new CardRegistry();
    const source = { lineNumber: hand.source.startLine, rawLine: "" };
    cards.observe(hand.heroPlayerId, hand.heroHoleCards!, source);
    for (const street of hand.streets) cards.observe("board", street.board, source, 5);
    for (const event of hand.events)
      if (event.type === "SHOW")
        cards.observe(event.actorPlayerId, event.cards, event.source);
    for (const summary of hand.summary.players)
      if (summary.cards) cards.observe(summary.playerId, summary.cards, summary.source);
  } catch {
    return {
      severity: "fatal",
      code: "INVALID_CARDS",
      message: "Physical card observations are inconsistent",
    };
  }
  const ids = new Set<string>();
  const actors = new Set(hand.players.map((player) => player.id));
  let sequence = -1;
  let streetIndex = 0;
  for (const event of hand.events) {
    const index = event.street === "SHOWDOWN" ? 4 : STREETS.indexOf(event.street);
    if (
      ids.has(event.id) ||
      event.sequence <= sequence ||
      index < streetIndex ||
      (index < 4 && !hand.streets.some((street) => street.street === event.street)) ||
      (event.actorPlayerId !== null && !actors.has(event.actorPlayerId))
    )
      return {
        severity: "fatal",
        code: "INVALID_EVENTS",
        message: "Event order, street, identity, or actor is inconsistent",
        eventId: event.id,
        lineNumber: event.source.lineNumber,
      };
    ids.add(event.id);
    sequence = event.sequence;
    streetIndex = index;
  }
  return null;
}

export function extractHeroDecisions(input: ImportedHand): DecisionExtractionResult {
  const parsed = importedHandSchema.safeParse(input);
  if (!parsed.success)
    return fatal("INVALID_HAND", "Canonical hand schema validation failed");
  const hand = parsed.data;
  const invalid = structuralError(hand);
  if (invalid) return { status: "excluded", decisions: [], diagnostics: [invalid] };

  const ledger = new HandLedger(hand.players, hand.blindLevel.bigBlindChips);
  const hero = hand.players.find((player) => player.id === hand.heroPlayerId)!;
  const folded = new Set<string>();
  const decisions: HeroDecisionContext[] = [];
  const diagnostics: DecisionDiagnostic[] = [];
  const lastActed = new Map<string, ActedWager>();
  const preflopSequence: PreflopDecisionAction[] = [];
  let trackerStreet: HandHistoryEvent["street"] | null = null;
  let fullIncrementChips = hand.blindLevel.bigBlindChips;
  let preflopRaises = 0;
  let preflopCalls = 0;
  let aggressive: { type: "BET" | "RAISE"; isAllIn: boolean } | null = null;
  let unsupportedRaise = false;
  for (const warning of hand.warnings) {
    if (warning.code === "SHORT_BLIND_POST")
      diagnostics.push({
        severity: "warning",
        code: warning.code,
        message: warning.message,
        lineNumber: warning.source.lineNumber,
      });
  }
  try {
    for (const event of hand.events) {
      ledger.beginStreet(event.street);
      if (event.street !== trackerStreet) {
        trackerStreet = event.street;
        lastActed.clear();
        fullIncrementChips = hand.blindLevel.bigBlindChips;
        aggressive = null;
        unsupportedRaise = false;
      }
      const actor = event.actorPlayerId;
      const before = ledger.snapshot();
      const currentBetBefore = ledger.currentBetChips();
      const zeroStackFold =
        event.type === "FOLD" && actor !== null && before.stacks[actor] === 0;
      if (zeroStackFold) {
        const warning = hand.warnings.find(
          (item) =>
            item.code === "ZERO_STACK_FOLD" &&
            item.source.lineNumber === event.source.lineNumber,
        );
        if (!warning)
          return fatal(
            "UNWARNED_ZERO_STACK_FOLD",
            "Zero-stack fold lacks source warning",
            event,
          );
        diagnostics.push({
          severity: "recoverable",
          code: "ZERO_STACK_FOLD",
          message: warning.message,
          eventId: event.id,
          lineNumber: event.source.lineNumber,
        });
      }
      if (
        actor === hand.heroPlayerId &&
        BETTING_ACTIONS.has(event.type) &&
        event.street !== "SHOWDOWN" &&
        !zeroStackFold
      ) {
        const remaining = hand.players
          .filter((player) => !folded.has(player.id))
          .map((player) => ({
            playerId: player.id,
            seatNumber: player.seatNumber,
            position: player.position,
            stackBeforeChips: before.stacks[player.id]!,
            streetCommitmentChips: ledger.commitment(player.id),
            state:
              before.stacks[player.id] === 0
                ? ("all-in" as const)
                : ("active" as const),
          }));
        const board = hand.streets.find(
          (street) => street.street === event.street,
        )!.board;
        const amountAddedChips = event.amountChips;
        const facingAmountChips = ledger.facingAmountChips(actor);
        const amountToCallChips = ledger.amountToCallChips(actor);
        const heroCommitmentChips = ledger.commitment(actor);
        const opponents = remaining.filter((player) => player.playerId !== actor);
        const effectiveStackBeforeChips =
          opponents.length === 1
            ? Math.min(
                before.stacks[actor]!,
                opponents[0]!.stackBeforeChips +
                  Math.max(
                    0,
                    opponents[0]!.streetCommitmentChips - heroCommitmentChips,
                  ),
              )
            : null;
        const unknownReasons: DecisionUnknownReason[] = [];
        if (effectiveStackBeforeChips === null)
          unknownReasons.push(
            {
              field: "effectiveStackBeforeChips",
              code:
                opponents.length > 1
                  ? "MULTIWAY_EFFECTIVE_STACK_AMBIGUOUS"
                  : "NO_CONTESTING_OPPONENT",
            },
            {
              field: "effectiveStackBeforeBb",
              code:
                opponents.length > 1
                  ? "MULTIWAY_EFFECTIVE_STACK_AMBIGUOUS"
                  : "NO_CONTESTING_OPPONENT",
            },
          );
        const legal = legalBettingActions(
          actor,
          currentBetBefore,
          facingAmountChips,
          amountToCallChips,
          before.stacks[actor]!,
          heroCommitmentChips,
          remaining,
          lastActed,
          fullIncrementChips,
        );
        const currentActionUnsupported =
          (event.type === "RAISE" &&
            (!canRaiseAfterActing(lastActed.get(actor), currentBetBefore) ||
              (event.raiseByChips < fullIncrementChips && !event.isAllIn))) ||
          (event.type === "BET" &&
            event.amountChips < hand.blindLevel.bigBlindChips &&
            !event.isAllIn);
        let legalActions: HeroBettingAction[] | null = legal.actions;
        if (unsupportedRaise || currentActionUnsupported) {
          legalActions = null;
          unknownReasons.push({
            field: "legalActions",
            code: "UNSUPPORTED_RAISE_SEQUENCE",
          });
          if (currentActionUnsupported)
            diagnostics.push({
              severity: "warning",
              code: "UNSUPPORTED_RAISE_SEQUENCE",
              message: "Source action does not meet minimum size or reopening rights",
              eventId: event.id,
              lineNumber: event.source.lineNumber,
              field: "legalActions",
            });
        } else if (!legal.actions.includes(event.type as HeroBettingAction)) {
          legalActions = null;
          unknownReasons.push({
            field: "legalActions",
            code: "SOURCE_ACTION_CONFLICT",
          });
          diagnostics.push({
            severity: "warning",
            code: "SOURCE_ACTION_CONFLICT",
            message: "Source action is outside derived betting options",
            eventId: event.id,
            lineNumber: event.source.lineNumber,
            field: "legalActions",
          });
        }
        decisions.push({
          handId: hand.id,
          eventId: event.id,
          sourceLine: event.source.lineNumber,
          decisionIndex: decisions.length,
          street: event.street,
          heroPosition: hero.position,
          heroCards: hand.heroHoleCards,
          board: [...board],
          playersDealt: hand.players.length,
          playersInHand: remaining.length,
          playersRemaining: remaining,
          heroStackBeforeChips: before.stacks[actor]!,
          heroStackBeforeBb: before.stacks[actor]! / hand.blindLevel.bigBlindChips,
          effectiveStackBeforeChips,
          effectiveStackBeforeBb:
            effectiveStackBeforeChips === null
              ? null
              : effectiveStackBeforeChips / hand.blindLevel.bigBlindChips,
          potBeforeActionChips: before.potChips,
          contributionsByPlayerChips: { ...before.contributions },
          currentBetChips: currentBetBefore,
          facingAmountChips,
          amountToCallChips,
          facingAction: classifyFacing(
            event.street,
            facingAmountChips,
            preflopRaises,
            preflopCalls,
            aggressive,
          ),
          legalActions,
          minimumRaiseToChips: legalActions === null ? null : legal.minimumRaiseToChips,
          actualAction: {
            kind: event.type as HeroBettingAction,
            isAllIn: event.isAllIn,
            amountAddedChips,
            raiseToChips: event.type === "RAISE" ? event.raiseToChips : null,
            amountAddedBb:
              amountAddedChips > 0
                ? amountAddedChips / hand.blindLevel.bigBlindChips
                : null,
            potFraction:
              (event.type === "BET" || event.type === "RAISE") && before.potChips > 0
                ? amountAddedChips / before.potChips
                : null,
          },
          potType: classifyPot(preflopRaises, preflopCalls),
          preflopSequence: [...preflopSequence],
          sourceConfidence:
            legalActions === null
              ? "unknown"
              : unknownReasons.length > 0 || hand.warnings.length > 0
                ? "partial"
                : "confirmed",
          unknownReasons,
        });
      }
      ledger.apply(event);
      if (event.type === "FOLD" && actor) folded.add(actor);
      if (actor && BETTING_ACTIONS.has(event.type) && !zeroStackFold) {
        if (event.type === "RAISE") {
          if (
            !canRaiseAfterActing(lastActed.get(actor), currentBetBefore) ||
            (event.raiseByChips < fullIncrementChips && !event.isAllIn)
          )
            unsupportedRaise = true;
          if (event.raiseByChips >= fullIncrementChips)
            fullIncrementChips = event.raiseByChips;
          aggressive = { type: "RAISE", isAllIn: event.isAllIn };
          if (event.street === "PREFLOP") preflopRaises++;
        } else if (event.type === "BET") {
          if (event.amountChips < hand.blindLevel.bigBlindChips) {
            if (!event.isAllIn) unsupportedRaise = true;
          } else fullIncrementChips = event.amountChips;
          aggressive = { type: "BET", isAllIn: event.isAllIn };
        } else if (
          event.type === "CALL" &&
          event.street === "PREFLOP" &&
          preflopRaises === 0
        ) {
          preflopCalls++;
        }
        if (event.type !== "FOLD")
          lastActed.set(actor, {
            wagerChips: ledger.currentBetChips(),
            fullIncrementChips,
          });
        if (event.street === "PREFLOP") {
          const player = hand.players.find((item) => item.id === actor)!;
          preflopSequence.push({
            eventId: event.id,
            playerId: actor,
            position: player.position,
            action: event.type as HeroBettingAction,
            isAllIn: event.isAllIn,
            amountAddedChips: event.amountChips,
            raiseToChips: event.type === "RAISE" ? event.raiseToChips : null,
          });
        }
      }
    }
    ledger.finish(hand.summary.totalPotChips);
    const final = ledger.snapshot();
    if (
      Object.values(hand.summary.deductions).some((amount) => amount !== 0) ||
      hand.results.length !== hand.players.length ||
      new Set(hand.results.map((result) => result.playerId)).size !==
        hand.players.length ||
      hand.summary.players.length !== hand.players.length ||
      new Set(hand.summary.players.map((summary) => summary.playerId)).size !==
        hand.players.length ||
      hand.players.some((player) => {
        const result = hand.results.find((item) => item.playerId === player.id);
        const summary = hand.summary.players.find(
          (item) => item.playerId === player.id,
        );
        return (
          !result ||
          !summary ||
          result.finalStackChips !== final.stacks[player.id] ||
          result.netChips !== final.stacks[player.id]! - player.startingStackChips ||
          result.grossContributedChips !== final.contributions[player.id] ||
          result.returnedChips !== final.returns[player.id] ||
          result.collectedChips !== final.awards[player.id] ||
          summary.collectedChips !== final.awards[player.id]
        );
      })
    )
      return fatal(
        "INVALID_ACCOUNTING",
        "Final player results disagree with the ledger",
      );
  } catch (error) {
    return fatal(
      "INVALID_ACCOUNTING",
      error instanceof Error ? error.message : "Ledger failed",
    );
  }
  return { status: "ok", decisions, diagnostics };
}
