# Nocturne R3 Tournament Overview Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and test-driven-development. The approved R3 brief authorizes implementation in the main worktree and prohibits commits.

**Goal:** Replace the right-side imported tournament header and metadata card with the approved compact Nocturne overview while retaining current hand navigation, replay, and deterministic stats.

**Architecture:** Extend the existing typed library presentation for overview display; render one overview tile in `ImportedTournamentWorkspace` from that projection. Keep the legacy hand list and deterministic Tournament Stats below it. Do not change parser, results, analysis, or replay state.

**Tech Stack:** React, TypeScript, CSS tokens, Vitest, Playwright.

**Spec:** `docs/subframe-design/design-guideline.md` and the approved R3 handoff attached on 2026-11-18.

## Global Constraints

- Main worktree; preserve unrelated edits. No commit, push, merge, or deploy.
- R3 ends at READY FOR REVIEW. Do not run broad suites automatically.
- Real imported data has no verified summary result or analysis output; keep finish and winnings unknown.
- Reuse Nocturne tokens, R2 presentation mapping, and current tabs. Do not redesign hand browser or Replayer.

## Review Focus

- Missing buy-in or format: render neutral unknown treatment without invented values.
- Very long tournament names and IDs: wrap or truncate without page overflow.
- Tournament selection: overview must update with the selected entry.
- Import action and tab navigation: existing controls remain usable.
- Outcome metric privacy: W$SD remains masked until revealed in existing Tournament Stats.

### Task 1: Typed overview presentation

**Files:** `src/ui/tournamentLibraryPresentation.ts`, `src/ui/tournamentLibraryPresentation.test.ts`

- [x] Add failing tests for compact source/date/buy-in/status/finish fields from a real imported entry and neutral unknown handling.
- [x] Run focused RED.
- [x] Extend the existing presentation adapter without deriving unsupported summary or analysis values.
- [x] Run focused GREEN.

### Task 2: Overview structure and existing navigation

**Files:** `src/ui/components/ImportedTournamentWorkspace.tsx`, `src/ui/App.tsx`, `src/ui/importedTournament.test.tsx`, `src/styles/nocturne-tournament-overview.css`, `src/main.tsx`

- [x] Add failing integration tests for name/meta, compact stats, unavailable analysis, legacy hand list and metric access, tournament switching and tab behavior.
- [x] Run focused RED.
- [x] Render the Nocturne overview tile, keep supported actions and existing navigation, and retain the unchanged hand list plus Tournament Stats below.
- [x] Style the overview at 1440 and 1280 with Nocturne tokens and safe stacked fallback.
- [x] Run focused GREEN and scoped lint/format checks.

### Task 3: Scoped visual QA and review

**Files:** `tests/visual/nocturne-r3-overview.spec.ts`, `docs/qa/nocturne-r3/README.md`, `docs/qa/nocturne-r3/*.png`

- [x] Capture real no-analysis overview at 1440x900 and 1280x900; inspect alignment, overflow, duplicate headers, and unchanged hand browser.
- [x] Record that no verified-summary fixture exists, so a real finish-state screenshot is unavailable.
- [x] Run focused browser checks and request independent code review.
- [x] Stop at READY FOR REVIEW with numbered broad verification commands for the user.
