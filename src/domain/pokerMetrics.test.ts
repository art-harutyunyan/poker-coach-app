// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  aggregatePokerMetrics,
  buildMetricAudit,
  deriveMetricInput,
} from "./pokerMetrics";
import { METRIC_IDS, type MetricInput } from "./pokerMetricTypes";
import { metricHand, deepFreeze } from "./pokerMetricsTestUtils";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";

const derive = (hand = metricHand()) => deriveMetricInput(hand, "GG");
describe("auditable metric contributions and cohort aggregation", () => {
  it.each(["missing settlement", "partial settlement", "contradictory results"])(
    "%s cannot enter any metric denominator",
    (kind) => {
      const parsed = parseGgTournament(fixtureHand(0, "TM6468725291"));
      if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
      const hand = parsed.tournament.hands[0]!;
      if (kind === "missing settlement")
        hand.events = hand.events.filter((e) => e.type !== "COLLECT_POT");
      if (kind === "partial settlement")
        hand.events.find((e) => e.type === "COLLECT_POT")!.amountChips--;
      if (kind === "contradictory results") hand.results[0]!.finalStackChips++;
      for (const metric of Object.values(aggregatePokerMetrics([derive(hand)]).metrics))
        expect(metric).toMatchObject({ denominator: 0, excluded: 1 });
    },
  );
  it("a timed reveal alone cannot turn unknown Hero participation into W$SD eligibility", () => {
    const input = derive(
      metricHand(
        [
          ["a", "CALL", 100],
          ["s", "FOLD"],
          ["b", "CHECK"],
        ],
        { board: 5, show: ["h"], awards: [["a", 250]] },
      ),
    );
    expect(input.facts.sawFlop.status).toBe("unknown");
    expect(input.facts.heroShowdown).toMatchObject({
      status: "unknown",
      reasons: ["missing_preflop_decision"],
    });
    expect(input.facts.played.status).toBe("unknown");
    expect(aggregatePokerMetrics([input]).metrics.wsd).toMatchObject({
      numerator: 0,
      denominator: 0,
      excluded: 1,
    });
  });
  it("common E denominator distinguishes voluntary action from saw-flop", () => {
    const inputs = [
      derive(metricHand([["h", "FOLD"]], { id: "fold" })),
      derive(metricHand([["h", "CALL", 100]], { id: "limp" })),
      derive(metricHand([["h", "RAISE", 300]], { id: "open" })),
      derive(
        metricHand(
          [
            ["h", "CALL", 100],
            ["b", "CHECK"],
          ],
          { hero: "b", board: 5, id: "check" },
        ),
      ),
    ];
    const m = aggregatePokerMetrics(inputs).metrics;
    expect(m.vpip).toMatchObject({ numerator: 2, denominator: 4, percentage: 50 });
    expect(m.pfr).toMatchObject({ numerator: 1, denominator: 4, percentage: 25 });
    expect(m.sawFlop).toMatchObject({ numerator: 1, denominator: 4, percentage: 25 });
  });
  it("forced-post-all-in W$SD eligibility is independent of E", () => {
    const input = derive(
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "FOLD"],
          ["s", "FOLD"],
        ],
        { hero: "b", stacks: { b: 100 }, board: 5, show: ["b"], awards: [["b", 250]] },
      ),
    );
    const m = aggregatePokerMetrics([input]).metrics;
    expect(m.vpip).toMatchObject({
      numerator: 0,
      denominator: 0,
      excluded: 1,
      reasons: { forced_post_exhausted: 1 },
    });
    expect(m.wtsd).toMatchObject({ denominator: 0, excluded: 1 });
    expect(m.wsd).toMatchObject({ numerator: 1, denominator: 1, percentage: 100 });
  });
  it("WTSD excludes unknown reveals instead of interpreting them as non-showdown", () => {
    const inputs = [
      derive(metricHand([["h", "CALL", 100]], { board: 5, show: ["h"], id: "shown" })),
      derive(metricHand([["h", "CALL", 100]], { board: 5, id: "unknown" })),
      derive(
        metricHand(
          [
            ["h", "CALL", 100],
            ["h", "FOLD", 0, "FLOP"],
          ],
          { board: 3, id: "fold" },
        ),
      ),
    ];
    expect(aggregatePokerMetrics(inputs).metrics.wtsd).toMatchObject({
      numerator: 1,
      denominator: 2,
      percentage: 50,
      excluded: 1,
      reasons: { missing_hero_reveal: 1 },
    });
  });
  it.each([
    ["zero reconciled award", [["a", 750]], 0],
    [
      "positive share with net loss",
      [
        ["h", 100],
        ["a", 650],
      ],
      1,
    ],
    [
      "multiple awards",
      [
        ["h", 100],
        ["h", 50],
        ["a", 600],
      ],
      1,
    ],
  ] as const)("%s counts recorded share once", (_, awards, n) => {
    const hand = metricHand(
      [
        ["h", "RAISE", 300],
        ["a", "CALL", 300],
      ],
      { board: 5, show: ["h"], awards: awards.map(([id, chips]) => [id, chips]) },
    );
    expect(aggregatePokerMetrics([derive(hand)]).metrics.wsd).toMatchObject({
      numerator: n,
      denominator: 1,
    });
    if (n)
      expect(hand.results.find((r) => r.playerId === "h")!.netChips).toBeLessThan(0);
  });
  it("unequal 628/629 split counts either Hero as collecting a share", () => {
    for (const hero of ["h", "a"]) {
      const hand = metricHand(
        [
          ["h", "RAISE", 554],
          ["a", "CALL", 553],
        ],
        {
          hero,
          stacks: { a: 553 },
          board: 5,
          show: [hero],
          awards: [
            ["h", 628],
            ["a", 629],
          ],
        },
      );
      expect(aggregatePokerMetrics([derive(hand)]).metrics.wsd).toMatchObject({
        numerator: 1,
        denominator: 1,
      });
    }
  });
  it("refund is not collected winnings", () => {
    const hand = metricHand(
      [
        ["h", "RAISE", 1000],
        ["a", "CALL", 500],
        ["s", "FOLD"],
        ["b", "FOLD"],
        ["h", "RETURN_UNCALLED", 500],
      ],
      { stacks: { a: 500 }, board: 5, show: ["h"], awards: [["a", 1150]] },
    );
    expect(aggregatePokerMetrics([derive(hand)]).metrics.wsd).toMatchObject({
      numerator: 0,
      denominator: 1,
    });
    expect(derive(hand).facts.voluntaryPreflop).toMatchObject({
      status: "known",
      value: true,
    });
  });
  it.each(["missing award", "inconsistent results", "inconsistent summary"])(
    "%s excludes W$SD",
    (kind) => {
      const hand = metricHand([["h", "CALL", 100]], { board: 5, show: ["h"] });
      if (kind === "missing award")
        hand.events = hand.events.filter((e) => e.type !== "COLLECT_POT");
      if (kind === "inconsistent results") hand.results[0]!.collectedChips++;
      if (kind === "inconsistent summary") hand.summary.totalPotChips++;
      const m = aggregatePokerMetrics([derive(hand)]).metrics.wsd;
      expect(m.denominator).toBe(0);
      expect(m.excluded).toBe(1);
    },
  );
  it("one-card timed SHOW qualifies, summary-only does not", () => {
    const hand = metricHand([["h", "CALL", 100]], { board: 5, show: ["h"] });
    const show = hand.events.find((e) => e.type === "SHOW")!;
    if (show.type === "SHOW") show.cards.splice(1);
    expect(aggregatePokerMetrics([derive(hand)]).metrics.wsd.denominator).toBe(1);
    hand.events = hand.events.filter((e) => e.type !== "SHOW");
    expect(aggregatePokerMetrics([derive(hand)]).metrics.wsd).toMatchObject({
      denominator: 0,
      excluded: 1,
      reasons: { missing_hero_reveal: 1 },
    });
  });
  it("sums integer opportunities across cohorts rather than averaging rates", () => {
    const inputs = Array.from({ length: 10 }, (_, i) =>
      derive(
        metricHand(i === 0 || i === 2 ? [["h", "CALL", 100]] : [["h", "FOLD"]], {
          id: String(i),
        }),
      ),
    );
    expect(aggregatePokerMetrics(inputs.slice(0, 2)).metrics.vpip.percentage).toBe(50);
    expect(aggregatePokerMetrics(inputs.slice(2)).metrics.vpip.percentage).toBe(12.5);
    expect(aggregatePokerMetrics(inputs).metrics.vpip).toMatchObject({
      numerator: 2,
      denominator: 10,
      percentage: 20,
    });
  });
  it("empty opportunities are null; audits partition every input with deduplicated reasons", () => {
    for (const m of Object.values(aggregatePokerMetrics([]).metrics))
      expect(m).toMatchObject({
        numerator: 0,
        denominator: 0,
        percentage: null,
        excluded: 0,
        notOpportunity: 0,
      });
    const inputs = [
      derive(metricHand()),
      derive(
        metricHand(
          [
            ["a", "RAISE", 300],
            ["h", "CALL", 300],
          ],
          { id: "call" },
        ),
      ),
    ];
    inputs[0]!.facts.eligiblePreflop = {
      status: "unknown",
      reasons: ["zero_stack_fold", "zero_stack_fold"],
      evidence: [],
    };
    const result = aggregatePokerMetrics(inputs);
    expect(result.metrics.vpip.reasons).toEqual({ zero_stack_fold: 1 });
    for (const metric of METRIC_IDS) {
      const rows = buildMetricAudit(inputs, metric);
      const m = result.metrics[metric];
      expect(m.denominator + m.excluded + m.notOpportunity).toBe(2);
      expect(
        rows.reduce(
          (n, r) =>
            n + (r.contribution.status === "eligible" ? r.contribution.numerator : 0),
          0,
        ),
      ).toBe(m.numerator);
      expect(rows.filter((r) => r.contribution.status === "eligible").length).toBe(
        m.denominator,
      );
      expect(rows[0]).toMatchObject({
        definitionVersion: "phase1c-v1",
        metric,
        handNumber: 1,
      });
    }
  });
  it("rejects overlapping cohorts and mixed versions explicitly", () => {
    const input = derive();
    expect(() => aggregatePokerMetrics([input, input])).toThrow(
      expect.objectContaining({ code: "duplicate_hand" }),
    );
    expect(() => buildMetricAudit([input, input], "vpip")).toThrow(
      expect.objectContaining({ code: "duplicate_hand" }),
    );
    const bad = structuredClone(input);
    Object.assign(bad.facts, { definitionVersion: "future" });
    expect(() => aggregatePokerMetrics([bad])).toThrow(
      expect.objectContaining({ code: "definition_mismatch" }),
    );
  });
  it("rejects invalid integer contributions instead of corrupting counts", () => {
    const bad = derive();
    Object.assign(bad, {
      threeBet: { status: "eligible", numerator: 2, denominator: 1, evidence: [] },
    });
    expect(() => aggregatePokerMetrics([bad])).toThrow(
      expect.objectContaining({ code: "unsafe_count" }),
    );
  });
  it("cohort order and intervening calculations cannot change immutable outputs", () => {
    const inputs = deepFreeze([
      derive(metricHand(undefined, { id: "a" })),
      derive(metricHand([["h", "CALL", 100]], { id: "b" })),
    ]);
    const result = aggregatePokerMetrics(inputs);
    const rows = buildMetricAudit(inputs, "vpip");
    aggregatePokerMetrics([]);
    expect(aggregatePokerMetrics([...inputs].reverse())).toEqual(result);
    expect(buildMetricAudit([...inputs].reverse(), "vpip")).toEqual(rows);
    const other = structuredClone(inputs[0]!) as MetricInput;
    other.facts.key = "another-room-same-id";
    expect(aggregatePokerMetrics([inputs[0]!, other]).importedHands).toBe(2);
  });
});
