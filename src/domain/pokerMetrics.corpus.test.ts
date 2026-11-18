// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { buildCorpusAudit } from "../../scripts/audit-poker-metrics";
import { parseGgTournament } from "../parsers/gg";
import { fixtureNames, readFixture } from "../parsers/gg/fixtureTestUtils";
import { metricHand } from "./pokerMetricsTestUtils";
import { METRIC_IDS } from "./pokerMetricTypes";

const corpus = () =>
  fixtureNames.map((_, i) => {
    const parsed = parseGgTournament(readFixture(i));
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
    return parsed.tournament;
  });
describe("independently auditable corpus reports", () => {
  it("matches independently source-audited integer counts without regenerating goldens", () => {
    const expected = JSON.parse(
      readFileSync("docs/qa/phase-1c/1c1/metric-counts.json", "utf8"),
    );
    expect(buildCorpusAudit(corpus()).counts).toEqual(expected);
  }, 30_000);
  it("retains four tournament identities and 674 hands with stable cohort order", () => {
    const tournaments = corpus();
    const report = buildCorpusAudit(tournaments);
    expect(
      Object.fromEntries(
        report.counts.map((c) => [c.tournamentId, c.summary.importedHands]),
      ),
    ).toEqual({ 314729652: 222, 314806258: 191, 317697722: 28, 309704619: 233 });
    expect(report.counts.reduce((n, c) => n + c.summary.importedHands, 0)).toBe(674);
    corpus();
    expect(buildCorpusAudit([...tournaments].reverse())).toEqual(report);
    for (const count of report.counts)
      for (const metric of METRIC_IDS) {
        const m = count.summary.metrics[metric];
        expect(m.denominator + m.excluded + m.notOpportunity).toBe(
          count.summary.importedHands,
        );
        const rows = report.rows.filter(
          (r) => r.metric === metric && JSON.parse(r.key)[1] === count.tournamentId,
        );
        expect(rows.filter((r) => r.contribution.status === "eligible").length).toBe(
          m.denominator,
        );
        expect(
          rows.reduce(
            (n, r) =>
              n + (r.contribution.status === "eligible" ? r.contribution.numerator : 0),
            0,
          ),
        ).toBe(m.numerator);
        expect(m.percentage).toBe(
          m.denominator ? (100 * m.numerator) / m.denominator : null,
        );
      }
  }, 30_000);
  it("report plumbing preserves independently hand-counted synthetic values", () => {
    const template = corpus()[0]!;
    const hand1 = metricHand([["h", "FOLD"]], { id: "fold" });
    const hand2 = metricHand([["h", "RAISE", 300]], { id: "raise" });
    const report = buildCorpusAudit([
      { ...template, id: "test", handsPlayed: 2, hands: [hand1, hand2] },
    ]);
    expect(report.counts[0]!.summary.metrics.vpip).toMatchObject({
      numerator: 1,
      denominator: 2,
      percentage: 50,
    });
    expect(report.counts[0]!.summary.metrics.pfr).toMatchObject({
      numerator: 1,
      denominator: 2,
      percentage: 50,
    });
  });
  it("preserves pre-implementation immutable fixture bytes", () => {
    const lines = readFileSync("docs/qa/phase-1c/1c1/asset-sha256.txt", "utf8")
      .trim()
      .split(/\r?\n/);
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      const [hash, path] = line.trim().split(/ {2}/);
      expect(createHash("sha256").update(readFileSync(path!)).digest("hex")).toBe(hash);
    }
  });
});
