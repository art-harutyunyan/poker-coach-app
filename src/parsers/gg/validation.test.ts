// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseGgTournament } from "./index";
import { fixtureHand, readFixture } from "./fixtureTestUtils";
import type { ParseErrorType } from "./diagnostics";

const original = fixtureHand(2, "TM6524471450");
const earlier = fixtureHand(2, "TM6522429068");
function failed(text: string, type: ParseErrorType) {
  const result = parseGgTournament(text, { sourceName: "corrupt.txt" });
  expect(result.ok).toBe(false);
  expect(result).not.toHaveProperty("tournament");
  if (result.ok) throw new Error("Expected parser rejection");
  expect(result.errors[0]).toMatchObject({
    type,
    sourceName: "corrupt.txt",
    message: expect.any(String),
    lineNumber: expect.any(Number),
    rawLine: expect.any(String),
    handId: expect.any(String),
  });
  return result.errors[0]!;
}

describe("structured GG corruption rejection", () => {
  const cases: [string, string, ParseErrorType][] = [
    [
      "duplicate starting seat",
      original.replace("Seat 2: 86bece49 (", "Seat 1: 86bece49 ("),
      "inconsistent_seats",
    ],
    [
      "duplicate player name",
      original.replace("Seat 2: 86bece49 (", "Seat 2: Hero ("),
      "inconsistent_seats",
    ],
    [
      "unoccupied button",
      original.replace("Seat #7 is the button", "Seat #9 is the button"),
      "inconsistent_seats",
    ],
    [
      "missing button syntax",
      original.replace(" Seat #7 is the button", ""),
      "unsupported_format",
    ],
    [
      "missing Hero identity",
      original.replace(/Hero/g, "FormerHero"),
      "incomplete_hand",
    ],
    [
      "missing Hero cards",
      original.replace("Dealt to Hero [Ad Ah]", "Dealt to Hero"),
      "incomplete_hand",
    ],
    [
      "unknown action actor",
      original.replace("9d2dcd91: raises 91 to 161", "Nobody: raises 91 to 161"),
      "invalid_action",
    ],
    [
      "unknown deal actor",
      original.replace("Dealt to Hero [Ad Ah]", "Dealt to Nobody [Ad Ah]"),
      "invalid_action",
    ],
    [
      "unknown summary actor",
      original.replace("Seat 2: 86bece49 folded", "Seat 2: Nobody folded"),
      "inconsistent_seats",
    ],
    [
      "negative starting stack",
      original.replace("(9,732 in chips)", "(-1 in chips)"),
      "invalid_action",
    ],
    [
      "unsafe starting stack",
      original.replace("(9,732 in chips)", "(9007199254740992 in chips)"),
      "invalid_action",
    ],
    [
      "invalid card code",
      original.replace("Dealt to Hero [Ad Ah]", "Dealt to Hero [Ax Ah]"),
      "invalid_card",
    ],
    [
      "duplicate Hero card",
      original.replace("Dealt to Hero [Ad Ah]", "Dealt to Hero [Ad Ad]"),
      "invalid_card",
    ],
    ["board shares Hero card", original.replace(/8c/g, "Ad"), "invalid_card"],
    [
      "conflicting Hero reveal",
      original.replace("Hero: shows [Ad Ah]", "Hero: shows [Ac Ah]"),
      "invalid_card",
    ],
    [
      "wrong turn prefix",
      original.replace("*** TURN *** [8c 2c 6s] [3c]", "*** TURN *** [8d 2c 6s] [3c]"),
      "invalid_card",
    ],
    [
      "summary board disagreement",
      original.replace("Board [8c 2c 6s 3c Jd]", "Board [8c 2c 6s 3c Qd]"),
      "invalid_card",
    ],
    [
      "impossible flop size",
      original.replace("*** FLOP *** [8c 2c 6s]", "*** FLOP *** [8c 2c]"),
      "invalid_card",
    ],
    [
      "summary role contradiction",
      original.replace(
        "Seat 1: Hero (big blind) showed",
        "Seat 1: Hero (button) showed",
      ),
      "inconsistent_seats",
    ],
    [
      "summary fold street disagreement",
      original.replace(
        "Seat 4: c6e16303 folded on the Flop",
        "Seat 4: c6e16303 folded before Flop",
      ),
      "malformed_hand",
    ],
    [
      "summary award disagreement",
      original.replace("and won (20,203)", "and won (20,204)"),
      "malformed_hand",
    ],
    [
      "truncated seat summaries",
      original.replace(/Seat 8: 318625a8 \(small blind\) folded before Flop/, ""),
      "incomplete_hand",
    ],
    [
      "malformed action",
      original.replace("Hero: bets 1,315", "Hero: bets bananas"),
      "invalid_action",
    ],
    [
      "raise-by disagreement",
      original.replace("raises 91 to 161", "raises 92 to 161"),
      "invalid_action",
    ],
    [
      "uncalled return disagreement",
      original.replace("Uncalled bet (417)", "Uncalled bet (418)"),
      "invalid_action",
    ],
    [
      "award exceeds pot",
      original.replace("collected 20,203 from pot", "collected 20,204 from pot"),
      "invalid_action",
    ],
    ["missing ante", original.replace("Hero: posts the ante 8", ""), "invalid_action"],
    [
      "repeated ante",
      original.replace(
        "Hero: posts the ante 8",
        "Hero: posts the ante 8\nHero: posts the ante 8",
      ),
      "invalid_action",
    ],
    [
      "ante contradicts level",
      original.replace("Hero: posts the ante 8", "Hero: posts the ante 9"),
      "invalid_action",
    ],
    [
      "missing small blind",
      original.replace("318625a8: posts small blind 35", ""),
      "invalid_action",
    ],
    [
      "repeated small blind",
      original.replace(
        "318625a8: posts small blind 35",
        "318625a8: posts small blind 35\n318625a8: posts small blind 35",
      ),
      "invalid_action",
    ],
    [
      "blind amount disagrees",
      original.replace(
        "318625a8: posts small blind 35",
        "318625a8: posts small blind 36",
      ),
      "inconsistent_seats",
    ],
    [
      "blind actor disagrees",
      original.replace(
        "318625a8: posts small blind 35",
        "a128711e: posts small blind 35",
      ),
      "inconsistent_seats",
    ],
    [
      "unsupported game",
      original.replace("Hold'em No Limit", "Omaha Pot Limit"),
      "unsupported_game",
    ],
    [
      "unobserved muck grammar",
      original.replace("Hero: shows [Ad Ah] (a pair of Aces)", "Hero: mucks hand"),
      "invalid_action",
    ],
    [
      "unobserved runout marker",
      original.replace("*** FLOP ***", "*** FIRST FLOP ***"),
      "unsupported_format",
    ],
    [
      "nonzero deductions",
      original.replace("| Rake 0", "| Rake 1"),
      "unsupported_format",
    ],
  ];
  it.each(cases)("rejects %s with contextual diagnostics", (_name, text, type) => {
    failed(text, type);
  });

  it("reports the exact bad line in a later hand and exposes no partial tournament", () => {
    const second = earlier.replace(
      "b140c1d5: raises 60 to 110",
      "Nobody: raises 60 to 110",
    );
    const text = `${original}\n\n${second}`;
    const issue = failed(text, "invalid_action");
    expect(issue).toMatchObject({
      handId: "TM6522429068",
      sourceHandNumber: 2,
      rawLine: "Nobody: raises 60 to 110",
    });
    expect(text.split(/\r?\n/)[issue.lineNumber! - 1]).toBe(issue.rawLine);
  });
  it.each([
    ["duplicate hand", original, "malformed_hand"],
    ["mixed tournament", fixtureHand(0, "TM6469820465"), "malformed_hand"],
    [
      "conflicting title",
      earlier.replace("GGMasters $150, $1M GTD [2-Day Event]", "Other Event $150"),
      "malformed_hand",
    ],
    [
      "conflicting buy-in",
      earlier.replace("GGMasters $150,", "GGMasters $151,"),
      "malformed_hand",
    ],
    ["conflicting level", earlier.replace("Level1(", "Level3("), "malformed_hand"],
    ["conflicting capacity", earlier.replace("8-max", "9-max"), "inconsistent_seats"],
  ] as const)("atomically rejects %s", (_name, second, type) => {
    const issue = failed(`${original}\n\n${second}`, type);
    expect(issue.sourceHandNumber).toBe(2);
  });
  it("surfaces the supplied zero-stack-fold ambiguity with exact source context", () => {
    const result = parseGgTournament(readFixture(1));
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: "source_warning",
        code: "ZERO_STACK_FOLD",
        handId: "TM6471061841",
        rawLine: "e66bbe34: folds",
        lineNumber: expect.any(Number),
      }),
    );
  });
  it("rejects unsupported visible opponent deals instead of losing card evidence", () => {
    const text = original.replace("Dealt to 86bece49 ", "Dealt to 86bece49 [Kd Qd]");
    expect(failed(text, "unsupported_format")).toMatchObject({
      rawLine: "Dealt to 86bece49 [Kd Qd]",
    });
  });
});
