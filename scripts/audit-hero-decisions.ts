import type { ImportedTournament } from "../src/domain/handHistory";
import type {
  HeroBettingAction,
  HeroDecisionContext,
} from "../src/domain/heroDecisionTypes";
import { extractHeroDecisions } from "../src/domain/extractHeroDecisions";
import { toReplayHand } from "../src/domain/replayAdapter";
import {
  buildReplayState,
  findActionCursor,
  flattenActions,
} from "../src/domain/replay";

type HandRef = { tournamentId: string; handId: string };
type DecisionRef = HandRef & { eventId: string };

export interface HeroDecisionAudit {
  totalHands: number;
  totalDecisions: number;
  byStreet: Record<"PREFLOP" | "FLOP" | "TURN" | "RIVER", number>;
  byAction: Record<HeroBettingAction, number>;
  zeroDecisionHands: HandRef[];
  exclusions: (HandRef & { reasons: string[] })[];
  unexpectedFailures: (HandRef & { reasons: string[] })[];
  unknownCriticalReasons: Record<string, number>;
  unknownWithoutReason: (DecisionRef & { field: string })[];
  anomalies: Record<string, number>;
  replayDiscrepancies: (DecisionRef & {
    field: string;
    expected: string;
    received: string;
  })[];
  rows: (DecisionRef & { context: HeroDecisionContext })[];
}

function stable(value: unknown): string {
  return JSON.stringify(value);
}

export function buildHeroDecisionAudit(
  tournaments: readonly ImportedTournament[],
): HeroDecisionAudit {
  const report: HeroDecisionAudit = {
    totalHands: 0,
    totalDecisions: 0,
    byStreet: { PREFLOP: 0, FLOP: 0, TURN: 0, RIVER: 0 },
    byAction: { FOLD: 0, CHECK: 0, CALL: 0, BET: 0, RAISE: 0 },
    unexpectedFailures: [],
    replayDiscrepancies: [],
    unknownWithoutReason: [],
    zeroDecisionHands: [],
    exclusions: [],
    unknownCriticalReasons: {},
    anomalies: {},
    rows: [],
  };
  for (const tournament of [...tournaments].sort((a, b) => a.id.localeCompare(b.id))) {
    for (const hand of [...tournament.hands].sort(
      (a, b) => a.source.sourceHandNumber - b.source.sourceHandNumber,
    )) {
      report.totalHands++;
      const ref = { tournamentId: tournament.id, handId: hand.id };
      const extracted = extractHeroDecisions(hand);
      for (const diagnostic of extracted.diagnostics) {
        if (diagnostic.severity !== "fatal")
          report.anomalies[diagnostic.code] =
            (report.anomalies[diagnostic.code] ?? 0) + 1;
      }
      if (extracted.status === "excluded") {
        const failure = { ...ref, reasons: extracted.diagnostics.map((d) => d.code) };
        report.exclusions.push(failure);
        report.unexpectedFailures.push(failure);
        continue;
      }
      if (extracted.decisions.length === 0) report.zeroDecisionHands.push(ref);
      const replay = toReplayHand(hand).hand;
      const actions = flattenActions(replay);
      for (const context of extracted.decisions) {
        const decisionRef = { ...ref, eventId: context.eventId };
        report.totalDecisions++;
        report.byStreet[context.street]++;
        report.byAction[context.actualAction.kind]++;
        report.rows.push({ ...decisionRef, context });
        for (const unknown of context.unknownReasons) {
          const key = `${unknown.field}:${unknown.code}`;
          report.unknownCriticalReasons[key] =
            (report.unknownCriticalReasons[key] ?? 0) + 1;
        }
        for (const [field, value] of [
          ["heroCards", context.heroCards],
          ["heroPosition", context.heroPosition],
          ["legalActions", context.legalActions],
          ["effectiveStackBeforeChips", context.effectiveStackBeforeChips],
          ["effectiveStackBeforeBb", context.effectiveStackBeforeBb],
        ] as const) {
          if (
            value === null &&
            !context.unknownReasons.some((reason) => reason.field === field)
          )
            report.unknownWithoutReason.push({ ...decisionRef, field });
        }
        const cursor = findActionCursor(replay, context.eventId);
        if (actions[cursor]?.id !== context.eventId) {
          report.replayDiscrepancies.push({
            ...decisionRef,
            field: "eventId",
            expected: context.eventId,
            received: actions[cursor]?.id ?? "missing",
          });
          continue;
        }
        const frame = buildReplayState(replay, cursor);
        const comparisons = [
          ["potBeforeActionChips", context.potBeforeActionChips, frame.potChips],
          [
            "heroStackBeforeChips",
            context.heroStackBeforeChips,
            frame.seats.find((seat) => seat.id === hand.heroPlayerId)?.stackChips,
          ],
          ["board", context.board, frame.board],
          [
            "playersRemaining",
            context.playersRemaining.map((p) => p.playerId).sort(),
            frame.seats
              .filter((seat) => !seat.isFolded)
              .map((seat) => seat.id)
              .sort(),
          ],
        ] as const;
        for (const [field, expected, received] of comparisons)
          if (stable(expected) !== stable(received))
            report.replayDiscrepancies.push({
              ...decisionRef,
              field,
              expected: stable(expected),
              received: stable(received),
            });
      }
    }
  }
  return report;
}
