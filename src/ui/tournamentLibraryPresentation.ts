import type { LibraryEntry } from "../services/tournamentLibrary";

export type TournamentStatus =
  "ready" | "warning" | "analysing" | "unavailable" | "empty";
export type TournamentSegment = "all" | "analysed" | "needs-action";
export type TournamentDateSort = "newest" | "oldest";
export type TournamentWon =
  | { state: "unknown" }
  | { state: "zero"; amount: string }
  | { state: "verified"; amount: string };
export type TournamentAchievement = "winner" | "final-table" | "itm";

export interface TournamentLibraryItem {
  key: string;
  name: string;
  tournamentId: string;
  buyIn: string | null;
  won: TournamentWon;
  finish: string | null;
  achievement: TournamentAchievement | null;
  dateKey: string;
  dateLabel: string;
  format: string | null;
  handCount: number;
  status: TournamentStatus;
  statusLabel: string;
  mistakes: number | null;
  flagged: number | null;
}

export interface TournamentOverviewItem extends TournamentLibraryItem {
  source: string;
  dateTime: string;
  overviewStatusLabel: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function dateLabel(local: string): string {
  const [year, month, day] = local.slice(0, 10).split("-").map(Number);
  return `${day} ${MONTHS[month! - 1]} ${year}`;
}

function statusLabel(status: TournamentStatus): string {
  switch (status) {
    case "ready":
      return "Analysed";
    case "warning":
      return "Hands skipped";
    case "analysing":
      return "Analysing";
    case "unavailable":
      return "Analysis not available";
    case "empty":
      return "No usable hands";
  }
}

function overviewStatusLabel(status: TournamentStatus): string {
  switch (status) {
    case "ready":
      return "Imported · analysed";
    case "warning":
      return "Imported · hands skipped";
    case "analysing":
      return "Analysing";
    case "unavailable":
      return "Imported · analysis not available";
    case "empty":
      return "Imported · no usable hands";
  }
}

export function presentTournament(entry: LibraryEntry): TournamentLibraryItem {
  const { tournament } = entry;
  const status: TournamentStatus =
    tournament.hands.length === 0 ? "empty" : "unavailable";
  const local = tournament.timestampRange.first.local;
  return {
    key: entry.key,
    name: tournament.name,
    tournamentId: tournament.id,
    buyIn: tournament.buyIn
      ? `${tournament.buyIn.symbol}${(tournament.buyIn.amountMinor / 100).toFixed(2)}`
      : null,
    won: { state: "unknown" },
    finish: null,
    achievement: null,
    dateKey: local,
    dateLabel: dateLabel(local),
    format: tournament.format,
    handCount: tournament.hands.length,
    status,
    statusLabel: statusLabel(status),
    mistakes: null,
    flagged: null,
  };
}

export function presentTournamentOverview(entry: LibraryEntry): TournamentOverviewItem {
  const firstHandLocal = entry.tournament.timestampRange.first.local;
  const item = presentTournament(entry);
  return {
    ...item,
    source: entry.tournament.room,
    dateTime: `${dateLabel(firstHandLocal)}, ${firstHandLocal.slice(11, 16)}`,
    overviewStatusLabel: overviewStatusLabel(item.status),
  };
}

export function selectTournamentItems(
  entries: readonly LibraryEntry[],
  query: string,
  segment: TournamentSegment,
  direction: TournamentDateSort,
): TournamentLibraryItem[] {
  const term = query.trim().toLocaleLowerCase();
  return entries
    .map(presentTournament)
    .filter((item) => {
      if (segment === "analysed" && item.status !== "ready") return false;
      if (
        segment === "needs-action" &&
        item.status !== "warning" &&
        item.status !== "empty"
      )
        return false;
      return (
        !term ||
        [item.name, item.tournamentId, `#${item.tournamentId}`, item.buyIn ?? ""].some(
          (value) => value.toLocaleLowerCase().includes(term),
        )
      );
    })
    .sort((a, b) => {
      const dateOrder = a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0;
      if (dateOrder) return direction === "newest" ? -dateOrder : dateOrder;
      return a.tournamentId < b.tournamentId
        ? -1
        : a.tournamentId > b.tournamentId
          ? 1
          : 0;
    });
}

export function groupTournamentItems(
  items: readonly TournamentLibraryItem[],
  today: string,
): { label: string; items: TournamentLibraryItem[] }[] {
  const [year, month, day] = today.slice(0, 10).split("-").map(Number);
  const now = new Date(Date.UTC(year!, month! - 1, day!));
  const weekday = (now.getUTCDay() + 6) % 7;
  now.setUTCDate(now.getUTCDate() - weekday);
  const weekStart = now.toISOString().slice(0, 10);
  const groups = new Map<string, TournamentLibraryItem[]>();
  for (const item of items) {
    const date = item.dateKey.slice(0, 10);
    const label = date >= weekStart && date <= today ? "This week" : "Earlier";
    const group = groups.get(label) ?? [];
    group.push(item);
    groups.set(label, group);
  }
  return [...groups].map(([label, grouped]) => ({ label, items: grouped }));
}
