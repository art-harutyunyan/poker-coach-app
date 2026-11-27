import { describe, expect, it } from "vitest";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import { prepareLibraryInsert } from "../services/tournamentLibrary";
import { presentImportResult } from "./importResultPresentation";
import type { FileImportResult } from "./useTournamentImport";

function entry() {
  const parsed = parseGgTournament(fixtureHand(0, "TM6469820465"));
  if (!parsed.ok) throw new Error("Fixture failed");
  const result = prepareLibraryInsert([], parsed.tournament, parsed.warnings);
  if (result.status !== "added") throw new Error("Preparation failed");
  return result.entry;
}

describe("source-backed import result presentation", () => {
  it("uses a safe file name and no invented progress while reading", () => {
    const view = presentImportResult(
      { id: 1, status: "processing", fileName: "C:\\temp\\history.txt" },
      [],
    );
    expect(view.fileName).toBe("history.txt");
    expect(view.title).toBe("Reading file…");
    expect(view.detail).not.toMatch(/%|of \d+ hands/i);
  });

  it("shows accepted source facts and keeps metadata notices distinct from skipped hands", () => {
    const imported = entry();
    const view = presentImportResult(
      { id: 2, status: "success", fileName: "history.txt", key: imported.key },
      [imported],
    );
    expect(view.status).toBe("success");
    expect(view.title).toBe(imported.tournament.name);
    expect(view.detail).toContain(`#${imported.tournament.id}`);
    expect(view.detail).toContain("1 hand accepted");
    expect(view.detail).toContain("NLHE");
    expect(view.detail).not.toMatch(/skipped|rejected|format/i);
  });

  it("renders a warning only from a typed skipped-record outcome", () => {
    const imported = entry();
    const warning: FileImportResult = {
      id: 3,
      status: "warning",
      fileName: "partial.txt",
      key: imported.key,
      skippedHands: 2,
    };
    const view = presentImportResult(warning, [imported]);
    expect(view.status).toBe("warning");
    expect(view.detail).toContain("1 hand accepted");
    expect(view.detail).toContain("2 hands skipped");
    expect(view.message).toBeNull();
  });

  it("explains duplicate and conflict using the existing tournament without suggesting a write", () => {
    const imported = entry();
    const duplicate = presentImportResult(
      { id: 4, status: "duplicate", fileName: "copy.txt", key: imported.key },
      [imported],
    );
    expect(duplicate.title).toContain("already imported");
    expect(duplicate.detail).toContain(`tournament #${imported.tournament.id}`);
    expect(duplicate.message).toBe("Nothing added.");
    const conflict = presentImportResult(
      {
        id: 5,
        status: "conflict",
        fileName: "changed.txt",
        key: imported.key,
        tournamentId: imported.tournament.id,
      },
      [imported],
    );
    expect(conflict.title).toContain("rejected");
    expect(conflict.message).toBe(
      "File rejected. The existing tournament is unchanged — nothing was merged or replaced.",
    );
  });

  it("uses the real failure reason without leaking a local path", () => {
    const view = presentImportResult(
      {
        id: 6,
        status: "error",
        fileName: "C:\\Users\\Someone\\bad.txt",
        error: {
          kind: "file",
          code: "invalid_type",
          message: "Select a GG hand-history .txt file.",
        },
      },
      [],
    );
    expect(view.title).toBe("Unrecognised file");
    expect(view.fileName).toBe("bad.txt");
    expect(view.detail).toBe("0 hands accepted");
    expect(view.message).toBe("Select a GG hand-history .txt file.");
    expect(JSON.stringify(view)).not.toContain("Someone");
  });
});
