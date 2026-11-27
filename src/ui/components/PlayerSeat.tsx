import type { CSSProperties } from "react";
import { Coins } from "lucide-react";
import type { SeatSnapshot } from "../../domain/replay";
import type { Hand, Street } from "../../domain/schemas";
import type { ChipTheme, VisualPreviewSelection } from "../design/visualThemes";
import { block52ChipUrl, block52DealerUrl } from "../design/visualThemes";
import { playerDisplayName } from "../format";
import { PlayingCard } from "./PlayingCard";
import { positionLabel, type SeatAnchor } from "./seatLayout";
import type { OpponentAliases } from "../opponentAliases";
import { ActionChip } from "./ActionChip";
import { SeatPlate, type SeatState } from "./SeatPlate";

export function PlayerSeat({
  seat,
  anchor,
  hand,
  visualPreview,
  resultHidden = true,
  opponentAliases,
  currentStreet,
  lastActionId,
}: {
  seat: SeatSnapshot;
  anchor: SeatAnchor;
  hand: Hand;
  visualPreview?: VisualPreviewSelection;
  resultHidden?: boolean;
  opponentAliases?: OpponentAliases;
  currentStreet: Street;
  lastActionId?: string;
}) {
  const position = positionLabel(seat.position);
  const importedOpponent = hand.replayMode === "source-events" && !seat.isHero;
  const name = playerDisplayName(
    seat,
    hand.replayMode === "source-events",
    opponentAliases,
  );
  const identity = importedOpponent
    ? `${name}, anonymized opponent, source ID ${seat.name}`
    : name;
  const revealed = !resultHidden ? seat.revealedCards : undefined;
  const action = seat.displayAction;
  // Replay retains terminal seat state; action chips describe the current street.
  const showAction =
    action?.street === currentStreet &&
    (action.type !== "FOLD" || action.id === lastActionId);
  const allIn = seat.isAllIn && !seat.isFolded;
  const type = seat.isFolded
    ? "Fold"
    : allIn
      ? "All-in"
      : action
        ? {
            ANTE: "Ante",
            SMALL_BLIND: "SB",
            BIG_BLIND: "BB",
            CHECK: "Check",
            CALL: "Call",
            BET: "Bet",
            RAISE: "Raise",
            ALL_IN: "All-in",
            FOLD: "Fold",
            WIN: "Win",
            RETURN_UNCALLED: "Returned",
            SHOW: "Shows",
            SHOWDOWN: "Showdown",
            DEAL_BOARD: "Deal",
          }[action.type]
        : undefined;
  const amount =
    action && action.amountChips > 0 && !seat.isFolded
      ? (
          (allIn || action.type === "RAISE"
            ? seat.displayActionTotalChips
            : action.amountChips) / hand.blindLevel.bigBlindChips
        )
          .toFixed(1)
          .replace(/\.0$/, "")
      : undefined;
  const chipTheme = visualPreview?.chipTheme ?? "poker-coach";
  const state: SeatState = seat.isFolded
    ? "folded"
    : allIn
      ? "all-in"
      : seat.isActive
        ? "to-act"
        : action
          ? "active"
          : "waiting";
  const status =
    state === "folded"
      ? "Folded"
      : state === "all-in"
        ? "All-in"
        : state === "to-act"
          ? seat.isHero
            ? "Your decision"
            : "To act"
          : state === "active"
            ? "In hand"
            : "Waiting";
  const style = {
    "--seat-x": `${anchor.x}%`,
    "--seat-y": `${anchor.y}%`,
    "--seat-mx": `${anchor.mx}%`,
    "--seat-my": `${anchor.my}%`,
    "--bet-dx": `${anchor.betX - anchor.x}cqw`,
    "--bet-dy": `${anchor.betY - anchor.y}cqh`,
    "--bet-mdx": `${anchor.mbetX - anchor.mx}cqw`,
    "--bet-mdy": `${anchor.mbetY - anchor.my}cqh`,
    "--action-dx": `${anchor.actionX - anchor.x}cqw`,
    "--action-dy": `${anchor.actionY - anchor.y}cqh`,
    "--action-mdx": `${anchor.mactionX - anchor.mx}cqw`,
    "--action-mdy": `${anchor.mactionY - anchor.my}cqh`,
  } as CSSProperties;

  return (
    <div
      className={`player-seat archetype-${anchor.archetype}${seat.isHero ? " is-hero" : ""}${seat.isFolded ? " is-folded" : ""}${seat.isActive ? " is-acting" : ""}${allIn ? " is-all-in" : ""}`}
      style={style}
      data-player-id={seat.id}
      data-position={position}
      data-state={state}
    >
      {!seat.isFolded && (
        <span
          className="player-cards"
          aria-label={
            seat.isHero
              ? "Hero hole cards"
              : name + (revealed?.length ? " revealed cards" : " hidden cards")
          }
        >
          {[0, 1].map((index) => (
            <PlayingCard
              key={index}
              card={seat.isHero ? hand.heroHoleCards[index] : revealed?.[index]}
              concealed={!seat.isHero && !revealed?.[index]}
              variant="table"
              context={seat.isHero ? "hero" : "compact"}
              theme={visualPreview?.cardTheme}
            />
          ))}
        </span>
      )}
      <SeatPlate
        name={name}
        identity={identity}
        position={seat.position}
        stackBB={seat.stackBB}
        stackChips={seat.stackChips}
        status={status}
        state={state}
        hero={seat.isHero}
        importedOpponent={importedOpponent}
      />
      {type && showAction && (
        <ActionChip
          kind={type.toLowerCase()}
          label={type === "Raise" ? "Raise to" : type}
          amount={amount}
        />
      )}
      {seat.position === "BTN" && (
        <span className="seat-dealer" aria-label="Dealer button">
          {chipTheme === "block52" ? <img alt="" src={block52DealerUrl()} /> : "D"}
        </span>
      )}
      {seat.committedThisStreetChips > 0 && (
        <span
          className="player-committed"
          aria-label={`${name}: ${(seat.committedThisStreetChips / hand.blindLevel.bigBlindChips).toFixed(1)} BB committed`}
        >
          <Chip theme={chipTheme} />
          <b>
            {(seat.committedThisStreetChips / hand.blindLevel.bigBlindChips)
              .toFixed(1)
              .replace(/\.0$/, "")}{" "}
            <small>BB</small>
          </b>
        </span>
      )}
    </div>
  );
}

function Chip({ theme }: { theme: ChipTheme }) {
  return theme === "block52" ? (
    <img className="seat-chip" src={block52ChipUrl("sm")} alt="" />
  ) : (
    <Coins aria-hidden="true" />
  );
}
