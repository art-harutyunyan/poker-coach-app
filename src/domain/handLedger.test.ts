// @vitest-environment node
import { describe, expect, it } from "vitest";
import { HandLedger } from "./handLedger";
import type { HandHistoryEvent } from "./handHistory";
import type { Player } from "./schemas";

const players: Player[] = [
  {
    id: "hero",
    name: "Hero",
    seatNumber: 1,
    position: "SB",
    startingStackChips: 1000,
    isHero: true,
  },
  {
    id: "villain",
    name: "Villain",
    seatNumber: 2,
    position: "BB",
    startingStackChips: 1000,
    isHero: false,
  },
];
let sequence = 0;
function event(
  type: HandHistoryEvent["type"],
  actorPlayerId: string | null,
  amountChips = 0,
  extra: object = {},
): HandHistoryEvent {
  return {
    id: `event-${sequence}`,
    sequence: sequence++,
    type,
    actorPlayerId,
    amountChips,
    isAllIn: false,
    street: "PREFLOP",
    source: { lineNumber: 41, rawLine: "ledger test source" },
    ...extra,
  } as HandHistoryEvent;
}
function posted() {
  const ledger = new HandLedger(players);
  ledger.apply(event("ANTE", "hero", 10));
  ledger.apply(event("ANTE", "villain", 10));
  ledger.apply(event("SMALL_BLIND", "hero", 50));
  ledger.apply(event("BIG_BLIND", "villain", 100));
  return ledger;
}
function allInAndReturn() {
  const ledger = posted();
  ledger.apply(
    event("RAISE", "hero", 940, {
      raiseByChips: 890,
      raiseToChips: 990,
      isAllIn: true,
    }),
  );
  ledger.apply(event("FOLD", "villain"));
  ledger.apply(event("RETURN_UNCALLED", "hero", 890));
  return ledger;
}

describe("exact normalized chip ledger", () => {
  it("counts antes in the pot but excludes them from live commitments", () => {
    const ledger = posted();
    expect(ledger.commitment("hero")).toBe(50);
    expect(ledger.snapshot()).toMatchObject({
      potChips: 170,
      stacks: { hero: 940, villain: 890 },
      contributions: { hero: 60, villain: 110 },
    });
  });
  it("checks raise-by/to independently from incremental contribution", () => {
    const ledger = posted();
    ledger.apply(event("RAISE", "hero", 150, { raiseByChips: 100, raiseToChips: 200 }));
    ledger.apply(event("CALL", "villain", 100));
    expect(ledger.snapshot()).toMatchObject({
      potChips: 420,
      stacks: { hero: 790, villain: 790 },
    });
    ledger.apply(event("CHECK", "hero", 0, { street: "FLOP" }));
    expect(ledger.commitment("hero")).toBe(0);
    ledger.apply(event("BET", "villain", 300, { street: "FLOP" }));
    ledger.apply(event("CALL", "hero", 300, { street: "FLOP" }));
    ledger.apply(event("SHOWDOWN", null, 0, { street: "SHOWDOWN" }));
    ledger.apply(event("COLLECT_POT", "hero", 1020, { street: "SHOWDOWN" }));
    expect(ledger.finish(1020)).toMatchObject({
      potChips: 0,
      stacks: { hero: 1510, villain: 490 },
    });
  });
  it("preserves a return after all-in separately from winnings", () => {
    const ledger = allInAndReturn();
    expect(ledger.snapshot()).toMatchObject({
      potChips: 220,
      stacks: { hero: 890 },
      returns: { hero: 890 },
      awards: { hero: 0 },
    });
    ledger.apply(event("COLLECT_POT", "hero", 100, { street: "SHOWDOWN" }));
    ledger.apply(event("COLLECT_POT", "hero", 120, { street: "SHOWDOWN" }));
    expect(ledger.finish(220)).toMatchObject({
      stacks: { hero: 1110, villain: 890 },
      awards: { hero: 220 },
      returns: { hero: 890 },
    });
  });
  it("normalizes the known Daily 32,000 then 316,050 raise sequence", () => {
    const ledger = new HandLedger([
      { ...players[0]!, startingStackChips: 318050 },
      { ...players[1]!, startingStackChips: 403930 },
    ]);
    ledger.apply(event("ANTE", "hero", 2000));
    ledger.apply(event("ANTE", "villain", 2000));
    ledger.apply(event("BIG_BLIND", "villain", 16000));
    ledger.apply(
      event("RAISE", "hero", 32000, { raiseByChips: 16000, raiseToChips: 32000 }),
    );
    ledger.apply(
      event("RAISE", "villain", 68000, { raiseByChips: 52000, raiseToChips: 84000 }),
    );
    ledger.apply(
      event("RAISE", "hero", 284050, {
        raiseByChips: 232050,
        raiseToChips: 316050,
        isAllIn: true,
      }),
    );
    expect(ledger.snapshot().stacks.hero).toBe(0);
    expect(ledger.commitment("hero")).toBe(316050);
  });
  it("accepts the known Fifty short all-in call and 129,067 return", () => {
    const ledger = new HandLedger([
      { ...players[0]!, startingStackChips: 182725 },
      { ...players[1]!, startingStackChips: 311792 },
      { ...players[1]!, id: "button", seatNumber: 3, startingStackChips: 294384 },
    ]);
    for (const id of ["hero", "villain", "button"])
      ledger.apply(event("ANTE", id, 2500));
    ledger.apply(event("SMALL_BLIND", "villain", 10000));
    ledger.apply(event("BIG_BLIND", "hero", 20000));
    ledger.apply(
      event("RAISE", "button", 40000, { raiseByChips: 20000, raiseToChips: 40000 }),
    );
    ledger.apply(
      event("RAISE", "villain", 299292, {
        raiseByChips: 269292,
        raiseToChips: 309292,
        isAllIn: true,
      }),
    );
    ledger.apply(event("CALL", "hero", 160225, { isAllIn: true }));
    ledger.apply(event("FOLD", "button"));
    ledger.apply(event("RETURN_UNCALLED", "villain", 129067));
    expect(ledger.snapshot()).toMatchObject({
      potChips: 407950,
      stacks: { hero: 0, villain: 129067 },
    });
  });
  it("conserves chips at each event", () => {
    const ledger = posted();
    for (const e of [
      event("CALL", "hero", 50),
      event("CHECK", "villain"),
      event("BET", "hero", 100, { street: "FLOP" }),
      event("FOLD", "villain", 0, { street: "FLOP" }),
      event("RETURN_UNCALLED", "hero", 100, { street: "FLOP" }),
      event("COLLECT_POT", "hero", 220, { street: "SHOWDOWN" }),
    ]) {
      ledger.apply(e);
      const state = ledger.snapshot();
      expect(
        state.potChips + Object.values(state.stacks).reduce((a, b) => a + b, 0),
      ).toBe(2000);
    }
  });
  it.each([
    ["unknown actor", () => posted().apply(event("CALL", "missing", 50))],
    ["check facing bet", () => posted().apply(event("CHECK", "hero"))],
    ["short call without all-in", () => posted().apply(event("CALL", "hero", 49))],
    ["call above amount owed", () => posted().apply(event("CALL", "hero", 51))],
    [
      "raise-by disagreement",
      () =>
        posted().apply(
          event("RAISE", "hero", 150, { raiseByChips: 99, raiseToChips: 200 }),
        ),
    ],
    [
      "raise contribution disagreement",
      () =>
        posted().apply(
          event("RAISE", "hero", 200, { raiseByChips: 100, raiseToChips: 200 }),
        ),
    ],
    ["bet instead of raise", () => posted().apply(event("BET", "hero", 100))],
    [
      "over-stack bet",
      () => posted().apply(event("BET", "hero", 1000, { street: "FLOP" })),
    ],
    [
      "false all-in flag",
      () => posted().apply(event("CALL", "hero", 50, { isAllIn: true })),
    ],
    [
      "negative amount",
      () => posted().apply(event("BET", "hero", -1, { street: "FLOP" })),
    ],
    [
      "unsafe amount",
      () =>
        posted().apply(
          event("BET", "hero", Number.MAX_SAFE_INTEGER + 1, { street: "FLOP" }),
        ),
    ],
    ["excess return", () => posted().apply(event("RETURN_UNCALLED", "villain", 101))],
    [
      "award above pot",
      () => posted().apply(event("COLLECT_POT", "hero", 171, { street: "SHOWDOWN" })),
    ],
    ["unfinished pot", () => posted().finish(170)],
    [
      "declared pot mismatch",
      () => {
        const l = allInAndReturn();
        l.apply(event("COLLECT_POT", "hero", 220, { street: "SHOWDOWN" }));
        l.finish(221);
      },
    ],
    [
      "negative starting stack",
      () => new HandLedger([{ ...players[0]!, startingStackChips: -1 }]),
    ],
    [
      "unsafe combined starting stacks",
      () =>
        new HandLedger(
          players.map((p) => ({ ...p, startingStackChips: Number.MAX_SAFE_INTEGER })),
        ),
    ],
  ] as const)("rejects %s", (_name, act) => {
    expect(act).toThrow(expect.objectContaining({ type: "invalid_action" }));
  });
  it("rejects betting or collecting after folding but permits revealed cards", () => {
    const ledger = posted();
    ledger.apply(event("FOLD", "hero"));
    expect(() => ledger.apply(event("BET", "hero", 100, { street: "FLOP" }))).toThrow();
    expect(() =>
      ledger.apply(event("COLLECT_POT", "hero", 100, { street: "SHOWDOWN" })),
    ).toThrow();
    expect(() =>
      ledger.apply(
        event("SHOW", "hero", 0, {
          street: "SHOWDOWN",
          cards: [{ rank: "T", suit: "s" }],
        }),
      ),
    ).not.toThrow();
  });
  it("retains a source fold at zero after a forced post without moving chips", () => {
    const ledger = new HandLedger([
      { ...players[0]!, startingStackChips: 5493 },
      players[1]!,
    ]);
    ledger.apply(event("ANTE", "hero", 1250));
    ledger.apply(event("SMALL_BLIND", "hero", 4243));
    expect(() => ledger.apply(event("FOLD", "hero"))).not.toThrow();
    expect(ledger.snapshot()).toMatchObject({ potChips: 5493, stacks: { hero: 0 } });
  });
  it("exposes nominal preflop wager and stack-capped call before action", () => {
    const ledger = new HandLedger(
      [{ ...players[0]!, startingStackChips: 70 }, players[1]!],
      100,
    );
    ledger.apply(event("SMALL_BLIND", "hero", 50));
    ledger.apply(event("BIG_BLIND", "villain", 100));
    expect(ledger.currentBetChips()).toBe(100);
    expect(ledger.facingAmountChips("hero")).toBe(50);
    expect(ledger.amountToCallChips("hero")).toBe(20);
    expect(ledger.facingAmountChips("villain")).toBe(0);
  });
  it("retains nominal BB when the posted BB is short", () => {
    const ledger = new HandLedger(
      [players[0]!, { ...players[1]!, startingStackChips: 40 }],
      100,
    );
    ledger.apply(event("SMALL_BLIND", "hero", 50));
    ledger.apply(event("BIG_BLIND", "villain", 40, { isAllIn: true }));
    expect(ledger.currentBetChips()).toBe(100);
    expect(ledger.amountToCallChips("hero")).toBe(50);
  });
  it("reads a returned wager from live commitments", () => {
    const ledger = allInAndReturn();
    expect(ledger.currentBetChips()).toBe(100);
    expect(ledger.facingAmountChips("hero")).toBe(0);
  });
  it("prepares a new street before reading its first decision", () => {
    const ledger = posted();
    ledger.apply(event("CALL", "hero", 50));
    const before = ledger.snapshot();
    ledger.beginStreet("FLOP");
    expect(ledger.currentBetChips()).toBe(0);
    expect(ledger.commitment("hero")).toBe(0);
    expect(ledger.commitment("villain")).toBe(0);
    expect(ledger.snapshot()).toEqual(before);
    ledger.apply(event("CHECK", "hero", 0, { street: "FLOP" }));
  });
});
