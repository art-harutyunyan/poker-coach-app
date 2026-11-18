// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveHandFacts } from "./handFacts";
import { METRIC_VERSION, type Fact, type HandFacts } from "./pokerMetricTypes";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import { adjacentFilteredHandId, filterHandIds, type HandFilter } from "./handFilters";

const fact = (value: boolean | undefined): Fact =>
  value === undefined
    ? { status: "unknown", reasons: ["missing_preflop_decision"], evidence: [] }
    : { status: "known", value, evidence: [] };

function hand(
  number: number,
  played: boolean | undefined,
  postflop: boolean | undefined,
  showdown: boolean | undefined,
): HandFacts {
  const handId = `hand-${number}`;
  return {
    definitionVersion: METRIC_VERSION,
    key: JSON.stringify(["GG", "tournament", "hero", handId]),
    room: "GG",
    tournamentId: "tournament",
    heroPlayerId: "hero",
    handId,
    handNumber: number,
    eligiblePreflop: fact(true),
    voluntaryPreflop: fact(false),
    preflopRaise: fact(false),
    sawFlop: fact(postflop),
    heroShowdown: fact(showdown),
    collectedShare: fact(false),
    played: fact(played),
  };
}

function real(index: number, id: string): HandFacts {
  const parsed = parseGgTournament(fixtureHand(index, id));
  if (!parsed.ok) throw new Error(`Source hand ${id} failed to parse`);
  return deriveHandFacts(parsed.tournament.hands[0]!, parsed.tournament.room);
}

describe("source-backed hand filters", () => {
  const ordered = [
    hand(1, false, false, false),
    hand(2, true, false, false),
    hand(3, true, true, true),
    hand(4, undefined, undefined, undefined),
  ];

  it("returns stable source IDs, all four counts and explicit unknown counts", () => {
    const result = filterHandIds(ordered, "played");
    expect(result).toEqual({
      ids: ["hand-2", "hand-3"],
      total: 4,
      counts: { all: 4, played: 2, postflop: 1, showdown: 1 },
      unknown: { all: 0, played: 1, postflop: 1, showdown: 1 },
    });
    expect(filterHandIds(ordered, "all").ids).toEqual([
      "hand-1",
      "hand-2",
      "hand-3",
      "hand-4",
    ]);
    expect(filterHandIds(ordered.slice(0, 2), "showdown").ids).toEqual([]);
  });

  it("navigates around an excluded current hand in chronology without wrapping", () => {
    expect(adjacentFilteredHandId(ordered, "played", "hand-1", "next")).toBe("hand-2");
    expect(adjacentFilteredHandId(ordered, "played", "hand-4", "previous")).toBe(
      "hand-3",
    );
    expect(adjacentFilteredHandId(ordered, "played", "hand-3", "next")).toBeNull();
    expect(
      adjacentFilteredHandId(ordered, "played", "missing-hand", "next"),
    ).toBeNull();
    const middle = [
      hand(1, true, false, false),
      hand(2, false, false, false),
      hand(3, true, true, false),
    ];
    expect(adjacentFilteredHandId(middle, "played", "hand-2", "previous")).toBe(
      "hand-1",
    );
    expect(adjacentFilteredHandId(middle, "played", "hand-2", "next")).toBe("hand-3");
  });

  it("rejects duplicate IDs and mixed tournament cohorts without mutating inputs", () => {
    const frozen = Object.freeze([...ordered]);
    const before = structuredClone(frozen);
    filterHandIds(frozen, "postflop");
    adjacentFilteredHandId(frozen, "showdown", "hand-2", "next");
    expect(frozen).toEqual(before);
    expect(() => filterHandIds([ordered[0]!, ordered[0]!], "all")).toThrow();
    expect(() =>
      filterHandIds([ordered[0]!, { ...ordered[1]!, tournamentId: "other" }], "all"),
    ).toThrow();
    expect(filterHandIds([ordered[2]!, ordered[0]!], "played").ids).toEqual(["hand-3"]);
  });

  it("uses accepted real Hero facts rather than source text or replay markers", () => {
    const foldedBeforeFlop = real(3, "TM6378370688");
    const checkedBigBlind = real(3, "TM6376938342");
    const earlyAllInRunout = real(0, "TM6468725291");
    const summaryOnlyReveal = real(1, "TM6470156513");
    const zeroStackFold = real(1, "TM6471061841");
    const cases: ReadonlyArray<readonly [HandFacts, readonly HandFilter[]]> = [
      [foldedBeforeFlop, []],
      [checkedBigBlind, ["played", "postflop", "showdown"]],
      [earlyAllInRunout, ["played", "postflop", "showdown"]],
      [summaryOnlyReveal, []],
    ];
    for (const [facts, expected] of cases) {
      for (const filter of ["played", "postflop", "showdown"] as const) {
        expect(filterHandIds([facts], filter).ids).toEqual(
          expected.includes(filter) ? [facts.handId] : [],
        );
      }
    }
    expect(filterHandIds([zeroStackFold], "all").ids).toEqual([zeroStackFold.handId]);
    expect(filterHandIds([zeroStackFold], "played").unknown.played).toBe(1);
  });
});
