import type { ImportedHand } from "../../domain/handHistory";
import { useMemo, useRef, useState } from "react";
import {
  filterHandBrowserRows,
  presentHandBrowserRow,
} from "../handBrowserPresentation";
import {
  NocturneButton,
  NocturneSearchInput,
  NocturneSegmentedControl,
} from "../design/NocturnePrimitives";
import { HandTableRow } from "./HandTableRow";

const STREETS = ["PREFLOP", "FLOP", "TURN", "RIVER"] as const;
const POSITION_ORDER = [
  "SB",
  "BB",
  "UTG",
  "UTG+1",
  "UTG+2",
  "LJ",
  "HJ",
  "CO",
  "BTN",
] as const;

export function TournamentHandBrowser({
  hands,
  selectedHandId,
  onSelectHand,
  onOpenHand,
}: {
  hands: readonly ImportedHand[];
  selectedHandId: string;
  onSelectHand(id: string): void;
  onOpenHand(id: string): void;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("any");
  const [street, setStreet] = useState("any");
  const grid = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => hands.map(presentHandBrowserRow), [hands]);
  const visibleRows = useMemo(
    () => filterHandBrowserRows(rows, { query, position, street }),
    [rows, query, position, street],
  );
  const selected = rows.find((row) => row.handId === selectedHandId);
  const selectedVisible = visibleRows.some((row) => row.handId === selectedHandId);
  const filtered = query.trim() !== "" || position !== "any" || street !== "any";

  function clearFilters() {
    setQuery("");
    setPosition("any");
    setStreet("any");
  }

  function move(from: number, direction: -1 | 1) {
    const next = from + direction;
    const row = visibleRows[next];
    if (!row) return;
    onSelectHand(row.handId);
    grid.current?.querySelectorAll<HTMLElement>("[data-hand-id]")[next]?.focus();
  }

  return (
    <section className="noc-hand-browser" aria-label="Tournament hand browser">
      <div className="noc-hand-browser__toolbar">
        <h2>Hands</h2>
        <NocturneSegmentedControl
          label="Hand states"
          className="noc-hand-browser__segments"
          value="all"
          onValueChange={() => undefined}
          options={[
            { value: "all", label: `All · ${rows.length}` },
            { value: "graded", label: "Graded · —", disabled: true },
            { value: "mistakes", label: "Mistakes · —", disabled: true },
            { value: "flagged", label: "Flagged · —", disabled: true },
            { value: "unreviewed", label: "Unreviewed · —", disabled: true },
          ]}
        />
        <NocturneSearchInput
          label="Search hands"
          className="noc-hand-browser__search"
          placeholder="Hand #, cards (AK, 77), spot"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </div>
      <div className="noc-hand-browser__filters">
        <label className="noc-hand-browser__select">
          <span>Position:</span>
          <select
            aria-label="Filter by position"
            value={position}
            onChange={(event) => setPosition(event.currentTarget.value)}
          >
            <option value="any">Any</option>
            {POSITION_ORDER.filter((item) =>
              rows.some((row) => row.position === item),
            ).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="noc-hand-browser__unavailable" disabled>
          Stack: —{" "}
          <span className="noc-visually-hidden">Effective stack unavailable</span>
        </button>
        <label className="noc-hand-browser__select">
          <span>Street:</span>
          <select
            aria-label="Filter by street"
            value={street}
            onChange={(event) => setStreet(event.currentTarget.value)}
          >
            <option value="any">Any</option>
            {STREETS.map((item) => (
              <option key={item} value={item}>
                {item[0]}
                {item.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="noc-hand-browser__unavailable" disabled>
          Grade: — <span className="noc-visually-hidden">Needs analysis</span>
        </button>
        {filtered && (
          <button
            type="button"
            className="noc-hand-browser__clear"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
        <span className="noc-hand-browser__count">
          Showing {visibleRows.length} of {rows.length} · source order
        </span>
      </div>
      <div
        className="noc-hand-browser__grid"
        role="grid"
        aria-label="Tournament hands"
        ref={grid}
      >
        <div className="noc-hand-browser__column-head" role="row">
          {[
            "Hand",
            "Cards",
            "Pos",
            "Spot",
            "Street",
            "Eff. stack",
            "Final pot",
            "Grade",
            "Status",
            "",
          ].map((label, index) => (
            <span
              role="columnheader"
              key={index}
              title={label === "Street" ? "Last recorded board street" : undefined}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="noc-hand-browser__scroll" role="rowgroup">
          {visibleRows.length === 0 && (
            <div className="noc-hand-browser__empty">
              <p>No hands match these filters</p>
            </div>
          )}
          {visibleRows.map((row, index) => (
            <HandTableRow
              key={row.handId}
              row={row}
              selected={row.handId === selectedHandId}
              tabStop={
                row.handId === selectedHandId || (!selectedVisible && index === 0)
              }
              onSelect={() => onSelectHand(row.handId)}
              onOpen={() => onOpenHand(row.handId)}
              onMove={(direction) => move(index, direction)}
            />
          ))}
        </div>
      </div>
      <div className="noc-hand-browser__selection">
        <span className="noc-hand-browser__hint">
          ↑↓ move · Space selects · Enter opens in Replayer
        </span>
        <div className="noc-hand-browser__selected-context">
          {selected && (
            <span>
              <strong>#{selected.handNumber}</strong> {selected.spot} ·{" "}
              {selected.street} · {selected.grade}
            </span>
          )}
          {selected && !selectedVisible && (
            <small>Selected hand is outside these results</small>
          )}
        </div>
        <NocturneButton
          onClick={() => selected && onOpenHand(selected.handId)}
          disabled={!selected}
        >
          Open in Replayer <span aria-hidden="true">→</span>
        </NocturneButton>
      </div>
    </section>
  );
}
