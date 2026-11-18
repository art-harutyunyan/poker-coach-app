import type { ImportedTournament } from "../domain/handHistory";
import { aggregatePokerMetrics, deriveMetricInput } from "../domain/pokerMetrics";
import type { MetricInput, PokerMetrics } from "../domain/pokerMetricTypes";
import type { ParserWarning } from "../parsers/gg/diagnostics";

export interface LibraryEntry {
  key: string;
  tournament: ImportedTournament;
  warnings: readonly ParserWarning[];
  facts: readonly MetricInput[];
  metrics: PokerMetrics;
}

export type LibraryInsertResult =
  | { status: "added"; entry: LibraryEntry }
  | { status: "already-imported"; key: string }
  | { status: "conflict"; key: string; tournamentId: string };

export function tournamentKey(
  tournament: Pick<ImportedTournament, "room" | "id">,
): string {
  return JSON.stringify([tournament.room, tournament.id]);
}

function canonicalContent(value: unknown): string {
  return JSON.stringify(value, (_key, current: unknown) => {
    if (!current || typeof current !== "object" || Array.isArray(current))
      return current;
    return Object.fromEntries(
      Object.entries(current).sort(([a], [b]) => a.localeCompare(b)),
    );
  });
}

/** Pure insertion decision. The controller publishes a prepared entry atomically. */
export function prepareLibraryInsert(
  entries: readonly LibraryEntry[],
  tournament: ImportedTournament,
  warnings: readonly ParserWarning[],
): LibraryInsertResult {
  const key = tournamentKey(tournament);
  const existing = entries.find((entry) => entry.key === key);
  if (existing) {
    return canonicalContent(existing.tournament) === canonicalContent(tournament)
      ? { status: "already-imported", key }
      : { status: "conflict", key, tournamentId: tournament.id };
  }
  const facts = tournament.hands.map((hand) =>
    deriveMetricInput(hand, tournament.room),
  );
  return {
    status: "added",
    entry: {
      key,
      tournament,
      warnings,
      facts,
      metrics: aggregatePokerMetrics(facts),
    },
  };
}
