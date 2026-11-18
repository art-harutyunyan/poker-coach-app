import type { KeyboardEvent } from "react";
import type { HandBrowserRow } from "../handBrowserPresentation";
import { PlayingCard } from "./PlayingCard";

export function HandTableRow({
  row,
  selected,
  tabStop,
  onSelect,
  onOpen,
  onMove,
}: {
  row: HandBrowserRow;
  selected: boolean;
  tabStop: boolean;
  onSelect(): void;
  onOpen(): void;
  onMove(direction: -1 | 1): void;
}) {
  const positionTone =
    row.position === "SB" || row.position === "BB"
      ? "blinds"
      : row.position === "CO" || row.position === "BTN"
        ? "late"
        : row.position === "LJ" || row.position === "HJ"
          ? "middle"
          : "early";
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onMove(event.key === "ArrowUp" ? -1 : 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onOpen();
    } else if (event.key === " ") {
      event.preventDefault();
      if (!selected) onSelect();
    }
  }

  return (
    <div
      role="row"
      className="noc-hand-browser__row"
      data-hand-id={row.handId}
      aria-selected={selected}
      tabIndex={tabStop ? 0 : -1}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <span role="gridcell" data-label="Hand" className="noc-hand-browser__number">
        #{row.handNumber}
      </span>
      <span role="gridcell" data-label="Cards" className="noc-hand-browser__cards">
        {row.cards.map((card) => (
          <PlayingCard key={`${card.rank}${card.suit}`} card={card} variant="compact" />
        ))}
      </span>
      <span
        role="gridcell"
        data-label="Position"
        data-tone={positionTone}
        className="noc-hand-browser__position"
      >
        {row.position}
      </span>
      <span role="gridcell" data-label="Spot" className="noc-hand-browser__spot">
        {row.spot}
      </span>
      <span role="gridcell" data-label="Street">
        {row.street}
      </span>
      <span
        role="gridcell"
        data-label="Effective stack"
        className="noc-hand-browser__muted"
      >
        {row.effectiveStack}
      </span>
      <span
        role="gridcell"
        data-label="Final pot"
        className="noc-hand-browser__number-cell"
      >
        {row.finalPot}
      </span>
      <span role="gridcell" data-label="Grade" className="noc-hand-browser__muted">
        {row.grade}
      </span>
      <span role="gridcell" data-label="Status" className="noc-hand-browser__muted">
        {row.status}
      </span>
      <span
        role="gridcell"
        aria-label="Select hand"
        className="noc-hand-browser__chevron"
      >
        ›
      </span>
    </div>
  );
}
