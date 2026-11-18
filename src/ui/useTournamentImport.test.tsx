import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTournamentImport } from "./useTournamentImport";
import { fixtureHand, readFixture } from "../parsers/gg/fixtureTestUtils";
import { importTournamentFile, type ImportOutcome } from "../services/tournamentImport";
import { buildReplayState, findCollectionCursor } from "../domain/replay";
import * as adapter from "../domain/replayAdapter";

const file = (index = 0) => new File([readFixture(index)], "history.txt");
const shortFile = () => new File([fixtureHand(1, "TM6471062694")], "hand.txt");
function deferred() {
  let resolve!: (result: ImportOutcome) => void;
  const promise = new Promise<ImportOutcome>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
afterEach(() => vi.restoreAllMocks());

describe("in-memory imported tournament controller", () => {
  it.each([0, 1, 2, 3])(
    "runs every hand through real import/selection/replay in fixture %i",
    async (index) => {
      const { result } = renderHook(() => useTournamentImport());
      expect(result.current.entries).toHaveLength(0);
      await act(() => result.current.importFile(file(index)));
      expect(result.current.entries).toHaveLength(1);
      act(() => result.current.openTournament(result.current.entries[0]!.key));
      const ready = result.current.selected;
      if (!ready) throw new Error("Expected import");
      expect(ready).toMatchObject({
        resultHidden: true,
        selectedHandId: ready.tournament.hands[0]!.id,
        frame: { cursor: 0, board: [], potChips: 0 },
      });
      const imported = structuredClone(ready.tournament);
      for (const hand of ready.tournament.hands) {
        act(() => {
          expect(result.current.selectHand(hand.id)).toBe(true);
        });
        expect(result.current.selected).toMatchObject({
          resultHidden: true,
          frame: { cursor: 0, board: [], potChips: 0 },
        });
        act(() => result.current.setResultHidden(false));
        act(() => result.current.setCursor(Number.MAX_SAFE_INTEGER));
        const selected = result.current.selected;
        if (!selected) throw new Error("Expected selection");
        expect(selected.frame).toEqual(
          buildReplayState(selected.replay.hand, selected.frame.totalActions),
        );
        expect(selected.frame.board).toEqual(hand.streets.at(-1)!.board);
        expect(selected.frame.potChips).toBe(0);
        expect(
          Object.fromEntries(selected.frame.seats.map((s) => [s.id, s.stackChips])),
        ).toEqual(
          Object.fromEntries(hand.results.map((s) => [s.playerId, s.finalStackChips])),
        );
      }
      expect(ready.tournament).toEqual(imported);
      await act(() => result.current.importFile(file((index + 1) % 4)));
      await act(() => result.current.importFile(file(index)));
      expect(result.current.entries).toHaveLength(2);
      expect(result.current.selected?.tournament.id).toBe(ready.tournament.id);
    },
    30000,
  );
  it("resets selections, rejects stale IDs/noninteger cursors, and clamps privacy before collection", async () => {
    const { result } = renderHook(() => useTournamentImport());
    act(() => result.current.setCursor(5));
    await act(() => result.current.importFile(shortFile()));
    act(() => result.current.openTournament(result.current.entries[0]!.key));
    const start = result.current.selected;
    if (!start) throw new Error("Expected import");
    act(() => {
      expect(result.current.selectHand("missing")).toBe(false);
      result.current.setCursor(NaN);
      result.current.setCursor(1.5);
    });
    expect(result.current.selected).toEqual(start);
    act(() => result.current.setCursor(999));
    if (!result.current.selected) throw new Error("Expected import");
    expect(result.current.selected.frame.cursor).toBe(
      findCollectionCursor(start.replay.hand),
    );
    expect(result.current.selected.frame.lastAction?.type).not.toBe("WIN");
    expect(
      result.current.selected.frame.seats.some((s) => s.stackChips === 129067),
    ).toBe(true);
    act(() => result.current.setResultHidden(false));
    expect(result.current.selected?.frame.cursor).toBe(
      findCollectionCursor(start.replay.hand),
    );
    act(() => result.current.setCursor(999));
    expect(result.current.selected?.frame.potChips).toBe(0);
    act(() => result.current.setResultHidden(true));
    expect(result.current.selected?.frame.cursor).toBe(
      findCollectionCursor(start.replay.hand),
    );
    act(() => result.current.selectHand(start.selectedHandId));
    expect(result.current.selected).toEqual(start);
  });
  it("retains old success and ignores slow success after a newer failure", async () => {
    const success = await importTournamentFile(shortFile());
    const slow = deferred(),
      fast = deferred();
    const read = vi
      .fn()
      .mockResolvedValueOnce(success)
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);
    const { result } = renderHook(() => useTournamentImport(read));
    await act(() => result.current.importFile(shortFile()));
    const entry = result.current.entries[0]!;
    act(() => result.current.openTournament(entry.key));
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.importFile(shortFile());
    });
    expect(result.current.attempt).toEqual({ status: "reading", fileName: "hand.txt" });
    expect(result.current.selected?.tournament).toEqual(entry.tournament);
    let newer!: Promise<void>;
    act(() => {
      newer = result.current.importFile(shortFile());
    });
    const failed = {
      ok: false,
      error: { kind: "file", code: "empty_file", message: "Empty" },
    } as const;
    await act(async () => {
      fast.resolve(failed);
      await newer;
    });
    expect(result.current.attempt).toEqual({ status: "error", error: failed.error });
    await act(async () => {
      slow.resolve(success);
      await pending;
    });
    expect(result.current.attempt).toEqual({ status: "error", error: failed.error });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.selected?.tournament).toEqual(entry.tournament);
  });
  it("ignores slow A after fast B and handles cancel/unmount/StrictMode reuse", async () => {
    const success = await importTournamentFile(shortFile());
    const slow = deferred();
    const read = vi.fn().mockReturnValueOnce(slow.promise).mockResolvedValue(success);
    const { result, unmount } = renderHook(() => useTournamentImport(read), {
      wrapper: StrictMode,
    });
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.importFile(shortFile());
    });
    await act(() => result.current.importFile(shortFile()));
    const ready = result.current.entries[0]!;
    await act(async () => {
      slow.resolve(success);
      await pending;
    });
    expect(result.current.entries[0]).toEqual(ready);
    act(() => result.current.cancelPendingImport());
    expect(result.current.entries[0]).toEqual(ready);
    const cancelled = deferred();
    read.mockReturnValueOnce(cancelled.promise);
    act(() => {
      pending = result.current.importFile(shortFile());
      result.current.cancelPendingImport();
    });
    expect(result.current.attempt).toEqual({ status: "idle" });
    await act(async () => {
      cancelled.resolve(success);
      await pending;
    });
    expect(result.current.attempt).toEqual({ status: "idle" });
    const last = deferred();
    read.mockReturnValueOnce(last.promise);
    act(() => {
      pending = result.current.importFile(shortFile());
    });
    unmount();
    await act(async () => {
      last.resolve(success);
      await pending;
    });
  });
  it("keeps adapter and rendering failures separate from parser failures and permits retry", async () => {
    const { result } = renderHook(() => useTournamentImport());
    const projection = vi.spyOn(adapter, "toReplayHand").mockImplementationOnce(() => {
      throw new Error("private internal detail");
    });
    await act(() => result.current.importFile(shortFile()));
    expect(result.current.attempt).toMatchObject({
      status: "error",
      error: { kind: "integration" },
    });
    expect(JSON.stringify(result.current.attempt)).not.toContain(
      "private internal detail",
    );
    projection.mockRestore();
    await act(() => result.current.importFile(shortFile()));
    act(() => result.current.openTournament(result.current.entries[0]!.key));
    act(() => result.current.reportIntegrationError());
    expect(result.current.replayError).toMatchObject({
      key: result.current.entries[0]!.key,
      handId: result.current.selected?.selectedHandId,
    });
    expect(result.current.selected).not.toBeNull();
    act(() => result.current.selectHand(result.current.selected!.selectedHandId));
    expect(result.current.replayError).toBeNull();
  });
});
