// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveHandFacts } from "./handFacts";
import { metricHand, deepFreeze, type TestAction } from "./pokerMetricsTestUtils";
import { parseGgTournament } from "../parsers/gg";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";
import type { ImportedHand } from "./handHistory";

const known = (value: boolean) => ({ status: "known", value });
describe("source-backed Hero facts", () => {
  it("invalid or conflicting physical card observations cannot become eligible facts", () => {
    const duplicate = metricHand();
    duplicate.heroHoleCards[1] = duplicate.heroHoleCards[0];
    expect(deriveHandFacts(duplicate, "GG").eligiblePreflop.status).toBe("unknown");
    const conflict = metricHand([["h", "CALL", 100]], { board: 5 });
    conflict.heroHoleCards[0] = conflict.streets[1]!.board[0]!;
    expect(deriveHandFacts(conflict, "GG").eligiblePreflop.status).toBe("unknown");
  });
  it.each<[string, TestAction[], boolean, boolean]>([
    ["unopened fold", [["h", "FOLD"]], false, false],
    ["limp", [["h", "CALL", 100]], true, false],
    [
      "call",
      [
        ["a", "RAISE", 300],
        ["h", "CALL", 300],
      ],
      true,
      false,
    ],
    ["open", [["h", "RAISE", 300]], true, true],
    [
      "open fold to 3-bet",
      [
        ["h", "RAISE", 300],
        ["a", "RAISE", 700],
        ["h", "FOLD"],
      ],
      true,
      true,
    ],
    [
      "3-bet",
      [
        ["a", "RAISE", 300],
        ["h", "RAISE", 700],
      ],
      true,
      true,
    ],
    [
      "4-bet",
      [
        ["h", "RAISE", 200],
        ["a", "RAISE", 400],
        ["h", "RAISE", 1000],
      ],
      true,
      true,
    ],
    ["voluntary all-in", [["h", "RAISE", 1000]], true, true],
    [
      "refunded open",
      [
        ["h", "RAISE", 300],
        ["a", "FOLD"],
        ["s", "FOLD"],
        ["b", "FOLD"],
        ["h", "RETURN_UNCALLED", 200],
      ],
      true,
      true,
    ],
  ])("%s distinguishes voluntary chips and raises", (_, actions, vpip, pfr) => {
    const f = deriveHandFacts(metricHand(actions), "GG");
    expect(f.eligiblePreflop).toMatchObject(known(true));
    expect(f.voluntaryPreflop).toMatchObject(known(vpip));
    expect(f.preflopRaise).toMatchObject(known(pfr));
    expect(f.played).toMatchObject(known(vpip));
  });
  it("BB check/flop is Played but not VPIP; walk is eligible zero", () => {
    const f = deriveHandFacts(
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "FOLD"],
          ["s", "FOLD"],
          ["b", "CHECK"],
        ],
        { hero: "b", board: 5 },
      ),
      "GG",
    );
    expect(f).toMatchObject({
      eligiblePreflop: known(true),
      voluntaryPreflop: known(false),
      sawFlop: known(true),
      played: known(true),
    });
    expect(
      deriveHandFacts(
        metricHand(
          [
            ["h", "FOLD"],
            ["a", "FOLD"],
            ["s", "FOLD"],
          ],
          { hero: "b" },
        ),
        "GG",
      ).eligiblePreflop,
    ).toMatchObject(known(true));
  });
  it("preflop fold before others' runout differs from board-only all-in", () => {
    expect(
      deriveHandFacts(metricHand([["h", "FOLD"]], { board: 5 }), "GG").sawFlop,
    ).toMatchObject(known(false));
    const f = deriveHandFacts(
      metricHand(
        [
          ["h", "RAISE", 1000],
          ["a", "CALL", 1000],
          ["s", "FOLD"],
          ["b", "FOLD"],
          ["h", "SHOW"],
        ],
        { board: 5 },
      ),
      "GG",
    );
    expect(f).toMatchObject({
      sawFlop: known(true),
      heroShowdown: known(true),
      played: known(true),
    });
    expect(f.heroShowdown.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventId: "event-6", lineNumber: 16 }),
      ]),
    );
  });
  it("forced-post exhaustion excludes E without erasing flop/reveal facts", () => {
    const f = deriveHandFacts(
      metricHand(
        [
          ["h", "CALL", 100],
          ["a", "FOLD"],
          ["s", "FOLD"],
        ],
        { hero: "b", stacks: { b: 100 }, board: 5, show: ["b"] },
      ),
      "GG",
    );
    expect(f).toMatchObject({
      eligiblePreflop: { ...known(false), reason: "forced_post_exhausted" },
      sawFlop: known(true),
      heroShowdown: known(true),
      played: known(true),
    });
  });
  it.each(["summary only", "marker only", "opponent only"])(
    "%s cannot establish Hero showdown",
    (mode) => {
      const hand = metricHand([["h", "CALL", 100]], {
        board: 5,
        show: mode === "opponent only" ? ["a"] : [],
      });
      expect(deriveHandFacts(hand, "GG").heroShowdown).toMatchObject({
        status: "unknown",
        reasons: ["missing_hero_reveal"],
      });
    },
  );
  it("partial timed reveal qualifies, folded and uncontested reveals do not", () => {
    const hand = metricHand([["h", "CALL", 100]], { board: 5, show: ["h"] });
    const show = hand.events.find((e) => e.type === "SHOW")!;
    if (show.type === "SHOW") show.cards = show.cards.slice(0, 1);
    expect(deriveHandFacts(hand, "GG").heroShowdown).toMatchObject(known(true));
    expect(
      deriveHandFacts(metricHand([["h", "FOLD"]], { board: 5, show: ["h"] }), "GG")
        .heroShowdown,
    ).toMatchObject(known(false));
    expect(
      deriveHandFacts(
        metricHand(
          [
            ["h", "RAISE", 200],
            ["a", "FOLD"],
            ["s", "FOLD"],
            ["b", "FOLD"],
          ],
          { show: ["h"] },
        ),
        "GG",
      ).heroShowdown,
    ).toMatchObject(known(false));
  });
  it("incomplete runout and reserved MUCK remain unknown", () => {
    expect(
      deriveHandFacts(metricHand([["h", "CALL", 100]], { board: 3, show: ["h"] }), "GG")
        .heroShowdown,
    ).toMatchObject({ status: "unknown", reasons: ["incomplete_runout"] });
    expect(
      deriveHandFacts(
        metricHand(
          [
            ["h", "CALL", 100],
            ["h", "MUCK"],
          ],
          { board: 5 },
        ),
        "GG",
      ).heroShowdown,
    ).toMatchObject({ status: "unknown", reasons: ["unsupported_muck"] });
  });
  it("missing preflop decision cannot establish voluntary eligibility", () => {
    expect(deriveHandFacts(metricHand([]), "GG").eligiblePreflop).toMatchObject({
      status: "unknown",
      reasons: ["missing_preflop_decision"],
    });
  });
  it.each([
    "missing hero",
    "duplicate hero",
    "missing deal",
    "incomplete",
    "future warning",
    "zero stack fold",
  ])("excludes %s defensively", (kind) => {
    const hand = metricHand();
    if (kind === "missing hero") hand.heroPlayerId = "absent";
    if (kind === "duplicate hero") hand.players[1]!.isHero = true;
    if (kind === "missing deal") Object.assign(hand, { heroHoleCards: [] });
    if (kind === "incomplete") Object.assign(hand, { events: [] });
    if (kind === "future warning")
      Object.assign(hand, {
        warnings: [
          {
            code: "NEW_UNKNOWN",
            message: "unknown",
            source: { lineNumber: 1, rawLine: "?" },
          },
        ],
      });
    if (kind === "zero stack fold")
      hand.warnings.push({
        code: "ZERO_STACK_FOLD",
        message: "unknown",
        source: { lineNumber: 1, rawLine: "fold" },
      });
    const f = deriveHandFacts(hand, "GG");
    expect(f.eligiblePreflop.status).toBe("unknown");
    expect(f.heroShowdown.status).toBe("unknown");
  });
  it("malformed inputs never throw or manufacture eligible zeros", () => {
    expect(
      deriveHandFacts(null as unknown as ImportedHand, "GG").collectedShare.status,
    ).toBe("unknown");
  });
  it("real metadata gaps do not exclude and calls are immutable/order independent", () => {
    const parsed = parseGgTournament(fixtureHand(0, "TM6468725291"));
    if (!parsed.ok) throw new Error("fixture failed");
    expect(parsed.warnings.length).toBeGreaterThan(0);
    const hand = deepFreeze(parsed.tournament.hands[0]!);
    const before = JSON.stringify(hand);
    const facts = deriveHandFacts(hand, parsed.tournament.room);
    deriveHandFacts(metricHand(), "GG");
    expect(deriveHandFacts(hand, parsed.tournament.room)).toEqual(facts);
    expect(facts.eligiblePreflop.status).toBe("known");
    expect(JSON.stringify(hand)).toBe(before);
    expect(facts.key).toBe(
      JSON.stringify([
        parsed.tournament.room,
        hand.tournamentId,
        hand.heroPlayerId,
        hand.id,
      ]),
    );
  });
});
