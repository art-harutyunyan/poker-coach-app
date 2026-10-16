import { flattenActions, type ReplayState } from "../../domain/replay";
import type { Action, Hand, Player, Street } from "../../domain/schemas";
import type { VisualPreviewSelection } from "../design/visualThemes";
import { formatBB, formatChips } from "../format";
import { PlayingCard } from "./PlayingCard";
import type { ReactNode } from "react";
import { PlayerSeat } from "./PlayerSeat";
import { layoutPlayers } from "./seatLayout";
import approvedTableArt from "../../assets/approved-poker-table.png";

export function PokerTable({
  controls,
  hand,
  replayState,
  resultHidden,
  visualPreview,
}: {
  controls?: ReactNode;
  hand: Hand;
  replayState: ReplayState;
  resultHidden: boolean;
  visualPreview?: VisualPreviewSelection;
}) {
  const displaySeats = layoutPlayers(replayState.seats, hand.tableSize);
  const allActions = flattenActions(hand);
  // Replay cursor semantics: the table shows state after actions [0, cursor)
  // have happened; `nextAction` is the action about to happen.
  const currentAction =
    replayState.nextAction?.type !== "WIN" ? replayState.nextAction : undefined;
  const currentActor = currentAction
    ? hand.players.find((player) => player.id === currentAction.actorPlayerId)
    : undefined;
  const currentSummary = currentActor
    ? actorToActLabel(currentActor, replayState)
    : "Hand complete";
  const actingContext = currentAction
    ? facingContext(hand, replayState)
    : replayState.lastAction
      ? `Final action: ${actionLine(
          replayState.lastAction,
          hand.players,
          hand.blindLevel.bigBlindChips,
          allActions,
        )}`
      : "Hand ready.";

  return (
    <div className="pokerTableWrap">
      <div
        className={`pokerStage${replayState.board.length ? " has-board" : ""}`}
        data-table-size={hand.tableSize}
        data-table-theme={visualPreview?.tableTheme}
        role="group"
        aria-label={`Poker table state for hand ${hand.handNumber}`}
      >
        <img className="approvedTableArt" src={approvedTableArt} alt="" />
        <div className="table-center">
          <div className="table-brand">Poker Coach</div>
          <div
            className="table-pot"
            title={`${formatChips(replayState.potChips)} chips`}
          >
            <span>Pot</span>{" "}
            <strong>
              {(replayState.potChips / hand.blindLevel.bigBlindChips).toFixed(1)}{" "}
              <small>BB</small>
            </strong>
          </div>
          {replayState.board.length > 0 ? (
            <div className="table-board" aria-label="Community cards">
              {replayState.board.map((card, index) => (
                <PlayingCard
                  card={card}
                  context="board"
                  key={`${card.rank}${card.suit}-${index}`}
                  theme={visualPreview?.cardTheme}
                />
              ))}
            </div>
          ) : (
            <div className="preflop-label">
              PREFLOP ·{" "}
              {formatBB(
                hand.blindLevel.anteChips * hand.players.length,
                hand.blindLevel.bigBlindChips,
              )}{" "}
              TOTAL ANTES
            </div>
          )}
        </div>

        {displaySeats.map(({ anchor, seat }) => (
          <PlayerSeat
            visualPreview={visualPreview}
            hand={hand}
            key={seat.id}
            anchor={anchor}
            seat={seat}
          />
        ))}
      </div>

      <div className="replayerCommandDeck">
        {controls}
        <div className="decisionRibbon">
          <div>
            <span>
              Action {replayState.cursor} / {replayState.totalActions}
            </span>
            <strong>{currentSummary}</strong>
          </div>
          <p>{actingContext}</p>
        </div>
      </div>
      <details className="actionHistory">
        <summary>Action history</summary>
        <ActionTimeline
          actions={allActions}
          bigBlindChips={hand.blindLevel.bigBlindChips}
          cursor={replayState.cursor}
          players={hand.players}
          resultHidden={resultHidden}
        />
      </details>
    </div>
  );
}

function ActionTimeline({
  actions,
  bigBlindChips,
  cursor,
  players,
  resultHidden,
}: {
  actions: Action[];
  bigBlindChips: number;
  cursor: number;
  players: Player[];
  resultHidden: boolean;
}) {
  const streets: Street[] = ["PREFLOP", "FLOP", "TURN", "RIVER"];

  return (
    <div className="actionTimeline" aria-label="Action timeline">
      {streets.map((street) => {
        const streetActions = actions.filter((action) => action.street === street);

        if (streetActions.length === 0) {
          return null;
        }

        return (
          <div className="timelineStreet" key={street}>
            <span className="timelineStreetLabel">{street}</span>
            <div className="timelineActions" data-street={street}>
              {streetActions.map((action) => {
                const isCurrent = action.sequence === cursor;
                const isCompleted = action.sequence < cursor;
                const shouldHide =
                  resultHidden && (action.sequence > cursor || action.type === "WIN");
                const actorLabel = actorNameForTimeline(action, players);
                const label = shouldHide ? "?" : actorLabel;
                const fullLabel = shouldHide
                  ? "Hidden action"
                  : isCurrent
                    ? `${actorLabel} to act`
                    : actionLine(action, players, bigBlindChips, actions);

                return (
                  <span
                    className="timelineAction"
                    aria-label={fullLabel}
                    data-completed={isCompleted}
                    data-current={isCurrent}
                    data-hidden={shouldHide}
                    key={action.id}
                    title={fullLabel}
                  >
                    <span className="timelineDot" />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function actionSummary(action: Action, bigBlindChips: number): string {
  const amount =
    action.amountChips > 0 ? ` ${formatBB(action.amountChips, bigBlindChips)}` : "";

  switch (action.type) {
    case "SMALL_BLIND":
      return `posts SB${amount}`;
    case "BIG_BLIND":
      return `posts BB${amount}`;
    case "RAISE":
      return `raises to${amount}`;
    case "BET":
      return `bets${amount}`;
    case "CALL":
      return `calls${amount}`;
    case "ALL_IN":
      return `all-in${amount}`;
    case "FOLD":
      return "folds";
    case "CHECK":
      return "checks";
    case "WIN":
      return resultVerb(action, bigBlindChips);
    case "ANTE":
      return `antes${amount}`;
  }
}

function resultVerb(action: Action, bigBlindChips: number): string {
  return `wins ${formatBB(action.amountChips, bigBlindChips)}`;
}

function actorToActLabel(actor: Player, replayState: ReplayState): string {
  const stack =
    replayState.seats.find((seat) => seat.id === actor.id)?.stackBB.toFixed(1) ?? "0";

  if (actor.isHero) {
    return `Hero to act \u00b7 ${positionLabel(actor.position)} \u00b7 ${stack} BB`;
  }

  return `Next to act: ${positionLabel(actor.position)} \u00b7 ${stack} BB`;
}

function facingContext(hand: Hand, replayState: ReplayState): string {
  const latestStreetAction = flattenActions(hand)
    .slice(0, replayState.cursor)
    .filter((action) => action.street === replayState.currentStreet)
    .filter((action) => action.type !== "ANTE" && action.type !== "WIN")
    .at(-1);

  if (!latestStreetAction) {
    return replayState.currentStreet === "PREFLOP"
      ? "Opening action pending."
      : `${streetLabel(replayState.currentStreet)} action begins.`;
  }

  return `Facing ${actionLine(
    latestStreetAction,
    hand.players,
    hand.blindLevel.bigBlindChips,
    flattenActions(hand),
  )}`;
}

function actionLine(
  action: Action,
  players: Player[],
  bigBlindChips: number,
  actions: Action[],
): string {
  const player = players.find((candidate) => candidate.id === action.actorPlayerId);
  const amountChips =
    action.type === "RAISE" || action.type === "ALL_IN"
      ? actions
          .filter(
            (candidate) =>
              candidate.sequence <= action.sequence &&
              candidate.street === action.street &&
              candidate.actorPlayerId === action.actorPlayerId &&
              candidate.type !== "ANTE" &&
              candidate.type !== "WIN",
          )
          .reduce((total, candidate) => total + candidate.amountChips, 0)
      : action.amountChips;
  return `${positionLabel(player?.position)} ${actionSummary({ ...action, amountChips }, bigBlindChips)}`;
}

function actorNameForTimeline(action: Action, players: Player[]): string {
  const player = players.find((candidate) => candidate.id === action.actorPlayerId);

  return player?.isHero ? "Hero" : positionLabel(player?.position);
}

function streetLabel(street: Street): string {
  return street.charAt(0) + street.slice(1).toLowerCase();
}

function positionLabel(position?: Player["position"]): string {
  return position ? position.replace("_PLUS_", "+") : "Player";
}
