// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildHeroDecisionAudit } from "../../scripts/audit-hero-decisions";
import { parseGgTournament } from "../parsers/gg";
import { fixtureNames, readFixture } from "../parsers/gg/fixtureTestUtils";

function corpus() {
  return fixtureNames.map((_, index) => {
    const parsed = parseGgTournament(readFixture(index));
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
    return parsed.tournament;
  });
}

describe("A1 immutable GG corpus audit", () => {
  it("reconciles decisions and passes the extraction/Replay acceptance gate", () => {
    const report = buildHeroDecisionAudit(corpus());
    expect(report.totalHands).toBe(674);
    expect(Object.values(report.byStreet).reduce((sum, n) => sum + n, 0)).toBe(
      report.totalDecisions,
    );
    expect(Object.values(report.byAction).reduce((sum, n) => sum + n, 0)).toBe(
      report.totalDecisions,
    );
    expect(report.unexpectedFailures).toEqual([]);
    expect(report.replayDiscrepancies).toEqual([]);
    expect(report.unknownWithoutReason).toEqual([]);
    expect(report.totalDecisions).toBeGreaterThan(0);
    console.info(
      "A1 corpus audit",
      JSON.stringify({
        totalHands: report.totalHands,
        totalDecisions: report.totalDecisions,
        byStreet: report.byStreet,
        byAction: report.byAction,
        zeroDecisionHands: report.zeroDecisionHands.length,
        exclusions: report.exclusions.length,
        unknownCriticalReasons: report.unknownCriticalReasons,
        anomalies: report.anomalies,
        replayDiscrepancies: report.replayDiscrepancies.length,
      }),
    );
  }, 60_000);

  it("is independent of tournament input order", () => {
    const tournaments = corpus();
    const forward = buildHeroDecisionAudit(tournaments);
    const reversed = buildHeroDecisionAudit([...tournaments].reverse());
    expect(reversed).toEqual(forward);
  }, 90_000);

  it("preserves the four immutable GG fixture hashes", () => {
    const lines = readFileSync("docs/qa/phase-1c/1c1/asset-sha256.txt", "utf8")
      .trim()
      .split(/\r?\n/);
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      const [hash, path] = line.trim().split(/ {2}/);
      expect(createHash("sha256").update(readFileSync(path!)).digest("hex")).toBe(hash);
    }
  });

  it("identifies source-backed manual review candidates", () => {
    const report = buildHeroDecisionAudit(corpus());
    const ids = [
      "TM6376938342:line:3808",
      "TM6469820465:line:30",
      "TM6469820465:line:38",
      "TM6471062694:line:37",
      "TM6524471450:line:37",
      "TM6524471450:line:41",
      "TM6524471450:line:47",
      "TM6378370476:line:1478",
      "TM6470155563:line:8364",
    ];
    const sample = ids.map((id) => {
      const row = report.rows.find((candidate) => candidate.eventId === id);
      expect(row, id).toBeDefined();
      return { tournamentId: row!.tournamentId, context: row!.context };
    });
    const saved = JSON.parse(
      readFileSync("docs/qa/a1/representative-decisions.json", "utf8"),
    );
    expect(
      saved.map((row: { context: { eventId: string } }) => row.context.eventId),
    ).toEqual(ids);
    expect(sample).toHaveLength(ids.length);
    expect(
      sample.some(
        (row) =>
          row.context.street === "FLOP" && row.context.actualAction.kind === "RAISE",
      ),
    ).toBe(true);
    expect(
      sample.some(
        (row) => row.context.playersInHand > 2 && row.context.street !== "PREFLOP",
      ),
    ).toBe(true);
  }, 60_000);
});
