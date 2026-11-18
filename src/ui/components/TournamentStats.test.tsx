import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  METRIC_VERSION,
  type MetricAuditRow,
  type PokerMetrics,
} from "../../domain/pokerMetricTypes";
import { TournamentStats } from "./TournamentStats";

const summary = (numerator: number, denominator: number, excluded = 0) => ({
  numerator,
  denominator,
  percentage: denominator ? (numerator / denominator) * 100 : null,
  excluded,
  notOpportunity: 0,
  reasons: excluded ? { zero_stack_fold: excluded } : {},
});
const metrics: PokerMetrics = {
  definitionVersion: METRIC_VERSION,
  importedHands: 233,
  metrics: {
    vpip: summary(48, 232, 1),
    pfr: summary(38, 232, 1),
    threeBet: summary(13, 96, 2),
    sawFlop: summary(29, 232, 1),
    wtsd: summary(11, 29, 1),
    wsd: summary(8, 11, 1),
  },
};
const excludedRow: MetricAuditRow = {
  key: "k",
  handId: "TM6377256916",
  handNumber: 17,
  metric: "vpip",
  definitionVersion: METRIC_VERSION,
  contribution: { status: "excluded", reasons: ["zero_stack_fold"], evidence: [] },
};
const winningRow: MetricAuditRow = {
  key: "w",
  handId: "WINNING-HAND-SECRET",
  handNumber: 18,
  metric: "wsd",
  definitionVersion: METRIC_VERSION,
  contribution: { status: "eligible", numerator: 1, denominator: 1, evidence: [] },
};

describe("Tournament Stats", () => {
  it("shows neutral audited values, definitions and source-linked exclusions", () => {
    const onOpenHand = vi.fn();
    render(
      <TournamentStats
        metrics={metrics}
        outcomeVisible={false}
        onOutcomeVisibleChange={vi.fn()}
        auditRows={{ vpip: [excludedRow] }}
        onOpenHand={onOpenHand}
      />,
    );
    expect(screen.getByText("233 imported hands")).toBeVisible();
    expect(screen.getByText("Single-tournament sample")).toBeVisible();
    expect(screen.getByText("232 eligible for VPIP/PFR")).toBeVisible();
    const cards = screen.getAllByTestId("metric-card");
    expect(cards.map((card) => card.getAttribute("data-metric"))).toEqual([
      "vpip",
      "pfr",
      "threeBet",
      "sawFlop",
      "wtsd",
      "wsd",
    ]);
    expect(within(cards[0]!).getByText("20.7%")).toBeVisible();
    expect(within(cards[0]!).getByText("48 / 232 eligible hands")).toBeVisible();
    expect(within(cards[2]!).getByText("13 / 96 opportunities")).toBeVisible();
    expect(within(cards[4]!).getByText("WTSD · source-confirmed")).toBeVisible();
    expect(within(cards[0]!).getByText("Definition")).toHaveAccessibleName(
      "VPIP definition",
    );
    expect(within(cards[0]!).getByText("Coverage")).toHaveAccessibleName(
      "VPIP coverage",
    );
    expect(within(cards[4]!).getByText("Definition")).toHaveAccessibleName(
      "WTSD · source-confirmed definition",
    );
    fireEvent.click(within(cards[0]!).getByText("Definition"));
    expect(within(cards[0]!).getByText(/voluntary preflop/)).toBeVisible();
    fireEvent.click(within(cards[0]!).getByText("Coverage"));
    expect(within(cards[0]!).getByText(/1 excluded/)).toBeVisible();
    fireEvent.click(within(cards[0]!).getByRole("button", { name: /TM6377256916/ }));
    expect(onOpenHand).toHaveBeenCalledWith("TM6377256916");
    expect(document.querySelector(".tournamentStats")?.className).not.toMatch(
      /good|bad|green|red/,
    );
  });

  it("omits hidden outcome numbers and audit identities from the DOM", () => {
    const onOutcomeVisibleChange = vi.fn();
    render(
      <TournamentStats
        metrics={metrics}
        outcomeVisible={false}
        onOutcomeVisibleChange={onOutcomeVisibleChange}
        auditRows={{ wsd: [winningRow] }}
        onOpenHand={vi.fn()}
      />,
    );
    const card = screen.getAllByTestId("metric-card")[5]!;
    expect(within(card).getByText("Outcome stat hidden")).toBeVisible();
    expect(card.textContent).not.toMatch(/72\.7|8 \/ 11|WINNING-HAND-SECRET/);
    expect(card.outerHTML).not.toMatch(/72\.7|8 \/ 11|WINNING-HAND-SECRET/);
    fireEvent.click(within(card).getByRole("button", { name: "Show outcome stat" }));
    expect(onOutcomeVisibleChange).toHaveBeenCalledWith(true);
  });

  it("reveals real values explicitly and shows unavailable denominators honestly", () => {
    const empty: PokerMetrics = {
      ...metrics,
      importedHands: 0,
      metrics: { ...metrics.metrics, threeBet: summary(0, 0) },
    };
    render(
      <TournamentStats
        metrics={empty}
        outcomeVisible={true}
        onOutcomeVisibleChange={vi.fn()}
        auditRows={{ wsd: [winningRow] }}
        onOpenHand={vi.fn()}
      />,
    );
    expect(screen.getByText("0 imported hands")).toBeVisible();
    expect(screen.getByText("No eligible opportunities")).toBeVisible();
    expect(screen.getByText("—")).toBeVisible();
    const wsd = screen.getAllByTestId("metric-card")[5]!;
    expect(within(wsd).getByText("72.7%")).toBeVisible();
    expect(within(wsd).getByText("8 / 11 confirmed showdowns")).toBeVisible();
  });
});
