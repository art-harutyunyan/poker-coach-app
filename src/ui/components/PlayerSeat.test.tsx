import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hands } from "../../data/mockTournament";
import {
  buildAllInPreviewHand,
  buildMultiSeatPreviewHand,
} from "../../data/previewHands";
import { buildReplayState, findActionCursor } from "../../domain/replay";
import { PokerTable } from "./PokerTable";

const base = hands[0]!;
describe("approved PlayerSeat anatomy", () => {
  for (const count of [6, 8, 9] as const) {
    const hand = count === 6 ? base : buildMultiSeatPreviewHand(base, count);
    it(`${count}-max attaches badge, cards, action, chips and dealer to one seat`, () => {
      const state = buildReplayState(hand, findActionCursor(hand, "a-hero-call"));
      const { container } = render(
        <PokerTable hand={hand} replayState={state} resultHidden />,
      );
      expect(container.querySelectorAll(".player-seat")).toHaveLength(count);
      const current = container.querySelector(
        '.player-nameplate[aria-current="true"]',
      )!;
      expect(current).toHaveAccessibleName(/SB, Hero.*Current actor/);
      expect(current.querySelector(".player-position-badge")).toHaveTextContent("SB");
      expect(current.querySelectorAll(".player-cards .playingCard")).toHaveLength(2);
      expect(screen.queryByText(/^To act$/i)).not.toBeInTheDocument();
      const btn = container.querySelector('[data-position="BTN"]')!;
      expect(btn.querySelector(".player-action-slot .action-raise")).toHaveTextContent(
        "Raise to2.3 BB",
      );
      expect(btn.querySelector(".player-committed")).toHaveTextContent("2.3 BB");
      expect(btn.querySelector(".seat-dealer")).toHaveAccessibleName("Dealer button");
      expect(screen.getAllByLabelText("Hidden card")).toHaveLength(4);
      for (const folded of container.querySelectorAll(".is-folded")) {
        expect(folded.querySelector(".player-cards")).toBeNull();
        expect(folded.querySelector(".player-action-text")).toHaveTextContent("Fold");
        expect(folded.querySelector(".player-name")).not.toBeEmptyDOMElement();
        expect(folded.querySelector(".player-stack")).not.toBeEmptyDOMElement();
      }
    });
  }
  it("renders all-in with persistent action and cards but no actor highlight", () => {
    const hand = buildAllInPreviewHand(base);
    const state = buildReplayState(hand, findActionCursor(hand, "qa-bb-fold"));
    const { container } = render(
      <PokerTable hand={hand} replayState={state} resultHidden />,
    );
    const hero = container.querySelector(".is-hero")!;
    expect(hero).toHaveAttribute("data-state", "all-in");
    expect(hero).not.toHaveClass("is-acting");
    expect(hero.querySelector(".action-all-in")).toHaveTextContent("All-in19.5 BB");
    expect(hero.querySelectorAll(".playingCard")).toHaveLength(2);
  });
  it("clears ordinary prior-street actions and chips while folds persist", () => {
    const state = buildReplayState(base, findActionCursor(base, "a-hero-check-flop"));
    const { container } = render(
      <PokerTable hand={base} replayState={state} resultHidden />,
    );
    expect(container.querySelectorAll(".player-committed")).toHaveLength(0);
    expect(container.querySelectorAll(".action-raise, .action-call")).toHaveLength(0);
    expect(container.querySelectorAll(".action-fold")).toHaveLength(4);
    expect(
      within(screen.getByLabelText("Community cards")).getAllByLabelText(/./),
    ).toHaveLength(3);
  });
});
