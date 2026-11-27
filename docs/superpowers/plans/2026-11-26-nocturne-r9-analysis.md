# Nocturne R9 Replayer Analysis Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task by task. The approved R9 handoff requires the main worktree, preserves existing changes, and forbids commits, pushes, merges, and deployment.

**Goal:** Finish the Replayer's right analysis tile and surrounding composition while keeping real imported hands free of invented strategy output.

**Architecture:** Reuse the existing `HandAnalysis` contract for the explicitly illustrative Phase 0 demo only. Give the demo and imported Replayer a shared panel shell; render an unavailable state when no analysis object exists. Apply opt-in Nocturne CSS after R8 so the panel, table, and dock align without changing replay/domain state.

**Tech Stack:** React, TypeScript, Radix tabs, custom Nocturne CSS, Vitest, Playwright.

**Spec:** Approved R9 brief supplied 2026-11-26; `docs/subframe-design/design-guideline.md` and `docs/subframe-design/design-screenshots/04_Hand_Replayer (2).png`.

## Global Constraints

- Keep R6 hand strip, R7 table/seat/card geometry, R8 dock, routes, parser, import rules, and Hide Result behavior intact.
- Never infer grade, EV, recommendations, strategy mix, source, or confidence for imported hands from replay or tournament data.
- Preserve the existing demo fixture's explicit illustrative provenance; do not present it as engine output.
- No new dependencies or analysis schema. Stop at **R9 — READY FOR REVIEW**; broad verification belongs to the reviewer.

## Review Focus

- Imported hands with no analysis show only an unavailable message and source-backed context, never demo grades or strategy percentages.
- Selecting another imported hand or stepping replay cannot carry stale demo or prior-hand analysis.
- Demo fixture content remains clearly illustrative and its Decision/Context tabs retain keyboard behavior.
- The right tile stays about 400px wide at desktop, stacks safely at narrow widths, and scrolls internally when content exceeds the viewport.
- Panel styling does not alter table, hand strip, replay dock, or navigation behavior.

---

### Task 1: Shared panel state boundary

**Files:** `src/ui/components/AnalysisPanel.tsx`, `src/ui/components/ImportedTournamentWorkspace.tsx`, focused component/application tests.

- [x] Add failing tests for imported unavailable copy and absence of grade, EV, recommendations, percentages, and demo controls; add a test for the demo's explicit illustrative state. Confirm RED.
- [x] Route both Replayers through the existing analysis panel component with optional analysis, keeping the imported state unavailable. Confirm focused GREEN.

### Task 2: Nocturne analysis presentation and composition

**Files:** `src/styles/nocturne-replayer-analysis.css`, `src/main.tsx`, `tests/visual/nocturne-r9-analysis.spec.ts`.

- [x] Add failing browser assertions for panel geometry, internal scrolling, unavailable state, stable content through action and hand changes, and no overflow at 1440/1280/1024/narrow widths. Confirm RED.
- [x] Implement scoped Nocturne styling for unavailable and illustrative demo states, preserving accessible tabs and focus. Confirm focused browser GREEN and inspect captures.

### Task 3: Final composition review and handoff

**Files:** `docs/qa/nocturne-r9/README.md`, plan checkboxes.

- [x] Inspect the R6–R9 composition at representative imported/demo states and widths, fixing only small integration issues with a failing check first.
- [x] Run focused unit/browser checks, typecheck, lint, build, targeted formatting, and diff checks. Record screenshots, findings, limits, and numbered reviewer commands. Stop at READY FOR REVIEW.
