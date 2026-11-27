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
  it("keeps the real action chip outside the plate and names seat state", () => {
    const state = buildReplayState(base, findActionCursor(base, "a-hero-call"));
    const { container } = render(
      <PokerTable hand={base} replayState={state} resultHidden />,
    );
    const hero = container.querySelector(".is-hero")!;
    const plate = hero.querySelector(".player-nameplate")!;
    expect(plate).toHaveTextContent("Your decision");
    expect(plate).toHaveAttribute("data-tone", "blinds");
    const btn = container.querySelector('[data-position="BTN"]')!;
    expect(btn.querySelector(".player-action-slot")).toHaveTextContent(
      "Raise to 2.3 BB",
    );
    expect(btn.querySelector(".player-nameplate .player-action-slot")).toBeNull();
    for (const folded of container.querySelectorAll(".is-folded")) {
      expect(folded.querySelector(".player-nameplate")).toHaveTextContent("Folded");
      expect(folded.querySelector(".player-cards")).toBeNull();
    }
  });
  it("shows a source-backed partial opponent reveal without inventing a second card", () => {
    const state = buildReplayState(base, 0);
    const opponent = state.seats.find((seat) => !seat.isHero)!;
    const partial = {
      ...state,
      seats: state.seats.map((seat) =>
        seat.id === opponent.id
          ? { ...seat, revealedCards: [base.heroHoleCards[0]!] }
          : seat,
      ),
    };
    const { container, rerender } = render(
      <PokerTable hand={base} replayState={partial} resultHidden={false} />,
    );
    const seat = container.querySelector(`[data-player-id="${opponent.id}"]`)!;
    expect(
      seat.querySelectorAll(".player-cards .playingCard:not(.cardBack)"),
    ).toHaveLength(1);
    expect(seat.querySelectorAll(".player-cards .cardBack")).toHaveLength(1);
    rerender(<PokerTable hand={base} replayState={partial} resultHidden />);
    expect(seat.querySelectorAll(".player-cards .cardBack")).toHaveLength(2);
  });
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
      expect(
        current.closest(".player-seat")!.querySelectorAll(".player-cards .playingCard"),
      ).toHaveLength(2);
      expect(screen.queryByText(/^To act$/i)).not.toBeInTheDocument();
      const btn = container.querySelector('[data-position="BTN"]')!;
      expect(btn.querySelector(".player-action-slot .action-raise")).toHaveTextContent(
        "Raise to 2.3 BB",
      );
      expect(btn.querySelector(".player-committed")).toHaveTextContent("2.3 BB");
      expect(btn.querySelector(".seat-dealer")).toHaveAccessibleName("Dealer button");
      expect(screen.getAllByLabelText("Face-down card")).toHaveLength(4);
      for (const folded of container.querySelectorAll(".is-folded")) {
        expect(folded.querySelector(".player-cards")).toBeNull();
        expect(folded.querySelector(".player-status")).toHaveTextContent("Folded");
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
    expect(hero.querySelector(".action-all-in")).toHaveTextContent("All-in 19.5 BB");
    expect(hero.querySelectorAll(".playingCard")).toHaveLength(2);
  });
  it("clears prior-street action chips while folded status persists", () => {
    const state = buildReplayState(base, findActionCursor(base, "a-hero-check-flop"));
    const { container } = render(
      <PokerTable hand={base} replayState={state} resultHidden />,
    );
    expect(container.querySelectorAll(".player-committed")).toHaveLength(0);
    expect(container.querySelectorAll(".action-raise, .action-call")).toHaveLength(0);
    expect(container.querySelectorAll(".action-fold")).toHaveLength(0);
    expect(
      container.querySelectorAll(".is-folded .player-status").length,
    ).toBeGreaterThan(0);
    expect(
      within(screen.getByLabelText("Community cards")).getAllByLabelText(/./),
    ).toHaveLength(3);
  });
  it("keeps dealer ownership with rotated Hero and unordered input players", () => {
    for (const count of [6, 8, 9] as const) {
      const source = count === 6 ? base : buildMultiSeatPreviewHand(base, count);
      for (const hero of source.players) {
        const hand = {
          ...source,
          players: [...source.players].reverse().map((player) => ({
            ...player,
            isHero: player.id === hero.id,
          })),
        };
        const { container, unmount } = render(
          <PokerTable
            hand={hand}
            replayState={buildReplayState(hand, 0)}
            resultHidden
          />,
        );
        expect(
          container.querySelector(".seat-dealer")!.closest(".player-seat"),
        ).toHaveAttribute("data-position", "BTN");
        expect(container.querySelector(".is-hero")).toHaveAttribute(
          "data-player-id",
          hero.id,
        );
        expect(
          container.querySelectorAll(".is-hero .playingCard:not(.cardBack)"),
        ).toHaveLength(2);
        expect(container.querySelector(".table-board")).toBeNull();
        expect(
          container.querySelector(".pokerStage img:not(.cardBack > img)"),
        ).toBeNull();
        unmount();
      }
    }
  });
});
