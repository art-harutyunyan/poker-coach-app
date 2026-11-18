import { afterEach, describe, expect, it, vi } from "vitest";
import { importTournamentFile } from "./tournamentImport";
import { fixtureHand, readFixture } from "../parsers/gg/fixtureTestUtils";

afterEach(() => vi.restoreAllMocks());

describe("local tournament file boundary", () => {
  it.each([0, 1, 2, 3])("imports full real fixture %i with warnings", async (index) => {
    const file = new File([readFixture(index)], "history.TXT", { type: "text/plain" });
    const result = await importTournamentFile(file);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected valid fixture");
    expect(result.tournament.handsPlayed).toBe([222, 191, 28, 233][index]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: "unknown_timezone" }),
    );
    expect(await importTournamentFile(file)).toEqual(result);
  });
  it.each(["", "application/octet-stream", "text/plain"])(
    "accepts supported MIME %s",
    async (type) => {
      expect(
        (
          await importTournamentFile(
            new File([fixtureHand(0, "TM6469820465")], "hand.txt", { type }),
          )
        ).ok,
      ).toBe(true);
    },
  );
  it.each([
    ["wrong.pdf", "text/plain"],
    ["hand.txt", "application/pdf"],
    ["hand.txt", "image/png"],
  ])("rejects incompatible %s/%s before read", async (name, type) => {
    const read = vi.spyOn(FileReader.prototype, "readAsText");
    expect(
      await importTournamentFile(new File(["not GG"], name, { type })),
    ).toMatchObject({ ok: false, error: { kind: "file", code: "invalid_type" } });
    expect(read).not.toHaveBeenCalled();
  });
  it.each(["", " \r\n\t"])("rejects empty text", async (text) => {
    expect(await importTournamentFile(new File([text], "hand.txt"))).toMatchObject({
      ok: false,
      error: { kind: "file", code: "empty_file" },
    });
  });
  it("preserves parser failure context and deterministic outcomes", async () => {
    for (const text of [
      "not GG",
      fixtureHand(0, "TM6469820465").replace("Hold'em No Limit", "Omaha Pot Limit"),
    ]) {
      const file = new File([text], "bad.txt");
      const result = await importTournamentFile(file);
      expect(result).toMatchObject({
        ok: false,
        error: {
          kind: "parser",
          issues: [expect.objectContaining({ sourceName: "bad.txt" })],
        },
      });
      expect(result).not.toHaveProperty("tournament");
      expect(await importTournamentFile(file)).toEqual(result);
    }
  });
  it("reports unreadable files without throwing or exposing source", async () => {
    vi.spyOn(FileReader.prototype, "readAsText").mockImplementation(function (
      this: FileReader,
    ) {
      this.dispatchEvent(new Event("error"));
    });
    expect(
      await importTournamentFile(new File(["private history"], "hand.txt")),
    ).toMatchObject({ ok: false, error: { kind: "file", code: "read_failed" } });
  });
});
