import { useEffect, useRef, useState } from "react";
import {
  buildReplayState,
  findCollectionCursor,
  type ReplayState,
} from "../domain/replay";
import { toReplayHand, type ReplayAdaptation } from "../domain/replayAdapter";
import type { ImportedTournament } from "../domain/handHistory";
import { adjacentFilteredHandId, type HandFilter } from "../domain/handFilters";
import type { ParserWarning } from "../parsers/gg/diagnostics";
import {
  importTournamentFile,
  type ImportFailure,
  type ImportOutcome,
} from "../services/tournamentImport";
import { prepareLibraryInsert, type LibraryEntry } from "../services/tournamentLibrary";
import type { TournamentTab } from "./components/TournamentTabs";

export interface ReadyImportState {
  status: "ready";
  tournament: ImportedTournament;
  warnings: readonly ParserWarning[];
  selectedHandId: string;
  replay: ReplayAdaptation;
  frame: ReplayState;
  resultHidden: boolean;
}
export interface TournamentViewState {
  selectedHandId: string;
  activeTab: TournamentTab;
  cursor: number;
  resultHidden: boolean;
  activeFilter: HandFilter;
  outcomeStatsVisible: boolean;
}
export type ImportAttempt =
  | { status: "idle" }
  | { status: "reading"; fileName: string }
  | { status: "error"; error: ImportFailure }
  | { status: "conflict"; tournamentId: string }
  | { status: "complete"; key: string; duplicate: boolean };
export type LibraryView = { kind: "library" } | { kind: "tournament"; key: string };
type EntryView = {
  ready: ReadyImportState;
  activeTab: TournamentTab;
  activeFilter: HandFilter;
  outcomeStatsVisible: boolean;
};
interface SessionData {
  entries: readonly LibraryEntry[];
  attempt: ImportAttempt;
  view: LibraryView;
  entryViews: Readonly<Record<string, EntryView>>;
  replayError: { key: string; handId: string; message: string } | null;
}
export interface TournamentImportSession {
  entries: readonly LibraryEntry[];
  attempt: ImportAttempt;
  view: LibraryView;
  selected: ReadyImportState | null;
  activeEntry: LibraryEntry | null;
  activeTab: TournamentTab | null;
  activeFilter: HandFilter | null;
  outcomeStatsVisible: boolean | null;
  replayError: SessionData["replayError"];
  importFile(file: File): Promise<void>;
  cancelPendingImport(): void;
  resetImportAttempt(): void;
  openTournament(key: string, tab?: TournamentTab): boolean;
  showLibrary(): void;
  setTab(tab: TournamentTab): void;
  selectHand(id: string): boolean;
  setHandFilter(filter: HandFilter): void;
  navigateFilteredHand(direction: "previous" | "next"): boolean;
  setCursor(cursor: number): void;
  setResultHidden(hidden: boolean): void;
  setOutcomeStatsVisible(visible: boolean): void;
  reportIntegrationError(): void;
}
const INITIAL: SessionData = {
  entries: [],
  attempt: { status: "idle" },
  view: { kind: "library" },
  entryViews: {},
  replayError: null,
};
const DISPLAY_ERROR =
  "This hand could not be displayed. Choose another hand or tournament.";
const IMPORT_ERROR: ImportFailure = {
  kind: "integration",
  message: "This tournament could not be prepared. Please try another file.",
};
function readyFor(entry: LibraryEntry, handId: string): ReadyImportState {
  const source = entry.tournament.hands.find((hand) => hand.id === handId);
  if (!source) throw new Error("Missing selected hand");
  const replay = toReplayHand(source);
  return {
    status: "ready",
    tournament: entry.tournament,
    warnings: entry.warnings,
    selectedHandId: handId,
    replay,
    frame: buildReplayState(replay.hand, 0),
    resultHidden: true,
  };
}
export function useTournamentImport(
  readImport: (file: File) => Promise<ImportOutcome> = importTournamentFile,
): TournamentImportSession {
  const [state, setState] = useState<SessionData>(INITIAL);
  const current = useRef(state);
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    const activeGeneration = generation;
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeGeneration.current++;
    };
  }, []);
  const publish = (next: SessionData) => {
    current.current = next;
    if (mounted.current) setState(next);
  };
  const activeKey = state.view.kind === "tournament" ? state.view.key : null;
  const activeView = activeKey ? state.entryViews[activeKey] : undefined;
  const activeEntry = state.entries.find((entry) => entry.key === activeKey) ?? null;
  const reportError = (key: string, handId: string) => {
    publish({
      ...current.current,
      replayError: { key, handId, message: DISPLAY_ERROR },
    });
  };
  const withActive = (change: (record: EntryView, key: string) => EntryView | null) => {
    const previous = current.current;
    if (previous.view.kind !== "tournament") return;
    const key = previous.view.key;
    const record = previous.entryViews[key];
    if (!record) return;
    const next = change(record, key);
    if (!next) return;
    publish({
      ...previous,
      entryViews: { ...previous.entryViews, [key]: next },
      replayError: null,
    });
  };
  return {
    entries: state.entries,
    attempt: state.attempt,
    view: state.view,
    selected: activeView?.ready ?? null,
    activeEntry,
    activeTab: activeView?.activeTab ?? null,
    activeFilter: activeView?.activeFilter ?? null,
    outcomeStatsVisible: activeView?.outcomeStatsVisible ?? null,
    replayError: state.replayError,
    async importFile(file) {
      const identity = ++generation.current;
      publish({
        ...current.current,
        attempt: { status: "reading", fileName: file.name },
      });
      try {
        const outcome = await readImport(file);
        if (identity !== generation.current || !mounted.current) return;
        if (!outcome.ok) {
          publish({
            ...current.current,
            attempt: { status: "error", error: outcome.error },
          });
          return;
        }
        const prior = current.current;
        const decision = prepareLibraryInsert(
          prior.entries,
          outcome.tournament,
          outcome.warnings,
        );
        if (decision.status === "already-imported") {
          publish({
            ...prior,
            attempt: { status: "complete", key: decision.key, duplicate: true },
          });
        } else if (decision.status === "conflict") {
          publish({
            ...prior,
            attempt: { status: "conflict", tournamentId: decision.tournamentId },
          });
        } else {
          const first = decision.entry.tournament.hands[0];
          if (!first) throw new Error("No imported hands");
          const ready = readyFor(decision.entry, first.id);
          publish({
            ...prior,
            entries: [decision.entry, ...prior.entries],
            entryViews: {
              ...prior.entryViews,
              [decision.entry.key]: {
                ready,
                activeTab: "overview",
                activeFilter: "all",
                outcomeStatsVisible: false,
              },
            },
            attempt: { status: "complete", key: decision.entry.key, duplicate: false },
          });
        }
      } catch {
        if (identity === generation.current && mounted.current)
          publish({
            ...current.current,
            attempt: { status: "error", error: IMPORT_ERROR },
          });
      }
    },
    cancelPendingImport() {
      if (current.current.attempt.status !== "reading") return;
      generation.current++;
      publish({ ...current.current, attempt: { status: "idle" } });
    },
    resetImportAttempt() {
      generation.current++;
      publish({ ...current.current, attempt: { status: "idle" } });
    },
    openTournament(key, tab) {
      const previous = current.current;
      const record = previous.entryViews[key];
      if (!record || !previous.entries.some((entry) => entry.key === key)) return false;
      publish({
        ...previous,
        view: { kind: "tournament", key },
        entryViews: tab
          ? { ...previous.entryViews, [key]: { ...record, activeTab: tab } }
          : previous.entryViews,
        replayError: null,
      });
      return true;
    },
    showLibrary() {
      publish({ ...current.current, view: { kind: "library" } });
    },
    setTab(tab) {
      withActive((record) => ({ ...record, activeTab: tab }));
    },
    setHandFilter(filter) {
      withActive((record) =>
        record.activeFilter === filter ? null : { ...record, activeFilter: filter },
      );
    },
    navigateFilteredHand(direction) {
      const previous = current.current;
      if (previous.view.kind !== "tournament") return false;
      const key = previous.view.key;
      const record = previous.entryViews[key];
      const entry = previous.entries.find((item) => item.key === key);
      if (!record || !entry) return false;
      const nextId = adjacentFilteredHandId(
        entry.facts.map((item) => item.facts),
        record.activeFilter,
        record.ready.selectedHandId,
        direction,
      );
      if (!nextId) return false;
      try {
        const ready = readyFor(entry, nextId);
        publish({
          ...previous,
          entryViews: {
            ...previous.entryViews,
            [key]: { ...record, ready, outcomeStatsVisible: false },
          },
          replayError: null,
        });
        return true;
      } catch {
        reportError(key, nextId);
        return false;
      }
    },
    selectHand(id) {
      const previous = current.current;
      if (previous.view.kind !== "tournament") return false;
      const key = previous.view.key;
      const entry = previous.entries.find((item) => item.key === key);
      if (!entry || !entry.tournament.hands.some((hand) => hand.id === id))
        return false;
      try {
        const ready = readyFor(entry, id);
        publish({
          ...previous,
          entryViews: {
            ...previous.entryViews,
            [key]: { ...previous.entryViews[key]!, ready, outcomeStatsVisible: false },
          },
          replayError: null,
        });
        return true;
      } catch {
        reportError(key, id);
        return false;
      }
    },
    setCursor(cursor) {
      if (!Number.isSafeInteger(cursor)) return;
      withActive((record, key) => {
        const ready = record.ready;
        const limit = ready.resultHidden
          ? findCollectionCursor(ready.replay.hand)
          : ready.frame.totalActions;
        try {
          return {
            ...record,
            ready: {
              ...ready,
              frame: buildReplayState(
                ready.replay.hand,
                Math.max(0, Math.min(cursor, limit)),
              ),
            },
          };
        } catch {
          reportError(key, ready.selectedHandId);
          return null;
        }
      });
    },
    setOutcomeStatsVisible(visible) {
      withActive((record) =>
        record.outcomeStatsVisible === visible
          ? null
          : { ...record, outcomeStatsVisible: visible },
      );
    },
    setResultHidden(hidden) {
      withActive((record, key) => {
        const ready = record.ready;
        const cursor = hidden
          ? Math.min(ready.frame.cursor, findCollectionCursor(ready.replay.hand))
          : ready.frame.cursor;
        try {
          return {
            ...record,
            outcomeStatsVisible: hidden ? false : record.outcomeStatsVisible,
            ready: {
              ...ready,
              resultHidden: hidden,
              frame: buildReplayState(ready.replay.hand, cursor),
            },
          };
        } catch {
          reportError(key, ready.selectedHandId);
          return null;
        }
      });
    },
    reportIntegrationError() {
      const previous = current.current;
      if (previous.view.kind !== "tournament") return;
      const ready = previous.entryViews[previous.view.key]?.ready;
      if (ready) reportError(previous.view.key, ready.selectedHandId);
    },
  };
}
