import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFixture } from "../parsers/gg/fixtureTestUtils";
import { filterHandIds } from "../domain/handFilters";
import { useTournamentImport } from "./useTournamentImport";

const file = (index: number) => new File([readFixture(index)], `history-${index}.txt`);

describe("session hand filter state", () => {
  it("starts at All and restores each tournament's filter without altering replay", async () => {
    const { result } = renderHook(() => useTournamentImport());
    await act(() => result.current.importFile(file(0)));
    const a = result.current.entries[0]!;
    act(() => result.current.openTournament(a.key, "replayer"));
    expect(result.current.activeFilter).toBe("all");
    act(() => result.current.setResultHidden(false));
    act(() => result.current.setCursor(3));
    const before = result.current.selected!;
    act(() => result.current.setHandFilter("showdown"));
    expect(result.current.activeFilter).toBe("showdown");
    expect(result.current.selected).toBe(before);
    await act(() => result.current.importFile(file(3)));
    const b = result.current.entries[0]!;
    act(() => result.current.openTournament(b.key, "replayer"));
    expect(result.current.activeFilter).toBe("all");
    act(() => result.current.setHandFilter("postflop"));
    act(() => result.current.openTournament(a.key));
    expect(result.current.activeFilter).toBe("showdown");
    expect(result.current.selected).toBe(before);
    act(() => result.current.showLibrary());
    act(() => result.current.openTournament(b.key));
    expect(result.current.activeFilter).toBe("postflop");
  }, 30000);

  it("navigates filtered source order without wrap and resets replay only on selection", async () => {
    const { result } = renderHook(() => useTournamentImport());
    await act(() => result.current.importFile(file(0)));
    const entry = result.current.entries[0]!;
    act(() => result.current.openTournament(entry.key, "replayer"));
    const ids = filterHandIds(
      entry.facts.map((input) => input.facts),
      "showdown",
    ).ids;
    expect(ids.length).toBeGreaterThan(1);
    const outside = entry.tournament.hands.find((hand) => !ids.includes(hand.id))!;
    act(() => result.current.selectHand(outside.id));
    act(() => result.current.setResultHidden(false));
    act(() => result.current.setCursor(2));
    const before = result.current.selected!;
    act(() => result.current.setHandFilter("showdown"));
    expect(result.current.selected).toBe(before);
    const firstNext = ids.find(
      (id) =>
        entry.tournament.hands.findIndex((h) => h.id === id) >
        entry.tournament.hands.indexOf(outside),
    );
    act(() =>
      expect(result.current.navigateFilteredHand("next")).toBe(Boolean(firstNext)),
    );
    if (firstNext) {
      expect(result.current.selected?.selectedHandId).toBe(firstNext);
      expect(result.current.selected?.frame.cursor).toBe(0);
      expect(result.current.selected?.resultHidden).toBe(true);
    }
    act(() => result.current.selectHand(ids.at(-1)!));
    act(() => expect(result.current.navigateFilteredHand("next")).toBe(false));
    expect(result.current.selected?.selectedHandId).toBe(ids.at(-1));
    act(() => result.current.selectHand(ids[0]!));
    act(() => expect(result.current.navigateFilteredHand("previous")).toBe(false));
    expect(result.current.selected?.selectedHandId).toBe(ids[0]);
  }, 30000);
});
