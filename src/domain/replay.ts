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

export function buildReplayState(hand: Hand, cursor: number): ReplayState {
  const actions = flattenActions(hand);
  const boundedCursor = Math.max(0, Math.min(cursor, actions.length));
  const appliedActions = actions.slice(0, boundedCursor);
  const nextAction = actions[boundedCursor];
  const lastAction = appliedActions.at(-1);
  const foldedPlayerIds = new Set<string>();
  const committedByPlayer = new Map<string, number>();
  const lastActionByPlayer = new Map<string, Action>();
  const currentStreet = resolveCurrentStreet(hand, nextAction, lastAction);
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

    if (action.type === "WIN") {
      if (action.amountChips > potChips) {
        throw new Error(`Action ${action.id} awards more than the pot`);
      }
      stacks.set(
        action.actorPlayerId,
        (stacks.get(action.actorPlayerId) ?? 0) + action.amountChips,
      );
      potChips = Math.max(0, potChips - action.amountChips);
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
      nextAction?.type !== "WIN" &&
      nextAction?.actorPlayerId === player.id &&
      !foldedPlayerIds.has(player.id) &&
      !allInPlayerIds.has(player.id),
    isFolded: foldedPlayerIds.has(player.id),
    isAllIn: allInPlayerIds.has(player.id),
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
    board: boardForStreet(hand, currentStreet),
    potChips,
    nextAction,
    lastAction,
    seats,
    heroDecisionId: nextAction?.decisionId ?? lastAction?.decisionId,
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
