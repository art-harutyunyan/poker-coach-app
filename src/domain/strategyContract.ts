import { z } from "zod";
import type { HeroBettingAction } from "./heroDecisionTypes";

export const STRATEGY_SCHEMA_VERSION = "a2-v1" as const;
export type StrategyAction = HeroBettingAction;

const nonblank = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, {
    message: "Must contain non-whitespace text",
  });
const actionSchema = z.enum(["FOLD", "CHECK", "CALL", "BET", "RAISE"]);
const positiveFinite = z.number().finite().positive();
const positiveChips = z.number().int().safe().positive();

export const strategyDecisionKeySchema = z
  .object({
    handId: nonblank,
    eventId: nonblank,
    decisionIndex: z.number().int().safe().nonnegative(),
  })
  .strict();
export type StrategyDecisionKey = z.infer<typeof strategyDecisionKeySchema>;

export const strategySizingSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("chips-added"), value: positiveChips }).strict(),
  z.object({ kind: z.literal("bb-added"), value: positiveFinite }).strict(),
  z.object({ kind: z.literal("raise-to-chips"), value: positiveChips }).strict(),
  z.object({ kind: z.literal("raise-to-bb"), value: positiveFinite }).strict(),
  z.object({ kind: z.literal("pot-fraction-added"), value: positiveFinite }).strict(),
  z.object({ kind: z.literal("all-in") }).strict(),
]);
export type StrategySizing = z.infer<typeof strategySizingSchema>;

export const strategyChoiceSchema = z
  .object({
    action: actionSchema,
    sizing: strategySizingSchema.optional(),
  })
  .strict();
export type StrategyChoice = z.infer<typeof strategyChoiceSchema>;

const strategyMixEntrySchema = strategyChoiceSchema.extend({
  frequency: z.number().finite().min(0).max(1),
});

export const strategyRecommendationSchema = z
  .object({
    primaryAction: actionSchema,
    primarySizing: strategySizingSchema.optional(),
    alternatives: z.array(strategyChoiceSchema).optional(),
    strategyMix: z.array(strategyMixEntrySchema).nonempty().optional(),
  })
  .strict();
export type StrategyRecommendation = z.infer<typeof strategyRecommendationSchema>;

export const strategySourceSchema = z
  .object({
    id: nonblank,
    kind: z.enum([
      "curated-range",
      "deterministic-rule",
      "push-fold",
      "solver-derived",
      "postflop-model",
      "icm-model",
      "exploit-adjustment",
    ]),
    name: nonblank,
    version: nonblank,
    isExactReference: z.boolean(),
    assumptions: z.array(nonblank),
    determinism: z.enum(["deterministic", "approximate", "stochastic"]),
  })
  .strict();
export type StrategySource = z.infer<typeof strategySourceSchema>;

export const strategyLimitationSchema = z
  .object({
    code: z.enum([
      "scope-boundary",
      "source-approximation",
      "missing-dimension",
      "model-simplification",
      "other",
    ]),
    detail: nonblank,
  })
  .strict();
export type StrategyLimitation = z.infer<typeof strategyLimitationSchema>;

export const strategyScopeSchema = z
  .object({
    street: z.array(z.enum(["PREFLOP", "FLOP", "TURN", "RIVER"])).optional(),
    tableSize: z.array(z.number().int().min(2).max(10)).optional(),
    heroPosition: z.array(nonblank).optional(),
    stackDepthBb: z
      .object({
        min: z.number().finite().nonnegative(),
        max: z.number().finite().positive(),
      })
      .strict()
      .refine(({ min, max }) => min <= max, {
        message: "Maximum stack depth must be at least the minimum",
      })
      .optional(),
    potType: z.array(nonblank).optional(),
    playerCount: z.enum(["heads-up", "multiway", "both"]).optional(),
    gameMode: z.enum(["tournament", "cash", "both"]).optional(),
    anteStructure: nonblank.optional(),
    icmAvailable: z.boolean().optional(),
    facingAction: z.array(nonblank).optional(),
  })
  .strict();
export type StrategyScope = z.infer<typeof strategyScopeSchema>;

export const strategyCapabilitySchema = z
  .object({
    status: z.enum(["supported", "partial", "unsupported"]),
    engineId: nonblank,
    scope: strategyScopeSchema.optional(),
    limitations: z.array(strategyLimitationSchema).optional(),
  })
  .strict();
export type StrategyCapability = z.infer<typeof strategyCapabilitySchema>;
export type StrategyConfidence = "supported" | "approximate" | "limited";

export const strategyMissingFieldSchema = z.enum([
  "legalActions",
  "heroCards",
  "heroPosition",
  "heroStackBeforeBb",
  "effectiveStackBeforeChips",
  "effectiveStackBeforeBb",
  "minimumRaiseToChips",
  "sourceConfidence",
]);
export type StrategyMissingField = z.infer<typeof strategyMissingFieldSchema>;

const baseResultSchema = z
  .object({
    schemaVersion: z.literal(STRATEGY_SCHEMA_VERSION),
    decisionKey: strategyDecisionKeySchema,
    engine: z
      .object({
        engineId: nonblank,
        engineVersion: nonblank,
        configurationId: nonblank.optional(),
      })
      .strict(),
    capability: strategyCapabilitySchema,
  })
  .strict();

export const strategyRecommendationResultSchema = z.discriminatedUnion("status", [
  baseResultSchema.extend({
    status: z.literal("available"),
    recommendation: strategyRecommendationSchema,
    source: strategySourceSchema,
    confidence: z.enum(["supported", "approximate", "limited"]),
  }),
  baseResultSchema.extend({
    status: z.literal("unsupported"),
    reason: z.enum([
      "spot-not-covered",
      "game-mode-not-covered",
      "source-not-available",
    ]),
  }),
  baseResultSchema.extend({
    status: z.literal("insufficient-context"),
    reason: z.enum(["required-field-unknown", "source-ambiguous"]),
    missingFields: z.array(strategyMissingFieldSchema).nonempty(),
  }),
]);
export type StrategyRecommendationResult = z.infer<
  typeof strategyRecommendationResultSchema
>;
