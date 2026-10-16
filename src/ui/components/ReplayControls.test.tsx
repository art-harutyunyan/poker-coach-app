import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { hands } from "../../data/mockTournament";
import { buildMultiSeatPreviewHand } from "../../data/previewHands";
import { findActionCursor } from "../../domain/replay";
import { ReplayControls } from "./ReplayControls";

describe("street navigation", () => {
  for (const size of [6, 8, 9] as const) {
    it(`uses the existing ${size}-max cursor at street boundaries`, () => {
      const hand = size === 6 ? hands[0]! : buildMultiSeatPreviewHand(hands[0]!, size);
      const onCursorChange = vi.fn();
      render(
        <ReplayControls
          hand={hand}
          currentStreet="FLOP"
          cursor={findActionCursor(hand, "a-hero-check-flop")}
          totalActions={findActionCursor(hand, "a-hero-win")}
          resultHidden
          onCursorChange={onCursorChange}
          setResultHidden={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "Flop" })).toHaveAttribute(
        "aria-current",
        "step",
      );
      fireEvent.click(screen.getByRole("button", { name: "Turn" }));
      expect(onCursorChange).toHaveBeenLastCalledWith(
        findActionCursor(hand, "a-hero-check-turn"),
      );
      fireEvent.click(screen.getByRole("button", { name: "River" }));
      expect(onCursorChange).toHaveBeenLastCalledWith(
        findActionCursor(hand, "a-hero-bet-river"),
      );
      fireEvent.click(screen.getByRole("button", { name: "Preflop" }));
      expect(onCursorChange).toHaveBeenLastCalledWith(0);
    });
  }

  it("disables unavailable streets without synthesizing actions", () => {
    const hand = { ...hands[0]!, streets: [hands[0]!.streets[0]!] };
    render(
      <ReplayControls
        hand={hand}
        currentStreet="PREFLOP"
        cursor={0}
        totalActions={14}
        resultHidden
        onCursorChange={vi.fn()}
        setResultHidden={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Flop" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });
});
