import type { Fact, HandFacts } from "./pokerMetricTypes";

export type HandFilter = "all" | "played" | "postflop" | "showdown";

export interface HandFilterResult {
  ids: readonly string[];
  total: number;
  counts: Readonly<Record<HandFilter, number>>;
  unknown: Readonly<Record<HandFilter, number>>;
}

function validateCohort(orderedFacts: readonly HandFacts[]): void {
  const first = orderedFacts[0];
  const tournamentKey = first && JSON.stringify([first.room, first.tournamentId]);
  const ids = new Set<string>();
  for (const facts of orderedFacts) {
    if (JSON.stringify([facts.room, facts.tournamentId]) !== tournamentKey) {
      throw new Error("Hand filters require one tournament");
    }
    if (ids.has(facts.handId)) throw new Error("Duplicate source hand ID");
    ids.add(facts.handId);
  }
}

function sourceFact(facts: HandFacts, filter: Exclude<HandFilter, "all">): Fact {
  switch (filter) {
    case "played":
      return facts.played;
    case "postflop":
      return facts.sawFlop;
    case "showdown":
      return facts.heroShowdown;
  }
}

export function filterHandIds(
  orderedFacts: readonly HandFacts[],
  filter: HandFilter,
): HandFilterResult {
  validateCohort(orderedFacts);
  const counts = { all: orderedFacts.length, played: 0, postflop: 0, showdown: 0 };
  const unknown = { all: 0, played: 0, postflop: 0, showdown: 0 };
  const ids: string[] = [];
  for (const facts of orderedFacts) {
    if (filter === "all") ids.push(facts.handId);
    for (const candidate of ["played", "postflop", "showdown"] as const) {
      const value = sourceFact(facts, candidate);
      if (value.status === "unknown") unknown[candidate]++;
      else if (value.value) {
        counts[candidate]++;
        if (filter === candidate) ids.push(facts.handId);
      }
    }
  }
  return { ids, total: orderedFacts.length, counts, unknown };
}

export function adjacentFilteredHandId(
  orderedFacts: readonly HandFacts[],
  filter: HandFilter,
  currentId: string,
  direction: "previous" | "next",
): string | null {
  const matching = new Set(filterHandIds(orderedFacts, filter).ids);
  const current = orderedFacts.findIndex((facts) => facts.handId === currentId);
  if (current < 0) return null;
  const step = direction === "previous" ? -1 : 1;
  for (
    let index = current + step;
    index >= 0 && index < orderedFacts.length;
    index += step
  ) {
    const id = orderedFacts[index]!.handId;
    if (matching.has(id)) return id;
  }
  return null;
}
