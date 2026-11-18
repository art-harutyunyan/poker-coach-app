import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ImportedTournament } from "../src/domain/handHistory";
import { parseGgTournament } from "../src/parsers/gg";
import {
  aggregatePokerMetrics,
  buildMetricAudit,
  deriveMetricInput,
} from "../src/domain/pokerMetrics";
import {
  METRIC_IDS,
  type MetricAuditRow,
  type PokerMetrics,
} from "../src/domain/pokerMetricTypes";

export function buildCorpusAudit(tournaments: readonly ImportedTournament[]): {
  counts: readonly { room: string; tournamentId: string; summary: PokerMetrics }[];
  rows: readonly MetricAuditRow[];
} {
  const rows: MetricAuditRow[] = [];
  const counts = [...tournaments]
    .sort((a, b) =>
      JSON.stringify([a.room, a.id]) < JSON.stringify([b.room, b.id]) ? -1 : 1,
    )
    .map((tournament) => {
      const inputs = tournament.hands.map((h) => deriveMetricInput(h, tournament.room));
      rows.push(...METRIC_IDS.flatMap((id) => buildMetricAudit(inputs, id)));
      return {
        room: tournament.room,
        tournamentId: tournament.id,
        summary: aggregatePokerMetrics(inputs),
      };
    });
  return { counts, rows };
}
export function writeCorpusAudit(out: string): void {
  const names = [
    "GG20260928-1307 - Daily Monster Stack 2.50.txt",
    "GG20260928-1905 - Fifty Stack 5.50.txt",
    "GG20261011-1700 - GGMasters 150, 1M GTD [2-Day Event].txt",
    "GG20260905-2102 - Daily Classic 10.txt",
  ];
  const tournaments = names.map((name) => {
    const parsed = parseGgTournament(
      readFileSync(resolve("tests/fixtures/gg", name), "utf8"),
    );
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
    return parsed.tournament;
  });
  const report = buildCorpusAudit(tournaments);
  mkdirSync(out, { recursive: true });
  writeFileSync(
    resolve(out, "counts.json"),
    JSON.stringify(report.counts, null, 2) + "\n",
  );
  writeFileSync(resolve(out, "rows.json"), JSON.stringify(report.rows, null, 2) + "\n");
}
