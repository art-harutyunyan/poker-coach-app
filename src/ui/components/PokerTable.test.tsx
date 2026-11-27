import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseGgTournament } from "../../parsers/gg";
import { fixtureHand } from "../../parsers/gg/fixtureTestUtils";
import { toReplayHand } from "../../domain/replayAdapter";
import {
  buildReplayState,
  flattenActions,
  findCollectionCursor,
  findStreetCursor,
} from "../../domain/replay";
import { PokerTable } from "./PokerTable";
import { ReplayControls } from "./ReplayControls";

function projected(index: number, id: string) {
  const result = parseGgTournament(fixtureHand(index, id));
  if (!result.ok) throw new Error("Invalid fixture");
  return toReplayHand(result.tournament.hands[0]!).hand;
}

it("keeps the current actor, controls, and real action progress in one replay dock", () => {
  const hand = projected(0, "TM6469820465");
  const state = buildReplayState(hand, 2);
  const { rerender } = render(
    <PokerTable
      hand={hand}
      replayState={state}
      resultHidden
      controls={
        <ReplayControls
          hand={hand}
          cursor={state.cursor}
          currentStreet={state.currentStreet}
          totalActions={state.totalActions}
          resultHidden
          onCursorChange={vi.fn()}
          setResultHidden={vi.fn()}
        />
      }
    />,
  );
  const dock = screen.getByRole("group", { name: "Replay dock" });
  expect(
    within(dock).getByRole("navigation", { name: "Replay streets and showdown" }),
  ).toBeVisible();
  expect(
    within(dock).getByRole("progressbar", { name: "Replay action progress" }),
  ).toHaveAttribute("aria-valuenow", "2");
  expect(dock).toHaveTextContent(`Action 2 / ${state.totalActions}`);
  expect(dock).toHaveTextContent("Next to act:");

  const next = buildReplayState(hand, 3);
  rerender(<PokerTable hand={hand} replayState={next} resultHidden />);
  expect(
    screen.getByRole("progressbar", { name: "Replay action progress" }),
  ).toHaveAttribute("aria-valuenow", "3");
});

describe("source replay rendering and privacy", () => {
  it("navigates before SHOW without consuming it and disables disallowed boundaries", () => {
    const hand = projected(0, "TM6468725291"),
      change = vi.fn();
    const props = {
      hand,
      cursor: 0,
      currentStreet: "PREFLOP" as const,
      resultHidden: false,
      setResultHidden: vi.fn(),
      onCursorChange: change,
    };
    const { rerender } = render(<ReplayControls {...props} totalActions={29} />);
    fireEvent.click(screen.getByRole("button", { name: "Showdown" }));
    expect(change).toHaveBeenCalledWith(22);
    rerender(<ReplayControls {...props} cursor={22} totalActions={29} />);
    expect(screen.getByRole("button", { name: "Showdown" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(change).toHaveBeenLastCalledWith(23);
    rerender(<ReplayControls {...props} totalActions={21} />);
    expect(screen.getByRole("button", { name: "Showdown" })).toBeDisabled();
    const noBoundary = {
      ...hand,
      streets: hand.streets.map((s) => ({
        ...s,
        actions: s.actions.filter((a) => a.type !== "SHOW" && a.type !== "SHOWDOWN"),
      })),
    };
    rerender(<ReplayControls {...props} hand={noBoundary} totalActions={29} />);
    expect(screen.getByRole("button", { name: "Showdown" })).toBeDisabled();
  });
  it("shows a supplied alias with exact source traceability and unchanged identity", () => {
    const hand = projected(0, "TM6468725291");
    const player = hand.players.find((p) => p.name === "ad116bad")!;
    const { container } = render(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, 0)}
        resultHidden
        opponentAliases={{ [player.id]: "Alex" }}
      />,
    );
    const seat = container.querySelector(`[data-player-id="${player.id}"]`)!;
    expect(seat.querySelector(".player-name")?.textContent).toBe("Alex");
    expect(seat.querySelector(".player-name")).toHaveAttribute(
      "title",
      expect.stringContaining("source ID ad116bad"),
    );
    expect(seat.querySelector(".player-nameplate")).toHaveAccessibleName(
      expect.stringContaining("Alex, anonymized opponent, source ID ad116bad"),
    );
    expect(container.querySelector(".is-hero .player-name")).toHaveTextContent("Hero");
    expect(player.name).toBe("ad116bad");
  });
  it("presents source IDs as opponent identities without changing replay records", () => {
    const hand = projected(0, "TM6468725291");
    const { container } = render(
      <PokerTable hand={hand} replayState={buildReplayState(hand, 0)} resultHidden />,
    );
    const opponent = hand.players.find((p) => p.name === "ad116bad")!;
    const seat = container.querySelector(`[data-player-id="${opponent.id}"]`)!;
    expect(seat.querySelector(".player-name")).toHaveTextContent("Opponent ad116bad");
    expect(seat.querySelector(".player-nameplate")).toHaveAccessibleName(
      expect.stringContaining("Opponent ad116bad"),
    );
    expect(container.querySelector(".is-hero .player-name")).toHaveTextContent("Hero");
    expect(opponent.name).toBe("ad116bad");
  });
  it("renders TM6468725291 preflop SHOW steps with exact KK/A5 cards and privacy", () => {
    const hand = projected(0, "TM6468725291");
    const { container, rerender } = render(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, 22)}
        resultHidden={false}
      />,
    );
    const opponent = () =>
      container.querySelector(
        '[data-player-id="gg:314729652:ad116bad"]',
      ) as HTMLElement;
    expect(within(opponent()).getAllByLabelText("Face-down card")).toHaveLength(2);
    rerender(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, 23)}
        resultHidden={false}
      />,
    );
    expect(within(opponent()).getByLabelText("Ace of hearts")).toBeVisible();
    expect(within(opponent()).getByLabelText("Five of diamonds")).toBeVisible();
    expect(container.querySelector(".table-board")).toBeNull();
    rerender(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, 24)}
        resultHidden={false}
      />,
    );
    const hero = container.querySelector(".is-hero") as HTMLElement;
    expect(within(hero).getByLabelText("King of diamonds")).toBeVisible();
    expect(within(hero).getByLabelText("King of clubs")).toBeVisible();
    rerender(
      <PokerTable hand={hand} replayState={buildReplayState(hand, 24)} resultHidden />,
    );
    expect(within(opponent()).queryByLabelText("Ace of hearts")).toBeNull();
    expect(within(opponent()).getAllByLabelText("Face-down card")).toHaveLength(2);
    expect(within(hero).getByLabelText("King of diamonds")).toBeVisible();
  });
  it("names a derived deal as a street transition rather than a player", () => {
    const hand = projected(0, "TM6469820465");
    const { container } = render(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, findStreetCursor(hand, "FLOP")!)}
        resultHidden
      />,
    );
    expect(
      container.querySelector('.timelineAction[title="Deal Flop"]'),
    ).toHaveTextContent("Flop");
    expect(container.querySelectorAll(".is-acting")).toHaveLength(0);
  });
  it("keeps a folded seat card-free after a source single-card reveal", () => {
    const hand = projected(0, "TM6469819712");
    const player = hand.players.find((p) => p.name === "54df8316")!;
    const show = flattenActions(hand).find(
      (a) => a.type === "SHOW" && a.actorPlayerId === player.id,
    )!;
    const { container, rerender } = render(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, show.sequence)}
        resultHidden={false}
      />,
    );
    const seat = () => container.querySelector(`[data-player-id="${player.id}"]`)!;
    expect(
      within(seat() as HTMLElement).queryByLabelText("Ten of spades"),
    ).not.toBeInTheDocument();
    rerender(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, show.sequence + 1)}
        resultHidden={false}
      />,
    );
    expect(seat()).toHaveClass("is-folded");
    expect(seat().querySelector(".player-cards")).toBeNull();
    expect(seat().querySelector(".player-nameplate")).toHaveTextContent("Folded");
    rerender(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, show.sequence + 1)}
        resultHidden
      />,
    );
    expect(
      within(seat() as HTMLElement).queryByLabelText("Ten of spades"),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll('.timelineAction[title*="shows"]')).toHaveLength(
      0,
    );
    expect(container.querySelector(".decisionRibbon")).not.toHaveTextContent(
      /shows Ts/,
    );
  });
  it("conceals opponents at start and prevents summary-only timed table cards", () => {
    const hand = projected(1, "TM6470156513");
    const { container, rerender } = render(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, 0)}
        resultHidden={false}
      />,
    );
    const known = () =>
      container.querySelectorAll(
        ".player-seat:not(.is-hero) .playingCard:not(.cardBack)",
      );
    expect(known()).toHaveLength(0);
    rerender(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, 999)}
        resultHidden={false}
      />,
    );
    expect(known()).toHaveLength(0);
  });
  it("labels consumed refunds distinctly and masks future amounts/reveals while hidden", () => {
    const hand = projected(1, "TM6471062694");
    const refund = flattenActions(hand).find((a) => a.type === "RETURN_UNCALLED")!;
    const { container, rerender } = render(
      <PokerTable hand={hand} replayState={buildReplayState(hand, 0)} resultHidden />,
    );
    expect(
      container.querySelectorAll(
        '[title*="420"], [aria-label*="wins"], [title*="returned"]',
      ),
    ).toHaveLength(0);
    rerender(
      <PokerTable
        hand={hand}
        replayState={buildReplayState(hand, refund.sequence + 1)}
        resultHidden
      />,
    );
    expect(
      container.querySelector(`.timelineAction[title*="returned"]`),
    ).not.toBeNull();
    expect(container.querySelectorAll(".is-acting")).toHaveLength(0);
  });
  it("street controls consume board-only deals and preserve step/privacy limits", () => {
    const hand = projected(0, "TM6469820465");
    const change = vi.fn();
    render(
      <ReplayControls
        hand={hand}
        cursor={0}
        currentStreet="PREFLOP"
        onCursorChange={change}
        totalActions={findCollectionCursor(hand)}
        resultHidden
        setResultHidden={vi.fn()}
      />,
    );
    for (const street of ["FLOP", "TURN", "RIVER"] as const) {
      fireEvent.click(
        screen.getByRole("button", { name: street[0] + street.slice(1).toLowerCase() }),
      );
      expect(change).toHaveBeenLastCalledWith(findStreetCursor(hand, street));
    }
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(change).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });
});

it("uses table for every hole card and board for all five community cards", () => {
  const hand = projected(0, "TM6469820465");
  const { container, rerender } = render(
    <PokerTable hand={hand} replayState={buildReplayState(hand, 0)} resultHidden />,
  );
  const holeCards = container.querySelectorAll(".player-cards .playingCard");
  expect(holeCards.length).toBeGreaterThan(2);
  for (const card of holeCards)
    expect(card).toHaveAttribute("data-card-variant", "table");
  rerender(
    <PokerTable
      hand={hand}
      replayState={buildReplayState(hand, 999)}
      resultHidden={false}
    />,
  );
  const board = container.querySelectorAll(".table-board .playingCard");
  expect(board).toHaveLength(5);
  for (const card of board) expect(card).toHaveAttribute("data-card-variant", "board");
  for (const card of container.querySelectorAll(".player-cards .playingCard"))
    expect(card).toHaveAttribute("data-card-variant", "table");
});
