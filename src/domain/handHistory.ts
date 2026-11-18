import { z } from "zod";
import {
  actionSchema,
  blindLevelSchema,
  cardSchema,
  handSchema,
  playerSchema,
  positionSchema,
  streetSchema,
  tournamentSchema,
} from "./schemas";

export const chipSchema = z.number().int().safe().nonnegative();
const positiveChips = chipSchema.positive();
export const sourceLocationSchema = z.object({
  lineNumber: z.number().int().positive(),
  rawLine: z.string(),
});
export type SourceLocation = z.infer<typeof sourceLocationSchema>;
export type Position = z.infer<typeof positionSchema>;
export type HistoryErrorType =
  | "unsupported_format"
  | "malformed_hand"
  | "unsupported_game"
  | "incomplete_hand"
  | "invalid_action"
  | "invalid_card"
  | "inconsistent_seats";

export class HandHistoryValidationError extends Error {
  readonly type: HistoryErrorType;
  readonly lineNumber?: number;
  readonly rawLine?: string;
  constructor(type: HistoryErrorType, message: string, source?: SourceLocation) {
    super(message);
    this.name = "HandHistoryValidationError";
    this.type = type;
    this.lineNumber = source?.lineNumber;
    this.rawLine = source?.rawLine;
  }
}

export const exactMoneySchema = z.object({
  amountMinor: chipSchema,
  scale: z.literal(2),
  currency: z.string().nullable(),
  symbol: z.string().min(1),
});
export type ExactMoney = z.infer<typeof exactMoneySchema>;
export const localTimestampSchema = z.object({
  local: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
  timezone: z.string().nullable(),
});
export type LocalTimestamp = z.infer<typeof localTimestampSchema>;
const eventBase = actionSchema.pick({ id: true, sequence: true }).extend({
  street: z.enum(["PREFLOP", "FLOP", "TURN", "RIVER", "SHOWDOWN"]),
  source: sourceLocationSchema,
});
const actor = z.string().min(1);
export const handHistoryEventSchema = z.discriminatedUnion("type", [
  eventBase.extend({
    type: z.enum([
      "ANTE",
      "SMALL_BLIND",
      "BIG_BLIND",
      "CALL",
      "BET",
      "RETURN_UNCALLED",
      "COLLECT_POT",
    ]),
    actorPlayerId: actor,
    amountChips: positiveChips,
    isAllIn: z.boolean(),
  }),
  eventBase.extend({
    type: z.enum(["FOLD", "CHECK"]),
    actorPlayerId: actor,
    amountChips: z.literal(0),
    isAllIn: z.literal(false),
  }),
  eventBase.extend({
    type: z.literal("RAISE"),
    actorPlayerId: actor,
    amountChips: positiveChips,
    raiseByChips: positiveChips,
    raiseToChips: positiveChips,
    isAllIn: z.boolean(),
  }),
  eventBase.extend({
    type: z.literal("SHOW"),
    actorPlayerId: actor,
    amountChips: z.literal(0),
    isAllIn: z.literal(false),
    cards: z.array(cardSchema).min(1).max(2),
    description: z.string().optional(),
  }),
  eventBase.extend({
    type: z.literal("MUCK"),
    actorPlayerId: actor,
    amountChips: z.literal(0),
    isAllIn: z.literal(false),
  }),
  eventBase.extend({
    type: z.literal("SHOWDOWN"),
    street: z.literal("SHOWDOWN"),
    actorPlayerId: z.null(),
    amountChips: z.literal(0),
    isAllIn: z.literal(false),
  }),
]);
export type HandHistoryEvent = z.infer<typeof handHistoryEventSchema>;

export const historyBoardSchema = z
  .object({ street: streetSchema, board: z.array(cardSchema) })
  .superRefine((value, ctx) => {
    const expected = { PREFLOP: 0, FLOP: 3, TURN: 4, RIVER: 5 }[value.street];
    if (
      value.board.length !== expected ||
      new Set(value.board.map((c) => c.rank + c.suit)).size !== value.board.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid cumulative board",
        path: ["board"],
      });
    }
  });
export const historyBlindLevelSchema = blindLevelSchema.extend({
  smallBlindChips: positiveChips,
  bigBlindChips: positiveChips,
  anteChips: chipSchema,
});
export const historyPlayerSchema = playerSchema.extend({
  startingStackChips: chipSchema,
});
export const historyTableSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().min(2).max(9),
});
const deductionsSchema = z.object({
  rakeChips: chipSchema,
  jackpotChips: chipSchema,
  bingoChips: chipSchema,
  fortuneChips: chipSchema,
  taxChips: chipSchema,
});
export const historySummaryPlayerSchema = z.object({
  playerId: actor,
  seatNumber: z.number().int().min(1).max(9),
  outcome: z.enum(["FOLDED", "WON", "LOST", "COLLECTED"]),
  foldStreet: streetSchema.optional(),
  collectedChips: chipSchema,
  cards: z.array(cardSchema).min(1).max(2).nullable(),
  description: z.string().optional(),
  source: sourceLocationSchema,
});
export const importedHandSchema = handSchema
  .omit({ streets: true, replayMode: true })
  .extend({
    timestamp: localTimestampSchema,
    table: historyTableSchema,
    occupiedSeatCount: z.number().int().min(2).max(9),
    buttonSeat: z.number().int().min(1).max(9),
    levelNumber: z.number().int().positive(),
    blindLevel: historyBlindLevelSchema,
    players: z.array(historyPlayerSchema).min(2).max(9),
    source: z.object({
      sourceHandNumber: z.number().int().positive(),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      rawText: z.string(),
    }),
    streets: z.array(historyBoardSchema).min(1).max(4),
    events: z.array(handHistoryEventSchema).min(1),
    warnings: z
      .array(
        z.object({
          code: z.enum(["SHORT_BLIND_POST", "ZERO_STACK_FOLD"]),
          message: z.string(),
          source: sourceLocationSchema,
        }),
      )
      .default([]),
    summary: z.object({
      totalPotChips: chipSchema,
      deductions: deductionsSchema,
      players: z.array(historySummaryPlayerSchema).min(2).max(9),
    }),
    results: z.array(
      z.object({
        playerId: actor,
        finalStackChips: chipSchema,
        netChips: z.number().int().safe(),
        grossContributedChips: chipSchema,
        returnedChips: chipSchema,
        collectedChips: chipSchema,
      }),
    ),
  });
export type ImportedHand = z.infer<typeof importedHandSchema>;
export const importedTournamentSchema = tournamentSchema
  .pick({ id: true, room: true, name: true, heroPlayerId: true, handsPlayed: true })
  .extend({
    buyIn: exactMoneySchema.nullable(),
    format: z.string().nullable(),
    formatAnnotations: z.array(z.string()),
    game: z.literal("NLHE"),
    timestampRange: z.object({
      first: localTimestampSchema,
      last: localTimestampSchema,
    }),
    tables: z.array(historyTableSchema).min(1),
    blindLevels: z
      .array(
        z.object({
          levelNumber: z.number().int().positive(),
          ...historyBlindLevelSchema.shape,
        }),
      )
      .min(1),
    hands: z.array(importedHandSchema).min(1),
  });
export type ImportedTournament = z.infer<typeof importedTournamentSchema>;
