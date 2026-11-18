import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTournamentImport } from "./useTournamentImport";
import { readFixture, fixtureHand } from "../parsers/gg/fixtureTestUtils";
import { importTournamentFile, type ImportOutcome } from "../services/tournamentImport";
import * as adapter from "../domain/replayAdapter";

const file = (index: number, name = "history.txt") =>
  new File([readFixture(index)], name);
function deferred() {
  let resolve!: (result: ImportOutcome) => void;
  const promise = new Promise<ImportOutcome>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("session tournament controller", () => {
  it("retains A and B and restores each hand, tab, cursor and privacy independently", async () => {
    const { result } = renderHook(() => useTournamentImport());
    expect(result.current.entries).toHaveLength(0);
    await act(() => result.current.importFile(file(0)));
    expect(result.current.view).toEqual({ kind: "library" });
    const a = result.current.entries[0]!;
    act(() => result.current.openTournament(a.key, "replayer"));
    const anotherHand = a.tournament.hands[1]!.id;
    act(() => result.current.selectHand(anotherHand));
    act(() => result.current.setResultHidden(false));
    act(() => result.current.setCursor(3));
    const aCursor = result.current.selected!.frame.cursor;
    await act(() => result.current.importFile(file(3)));
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.selected?.selectedHandId).toBe(anotherHand);
    const b = result.current.entries[0]!;
    act(() => result.current.openTournament(b.key, "review"));
    expect(result.current.selected?.selectedHandId).toBe(b.tournament.hands[0]!.id);
    expect(result.current.selected?.resultHidden).toBe(true);
    act(() => result.current.showLibrary());
    act(() => result.current.openTournament(a.key));
    expect(result.current.activeTab).toBe("replayer");
    expect(result.current.selected).toMatchObject({
      selectedHandId: anotherHand,
      resultHidden: false,
      frame: { cursor: aCursor },
    });
    act(() => result.current.selectHand(a.tournament.hands[2]!.id));
    expect(result.current.selected).toMatchObject({
      resultHidden: true,
      frame: { cursor: 0 },
    });
  }, 30000);

  it("keeps original entry and state on duplicate, conflict and invalid actions", async () => {
    const { result } = renderHook(() => useTournamentImport());
    await act(() => result.current.importFile(file(0)));
    const entry = result.current.entries[0]!;
    act(() => result.current.openTournament(entry.key, "review"));
    const snapshot = structuredClone(entry.tournament);
    await act(() => result.current.importFile(file(0, "other-filename.txt")));
    expect(result.current.attempt).toEqual({
      status: "complete",
      key: entry.key,
      duplicate: true,
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.activeTab).toBe("review");
    const partial = new File([fixtureHand(0, "TM6469820465")], "partial.txt");
    await act(() => result.current.importFile(partial));
    expect(result.current.attempt).toMatchObject({
      status: "conflict",
      tournamentId: entry.tournament.id,
    });
    expect(result.current.entries[0]!.tournament).toEqual(snapshot);
    expect(result.current.view).toEqual({ kind: "tournament", key: entry.key });
    act(() => {
      expect(result.current.openTournament("bad")).toBe(false);
      expect(result.current.selectHand("bad")).toBe(false);
      result.current.setCursor(NaN);
    });
    expect(result.current.activeTab).toBe("review");
  }, 30000);

  it("preserves entries and view across a failed, cancelled or superseded import", async () => {
    const initial = await importTournamentFile(file(0));
    const slow = deferred();
    const read = vi
      .fn()
      .mockResolvedValueOnce(initial)
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce({
        ok: false,
        error: { kind: "file", code: "empty_file", message: "Empty" },
      });
    const { result, unmount } = renderHook(() => useTournamentImport(read), {
      wrapper: StrictMode,
    });
    await act(() => result.current.importFile(file(0)));
    const key = result.current.entries[0]!.key;
    act(() => result.current.openTournament(key));
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.importFile(file(3));
    });
    await act(() => result.current.importFile(file(1)));
    expect(result.current.attempt.status).toBe("error");
    await act(async () => {
      slow.resolve(initial);
      await pending;
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.view).toEqual({ kind: "tournament", key });
    act(() => result.current.cancelPendingImport());
    expect(result.current.entries).toHaveLength(1);
    unmount();
  }, 30000);

  it("rejects a new entry atomically when its first replay fails; later hand errors stay scoped", async () => {
    const { result } = renderHook(() => useTournamentImport());
    await act(() => result.current.importFile(file(0)));
    const a = result.current.entries[0]!;
    act(() => result.current.openTournament(a.key));
    const before = structuredClone(a.tournament);
    const projection = vi.spyOn(adapter, "toReplayHand").mockImplementationOnce(() => {
      throw new Error("private detail");
    });
    await act(() => result.current.importFile(file(3)));
    expect(result.current.attempt).toMatchObject({
      status: "error",
      error: { kind: "integration" },
    });
    expect(JSON.stringify(result.current.attempt)).not.toContain("private detail");
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]!.tournament).toEqual(before);
    projection.mockRestore();
    await act(() => result.current.importFile(file(3)));
    const b = result.current.entries[0]!;
    act(() => result.current.reportIntegrationError());
    expect(result.current.replayError?.key).toBe(a.key);
    act(() => result.current.openTournament(b.key));
    expect(result.current.replayError).toBeNull();
    expect(result.current.selected?.tournament.id).toBe(b.tournament.id);
    act(() => result.current.openTournament(a.key));
    expect(result.current.selected?.tournament.id).toBe(a.tournament.id);
  }, 30000);

  it("resets only upload status and never writes imported data to browser storage", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useTournamentImport());
    await act(() => result.current.importFile(file(0)));
    const key = result.current.entries[0]!.key;
    act(() => result.current.openTournament(key));
    act(() => result.current.resetImportAttempt());
    expect(result.current.attempt).toEqual({ status: "idle" });
    expect(result.current.view).toEqual({ kind: "tournament", key });
    expect(result.current.entries).toHaveLength(1);
    expect(local).not.toHaveBeenCalled();
    local.mockRestore();
  }, 30000);
});
