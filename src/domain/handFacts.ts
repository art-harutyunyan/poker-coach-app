import type { ImportedHand } from "./handHistory";
import { eventEvidence, inspectMetricHand } from "./metricHandValidation";
import {
  METRIC_VERSION,
  type EvidenceRef,
  type Fact,
  type HandFacts,
  type ReasonCode,
} from "./pokerMetricTypes";

const known = (
  value: boolean,
  evidence: readonly EvidenceRef[] = [],
  reason?: ReasonCode,
): Fact => ({ status: "known", value, evidence, ...(reason ? { reason } : {}) });
const unknown = (reason: ReasonCode, evidence: readonly EvidenceRef[] = []): Fact => ({
  status: "unknown",
  reasons: [reason],
  evidence,
});

export function deriveHandFacts(input: ImportedHand, room: string): HandFacts {
  const identity = {
    definitionVersion: METRIC_VERSION,
    room,
    tournamentId: input?.tournamentId ?? "",
    heroPlayerId: input?.heroPlayerId ?? "",
    handId: input?.id ?? "",
    handNumber: input?.handNumber ?? 0,
    key: JSON.stringify([
      room,
      input?.tournamentId ?? "",
      input?.heroPlayerId ?? "",
      input?.id ?? "",
    ]),
  };
  const checked = inspectMetricHand(input);
  if (!checked.ok) {
    const f = unknown(checked.reason, checked.evidence);
    return {
      ...identity,
      eligiblePreflop: f,
      voluntaryPreflop: f,
      preflopRaise: f,
      sawFlop: f,
      heroShowdown: f,
      collectedShare: f,
      played: f,
    };
  }
  const { hand, awardsReconciled } = checked;
  const hero = hand.players.find((p) => p.id === hand.heroPlayerId)!;
  const own = hand.events.filter((e) => e.actorPlayerId === hero.id);
  const pre = own.filter((e) => e.street === "PREFLOP");
  const decisions = pre.filter((e) =>
    ["FOLD", "CHECK", "CALL", "BET", "RAISE"].includes(e.type),
  );
  const forced = pre.filter((e) =>
    ["ANTE", "SMALL_BLIND", "BIG_BLIND"].includes(e.type),
  );
  const remaining =
    hero.startingStackChips - forced.reduce((s, e) => s + e.amountChips, 0);
  const folds = hand.events.filter((e) => e.type === "FOLD");
  const walk =
    pre.some((e) => e.type === "BIG_BLIND") &&
    hand.players
      .filter((p) => p.id !== hero.id)
      .every((p) =>
        folds.some((e) => e.actorPlayerId === p.id && e.street === "PREFLOP"),
      );
  const eligiblePreflop =
    remaining <= 0
      ? known(false, eventEvidence(forced), "forced_post_exhausted")
      : decisions.length || walk
        ? known(true, eventEvidence(walk ? [...forced, ...folds] : decisions))
        : unknown("missing_preflop_decision");
  const voluntary = pre.filter(
    (e) => ["CALL", "BET", "RAISE"].includes(e.type) && e.amountChips > 0,
  );
  const raises = pre.filter((e) => e.type === "RAISE");
  const voluntaryPreflop = known(
    voluntary.length > 0,
    eventEvidence(voluntary.length ? voluntary : pre),
  );
  const preflopRaise = known(
    raises.length > 0,
    eventEvidence(raises.length ? raises : pre),
  );
  const folded = own.find((e) => e.type === "FOLD");
  const hasFlop = hand.streets.some((s) => s.street === "FLOP");
  const participation =
    decisions.length > 0 ||
    (remaining === 0 && hero.startingStackChips > 0 && forced.length > 0) ||
    own.some(
      (e) =>
        ["FLOP", "TURN", "RIVER"].includes(e.street) &&
        ["FOLD", "CHECK", "CALL", "BET", "RAISE"].includes(e.type),
    );
  const sawFlop =
    !hasFlop || folded?.street === "PREFLOP"
      ? known(false, eventEvidence(folded ? [folded] : pre))
      : participation
        ? known(true, [{ street: "FLOP" }, ...eventEvidence(pre)])
        : unknown("missing_preflop_decision", [{ street: "FLOP" }]);
  const survivors = hand.players.filter(
    (p) => !folds.some((e) => e.actorPlayerId === p.id),
  );
  const firstCollection = hand.events.findIndex((e) => e.type === "COLLECT_POT");
  const shows = hand.events.filter(
    (e, i) =>
      e.type === "SHOW" &&
      e.actorPlayerId === hero.id &&
      firstCollection >= 0 &&
      i < firstCollection,
  );
  let heroShowdown: Fact;
  if (folded || survivors.length < 2)
    heroShowdown = known(false, eventEvidence(folded ? [folded] : folds));
  else if (own.some((e) => e.type === "MUCK"))
    heroShowdown = unknown(
      "unsupported_muck",
      eventEvidence(own.filter((e) => e.type === "MUCK")),
    );
  else if (!hand.streets.some((s) => s.street === "RIVER"))
    heroShowdown = unknown("incomplete_runout", eventEvidence(shows));
  else if (!shows.length)
    heroShowdown = unknown("missing_hero_reveal", [{ street: "RIVER" }]);
  else if (!participation)
    heroShowdown = unknown("missing_preflop_decision", eventEvidence(shows));
  else
    heroShowdown = known(true, [
      ...eventEvidence(shows),
      { street: "RIVER" },
      ...eventEvidence(folds),
    ]);
  const collections = own.filter((e) => e.type === "COLLECT_POT");
  const collectedShare = awardsReconciled
    ? known(
        collections.length > 0,
        eventEvidence(hand.events.filter((e) => e.type === "COLLECT_POT")),
      )
    : unknown("award_mismatch", eventEvidence(collections));
  const branches = [voluntaryPreflop, sawFlop, heroShowdown];
  const positive = branches.filter((f) => f.status === "known" && f.value);
  const uncertain = branches.filter((f) => f.status === "unknown");
  const played: Fact = positive.length
    ? known(
        true,
        positive.flatMap((f) => f.evidence),
      )
    : uncertain.length
      ? {
          status: "unknown",
          reasons: [
            ...new Set(
              uncertain.flatMap((f) => (f.status === "unknown" ? f.reasons : [])),
            ),
          ],
          evidence: uncertain.flatMap((f) => f.evidence),
        }
      : known(
          false,
          branches.flatMap((f) => f.evidence),
        );
  return {
    ...identity,
    eligiblePreflop,
    voluntaryPreflop,
    preflopRaise,
    sawFlop,
    heroShowdown,
    collectedShare,
    played,
  };
}
