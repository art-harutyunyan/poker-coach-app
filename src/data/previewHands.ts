import { flattenActions } from "../domain/replay";
import type { Action, Hand, Player } from "../domain/schemas";

// Geometry previews remain mock data, not replay/UI-generated poker decisions.
export function buildMultiSeatPreviewHand(hand: Hand, tableSize: 8 | 9): Hand {
  const additional: Player[] = [
    {
      id: "p-utg1-preview",
      name: "Aster",
      position: "UTG_PLUS_1",
      startingStackChips: 49250,
      isHero: false,
      seatNumber: 4,
    },
    ...(tableSize === 9
      ? [
          {
            id: "p-utg2-preview",
            name: "NineLine",
            position: "UTG_PLUS_2" as const,
            startingStackChips: 71400,
            isHero: false,
            seatNumber: 5,
          },
        ]
      : []),
    {
      id: "p-lj-preview",
      name: "LumaRaise",
      position: "LJ",
      startingStackChips: 58700,
      isHero: false,
      seatNumber: tableSize - 3,
    },
  ];
  const players = [
    hand.players.find((p) => p.position === "SB")!,
    hand.players.find((p) => p.position === "BB")!,
    hand.players.find((p) => p.position === "UTG")!,
    ...additional,
    hand.players.find((p) => p.position === "HJ")!,
    hand.players.find((p) => p.position === "CO")!,
    hand.players.find((p) => p.position === "BTN")!,
  ].map((player, index) => ({ ...player, seatNumber: index + 1 }));
  let sequence = 0;
  const streets = hand.streets.map((street) => {
    const actions = street.actions.flatMap((action) => {
      const extras: Action[] =
        action.id === "a-ante-utg" || action.id === "a-utg-fold"
          ? additional.map((player) => ({
              id: `${action.type === "ANTE" ? "a-ante" : "a-fold"}-${player.id}`,
              actorPlayerId: player.id,
              street: "PREFLOP",
              sequence: 0,
              type: action.type,
              amountChips: action.type === "ANTE" ? hand.blindLevel.anteChips : 0,
            }))
          : [];
      return [action, ...extras].map((item) => ({
        ...item,
        sequence: sequence++,
        amountChips:
          item.type === "WIN"
            ? item.amountChips + additional.length * hand.blindLevel.anteChips
            : item.amountChips,
      }));
    });
    return { ...street, actions };
  });
  return {
    ...hand,
    id: `${hand.id}-${tableSize}max-preview`,
    tableSize,
    players,
    streets,
  };
}

// A legal equal-stack all-in branch for dev-only QA; never changes the primary lesson.
export function buildAllInPreviewHand(hand: Hand): Hand {
  const actions = flattenActions(hand);
  const call = actions.find((action) => action.id === "a-hero-call")!;
  const preflop = actions.filter((action) => action.sequence < call.sequence);
  preflop.push({ ...call, type: "ALL_IN", amountChips: 38000, decisionId: undefined });
  preflop.push({
    id: "qa-bb-fold",
    street: "PREFLOP",
    sequence: 0,
    actorPlayerId: "p-bb",
    type: "FOLD",
    amountChips: 0,
  });
  preflop.push({
    id: "qa-btn-call",
    street: "PREFLOP",
    sequence: 0,
    actorPlayerId: "p-btn",
    type: "CALL",
    amountChips: 34500,
  });
  let sequence = 0;
  const pot = preflop.reduce((sum, action) => sum + action.amountChips, 0);
  return {
    ...hand,
    id: `${hand.id}-all-in-qa`,
    players: hand.players.map((player) =>
      player.isHero || player.position === "BTN"
        ? { ...player, startingStackChips: 39250 }
        : player,
    ),
    streets: hand.streets.map((street) => ({
      ...street,
      actions: (street.street === "PREFLOP"
        ? preflop
        : street.street === "RIVER"
          ? [
              {
                id: "qa-showdown-win",
                actorPlayerId: hand.heroPlayerId,
                street: "RIVER" as const,
                sequence: 0,
                type: "WIN" as const,
                amountChips: pot,
              },
            ]
          : []
      ).map((action) => ({ ...action, sequence: sequence++ })),
    })),
  };
}
