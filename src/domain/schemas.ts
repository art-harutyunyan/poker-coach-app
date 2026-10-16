import { z } from "zod";

export const decisionGradeSchema = z.enum([
  "EXCELLENT",
  "GOOD",
  "INACCURATE",
  "MISTAKE",
  "MAJOR_MISTAKE",
]);

export const severitySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const confidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const streetSchema = z.enum(["PREFLOP", "FLOP", "TURN", "RIVER"]);
export const cardRankSchema = z.enum([
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
]);
export const cardSuitSchema = z.enum(["s", "h", "d", "c"]);
export const actionTypeSchema = z.enum([
  "ANTE",
  "SMALL_BLIND",
  "BIG_BLIND",
  "FOLD",
  "CHECK",
  "CALL",
  "BET",
  "RAISE",
  "ALL_IN",
  "WIN",
]);
export const positionSchema = z.enum([
  "UTG",
  "UTG_PLUS_1",
  "UTG_PLUS_2",
  "LJ",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
]);
export const strategySourceTypeSchema = z.enum([
  "DETERMINISTIC_RULE",
  "CURATED_RANGE",
  "SOLVER_CACHE",
  "POPULATION_EXPLOIT",
  "AI_HEURISTIC",
  "UNAVAILABLE",
  "MOCK_PROTOTYPE",
]);
export const triageSchema = z.enum([
  "IGNORE",
  "STANDARD",
  "REVIEW",
  "IMPORTANT",
  "CRITICAL",
]);

export const cardSchema = z.object({
  rank: cardRankSchema,
  suit: cardSuitSchema,
});

export const playerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  seatNumber: z.number().int().min(1).max(9),
  position: positionSchema,
  startingStackChips: z.number().int().nonnegative(),
  isHero: z.boolean(),
});

export const blindLevelSchema = z.object({
  smallBlindChips: z.number().int().positive(),
  bigBlindChips: z.number().int().positive(),
  anteChips: z.number().int().nonnegative(),
});

export const actionSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  street: streetSchema,
  actorPlayerId: z.string().min(1),
  type: actionTypeSchema,
  amountChips: z.number().int().nonnegative(),
  resultingPotChips: z.number().int().nonnegative().optional(),
  note: z.string().optional(),
  decisionId: z.string().optional(),
});

export const streetStateSchema = z.object({
  street: streetSchema,
  board: z.array(cardSchema),
  actions: z.array(actionSchema),
});

export const handSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  handNumber: z.number().int().positive(),
  tableSize: z.number().int().min(2).max(9),
  heroPlayerId: z.string().min(1),
  heroHoleCards: z.tuple([cardSchema, cardSchema]),
  blindLevel: blindLevelSchema,
  players: z.array(playerSchema).min(2).max(9),
  streets: z.array(streetStateSchema).min(1),
  resultSummary: z.string(),
});

export const strategyActionSchema = z.object({
  action: z.string().min(1),
  frequency: z.number().min(0).max(1).optional(),
  sizeBB: z.number().positive().optional(),
  label: z.string().min(1),
});

export const strategyReferenceSchema = z.object({
  id: z.string().min(1),
  sourceType: strategySourceTypeSchema,
  sourceName: z.string().min(1),
  version: z.string().min(1),
  isExactReference: z.boolean(),
  assumptions: z.array(z.string()),
  actions: z.array(strategyActionSchema),
});

export const decisionContextSchema = z.object({
  id: z.string().min(1),
  handId: z.string().min(1),
  street: streetSchema,
  actionId: z.string().min(1),
  playerId: z.string().min(1),
  potChipsBeforeAction: z.number().int().nonnegative(),
  effectiveStackBB: z.number().nonnegative(),
  position: positionSchema,
  categories: z.array(z.string().min(1)),
  triage: triageSchema,
});

export const handAnalysisSchema = z.object({
  id: z.string().min(1),
  decisionId: z.string().min(1),
  analysisVersion: z.string().min(1),
  grade: decisionGradeSchema,
  severity: severitySchema,
  confidence: confidenceSchema,
  actualAction: z.string().min(1),
  recommendedAction: z.string().min(1),
  recommendedSizing: z.string().optional(),
  shortReason: z.string().min(1),
  alternativeLine: z.string().min(1),
  resultIndependenceNote: z.string().min(1),
  strategyReference: strategyReferenceSchema,
});

export const tournamentSchema = z.object({
  id: z.string().min(1),
  room: z.literal("GGPoker"),
  name: z.string().min(1),
  buyIn: z.object({
    amount: z.number().nonnegative(),
    currency: z.string().min(1),
  }),
  playedAt: z.string().datetime(),
  handsPlayed: z.number().int().positive(),
  finish: z.object({
    position: z.number().int().positive(),
    fieldSize: z.number().int().positive(),
    payout: z.number().nonnegative(),
    currency: z.string().min(1),
  }),
  heroPlayerId: z.string().min(1),
  metrics: z.object({
    vpip: z.number().min(0).max(1),
    pfr: z.number().min(0).max(1),
    threeBet: z.number().min(0).max(1),
    threeBetOpportunities: z.number().int().nonnegative(),
    majorMistakes: z.number().int().nonnegative(),
  }),
  scoreDimensions: z.array(
    z.object({
      label: z.string().min(1),
      score: z.number().min(0).max(100),
      note: z.string().min(1),
    }),
  ),
  biggestStrength: z.string().min(1),
  mainImprovementArea: z.string().min(1),
});

export const tournamentEvaluationSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  evaluationVersion: z.string().min(1),
  overallGrade: z.string().min(1),
  prioritySummary: z.string().min(1),
  reviewDecisionIds: z.array(z.string().min(1)),
});

export const developmentMetricSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  unit: z.enum(["PERCENT", "COUNT", "SCORE"]),
  points: z.array(
    z.object({
      tournamentLabel: z.string().min(1),
      value: z.number(),
      target: z.number().optional(),
    }),
  ),
});

export const aiUsageSchema = z.object({
  id: z.string().min(1),
  operation: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  tournamentId: z.string().optional(),
  handId: z.string().optional(),
  decisionId: z.string().optional(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cached: z.boolean(),
  estimatedCostUsd: z.number().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  analyzerVersion: z.string().min(1),
  success: z.boolean(),
  createdAt: z.string().datetime(),
});

export const reviewQueueItemSchema = z.object({
  id: z.string().min(1),
  handId: z.string().min(1),
  decisionId: z.string().min(1),
  actionId: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  grade: decisionGradeSchema,
  severity: severitySchema,
  confidence: confidenceSchema,
  description: z.string().min(1),
});

export type DecisionGrade = z.infer<typeof decisionGradeSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type Street = z.infer<typeof streetSchema>;
export type Card = z.infer<typeof cardSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Hand = z.infer<typeof handSchema>;
export type StrategyReference = z.infer<typeof strategyReferenceSchema>;
export type DecisionContext = z.infer<typeof decisionContextSchema>;
export type HandAnalysis = z.infer<typeof handAnalysisSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
export type TournamentEvaluation = z.infer<typeof tournamentEvaluationSchema>;
export type DevelopmentMetric = z.infer<typeof developmentMetricSchema>;
export type AIUsage = z.infer<typeof aiUsageSchema>;
export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>;
