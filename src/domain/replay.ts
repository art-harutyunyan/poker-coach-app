import type { Action, Card, Hand, Player, Street } from "./schemas";

export interface SeatSnapshot extends Player {
  stackChips: number;
  stackBB: number;
  committedThisHandChips: number;
  committedThisStreetChips: number;
  isActive: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  lastAction?: Action;
  displayAction?: Action;
  displayActionTotalChips: number;
  revealedCards?: Card[];
}

export interface ReplayState {
  handId: string;
  cursor: number;
  totalActions: number;
  currentStreet: Street;
  board: Card[];
  potChips: number;
  nextAction?: Action;
  lastAction?: Action;
  seats: SeatSnapshot[];
  heroDecisionId?: string;
  phase?: "BETTING" | "SHOWDOWN" | "COMPLETE";
}

export function flattenActions(hand: Hand): Action[] {
  return hand.streets
    .flatMap((street) => street.actions)
    .sort((left, right) => left.sequence - right.sequence);
}

export function findActionCursor(hand: Hand, actionId: string): number {
  const index = flattenActions(hand).findIndex((action) => action.id === actionId);
  return index < 0 ? 0 : index;
}

export function findCollectionCursor(hand: Hand): number {
  const actions = flattenActions(hand);
  const index = actions.findIndex((a) => a.type === "WIN");
  return index < 0 ? actions.length : index;
}

export function findStreetCursor(hand: Hand, street: Street): number | null {
  if (street === "PREFLOP") return 0;
  const actions = flattenActions(hand);
  const index = actions.findIndex(
    (a) =>
      a.street === street &&
      (hand.replayMode !== "source-events" || a.type === "DEAL_BOARD"),
  );
  return index < 0 ? null : index + (hand.replayMode === "source-events" ? 1 : 0);
}

export type ReplayNavigationTarget = Street | "SHOWDOWN";

/** Cursor k consumes [0,k): landing here leaves the first reveal unconsumed. */
export function findShowdownCursor(hand: Hand): number | null {
  const actions = flattenActions(hand).slice(0, findCollectionCursor(hand));
  const show = actions.findIndex((action) => action.type === "SHOW");
  if (show >= 0) return show;
  const marker = actions.findIndex((action) => action.type === "SHOWDOWN");
  return marker >= 0 ? marker : null;
}

export function currentNavigationTarget(
  hand: Hand,
  cursor: number,
  currentStreet: Street,
): ReplayNavigationTarget {
  const eligible = flattenActions(hand).slice(0, findCollectionCursor(hand));
  const next = eligible[cursor];
  if (next?.type === "SHOW" || next?.type === "SHOWDOWN") return "SHOWDOWN";
  // Dealing or betting resumes street navigation after an early all-in reveal.
  const lastTransition = eligible
    .slice(0, cursor)
    .filter(
      (action) =>
        !["ANTE", "SMALL_BLIND", "BIG_BLIND", "RETURN_UNCALLED"].includes(action.type),
    )
    .at(-1);
  return lastTransition?.type === "SHOW" || lastTransition?.type === "SHOWDOWN"
    ? "SHOWDOWN"
    : currentStreet;
}

export function buildReplayState(hand: Hand, cursor: number): ReplayState {
  const actions = flattenActions(hand);
  const boundedCursor = Math.max(0, Math.min(cursor, actions.length));
  const appliedActions = actions.slice(0, boundedCursor);
  const nextAction = actions[boundedCursor];
  const lastAction = appliedActions.at(-1);
  const foldedPlayerIds = new Set<string>();
  const committedByPlayer = new Map<string, number>();
  const lastActionByPlayer = new Map<string, Action>();
  const sourceEvents = hand.replayMode === "source-events";
  const lastDeal = appliedActions.filter((a) => a.type === "DEAL_BOARD").at(-1);
  const currentStreet = sourceEvents
    ? (lastDeal?.street ?? "PREFLOP")
    : resolveCurrentStreet(hand, nextAction, lastAction);
  const reveals = new Map<string, Card[]>();
  const streetCommitted = new Map<string, number>();
  const displayActions = new Map<string, Action>();
  const actionTotals = new Map<string, number>();
  const allInPlayerIds = new Set<string>();
  const roundTotals = new Map<string, number>();
  let previousStreet: Street | undefined;

  let potChips = 0;
  const stacks = new Map(
    hand.players.map((player) => [player.id, player.startingStackChips]),
  );

  for (const action of appliedActions) {
    if (action.type === "DEAL_BOARD" || action.type === "SHOWDOWN") {
      if (action.actorPlayerId !== null || action.amountChips !== 0)
        throw new Error(`Action ${action.id} is an invalid boundary`);
      roundTotals.clear();
      streetCommitted.clear();
      previousStreet = action.street;
      continue;
    }
    if (action.actorPlayerId === null)
      throw new Error(`Action ${action.id} has no actor`);
    if (!stacks.has(action.actorPlayerId)) {
      throw new Error(`Action ${action.id} references an unseated player`);
    }
    if (action.street !== previousStreet) {
      roundTotals.clear();
      previousStreet = action.street;
    }
    if (action.type === "FOLD") {
      foldedPlayerIds.add(action.actorPlayerId);
    }

    if (action.type === "SHOW") {
      reveals.set(action.actorPlayerId, action.cards?.map((c) => ({ ...c })) ?? []);
      continue;
    }
    if (action.type === "WIN" || action.type === "RETURN_UNCALLED") {
      if (action.amountChips > potChips) {
        throw new Error(`Action ${action.id} awards more than the pot`);
      }
      stacks.set(
        action.actorPlayerId,
        (stacks.get(action.actorPlayerId) ?? 0) + action.amountChips,
      );
      potChips = Math.max(0, potChips - action.amountChips);
      if (action.type === "RETURN_UNCALLED") {
        const remaining =
          (roundTotals.get(action.actorPlayerId) ?? 0) - action.amountChips;
        if (remaining < 0)
          throw new Error(`Action ${action.id} returns more than committed`);
        roundTotals.set(action.actorPlayerId, remaining);
        streetCommitted.set(action.actorPlayerId, remaining);
        allInPlayerIds.delete(action.actorPlayerId);
      } else if (sourceEvents) streetCommitted.clear();
    } else if (action.amountChips > 0) {
      if (action.amountChips > stacks.get(action.actorPlayerId)!) {
        throw new Error(`Action ${action.id} exceeds the player's stack`);
      }
      stacks.set(
        action.actorPlayerId,
        Math.max(0, (stacks.get(action.actorPlayerId) ?? 0) - action.amountChips),
      );
      committedByPlayer.set(
        action.actorPlayerId,
        (committedByPlayer.get(action.actorPlayerId) ?? 0) + action.amountChips,
      );
      potChips += action.amountChips;
      if (action.type !== "ANTE") {
        const total = (roundTotals.get(action.actorPlayerId) ?? 0) + action.amountChips;
        roundTotals.set(action.actorPlayerId, total);
        if (action.street === currentStreet) {
          streetCommitted.set(action.actorPlayerId, total);
        }
      }
      if (stacks.get(action.actorPlayerId) === 0) {
        allInPlayerIds.add(action.actorPlayerId);
      }
    }

    lastActionByPlayer.set(action.actorPlayerId, action);
    // Antes go straight into the pot; only live street commitments occupy a seat lane.
    // Folds/all-ins persist, but ordinary actions belong only to their betting round.
    if (
      action.type !== "ANTE" &&
      action.type !== "WIN" &&
      action.type !== "RETURN_UNCALLED" &&
      (action.street === currentStreet ||
        action.type === "FOLD" ||
        allInPlayerIds.has(action.actorPlayerId))
    ) {
      displayActions.set(action.actorPlayerId, action);
      actionTotals.set(
        action.actorPlayerId,
        roundTotals.get(action.actorPlayerId) ?? 0,
      );
    }
  }

  const seats = hand.players.map((player) => ({
    ...player,
    stackChips: stacks.get(player.id) ?? player.startingStackChips,
    stackBB: roundToOneDecimal(
      (stacks.get(player.id) ?? player.startingStackChips) /
        hand.blindLevel.bigBlindChips,
    ),
    committedThisHandChips: committedByPlayer.get(player.id) ?? 0,
    committedThisStreetChips:
      lastAction?.type === "WIN" ? 0 : (streetCommitted.get(player.id) ?? 0),
    isActive:
      !["WIN", "RETURN_UNCALLED", "SHOW", "SHOWDOWN", "DEAL_BOARD"].includes(
        nextAction?.type ?? "",
      ) &&
      nextAction?.actorPlayerId === player.id &&
      !foldedPlayerIds.has(player.id) &&
      !allInPlayerIds.has(player.id),
    isFolded: foldedPlayerIds.has(player.id),
    isAllIn: sourceEvents ? stacks.get(player.id) === 0 : allInPlayerIds.has(player.id),
    ...(reveals.has(player.id) ? { revealedCards: reveals.get(player.id) } : {}),
    lastAction: lastActionByPlayer.get(player.id),
    displayAction:
      ["SMALL_BLIND", "BIG_BLIND"].includes(
        displayActions.get(player.id)?.type ?? "",
      ) && displayActions.get(player.id)?.id !== lastAction?.id
        ? undefined
        : displayActions.get(player.id),
    displayActionTotalChips: actionTotals.get(player.id) ?? 0,
  }));

  return {
    handId: hand.id,
    cursor: boundedCursor,
    totalActions: actions.length,
    currentStreet,
    board: sourceEvents
      ? (lastDeal?.cards?.map((c) => ({ ...c })) ?? [])
      : boardForStreet(hand, currentStreet),
    potChips,
    nextAction,
    lastAction,
    seats,
    heroDecisionId: nextAction?.decisionId ?? lastAction?.decisionId,
    ...(sourceEvents
      ? {
          phase:
            boundedCursor === actions.length
              ? ("COMPLETE" as const)
              : appliedActions.some((a) => a.type === "SHOWDOWN")
                ? ("SHOWDOWN" as const)
                : ("BETTING" as const),
        }
      : {}),
  };
}

function resolveCurrentStreet(
  hand: Hand,
  nextAction: Action | undefined,
  lastAction: Action | undefined,
): Street {
  if (nextAction) {
    return nextAction.street;
  }

  if (lastAction) {
    return lastAction.street;
  }

  return hand.streets[0]?.street ?? "PREFLOP";
}

function boardForStreet(hand: Hand, street: Street): Card[] {
  const order: Street[] = ["PREFLOP", "FLOP", "TURN", "RIVER"];
  const streetIndex = order.indexOf(street);
  return hand.streets
    .filter((streetState) => order.indexOf(streetState.street) <= streetIndex)
    .flatMap((streetState) => streetState.board);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
