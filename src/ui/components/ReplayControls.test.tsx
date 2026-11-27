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

  it("offers compact named transport, a real start shortcut, and the existing privacy switch", () => {
    const onCursorChange = vi.fn();
    const setResultHidden = vi.fn();
    const hand = hands[0]!;
    const { rerender } = render(
      <ReplayControls
        hand={hand}
        currentStreet="FLOP"
        cursor={5}
        totalActions={10}
        resultHidden
        onCursorChange={onCursorChange}
        setResultHidden={setResultHidden}
      />,
    );

    expect(screen.getByRole("button", { name: "Start of hand" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Start of hand" }));
    expect(onCursorChange).toHaveBeenLastCalledWith(0);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onCursorChange).toHaveBeenLastCalledWith(4);
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(onCursorChange).toHaveBeenLastCalledWith(6);
    expect(screen.getByRole("switch", { name: "Hide result" })).toBeChecked();
    fireEvent.click(screen.getByRole("switch", { name: "Hide result" }));
    expect(setResultHidden).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("button", { name: /play|pause/i })).toBeNull();

    rerender(
      <ReplayControls
        hand={hand}
        currentStreet="PREFLOP"
        cursor={0}
        totalActions={10}
        resultHidden={false}
        onCursorChange={onCursorChange}
        setResultHidden={setResultHidden}
      />,
    );
    expect(screen.getByRole("button", { name: "Start of hand" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Hide result" })).not.toBeChecked();
  });

  it("ignores global arrow shortcuts while a dialog has focus", () => {
    const onCursorChange = vi.fn();
    render(
      <>
        <div
          role="dialog"
          aria-label="Import details"
          tabIndex={-1}
          data-testid="dialog"
        />
        <ReplayControls
          hand={hands[0]!}
          currentStreet="PREFLOP"
          cursor={5}
          totalActions={10}
          resultHidden
          onCursorChange={onCursorChange}
          setResultHidden={vi.fn()}
        />
      </>,
    );
    fireEvent.keyDown(screen.getByTestId("dialog"), { key: "ArrowRight" });
    expect(onCursorChange).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onCursorChange).toHaveBeenCalledWith(6);
  });
});
