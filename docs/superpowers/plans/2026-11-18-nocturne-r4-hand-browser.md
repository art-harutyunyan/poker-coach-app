# Nocturne R4 Tournament Hand Browser Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and test-driven-development. The approved R4 brief authorizes work in the main worktree and prohibits commits.

**Goal:** Replace only the imported tournament Overview's legacy vertical hand list with the approved compact Nocturne hand browser while keeping Tournament Stats reachable.

**Architecture:** Project source-backed row fields from `ImportedHand` in a UI adapter, then render a dedicated Overview browser with local search and filter state. Keep the existing `ImportedHandNavigator` for Replayer and Review Queue. Row selection calls the existing selected-hand action without changing tabs; one explicit action opens Replayer. Bound only the browser row region's height so the existing Stats section sits below a compact tile.

**Tech Stack:** React, TypeScript, Nocturne CSS tokens, Vitest, Playwright.

**Spec:** `docs/subframe-design/design-guideline.md`, `docs/subframe-design/design-screenshots/03_Tournament_Detail (2).png`, and the approved R4 brief supplied 2026-11-18.

## Global Constraints

- Work in the main worktree; preserve existing edits. No commit, push, merge, deploy, or new dependency.
- Stop at **R4 — READY FOR REVIEW**. Run focused tests and visual QA only; give the reviewer numbered broad commands.
- Preserve R2 Library, R3 Overview, Replayer rail, Review Queue, Tournament Stats, parser, replay math, and source order.
- Imported tournaments have no analysis, reviewed, or flagged hand state. Graded, Mistakes, Flagged, and Unreviewed tabs are disabled with `—`; Grade and Stack controls are unavailable.
- Position and reached-street filters use existing source data. Search covers hand number, Hero cards, position, and a source-backed spot label. No strategy interpretation.
- `Pot` displays `summary.totalPotChips`, the recorded final pot, not an inferred pot at a decision. Effective stack displays `—`.

## Review Focus

- Filtering to zero results or excluding the selected hand leaves selected/replay state intact and offers a clear reset.
- Switching tournaments does not carry a prior tournament's search/filter into the new one.
- Keyboard arrows and Enter act only on focused browser rows, never while typing in search or filters.
- A selected row remains visually and accessibly distinct; clicking it does not open Replayer.
- Narrow widths retain every field and action without card overlap or horizontal page overflow.

### Task 1: Source-backed row projection and filtering

**Files:** `src/ui/handBrowserPresentation.ts`, `src/ui/handBrowserPresentation.test.ts`

**Interface:** `presentHandBrowserRow(hand: ImportedHand): HandBrowserRow`; `filterHandBrowserRows(rows, { query, position, street }): HandBrowserRow[]`.

- [x] Add focused tests from real GG fixtures for source order, hand number, cards, Hero position, reached street, final recorded pot, unknown effective stack, and `Not analysed`.
- [x] Add search/filter tests for hand number, cards (including ten display and rank pairs), position, street, zero matches, and stable ordering.
- [x] Run RED and verify expected missing behavior.
- [x] Implement the smallest deterministic projection and filtering functions.
- [x] Run focused GREEN.

### Task 2: Compact hand browser interaction and layout

**Files:** `src/ui/components/TournamentHandBrowser.tsx`, `src/ui/components/HandTableRow.tsx`, `src/ui/components/TournamentHandBrowser.test.tsx`, `src/styles/nocturne-hand-browser.css`, `src/main.tsx`

**Interface:** `TournamentHandBrowser({ hands, selectedHandId, onSelectHand, onOpenHand })`; `HandTableRow` renders one source-backed row.

- [x] Add focused tests for disabled analysis controls, selected row, result context, empty results, explicit Open in Replayer, focused-row arrows/Enter, and input shortcut isolation.
- [x] Run RED and verify expected missing behavior.
- [x] Implement compact grid rows with shared `PlayingCard`, local search/position/street controls, selected context bar, and bounded internal row scrolling.
- [x] Style 1440/1280 layouts and a narrow stacked fallback with Nocturne tokens and visible focus.
- [x] Run focused GREEN and scoped lint/format checks.

### Task 3: Overview integration, visual QA, and review

**Files:** `src/ui/components/ImportedTournamentWorkspace.tsx`, `src/ui/importedTournament.test.tsx`, `tests/visual/nocturne-r4-hand-browser.spec.ts`, `tests/visual/nocturne-r3-overview.spec.ts`, `docs/qa/nocturne-r4/README.md`, `docs/qa/nocturne-r4/*.png`

- [x] Add integration tests that Overview selection stays on Overview, explicit open reaches Replayer with the real hand, and Tournament Stats remains accessible; preserve Replayer/Queue tests.
- [x] Run RED, replace only the Overview navigator/chrome, run focused GREEN.
- [x] Capture and inspect 1440×900 many-hand, selected, active filter/search, no-analysis, and 1280 screenshots, plus a narrow fallback check.
- [x] Run focused Playwright, inspect changed files, and request independent review. Resolve Critical/Important findings.
- [x] Record data/design gaps and stop at READY FOR REVIEW with numbered broad verification commands.
