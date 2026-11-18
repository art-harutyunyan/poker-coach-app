import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import { useTournamentImport } from "./useTournamentImport";

const file = (index: number, id: string) =>
  new File([fixtureHand(index, id)], `${id}.txt`);

it("keeps outcome visibility per tournament and resets it on Hide Result or hand selection", async () => {
  const { result } = renderHook(() => useTournamentImport());
  act(() => result.current.setOutcomeStatsVisible(true));
  expect(result.current.outcomeStatsVisible).toBeNull();
  await act(() => result.current.importFile(file(0, "TM6468725291")));
  const a = result.current.entries[0]!.key;
  act(() => result.current.openTournament(a));
  expect(result.current.outcomeStatsVisible).toBe(false);
  act(() => result.current.setOutcomeStatsVisible(true));
  expect(result.current.outcomeStatsVisible).toBe(true);
  expect(result.current.selected?.frame.cursor).toBe(0);
  expect(result.current.selected?.resultHidden).toBe(true);
  await act(() => result.current.importFile(file(1, "TM6471062694")));
  const b = result.current.entries[0]!.key;
  act(() => result.current.openTournament(b));
  expect(result.current.outcomeStatsVisible).toBe(false);
  act(() => result.current.setResultHidden(false));
  expect(result.current.outcomeStatsVisible).toBe(false);
  act(() => result.current.openTournament(a));
  expect(result.current.outcomeStatsVisible).toBe(true);
  act(() => result.current.setResultHidden(true));
  expect(result.current.outcomeStatsVisible).toBe(false);
  act(() => result.current.setOutcomeStatsVisible(true));
  act(() => result.current.selectHand(result.current.selected!.selectedHandId));
  expect(result.current.outcomeStatsVisible).toBe(false);
  expect(result.current.selected?.resultHidden).toBe(true);
});
