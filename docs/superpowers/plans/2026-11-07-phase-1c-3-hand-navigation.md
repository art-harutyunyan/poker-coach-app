# Phase 1C.3 Deterministic Hand Filtering and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development task-by-task after authorization.

**Goal:** Filter/navigate imported hands inside the existing navigator without changing selected-hand replay or table geometry.

**Architecture:** Pure selectors consume accepted 1C.1 facts in parser order. The 1C.2 controller owns one filter per tournament; compact controls use the existing navigator and cards.

**Tech Stack:** Existing TypeScript, React, CSS, Vitest and Playwright.

**Spec:** [Approved design](../specs/2026-11-07-phase-1c-tournament-library-stats-design.md), sections 1/6; [shared contract](2026-11-07-phase-1c-deliveries.md). Dependencies: accepted 1C.1 and 1C.2.

## Global Constraints

- All starts selected even for 200+ hands; filters remembered per tournament, session-only.
- Unknown does not match a positive filter; All includes every imported hand.
- Preserve table/cards/geometry/shell and action Back/Forward; all controls compact and navigator-local.
- Filter changes never reset selection/cursor/privacy or Overview metric scope. Queue remains All.
- No strategy, Stats UI, large schematic layout, virtualization dependency, broad baseline changes or commit/push/deploy.

## Review Focus

- Excluded current hand and zero results cannot jump/reset replay: Tasks 1/2.
- Flop after Hero folds versus board-only all-in runout: Task 1.
- Marker-only versus confirmed Hero showdown: Task 1 consumes shared facts.
- Queue-selected excluded hand and A/B remembered filters: Task 2.
- Narrow controls/long labels shifting table geometry: Tasks 2/3.

## Task 1: Pure IDs, counts and adjacent-hand navigation

**Files:** Create `src/domain/handFilters.ts`, `.test.ts`.

**Interfaces:**

```ts
type HandFilter = "all" | "played" | "postflop" | "showdown";
interface HandFilterResult {
  ids: readonly string[];
  total: number;
  counts: Readonly<Record<HandFilter, number>>;
  unknown: Readonly<Record<HandFilter, number>>;
}
function filterHandIds(
  orderedFacts: readonly HandFacts[],
  filter: HandFilter,
): HandFilterResult;
function adjacentFilteredHandId(
  orderedFacts: readonly HandFacts[],
  filter: HandFilter,
  currentId: string,
  direction: "previous" | "next",
): string | null;
```

Export from handFilters.ts, consume 1C.1 HandFacts. Operate within one tournament; reject mixed tournament keys/duplicate hand IDs. Input order is parser chronology. All unknown count=0. Return source IDs without renumbering.

- [ ] Write RED tests: four hand facts with Played `[false,true,true,unknown]`, Postflop/Showdown `[false,false,true,unknown]` -> counts `{all:4,played:2,postflop:1,showdown:1}`, unknowns `{all:0,played:1,postflop:1,showdown:1}`. Zero matches empty. Excluded current in middle selects next/previous chronological match, no wrap; missing current -> null. Duplicate/mixed keys reject; freeze/interleave inputs. Real-fact cases: Hero fold before others' flop, BB check, all-in runout, summary-only reveal.
- [ ] Run `npm.cmd test -- src/domain/handFilters.test.ts --maxWorkers=2`; expect missing selector/behavior failure.
- [ ] Implement using only known-true played/sawFlop/heroShowdown. Use array positions for adjacent navigation even when current is excluded; no domain reinterpretation.
- [ ] Rerun focused and handFacts tests; green, checkpoint.

## Task 2: Controller state and compact existing-navigator controls

**Files:** Modify `src/ui/useTournamentImport.ts`, `.test.tsx`, `components/ImportedTournamentWorkspace.tsx`, `components/ImportedHandNavigator.tsx`, `.test.tsx`, `src/styles/tournament-import.css`, relevant App wiring. Create `components/HandFilterControls.tsx`, `.test.tsx`.

**Interfaces:** Add `activeFilter:HandFilter` to private TournamentViewState (initial all). Expose `activeFilter:HandFilter|null`, `setHandFilter(filter:HandFilter):void`, `navigateFilteredHand(direction:'previous'|'next'):boolean` on session. Navigation uses Task 1 and existing selectHand reset; false at boundary. HandFilterControls takes filter, result:HandFilterResult, selectedHandId, previousId/nextId:string|null, onFilterChange and onNavigate. ImportedHandNavigator retains current props, adding optional `controls?:ReactNode`, `emptyMessage?:string`. Workspace receives `facts:readonly MetricInput[]` plus filter/controller callbacks; rail gets filtered source hands, Queue original hands.

- [ ] Write RED tests: filter preserves current frame/privacy; A/B restores filters; row selection preserves filter/resets replay; Queue opens selected hand without clearing remembered filter. Four labels/counts/aria-pressed; exact `Current hand is outside this filter` and Show all hands; zero state `No hands match this filter`. Do not insert current into filtered count. Previous/Next hand accessible names differ from action Back/Forward; disabled boundaries/no wrap. Show `k of matched` only for matched current, otherwise `Current hand outside filter`. Unknown-count notice only when nonzero. Focus stays on activated control and scrollIntoView targets selected matching row.
- [ ] Run `npm.cmd test -- src/ui/useTournamentImport.test.tsx src/ui/components/HandFilterControls.test.tsx src/ui/components/ImportedHandNavigator.test.tsx --maxWorkers=2`; observe RED.
- [ ] Implement compact All/Played/Postflop/Showdown row above existing list, using current tokens/fonts/buttons and compact Previous/Next. Preserve existing rail/table outer footprint: allocate space from the list viewport rather than resizing table/layout tracks. On mobile keep controls within existing navigator area; horizontally scroll controls when needed with visible keyboard focus. Outside/empty notices use that same area, not a full-width new page band. Keep Queue and original card rows unchanged. No duplicate local component filter state.
- [ ] Rerun focused plus importedTournament tests; green. Measure pre/post navigator/table bounds including notice states and record checkpoint.

## Task 3: 200+ hand browser evidence and delivery stop

**Files:** Create `tests/visual/phase1c-navigation.spec.ts`, `docs/qa/phase-1c/1c3/README.md` and screenshots; Roadmap evidence.

- [ ] Write browser regressions and observe RED: actual 222/233-hand uploads, all counts checked against independently audited facts, accessible All, last matching row reachable, stable Previous/Next, Queue mismatch notice, A/B restoration and no outcome/card leak. Include a valid controlled zero-match import, five widths and 200% zoom. Freeze pre-delivery same-hand/cursor geometry and compare navigator/table/card/seat bounds after filters/notices. No broad historical refresh.
- [ ] Run `npx.cmd playwright test tests/visual/phase1c-navigation.spec.ts tests/visual/phase1c-library.spec.ts tests/visual/playing-cards.spec.ts tests/visual/phase1b1-refinement.spec.ts`; green. Capture desktop/mobile controls, excluded-current and zero states. Record observed 200+ hand interactions without unmeasured speed claims; preserve historical QA files.
- [ ] Run common checks and fresh independent review covering fact reuse, focus/scroll, mobile geometry, Queue independence and privacy. Fix substantive findings with regressions. Stop **1C.3 READY FOR REVIEW** before Stats UI.
