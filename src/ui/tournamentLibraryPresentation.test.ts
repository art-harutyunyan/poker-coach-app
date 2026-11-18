import { describe, expect, it } from "vitest";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import {
  prepareLibraryInsert,
  tournamentKey,
  type LibraryEntry,
} from "../services/tournamentLibrary";
import {
  groupTournamentItems,
  presentTournament,
  presentTournamentOverview,
  selectTournamentItems,
} from "./tournamentLibraryPresentation";

function entry(): LibraryEntry {
  const parsed = parseGgTournament(fixtureHand(0, "TM6469820465"));
  if (!parsed.ok) throw new Error("Fixture failed");
  const decision = prepareLibraryInsert([], parsed.tournament, parsed.warnings);
  if (decision.status !== "added") throw new Error("Preparation failed");
  return decision.entry;
}

function changed(
  original: LibraryEntry,
  changes: Partial<LibraryEntry["tournament"]>,
): LibraryEntry {
  const tournament = { ...original.tournament, ...changes };
  return { ...original, key: tournamentKey(tournament), tournament };
}

describe("Tournament Library presentation", () => {
  it("projects compact overview metadata without inventing a summary or analysis", () => {
    const item = presentTournamentOverview(entry());
    expect(item).toMatchObject({
      name: expect.any(String),
      source: "GGPoker",
      tournamentId: "314729652",
      buyIn: "$2.50",
      status: "unavailable",
      statusLabel: "Analysis not available",
      overviewStatusLabel: "Imported · analysis not available",
      handCount: 1,
      finish: null,
      won: { state: "unknown" },
      achievement: null,
    });
    expect(item.dateTime).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}$/);
    const withoutOptional = changed(entry(), { buyIn: null, format: null });
    expect(presentTournamentOverview(withoutOptional)).toMatchObject({
      buyIn: null,
      format: null,
    });
  });
  it("keeps unknown results distinct from zero and does not derive analysis from raw metrics", () => {
    const item = presentTournament(entry());
    expect(item).toMatchObject({
      tournamentId: "314729652",
      buyIn: "$2.50",
      won: { state: "unknown" },
      finish: null,
      achievement: null,
      mistakes: null,
      flagged: null,
      status: "unavailable",
      statusLabel: "Analysis not available",
    });
  });

  it("searches real names, source IDs, and buy-ins while keeping equal names distinct", () => {
    const first = changed(entry(), { name: "Daily Monster Stack" });
    const second = changed(first, { id: "second-id", buyIn: null });
    const entries = [first, second];
    expect(
      selectTournamentItems(entries, "314729652", "all", "newest").map((x) => x.key),
    ).toEqual([first.key]);
    expect(
      selectTournamentItems(entries, "2.50", "all", "newest").map((x) => x.key),
    ).toEqual([first.key]);
    expect(
      selectTournamentItems(entries, "DAILY MONSTER", "all", "newest"),
    ).toHaveLength(2);
  });

  it("sorts by source-local date with a stable ID tie break and groups by recency", () => {
    const first = entry();
    const later = changed(first, {
      id: "later",
      timestampRange: {
        first: { local: "2026-11-16T12:00:00", timezone: null },
        last: { local: "2026-11-16T12:30:00", timezone: null },
      },
    });
    const sameTime = changed(later, { id: "same-time" });
    const ordered = selectTournamentItems(
      [sameTime, first, later],
      "",
      "all",
      "newest",
    );
    expect(ordered.map((x) => x.tournamentId)).toEqual([
      "later",
      "same-time",
      "314729652",
    ]);
    expect(
      groupTournamentItems(ordered, "2026-11-17").map((g) => [g.label, g.items.length]),
    ).toEqual([
      ["This week", 2],
      ["Earlier", 1],
    ]);
    expect(
      selectTournamentItems([sameTime, first, later], "", "all", "oldest").map(
        (x) => x.tournamentId,
      ),
    ).toEqual(["314729652", "later", "same-time"]);
  });

  it("does not invent analysed or needs-action entries from metadata warnings", () => {
    const real = entry();
    expect(selectTournamentItems([real], "", "analysed", "newest")).toEqual([]);
    expect(selectTournamentItems([real], "", "needs-action", "newest")).toEqual([]);
  });
});
