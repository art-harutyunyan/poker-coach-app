import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HandFilterResult } from "../../domain/handFilters";
import { HandFilterControls, type SourceReviewHand } from "./HandFilterControls";

const result: HandFilterResult = {
  ids: ["h2", "h4"],
  total: 4,
  counts: { all: 4, played: 2, postflop: 1, showdown: 1 },
  unknown: { all: 0, played: 1, postflop: 1, showdown: 1 },
};

const reviewHands: readonly SourceReviewHand[] = [
  {
    handId: "TM6377256916",
    handNumber: 17,
    reasons: ["zero_stack_fold"],
    sourceLine: 4883,
  },
];

describe("navigator-local hand filters", () => {
  it("exposes source-review reasons and opens an affected hand without changing the filter", () => {
    const onOpenHand = vi.fn();
    const onFilterChange = vi.fn();
    render(
      <HandFilterControls
        result={result}
        filter="played"
        currentHandId="h2"
        onFilterChange={onFilterChange}
        onNavigate={vi.fn()}
        previousId={null}
        nextId="h4"
        reviewHands={reviewHands}
        onOpenHand={onOpenHand}
      />,
    );
    const disclosure = screen.getByText("1 hand needs source review");
    expect(disclosure).toBeVisible();
    expect(disclosure.closest("details")).not.toHaveAttribute("open");
    fireEvent.click(disclosure);
    expect(disclosure.closest("details")).toHaveAttribute("open");
    expect(screen.getByText(/Hand #17.*TM6377256916/)).toBeVisible();
    expect(screen.getByText("zero_stack_fold")).toBeVisible();
    expect(
      screen.getByText(/folded after forced posts left them with no chips/i),
    ).toBeVisible();
    expect(screen.getByText("Source line 4883")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Open hand #17 in Replayer" }));
    expect(onOpenHand).toHaveBeenCalledWith("TM6377256916");
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it("shows all four neutral controls and source counts", () => {
    const onFilterChange = vi.fn();
    render(
      <HandFilterControls
        result={result}
        filter="played"
        currentHandId="h2"
        onFilterChange={onFilterChange}
        onNavigate={vi.fn()}
        previousId={null}
        nextId="h4"
        reviewHands={reviewHands}
        onOpenHand={vi.fn()}
      />,
    );
    for (const [name, count] of [
      ["All", 4],
      ["Played", 2],
      ["Postflop", 1],
      ["Showdown", 1],
    ] as const) {
      expect(
        screen.getByRole("button", { name: new RegExp(`${name} ${count} / 4`) }),
      ).toBeVisible();
    }
    expect(screen.getByRole("button", { name: /Played 2 \/ 4/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /Postflop 1 \/ 4/ }));
    expect(onFilterChange).toHaveBeenCalledWith("postflop");
    expect(screen.getByText("1 of 2")).toBeVisible();
    expect(screen.getByText("1 hand needs source review")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Previous filtered hand" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next filtered hand" })).toBeEnabled();
  });

  it("keeps an excluded current hand visible and offers Show all hands", () => {
    const onFilterChange = vi.fn();
    render(
      <HandFilterControls
        result={result}
        filter="played"
        currentHandId="h1"
        onFilterChange={onFilterChange}
        onNavigate={vi.fn()}
        previousId={null}
        nextId="h2"
        reviewHands={reviewHands}
        onOpenHand={vi.fn()}
      />,
    );
    expect(screen.getByText("Current hand is outside this filter")).toBeVisible();
    expect(screen.queryByText(/of 2/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all hands" }));
    expect(onFilterChange).toHaveBeenCalledWith("all");
  });

  it("announces an empty match set without invoking disabled navigation", () => {
    const onNavigate = vi.fn();
    render(
      <HandFilterControls
        result={{ ...result, ids: [], counts: { ...result.counts, showdown: 0 } }}
        filter="showdown"
        currentHandId="h1"
        onFilterChange={vi.fn()}
        onNavigate={onNavigate}
        previousId={null}
        nextId={null}
        reviewHands={reviewHands}
        onOpenHand={vi.fn()}
      />,
    );
    expect(screen.getByText("No hands match this filter")).toBeVisible();
    expect(screen.getByRole("button", { name: "Show all hands" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next filtered hand" }));
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
