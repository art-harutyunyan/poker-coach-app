# Nocturne R10 Replayer Reconciliation Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task by task. The approved R10 handoff requires the main worktree and forbids commits, pushes, merges, and deployment.

**Goal:** Reconcile the implemented Replayer with the approved Nocturne reference, especially the transitional Browse all popover, without changing replay or analysis behavior.

**Architecture:** Keep the R6–R9 components and domain contracts. Give Browse all scoped presentation rules and remove its duplicate heading; make small opt-in composition corrections to the hand strip, table context, dock, and unavailable panel where the 1440 reference supports them.

**Tech Stack:** React, TypeScript, existing Nocturne tokens and CSS, Vitest, Playwright.

**Spec:** Approved R10 handoff supplied 2026-11-27; `docs/subframe-design/design-guideline.md`; `docs/subframe-design/design-screenshots/04_Hand_Replayer (2).png`.

## Global Constraints

- Main PokerCoachApp worktree; preserve all verified R0–R9 and unrelated edits.
- Visual and composition changes only. No parser, accounting, action, filtering, Hide Result, import, or analysis-engine changes.
- Keep real imported hands explicitly unanalysed. No fabricated grades, EV, recommendations, or playback state.
- Stop at **R10 — READY FOR REVIEW**. The reviewer runs broad verification.

## Initial 1440 visual delta audit

Compared the approved Subframe Replayer screenshot with `docs/qa/nocturne-r9/imported-1440.png` and the current Browse all capture at `docs/qa/nocturne-r6/browse-1440.png`.

| Delta                                                                                                                      | Classification                               | Rationale                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Browse all rows use large green legacy cards, small text, a repeated Hands heading, and cramped filter/navigation controls | Fix in R10                                   | Handoff calls out Browse all as transitional; Nocturne strip provides the compact-card language. |
| Strip header is subdued relative to the approved title and its selected card could show a clearer spot hierarchy           | Fix in R10                                   | Presentation only; current real cards, count and position stay.                                  |
| Current-hand context repeats the selected cards/position and spends more vertical space than needed                        | Fix in R10                                   | Keep useful source hand ID and player count in a compact hierarchy.                              |
| Table, seats, dock and 400px analysis tile are broadly aligned; minor internal whitespace and dock spacing remain          | Fix in R10 after focused visual check        | Keep R7 geometry and R8 controls intact.                                                         |
| Imported analysis tile is sparse beside the illustrated reference                                                          | Intentional current capability               | No Strategy Engine or real grades/EV/recommendations exist.                                      |
| Screenshot's sample tournament name, cards, action, and seat values differ                                                 | Intentional real data                        | The imported GG fixture is the source of truth.                                                  |
| Search, mistakes/flagged tabs, autoplay, speed, review persistence, and full strategy content                              | Deferred pending product capability/approval | R10 explicitly forbids inventing these features.                                                 |

## Review Focus

- Browse all stays anchored, about 640px wide, internally scrollable, and usable without horizontal page overflow at 1440 and narrow widths.
- Opening moves focus inside; Escape and Close return focus; selected hand remains indicated after changing filters or navigating.
- Filter counts, order and Previous/Next use the existing Phase 1C model.
- Imported analysis retains only the honest unavailable state.
- Table geometry, seat assignment, action order, cards, and Hide Result remain unchanged.

---

### Task 1: Browse all structure and presentation

**Files:** `src/ui/components/ImportedHandNavigator.tsx`, `src/ui/components/ImportedTournamentWorkspace.tsx`, `src/styles/nocturne-replayer-browse.css`, `src/main.tsx`, focused unit and browser tests.

- [x] Add a focused failing test for the browser's single heading and current selected hand, and browser assertions for compact neutral cards, readable filter controls, bounded popover and scrolling. Verify RED.
- [x] Remove the duplicate heading from the popover variant and add scoped Nocturne styles without changing the shared Tournament navigator. Verify GREEN.

### Task 2: Final 1440 composition and responsive checks

**Files:** existing R6–R9 presentation CSS or a small R10 CSS file, focused Playwright tests.

- [x] Add failing geometry/visibility assertions for any concrete 1440 or narrow mismatch before adjusting styles.
- [x] Reconcile strip hierarchy, current-hand header, table/dock/panel spacing and any clear old chrome. Keep table positions and replay behavior unchanged. Verify focused GREEN.
- [x] Capture 1440 imported and Browse all plus representative replay states and 1280/1024/768/narrow widths. Inspect each capture for overlap and overflow.

### Task 3: Review and evidence

**Files:** `docs/qa/nocturne-r10/README.md`, plan checkboxes.

- [x] Review the scoped diff for behavior and style leakage, run focused tests and scoped formatting/diff checks, and record visual deltas and screenshots.
- [x] Provide numbered broad verification commands. Stop at READY FOR REVIEW.
