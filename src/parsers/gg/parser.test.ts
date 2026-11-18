// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseGgTournament } from "./index";
import { fixtureHand, readFixture } from "./fixtureTestUtils";
import { importedTournamentSchema } from "../../domain/handHistory";

const expected = [
  {
    id: "314729652",
    name: "Daily Monster Stack $2.50",
    hands: 222,
    buyIn: 250,
    first: "2026-09-28T17:07:51",
    last: "2026-09-28T21:09:39",
    tables: 4,
    firstHand: "TM6469019406",
  },
  {
    id: "314806258",
    name: "Fifty Stack $5.50",
    hands: 191,
    buyIn: 550,
    first: "2026-09-28T23:05:02",
    last: "2026-09-29T02:40:11",
    tables: 4,
    firstHand: "TM6470172527",
  },
  {
    id: "317697722",
    name: "GGMasters $150, $1M GTD [2-Day Event]",
    hands: 28,
    buyIn: 15000,
    first: "2026-10-11T21:00:02",
    last: "2026-10-11T21:31:32",
    tables: 1,
    firstHand: "TM6522429068",
  },
];

describe("public GG tournament parser", () => {
  it("uses the declared 450 BB for TM6377255556 raises despite its short 82-chip BB post", () => {
    const result = parseGgTournament(fixtureHand(3, "TM6377255556"));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const hand = result.tournament.hands[0]!;
    expect(hand.events.find((e) => e.type === "RAISE")).toMatchObject({
      amountChips: 900,
      raiseByChips: 450,
      raiseToChips: 900,
    });
    expect(
      hand.events.filter((e) => e.type === "COLLECT_POT").map((e) => e.amountChips),
    ).toEqual([343, 343, 11058]);
    expect(hand.summary.totalPotChips).toBe(11744);
  });
  it("rejects a raise-by incorrectly measured from the largest actual short-blind contribution", () => {
    const result = parseGgTournament(
      fixtureHand(3, "TM6377255556").replace("raises 450 to 900", "raises 675 to 900"),
    );
    expect(result).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ type: "invalid_action" })],
    });
  });
  it("preserves the exact Daily Classic TM6378370688 one-card summary without an invented show step", () => {
    const result = parseGgTournament(fixtureHand(3, "TM6378370688"));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const hand = result.tournament.hands[0]!;
    const opponent = hand.players.find((p) => p.name === "f5cbea50")!;
    expect(hand.summary.players.find((p) => p.playerId === opponent.id)).toMatchObject({
      cards: [{ rank: "A", suit: "h" }],
      collectedChips: 106400,
      source: { rawLine: "Seat 2: f5cbea50 (big blind) showed [Ah] and won (106,400)" },
    });
    expect(hand.events.filter((e) => e.type === "SHOW")).toHaveLength(0);
  });
  it.each(["Ax", "Ah Ah", ""])(
    "rejects invalid partial-summary cards [%s]",
    (cards) => {
      const result = parseGgTournament(
        fixtureHand(3, "TM6378370688").replace("showed [Ah]", `showed [${cards}]`),
      );
      expect(result).toMatchObject({
        ok: false,
        errors: [expect.objectContaining({ type: "invalid_card" })],
      });
    },
  );
  it.each([0, 1, 2])("parses every hand and metadata from real fixture %i", (index) => {
    const result = parseGgTournament(readFixture(index));
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const e = expected[index]!;
    const t = result.tournament;
    expect(t).toMatchObject({
      id: e.id,
      name: e.name,
      room: "GGPoker",
      game: "NLHE",
      handsPlayed: e.hands,
      buyIn: { amountMinor: e.buyIn, scale: 2, currency: null, symbol: "$" },
      timestampRange: {
        first: { local: e.first, timezone: null },
        last: { local: e.last, timezone: null },
      },
      format: null,
    });
    expect(t.tables).toHaveLength(e.tables);
    expect(t.hands).toHaveLength(e.hands);
    expect(t.hands[0]?.id).toBe(e.firstHand);
    expect(t.hands[0]?.source.sourceHandNumber).toBe(e.hands);
    expect(t.hands.map((h) => h.handNumber)).toEqual(
      Array.from({ length: e.hands }, (_, i) => i + 1),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "unresolved_currency",
          field: "buyIn.currency",
        }),
        expect.objectContaining({
          type: "unknown_timezone",
          field: "timestamp.timezone",
        }),
      ]),
    );
    expect(result.warnings.filter((w) => w.type === "unknown_timezone")).toHaveLength(
      1,
    );
    expect(importedTournamentSchema.safeParse(t).success).toBe(true);
    for (const hand of t.hands) {
      expect(hand.events.map((a) => a.sequence)).toEqual(hand.events.map((_, i) => i));
      expect(hand.events.every((a) => Number.isSafeInteger(a.amountChips))).toBe(true);
      expect(hand.players.reduce((sum, p) => sum + p.startingStackChips, 0)).toBe(
        hand.results.reduce((sum, r) => sum + r.finalStackChips, 0),
      );
      expect(
        hand.results.reduce(
          (sum, r) => sum + r.grossContributedChips - r.returnedChips,
          0,
        ),
      ).toBe(hand.summary.totalPotChips);
      expect(hand.results.reduce((sum, r) => sum + r.collectedChips, 0)).toBe(
        hand.summary.totalPotChips,
      );
    }
  });
  it("retains literal format annotations without classifying a format", () => {
    const result = parseGgTournament(readFixture(2));
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.tournament.formatAnnotations).toEqual(["2-Day Event"]);
  });
  it.each([0, 1, 2, 3])("is deterministic for real fixture %i", (index) => {
    expect(parseGgTournament(readFixture(index))).toEqual(
      parseGgTournament(readFixture(index)),
    );
  });
  it("does not derive poker identity from a diagnostic filename", () => {
    const text = fixtureHand(2, "TM6524471450");
    const first = parseGgTournament(text, { sourceName: "one.txt" });
    const second = parseGgTournament(text, { sourceName: "two.txt" });
    expect(first.ok && first.tournament).toEqual(second.ok && second.tournament);
  });
  it("preserves an unavailable buy-in rather than fabricating money", () => {
    const text = fixtureHand(2, "TM6524471450").replace(
      "GGMasters $150, $1M GTD [2-Day Event]",
      "Unpriced Event",
    );
    const result = parseGgTournament(text);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.tournament.buyIn).toBeNull();
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: "missing_metadata", field: "buyIn" }),
    );
  });
  it("returns structured failure instead of throwing on unknown text", () => {
    expect(parseGgTournament("not GG")).toMatchObject({
      ok: false,
      errors: [{ type: "unsupported_format" }],
    });
  });
  it("warns instead of interpreting a guarantee after an unsupported first price", () => {
    const text = fixtureHand(2, "TM6524471450").replace(
      "GGMasters $150, $1M GTD [2-Day Event]",
      "GGMasters $2,500, $100000 GTD",
    );
    const result = parseGgTournament(text);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.tournament.buyIn).toBeNull();
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: "missing_metadata", field: "buyIn" }),
    );
  });
});
