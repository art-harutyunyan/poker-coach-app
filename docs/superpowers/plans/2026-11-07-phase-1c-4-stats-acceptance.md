# Phase 1C.4 Tournament Stats UI and Integrated Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development task-by-task after authorization.

**Goal:** Present audited tournament metrics on Overview and verify all four deliveries together, preserving the current application and result privacy.

**Architecture:** Stateless presentation formats 1C.1 aggregates/audit rows; the existing per-tournament controller owns outcome-stat visibility. Library and Replayer reuse earlier deliveries without new metric definitions or parallel state.

**Tech Stack:** Existing React, TypeScript, CSS, Radix, Vitest and Playwright.

**Spec:** [Approved design](../specs/2026-11-07-phase-1c-tournament-library-stats-design.md), sections 1/8/9/11/13; [shared contract](2026-11-07-phase-1c-deliveries.md). Dependencies: accepted 1C.1, 1C.2 and 1C.3, including audited corpus counts.

## Global Constraints

- Overview only; Library rows remain metadata-only. Metrics always describe the selected imported tournament, not the Replayer filter.
- Current implemented typography, shell, buttons, spacing and workspace are visual authority. Primary VPIP/PFR/3-Bet; secondary Saw Flop/source-confirmed WTSD/W$SD.
- Numerator/denominator, accessible Definition/Coverage controls, neutral styling and Single-tournament sample context. No thresholds, gauges, good/bad colors or strategic conclusions.
- Default W$SD masking. No placeholder percentages, mockup banners/footers/proposal boxes or schematic tables.
- No later metrics, parser/engine changes, persistence, commit/push/deploy. Phase 1 remains IN PROGRESS.

## Review Focus

- One-hand import outcome leaks via hidden value, audit rows or accessible names: Tasks 1/2.
- Null denominator incorrectly displayed as 0%, and rounding confused with underlying arithmetic: Task 1.
- Showdown exclusions hidden by an unqualified HUD label: Task 1/2.
- A/B switching, filter changes and Hide Result affecting the wrong aggregate/visibility: Tasks 2/3.
- Mockup shell or methodology paragraphs replacing approved production layout: Task 2/3 visual evidence.

## Task 1: Metric presentation contract and stat component

**Files:** Create `src/ui/metricPresentation.ts`, `.test.ts`, `src/ui/components/TournamentStats.tsx`, `.test.tsx`, `src/styles/tournament-stats.css`. Add stylesheet import to `src/main.tsx` when component is wired in Task 2.

**Interfaces:** Consume MetricId, MetricSummary, PokerMetrics and MetricAuditRow from 1C.1. Export `formatMetricPercentage(value:number|null):string` and `metricDefinition(id:MetricId):{label:string;denominatorLabel:string;definition:string}` from metricPresentation.ts. Formatter returns `—` for null and otherwise a one-decimal percentage from the already computed domain value (use explicit en-US formatting, no numerator calculation in UI). Definitions map six IDs to the approved labels and denominator semantics. Export:

```ts
TournamentStats({ metrics, outcomeVisible, onOutcomeVisibleChange, auditRows, onOpenHand }: {
  metrics: PokerMetrics; outcomeVisible: boolean;
  onOutcomeVisibleChange(visible: boolean): void;
  auditRows: Readonly<Partial<Record<MetricId, readonly MetricAuditRow[]>>>;
  onOpenHand(handId: string): void;
}): ReactElement;
```

Hidden presentation receives no `wsd` auditRows; component must also ignore any accidentally supplied hidden W$SD rows. Do not derive poker eligibility or percentage from audit rows. Coverage groups supplied exclusion rows by reason for display only. Use label `WTSD · source-confirmed` and `W$SD · collected a share`; definitions explain exclusions, chops, refund exclusion and chips versus cash profit. Long definitions are expandable/focusable, not permanent paragraphs.

- [ ] Write RED tests: null -> `—` + `No eligible opportunities`, 0 -> `0.0%`, 23.94 -> `23.9%`, 23.96 -> `24.0%`; display numerator/denominator and correct unit, exclusion counts and Single-tournament sample. Primary/secondary order correct; no green/red classes or strategic copy. Known source limitations are accessible by keyboard/touch Definition/Coverage controls. Coverage hand links pass source ID. Hidden W$SD renders `Outcome stat hidden` and `Show outcome stat`, but no numeric value, n/d, winning-hand rows, title, aria-label or hidden DOM text leaking outcomes. Explicit reveal renders real value or true unavailable state, not a mock placeholder. Empty imported cohort shows honest zero-hand context.
- [ ] Run `npm.cmd test -- src/ui/metricPresentation.test.ts src/ui/components/TournamentStats.test.tsx --maxWorkers=2`; observe RED.
- [ ] Implement pure formatting/presentation and compact metric strips using existing Study tokens. Use native details/summary or existing Radix controls for definitions; no new dependency. Hidden W$SD must not be merely visually blurred/CSS-hidden. No per-hand result badges elsewhere.
- [ ] Rerun focused tests; green. Record checkpoint.

## Task 2: Overview wiring and per-tournament outcome privacy

**Files:** Modify `src/ui/useTournamentImport.ts`, `.test.tsx`, `components/ImportedTournamentWorkspace.tsx`, `src/ui/App.tsx`, `src/ui/importedTournament.test.tsx`, `src/main.tsx`. New UI belongs in scoped Stats CSS; do not edit shell/card/seat styles.

**Interfaces:** Add `outcomeStatsVisible:boolean` (initial false) to existing private TournamentViewState. Expose `outcomeStatsVisible:boolean|null`, `setOutcomeStatsVisible(visible:boolean):void` on TournamentImportSession. Workspace receives selected entry `metrics:PokerMetrics`, `facts:readonly MetricInput[]`, outcome visibility/change callback; it uses 1C.1 `buildMetricAudit` for details, memoized against entry facts. Omit W$SD audit rows while masked. Coverage Open selects the hand through existing selectHand and sets Replayer tab without clearing the saved filter.

- [ ] Write RED integration tests: new A/B start masked; explicit A reveal does not move replay cursor or reveal cards, B stays masked, return to A restores its own state. `setResultHidden(true)` also clears active entry outcomeStatsVisible, including when already hidden; selecting another hand uses result-hidden reset and likewise clears outcome visibility. Showing replay results alone does not unmask W$SD. Unknown/missing active entry setters are safe no-ops. Replayer filter changes leave Overview numerator/denominator unchanged. Source-only summary cards never become timed reveals via Coverage/Open. One-hand import cannot expose its W$SD result before explicit action. Library rows still show no stats.
- [ ] Run `npm.cmd test -- src/ui/useTournamentImport.test.tsx src/ui/importedTournament.test.tsx --maxWorkers=2`; observe RED.
- [ ] Wire Stats below existing Overview metadata, above Replayer/Queue actions. Replace only the obsolete statement that tournament statistics are unavailable; retain concise honest coaching-unavailable state. Reuse existing typefaces/headings/buttons and mobile wrapping. Keep explicit tournament ID in existing metadata space, without adding a new Replayer header band. Domain aggregation remains cached at import; cursor changes never recompute facts/metrics. Preserve all approved reveal and collection clamps.
- [ ] Rerun integration/component tests and all 1C.1 metrics tests; green. Record checkpoint.

## Task 3: Integrated browser acceptance, final review and stop

**Files:** Create `tests/visual/phase1c-stats.spec.ts`, `docs/qa/phase-1c/1c4/README.md`, new screenshots and `docs/qa/phase-1c/README.md` acceptance index. Update Roadmap evidence. Only narrowly adjust assertions for intentional new Overview contents; no broad protected-file/hash or snapshot exemptions.

- [ ] Write browser acceptance tests and observe RED before UI completion: import all four real fixtures, compare displayed counts/rates with independently audited 1C.1 snapshots, switch A/B and return, duplicate/conflict preservation, filters/current-outside/zero states, first/last hand selection, SHOW/Hide Result plus W$SD privacy. Open Definition/Coverage with keyboard; hand links target the correct entry/source ID. A one-hand import tests hidden audit/accessibility leakage and explicit reveal. Verify absent preview/proposal copy, no placeholder percentages, no Library stats and no outcome colors. Metadata unknowns remain honest.
- [ ] Run focused suites: `npx.cmd playwright test tests/visual/phase1c-library.spec.ts tests/visual/phase1c-navigation.spec.ts tests/visual/phase1c-stats.spec.ts` at 1440/1024/768/430/390; add 200% zoom and forced-colors checks for new controls/definitions. Capture Library, Overview, masked/revealed W$SD, Coverage, filters and zero/outside states. Real app screenshots, not mockups, are acceptance evidence.
- [ ] Run compatibility suites: `npx.cmd playwright test tests/visual/tournament-import.spec.ts tests/visual/phase1b-corrections.spec.ts tests/visual/phase1b1-refinement.spec.ts tests/visual/playing-cards.spec.ts tests/visual/replayer.spec.ts tests/visual/replayer-shell.spec.ts tests/visual/tournament-subpages.spec.ts tests/visual/visual-migration.spec.ts`. Verify all applicable existing table profiles (6/8/9-seat desktop/mobile normal/all-in) and card tokens/SVG identity. Retain old QA artifacts per index. Compare shell typography, sidebar/buttons and same-hand table/seat/card geometry with pre-phase baseline; feature additions are limited to Library/Overview and navigator-local controls.
- [ ] Run common unit/typecheck/lint/build/format/whitespace checks; rerun corpus audit to scratch and compare accepted counts/hashes. No new golden regeneration. Inspect final task-only diff across all four delivery baselines for domain mutation, unrelated UI edits and mockup artifacts.
- [ ] Obtain fresh independent whole-phase integration review, including consumed 1C.1 definitions/audit and 1C.2/1C.3 state transitions. Fix substantive findings with reproducing regressions and appropriate fresh checks. Record code-review results separately from human visual acceptance.
- [ ] Publish local QA index with exact executed commands/results, n/d/coverage tables, source-audit links, screenshot paths, remaining risks and handoff checklist. Mark **Phase 1C READY FOR REVIEW**, with each delivery's evidence linked; leave overall Phase 1 IN PROGRESS. Stop for human acceptance. No commit, push, deploy or later-phase work.
