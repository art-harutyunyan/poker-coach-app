import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { parseGgTournament } from "../../parsers/gg";
import { readFixture } from "../../parsers/gg/fixtureTestUtils";
import { presentHandBrowserRow } from "../handBrowserPresentation";
import { TournamentHandBrowser } from "./TournamentHandBrowser";

const parsed = parseGgTournament(readFixture(0));
if (!parsed.ok) throw new Error("Fixture did not parse");
const hands = parsed.tournament.hands;

describe("Nocturne tournament hand browser", () => {
  it("shows compact source rows, unavailable analysis controls, and an explicit open action", () => {
    const onSelectHand = vi.fn();
    const onOpenHand = vi.fn();
    render(
      <TournamentHandBrowser
        hands={hands.slice(0, 3)}
        selectedHandId={hands[0]!.id}
        onSelectHand={onSelectHand}
        onOpenHand={onOpenHand}
      />,
    );
    const browser = screen.getByRole("region", { name: "Tournament hand browser" });
    const grid = within(browser).getByRole("grid", { name: "Tournament hands" });
    const rows = grid.querySelectorAll<HTMLElement>("[data-hand-id]");
    expect(rows).toHaveLength(3);
    expect([...rows].map((row) => row.dataset.handId)).toEqual(
      hands.slice(0, 3).map((hand) => hand.id),
    );
    expect(rows[0]).toHaveAttribute("aria-selected", "true");
    expect(rows[0]).toHaveTextContent("Not analysed");
    expect(
      rows[0]!.querySelectorAll('.playingCard[data-card-variant="compact"]'),
    ).toHaveLength(2);
    expect(within(browser).getByRole("button", { name: /Graded/ })).toBeDisabled();
    expect(within(browser).getByRole("button", { name: /Mistakes/ })).toBeDisabled();
    expect(within(browser).getByRole("button", { name: /Flagged/ })).toBeDisabled();
    expect(within(browser).getByRole("button", { name: /Unreviewed/ })).toBeDisabled();
    expect(within(browser).getByRole("button", { name: /^Grade:/ })).toBeDisabled();
    expect(within(browser).getByRole("button", { name: /Stack/ })).toBeDisabled();
    expect(browser).not.toHaveTextContent(/Best|Major mistake|Reviewed 0|Flagged 0/);
    fireEvent.click(rows[1]!);
    expect(onSelectHand).toHaveBeenCalledWith(hands[1]!.id);
    expect(onOpenHand).not.toHaveBeenCalled();
    fireEvent.click(within(browser).getByRole("button", { name: "Open in Replayer" }));
    expect(onOpenHand).toHaveBeenCalledWith(hands[0]!.id);
  });

  it("searches and filters without changing selection, then clears a zero-match state", () => {
    const onSelectHand = vi.fn();
    const sampleHands = hands.slice(0, 12);
    const searchedHand = sampleHands[5]!;
    const filteredPosition = presentHandBrowserRow(sampleHands[1]!).position;
    render(
      <TournamentHandBrowser
        hands={sampleHands}
        selectedHandId={sampleHands[0]!.id}
        onSelectHand={onSelectHand}
        onOpenHand={vi.fn()}
      />,
    );
    const browser = screen.getByRole("region", { name: "Tournament hand browser" });
    const search = within(browser).getByRole("searchbox", { name: "Search hands" });
    fireEvent.change(search, { target: { value: String(searchedHand.handNumber) } });
    expect(browser).toHaveTextContent(/Showing .* of 12/);
    expect(
      [...browser.querySelectorAll<HTMLElement>("[data-hand-id]")].some((row) =>
        row.textContent?.includes(`#${searchedHand.handNumber}`),
      ),
    ).toBe(true);
    expect(onSelectHand).not.toHaveBeenCalled();
    fireEvent.change(search, { target: { value: "no such hand" } });
    expect(browser).toHaveTextContent("No hands match these filters");
    expect(browser).toHaveTextContent("Selected hand is outside these results");
    fireEvent.click(within(browser).getByRole("button", { name: "Clear filters" }));
    expect(browser.querySelectorAll("[data-hand-id]")).toHaveLength(12);
    expect(onSelectHand).not.toHaveBeenCalled();
    fireEvent.change(
      within(browser).getByRole("combobox", { name: "Filter by position" }),
      {
        target: { value: filteredPosition },
      },
    );
    const filteredRows = [...browser.querySelectorAll<HTMLElement>("[data-hand-id]")];
    expect(filteredRows.length).toBeGreaterThan(0);
    expect(
      filteredRows.every((row) => row.textContent?.includes(filteredPosition)),
    ).toBe(true);
  });

  it("uses focused rows for arrows and Enter while search typing does not trigger shortcuts", () => {
    const onOpenHand = vi.fn();
    function Controlled() {
      const [selectedHandId, setSelectedHandId] = useState(hands[0]!.id);
      return (
        <TournamentHandBrowser
          hands={hands.slice(0, 3)}
          selectedHandId={selectedHandId}
          onSelectHand={setSelectedHandId}
          onOpenHand={onOpenHand}
        />
      );
    }
    render(<Controlled />);
    const browser = screen.getByRole("region", { name: "Tournament hand browser" });
    const rows = browser.querySelectorAll<HTMLElement>("[data-hand-id]");
    rows[0]!.focus();
    fireEvent.keyDown(rows[0]!, { key: "ArrowDown" });
    expect(rows[1]).toHaveFocus();
    expect(rows[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(rows[1]!, { key: "Enter" });
    expect(onOpenHand).toHaveBeenCalledWith(hands[1]!.id);
    const search = within(browser).getByRole("searchbox", { name: "Search hands" });
    search.focus();
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onOpenHand).toHaveBeenCalledTimes(1);
  });

  it("selects a sole filtered row with Space before opening it", () => {
    const first = hands[0]!;
    const firstPosition = presentHandBrowserRow(first).position;
    const other = hands.find(
      (hand) => presentHandBrowserRow(hand).position !== firstPosition,
    )!;
    const otherPosition = presentHandBrowserRow(other).position;
    const onOpenHand = vi.fn();
    function Controlled() {
      const [selectedHandId, setSelectedHandId] = useState(first.id);
      return (
        <TournamentHandBrowser
          hands={[first, other]}
          selectedHandId={selectedHandId}
          onSelectHand={setSelectedHandId}
          onOpenHand={onOpenHand}
        />
      );
    }
    render(<Controlled />);
    const browser = screen.getByRole("region", { name: "Tournament hand browser" });
    fireEvent.change(
      within(browser).getByRole("combobox", { name: "Filter by position" }),
      {
        target: { value: otherPosition },
      },
    );
    const rows = browser.querySelectorAll<HTMLElement>("[data-hand-id]");
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row).toHaveAttribute("tabindex", "0");
    expect(row).toHaveAttribute("aria-selected", "false");
    row.focus();
    fireEvent.keyDown(row, { key: " " });
    expect(row).toHaveAttribute("aria-selected", "true");
    expect(onOpenHand).not.toHaveBeenCalled();
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onOpenHand).toHaveBeenCalledWith(other.id);
  });
});
