import { flattenActions, type ReplayState } from "../../domain/replay";
import type { Action, Hand, Player, Street } from "../../domain/schemas";
import type { VisualPreviewSelection } from "../design/visualThemes";
import { formatBB, formatChips } from "../format";
import { PlayingCard } from "./PlayingCard";
import type { ReactNode } from "react";
import { PlayerSeat } from "./PlayerSeat";
import { layoutPlayers } from "./seatLayout";
import type { OpponentAliases } from "../opponentAliases";

export function PokerTable({
  controls,
  hand,
  replayState,
  resultHidden,
  visualPreview,
  opponentAliases,
}: {
  controls?: ReactNode;
  hand: Hand;
  replayState: ReplayState;
  resultHidden: boolean;
  visualPreview?: VisualPreviewSelection;
  opponentAliases?: OpponentAliases;
}) {
  const displaySeats = layoutPlayers(replayState.seats, hand.tableSize);
  const allActions = flattenActions(hand);
  const sourceEvents = hand.replayMode === "source-events";
  // Replay cursor semantics: the table shows state after actions [0, cursor)
  // have happened; `nextAction` is the action about to happen.
  const currentAction =
    replayState.nextAction?.type !== "WIN" &&
    (!sourceEvents ||
      !["RETURN_UNCALLED", "SHOW", "SHOWDOWN", "DEAL_BOARD"].includes(
        replayState.nextAction?.type ?? "",
      ))
      ? replayState.nextAction
      : undefined;
  const currentActor = currentAction
    ? hand.players.find((player) => player.id === currentAction.actorPlayerId)
    : undefined;
  const currentSummary = currentActor
    ? actorToActLabel(currentActor, replayState)
    : sourceEvents && replayState.nextAction
      ? "Replay transition"
      : "Hand complete";
  const actingContext =
    sourceEvents &&
    resultHidden &&
    ["SHOW", "WIN"].includes(replayState.lastAction?.type ?? "")
      ? "Result hidden."
      : currentAction
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
        data-board-count={replayState.board.length}
        data-table-theme={visualPreview?.tableTheme}
        role="group"
        aria-label={`Poker table state for hand ${hand.handNumber}`}
      >
        <div className="table-felt" aria-hidden="true" />
        <div className="table-center">
          <div className="table-brand">THE STUDY</div>
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
                  variant="board"
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
          {replayState.board.length > 0 && (
            <div className="table-street">{streetLabel(replayState.currentStreet)}</div>
          )}
        </div>

        {displaySeats.map(({ anchor, seat }) => (
          <PlayerSeat
            visualPreview={visualPreview}
            hand={hand}
            key={seat.id}
            anchor={anchor}
            seat={seat}
            resultHidden={resultHidden}
            opponentAliases={opponentAliases}
            currentStreet={replayState.currentStreet}
            lastActionId={replayState.lastAction?.id}
          />
        ))}
      </div>

      <div className="replayerCommandDeck" role="group" aria-label="Replay dock">
        <div className="decisionRibbon">
          <div className="decisionRibbonMessage">
            <strong>{currentSummary}</strong>
            <p>{actingContext}</p>
          </div>
          <div
            className="replayProgress"
            role="progressbar"
            aria-label="Replay action progress"
            aria-valuemin={0}
            aria-valuemax={replayState.totalActions}
            aria-valuenow={replayState.cursor}
            aria-valuetext={`Action ${replayState.cursor} of ${replayState.totalActions}`}
          >
            <span>
              Action {replayState.cursor} / {replayState.totalActions}
            </span>
            <div className="replayProgressTrack" aria-hidden="true">
              <i
                style={{
                  width: `${replayState.totalActions > 0 ? (replayState.cursor / replayState.totalActions) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
        {controls}
      </div>
      <details className="actionHistory">
        <summary>Action history</summary>
        <ActionTimeline
          actions={allActions}
          bigBlindChips={hand.blindLevel.bigBlindChips}
          cursor={replayState.cursor}
          players={hand.players}
          resultHidden={resultHidden}
          sourceEvents={sourceEvents}
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
  sourceEvents,
}: {
  actions: Action[];
  bigBlindChips: number;
  cursor: number;
  players: Player[];
  resultHidden: boolean;
  sourceEvents: boolean;
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
                  resultHidden &&
                  (sourceEvents
                    ? action.sequence >= cursor ||
                      action.type === "WIN" ||
                      action.type === "SHOW"
                    : action.sequence > cursor || action.type === "WIN");
                const actorLabel = actorNameForTimeline(action, players);
                const label = shouldHide ? "?" : actorLabel;
                const fullLabel = shouldHide
                  ? "Hidden action"
                  : isCurrent && !sourceEvents
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
    case "RETURN_UNCALLED":
      return `returned${amount}`;
    case "SHOW":
      return `shows ${action.cards?.map((c) => c.rank + c.suit).join(" ") ?? "cards"}`;
    case "SHOWDOWN":
      return "showdown";
    case "DEAL_BOARD":
      return `deal ${action.street.toLowerCase()}`;
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
  if (action.type === "DEAL_BOARD") return `Deal ${streetLabel(action.street)}`;
  if (action.type === "SHOWDOWN") return "Showdown";
  const player = players.find((candidate) => candidate.id === action.actorPlayerId);
  const amountChips =
    action.raiseToChips ??
    (action.type === "RAISE" || action.type === "ALL_IN"
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
      : action.amountChips);
  return `${positionLabel(player?.position)} ${actionSummary({ ...action, amountChips }, bigBlindChips)}`;
}

function actorNameForTimeline(action: Action, players: Player[]): string {
  if (action.type === "DEAL_BOARD") return streetLabel(action.street);
  if (action.type === "SHOWDOWN") return "Showdown";
  const player = players.find((candidate) => candidate.id === action.actorPlayerId);

  return player?.isHero ? "Hero" : positionLabel(player?.position);
}

function streetLabel(street: Street): string {
  return street.charAt(0) + street.slice(1).toLowerCase();
}

function positionLabel(position?: Player["position"]): string {
  return position ? position.replace("_PLUS_", "+") : "Player";
}
