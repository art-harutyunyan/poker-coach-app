import { ArrowDown, ArrowUp, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import type { LibraryEntry } from "../../services/tournamentLibrary";
import {
  NocturneButton,
  NocturneEmptyState,
  NocturneSearchInput,
  NocturneSegmentedControl,
  NocturneSurface,
} from "../design/NocturnePrimitives";
import {
  groupTournamentItems,
  presentTournament,
  selectTournamentItems,
  type TournamentDateSort,
  type TournamentSegment,
} from "../tournamentLibraryPresentation";
import { TournamentListItem } from "./TournamentListItem";
import type { TournamentTab } from "./TournamentTabs";

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function TournamentLibrary({
  entries,
  selectedKey = null,
  onOpen,
  onImport,
}: {
  entries: readonly LibraryEntry[];
  selectedKey?: string | null;
  onOpen(key: string, tab: TournamentTab): void;
  onImport(): void;
}) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<TournamentSegment>("all");
  const [sort, setSort] = useState<TournamentDateSort>("newest");
  const available = useMemo(() => entries.map(presentTournament), [entries]);
  const hasAnalysed = available.some((item) => item.status === "ready");
  const hasNeedsAction = available.some(
    (item) => item.status === "warning" || item.status === "empty",
  );
  const visible = useMemo(
    () => selectTournamentItems(entries, query, segment, sort),
    [entries, query, segment, sort],
  );
  const groups = groupTournamentItems(visible, todayLocal());
  const totalHands = entries.reduce(
    (sum, entry) => sum + entry.tournament.hands.length,
    0,
  );

  return (
    <NocturneSurface
      className="tournamentLibrary"
      role="region"
      aria-label="Tournament Library"
    >
      <div className="tournamentLibraryHeader">
        <div className="tournamentLibraryTitle">
          <h2 aria-label="Tournament Library">Tournaments</h2>
          <span aria-label={`${entries.length} tournaments`}>{entries.length}</span>
        </div>
        <NocturneButton className="tournamentLibraryImport" onClick={onImport}>
          <Upload size={16} aria-hidden="true" /> Import
        </NocturneButton>
      </div>
      <div className="tournamentLibraryControls">
        <NocturneSearchInput
          className="tournamentLibrarySearch"
          label="Search tournaments"
          placeholder="Name, ID or buy-in"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <div className="tournamentLibraryFilterBar">
          <NocturneSegmentedControl
            className="tournamentLibrarySegments"
            label="Tournament filter"
            options={[
              { value: "all", label: "All" },
              { value: "analysed", label: "Analysed", disabled: !hasAnalysed },
              {
                value: "needs-action",
                label: "Needs action",
                disabled: !hasNeedsAction,
              },
            ]}
            value={segment}
            onValueChange={(next) => setSegment(next as TournamentSegment)}
          />
          <button
            className="tournamentLibrarySort"
            type="button"
            aria-label={`Date: ${sort === "newest" ? "newest first" : "oldest first"}`}
            onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
          >
            Date {sort === "newest" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          </button>
        </div>
        {query && visible.length > 0 && (
          <button
            className="tournamentLibraryClear"
            type="button"
            onClick={() => setQuery("")}
          >
            Clear search
          </button>
        )}
      </div>
      <div className="tournamentLibraryList">
        {entries.length === 0 ? (
          <NocturneEmptyState
            headingLevel={3}
            title="No imported tournaments yet"
            description="Import a GG hand history to review its hands."
            actions={
              <NocturneButton onClick={onImport}>Import .txt files</NocturneButton>
            }
          />
        ) : visible.length === 0 ? (
          <NocturneEmptyState
            headingLevel={3}
            title={
              query
                ? `No tournaments match “${query}”`
                : "No tournaments match this filter"
            }
            description="Try another name, tournament ID, or buy-in."
            actions={
              <NocturneButton
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setSegment("all");
                }}
              >
                Clear search
              </NocturneButton>
            }
          />
        ) : (
          groups.map((group) => (
            <div className="tournamentLibraryGroup" key={group.label}>
              <h3>{group.label}</h3>
              {group.items.map((item) => (
                <TournamentListItem
                  key={item.key}
                  item={item}
                  selected={item.key === selectedKey}
                  onOpen={(tab) => onOpen(item.key, tab)}
                />
              ))}
            </div>
          ))
        )}
      </div>
      <footer className="tournamentLibraryFooter">
        <div>
          {entries.length} {entries.length === 1 ? "tournament" : "tournaments"} ·{" "}
          {totalHands} {totalHands === 1 ? "hand" : "hands"}
        </div>
        <p>Stored in this session only</p>
        <p className="tournamentLibraryRefreshNote">
          Closing or refreshing this page clears imports.
        </p>
      </footer>
    </NocturneSurface>
  );
}
