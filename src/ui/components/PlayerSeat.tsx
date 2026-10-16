import type { CSSProperties } from "react";
import { Coins } from "lucide-react";
import type { SeatSnapshot } from "../../domain/replay";
import type { Hand } from "../../domain/schemas";
import type { ChipTheme, VisualPreviewSelection } from "../design/visualThemes";
import { block52ChipUrl, block52DealerUrl } from "../design/visualThemes";
import { formatChips } from "../format";
import { PlayingCard } from "./PlayingCard";
import { positionLabel, type SeatAnchor } from "./seatLayout";

export function PlayerSeat({
  seat,
  anchor,
  hand,
  visualPreview,
}: {
  seat: SeatSnapshot;
  anchor: SeatAnchor;
  hand: Hand;
  visualPreview?: VisualPreviewSelection;
}) {
  const position = positionLabel(seat.position);
  const action = seat.displayAction;
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
  const state = seat.isFolded
    ? "folded"
    : allIn
      ? "all-in"
      : seat.isActive
        ? "current"
        : "active";
  const style = {
    "--seat-x": `${anchor.x}%`,
    "--seat-y": `${anchor.y}%`,
    "--seat-mx": `${anchor.mx}%`,
    "--seat-my": `${anchor.my}%`,
  } as CSSProperties;

  return (
    <div
      className={`player-seat archetype-${anchor.archetype}${seat.isHero ? " is-hero" : ""}${seat.isFolded ? " is-folded" : ""}${seat.isActive ? " is-acting" : ""}${allIn ? " is-all-in" : ""}`}
      style={style}
      data-player-id={seat.id}
      data-position={position}
      data-state={state}
    >
      <div
        className="player-nameplate"
        role="group"
        aria-current={seat.isActive ? "true" : undefined}
        title={`${seat.name} · ${formatChips(seat.stackChips)} chips`}
        aria-label={`${position}, ${seat.name}, ${seat.stackBB.toFixed(1)} BB${seat.isHero ? ", Hero" : ""}${seat.isActive ? ", Current actor" : ""}${type ? `, ${type}${type === "Raise" ? " to" : ""}${amount ? ` ${amount} BB` : ""}` : ""}`}
      >
        {!seat.isFolded && (
          <span
            className="player-cards"
            aria-label={seat.isHero ? "Hero hole cards" : `${seat.name} hidden cards`}
          >
            {[0, 1].map((index) => (
              <PlayingCard
                key={index}
                card={seat.isHero ? hand.heroHoleCards[index] : undefined}
                concealed={!seat.isHero}
                context={seat.isHero ? "hero" : "compact"}
                theme={visualPreview?.cardTheme}
              />
            ))}
          </span>
        )}
        <span className="player-position-badge" aria-label={`Position ${position}`}>
          <span>{position.split("+")[0]}</span>
          {position.includes("+") && <span>+{position.split("+")[1]}</span>}
        </span>
        <span className="player-action-slot">
          {type && (
            <span className={`player-action-text action-${type.toLowerCase()}`}>
              <span>
                {type}
                {type === "Raise" && <span className="raise-to"> to</span>}
              </span>
              {amount && (
                <b>
                  {amount} <small>BB</small>
                </b>
              )}
            </span>
          )}
        </span>
        <span className="player-name" title={seat.name}>
          {seat.name}
        </span>
        <b className="player-stack">
          {seat.stackBB.toFixed(1)} <small>BB</small>
        </b>
      </div>
      {seat.position === "BTN" && (
        <span className="seat-dealer" aria-label="Dealer button">
          {chipTheme === "block52" ? <img alt="" src={block52DealerUrl()} /> : "D"}
        </span>
      )}
      {seat.committedThisStreetChips > 0 && (
        <span
          className="player-committed"
          aria-label={`${seat.name}: ${(seat.committedThisStreetChips / hand.blindLevel.bigBlindChips).toFixed(1)} BB committed`}
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
