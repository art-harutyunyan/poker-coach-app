import type { HeroBettingAction, HeroDecisionContext } from "./heroDecisionTypes";
import {
  strategyRecommendationResultSchema,
  type StrategyRecommendationResult,
  type StrategySizing,
  type StrategyChoice,
} from "./strategyContract";

export type StrategyValidationIssueCode =
  | "INVALID_SHAPE"
  | "DECISION_KEY_MISMATCH"
  | "CAPABILITY_ENGINE_MISMATCH"
  | "CAPABILITY_STATUS_MISMATCH"
  | "CAPABILITY_LIMITATIONS_REQUIRED"
  | "CONFIDENCE_CAPABILITY_MISMATCH"
  | "MISSING_FIELD_KNOWN"
  | "LEGAL_ACTIONS_UNKNOWN"
  | "ILLEGAL_ACTION"
  | "INVALID_SIZING"
  | "INVALID_MIX"
  | "DUPLICATE_CHOICE"
  | "REPRESENTATIVE_MISMATCH"
  | "DUPLICATE_ALTERNATIVE"
  | "SOURCE_CONFIDENCE_MISMATCH";

export interface StrategyValidationIssue {
  code: StrategyValidationIssueCode;
  path: string;
  message: string;
}

export type StrategyValidationResult =
  | { ok: true; result: StrategyRecommendationResult }
  | { ok: false; issues: StrategyValidationIssue[] };

function checkSizing(
  context: HeroDecisionContext,
  action: HeroBettingAction,
  sizing: StrategySizing | undefined,
  path: string,
  add: (code: StrategyValidationIssueCode, path: string, message: string) => void,
) {
  if (!sizing) return;
  const invalid = (message: string) => add("INVALID_SIZING", path, message);
  if (action === "FOLD" || action === "CHECK") {
    invalid(`${action} cannot have sizing`);
    return;
  }
  if (action === "CALL") {
    if (
      sizing.kind !== "all-in" ||
      context.heroStackBeforeChips <= 0 ||
      context.amountToCallChips !== context.heroStackBeforeChips
    ) {
      invalid(
        "CALL may only designate all-in when the stack-capped call exhausts Hero",
      );
    }
    return;
  }
  if (sizing.kind === "raise-to-chips" || sizing.kind === "raise-to-bb") {
    if (action !== "RAISE") invalid("Raise-to sizing applies only to RAISE");
    if (sizing.kind === "raise-to-chips" && sizing.value <= context.currentBetChips) {
      invalid("Raise-to target must exceed the current live bet");
    }
  }
  if (sizing.kind === "chips-added" && sizing.value > context.heroStackBeforeChips) {
    invalid("Incremental chips exceed Hero's remaining stack");
  }
  if (
    (sizing.kind === "bb-added" || sizing.kind === "raise-to-bb") &&
    (context.heroStackBeforeBb === null || context.heroStackBeforeBb <= 0)
  ) {
    invalid("BB normalization is unknown");
  }
  if (sizing.kind === "pot-fraction-added" && context.potBeforeActionChips <= 0) {
    invalid("Pot fraction requires a positive pre-action pot");
  }
  if (sizing.kind === "all-in" && context.heroStackBeforeChips <= 0) {
    invalid("All-in requires a positive remaining stack");
  }
}

function choiceKey(choice: StrategyChoice): string {
  const sizing = choice.sizing;
  return JSON.stringify([
    choice.action,
    sizing?.kind ?? "absent",
    sizing && "value" in sizing ? sizing.value : null,
  ]);
}

/** Validates a provider result against A1 facts without modifying either input. */
export function validateStrategyResult(
  context: HeroDecisionContext,
  candidate: unknown,
): StrategyValidationResult {
  const parsed = strategyRecommendationResultSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "INVALID_SHAPE",
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  const result = parsed.data;
  const issues: StrategyValidationIssue[] = [];
  const add = (code: StrategyValidationIssueCode, path: string, message: string) => {
    issues.push({ code, path, message });
  };

  for (const field of ["handId", "eventId", "decisionIndex"] as const) {
    if (result.decisionKey[field] !== context[field]) {
      add(
        "DECISION_KEY_MISMATCH",
        `decisionKey.${field}`,
        `Does not match A1 ${field}`,
      );
    }
  }
  if (result.capability.engineId !== result.engine.engineId) {
    add(
      "CAPABILITY_ENGINE_MISMATCH",
      "capability.engineId",
      "Capability names another engine",
    );
  }

  if (result.status === "unsupported") {
    if (result.capability.status !== "unsupported") {
      add(
        "CAPABILITY_STATUS_MISMATCH",
        "capability.status",
        "Unsupported result requires unsupported capability",
      );
    }
  } else if (result.status === "insufficient-context") {
    if (result.capability.status === "unsupported") {
      add(
        "CAPABILITY_STATUS_MISMATCH",
        "capability.status",
        "Insufficient context requires possible coverage",
      );
    }
    if (result.reason === "required-field-unknown") {
      result.missingFields.forEach((field, index) => {
        const value = context[field];
        if (value !== null && !(field === "sourceConfidence" && value === "unknown")) {
          add(
            "MISSING_FIELD_KNOWN",
            `missingFields.${index}`,
            `${field} is known in the A1 decision`,
          );
        }
      });
    }
  } else {
    if (result.capability.status === "unsupported") {
      add(
        "CAPABILITY_STATUS_MISMATCH",
        "capability.status",
        "Available result cannot have unsupported capability",
      );
    }
    if (result.capability.status === "partial") {
      if (!result.capability.limitations?.length) {
        add(
          "CAPABILITY_LIMITATIONS_REQUIRED",
          "capability.limitations",
          "Partial coverage requires limitations",
        );
      }
      if (result.confidence === "supported") {
        add(
          "CONFIDENCE_CAPABILITY_MISMATCH",
          "confidence",
          "Partial coverage cannot claim fully supported confidence",
        );
      }
    }
    if (context.legalActions === null) {
      add("LEGAL_ACTIONS_UNKNOWN", "recommendation", "A1 legal actions are unknown");
    } else {
      const checkAction = (action: string, path: string) => {
        if (!context.legalActions?.includes(action as HeroBettingAction)) {
          add("ILLEGAL_ACTION", path, `${action} is not legal in the A1 decision`);
        }
      };
      checkAction(result.recommendation.primaryAction, "recommendation.primaryAction");
      result.recommendation.strategyMix?.forEach((entry, index) =>
        checkAction(entry.action, `recommendation.strategyMix.${index}.action`),
      );
      result.recommendation.alternatives?.forEach((entry, index) =>
        checkAction(entry.action, `recommendation.alternatives.${index}.action`),
      );
    }
    checkSizing(
      context,
      result.recommendation.primaryAction,
      result.recommendation.primarySizing,
      "recommendation.primarySizing",
      add,
    );
    result.recommendation.strategyMix?.forEach((entry, index) =>
      checkSizing(
        context,
        entry.action,
        entry.sizing,
        `recommendation.strategyMix.${index}.sizing`,
        add,
      ),
    );
    result.recommendation.alternatives?.forEach((entry, index) =>
      checkSizing(
        context,
        entry.action,
        entry.sizing,
        `recommendation.alternatives.${index}.sizing`,
        add,
      ),
    );
    const recommendation = result.recommendation;
    if (recommendation.strategyMix) {
      const mix = recommendation.strategyMix;
      if (recommendation.alternatives?.length) {
        add(
          "INVALID_MIX",
          "recommendation.alternatives",
          "A mix cannot have a separate alternative list",
        );
      }
      if (mix.some((entry) => entry.frequency <= 0)) {
        add(
          "INVALID_MIX",
          "recommendation.strategyMix",
          "Mix entries must have positive frequency",
        );
      }
      const total = mix.reduce((sum, entry) => sum + entry.frequency, 0);
      if (Math.abs(total - 1) > 1e-6) {
        add(
          "INVALID_MIX",
          "recommendation.strategyMix",
          "Mix frequencies must total one within 1e-6",
        );
      }
      const seen = new Set<string>();
      const totals = new Map<HeroBettingAction, number>();
      for (const [index, entry] of mix.entries()) {
        const key = choiceKey(entry);
        if (seen.has(key)) {
          add(
            "DUPLICATE_CHOICE",
            `recommendation.strategyMix.${index}`,
            "Repeated action and declared sizing",
          );
        }
        seen.add(key);
        totals.set(entry.action, (totals.get(entry.action) ?? 0) + entry.frequency);
      }
      const highestActionFrequency = Math.max(...totals.values());
      if ((totals.get(recommendation.primaryAction) ?? 0) < highestActionFrequency) {
        add(
          "REPRESENTATIVE_MISMATCH",
          "recommendation.primaryAction",
          "Primary action must have highest aggregate frequency",
        );
      }
      if (recommendation.primarySizing) {
        const primaryKey = choiceKey({
          action: recommendation.primaryAction,
          sizing: recommendation.primarySizing,
        });
        const selected = mix.find((entry) => choiceKey(entry) === primaryKey);
        const highestSizeFrequency = Math.max(
          ...mix
            .filter((entry) => entry.action === recommendation.primaryAction)
            .map((entry) => entry.frequency),
        );
        if (!selected || selected.frequency < highestSizeFrequency) {
          add(
            "REPRESENTATIVE_MISMATCH",
            "recommendation.primarySizing",
            "Primary sizing must select a highest-frequency size within the primary action",
          );
        }
      }
      if (!result.source.isExactReference && result.confidence === "supported") {
        add(
          "SOURCE_CONFIDENCE_MISMATCH",
          "confidence",
          "Non-exact mixed source requires approximate or limited confidence",
        );
      }
    } else if (recommendation.alternatives) {
      const seen = new Set([
        choiceKey({
          action: recommendation.primaryAction,
          sizing: recommendation.primarySizing,
        }),
      ]);
      for (const [index, alternative] of recommendation.alternatives.entries()) {
        const key = choiceKey(alternative);
        if (seen.has(key)) {
          add(
            "DUPLICATE_ALTERNATIVE",
            `recommendation.alternatives.${index}`,
            "Alternative repeats a choice",
          );
        }
        seen.add(key);
      }
    }
  }
  return issues.length ? { ok: false, issues } : { ok: true, result };
}
