import { describe, expect, it } from "vitest";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import { prepareLibraryInsert, tournamentKey } from "./tournamentLibrary";

function parsed(source: string, name = "first.txt") {
  const result = parseGgTournament(source, { sourceName: name });
  if (!result.ok) throw new Error(`Fixture invalid: ${result.errors[0]?.message}`);
  return result;
}
const sourceA = fixtureHand(0, "TM6469820465");
const sourceB = fixtureHand(1, "TM6471062694");

describe("session library insertion boundary", () => {
  it("accepts distinct tournaments and derives immutable metrics for each", () => {
    const a = parsed(sourceA);
    const b = parsed(sourceB);
    const first = prepareLibraryInsert([], a.tournament, a.warnings);
    expect(first.status).toBe("added");
    if (first.status !== "added") return;
    expect(first.entry.key).toBe(JSON.stringify([a.tournament.room, a.tournament.id]));
    expect(tournamentKey(b.tournament)).not.toBe(first.entry.key);
    const second = prepareLibraryInsert([first.entry], b.tournament, b.warnings);
    expect(second.status).toBe("added");
    if (second.status !== "added") return;
    expect(second.entry.facts).toHaveLength(b.tournament.hands.length);
    expect(second.entry.metrics.importedHands).toBe(b.tournament.hands.length);
    expect(first.entry.tournament).toEqual(a.tournament);
  });

  it("recognizes identical parsed content under another upload filename without replacement", () => {
    const a = parsed(sourceA, "first.txt");
    const renamed = parsed(sourceA, "renamed.txt");
    const first = prepareLibraryInsert([], a.tournament, a.warnings);
    if (first.status !== "added") throw new Error("Expected initial entry");
    const before = structuredClone(first.entry);
    const entries = Object.freeze([first.entry]);
    expect(prepareLibraryInsert(entries, renamed.tournament, renamed.warnings)).toEqual(
      {
        status: "already-imported",
        key: first.entry.key,
      },
    );
    expect(entries[0]).toEqual(before);
  });

  it.each(["hand", "metadata", "raw source", "hand order"])(
    "rejects same-ID differing %s while keeping the original entry",
    (kind) => {
      const a = parsed(sourceA);
      const first = prepareLibraryInsert([], a.tournament, a.warnings);
      if (first.status !== "added") throw new Error("Expected entry");
      const changed = structuredClone(a.tournament);
      if (kind === "hand") changed.hands[0]!.id += "x";
      if (kind === "metadata") changed.name += " changed";
      if (kind === "raw source") changed.hands[0]!.source.rawText += " ";
      if (kind === "hand order") {
        const two = parsed(
          sourceA + "\n\n" + sourceA.split("TM6469820465").join("TM6469820466"),
        );
        changed.hands = [...two.tournament.hands].reverse();
      }
      const before = structuredClone(first.entry);
      expect(prepareLibraryInsert([first.entry], changed, a.warnings)).toEqual({
        status: "conflict",
        key: first.entry.key,
        tournamentId: a.tournament.id,
      });
      expect(first.entry).toEqual(before);
    },
  );

  it("accepts same tournament name under different source IDs", () => {
    const a = parsed(sourceA);
    const first = prepareLibraryInsert([], a.tournament, a.warnings);
    if (first.status !== "added") throw new Error("Expected entry");
    const renamedId = structuredClone(a.tournament);
    renamedId.id = "another-id";
    renamedId.hands[0]!.tournamentId = "another-id";
    expect(prepareLibraryInsert([first.entry], renamedId, a.warnings).status).toBe(
      "added",
    );
  });
});
