# Nocturne R2 Tournament Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the left Tournament Library column with the approved 364px Nocturne design while retaining real import and tournament selection behavior.

**Architecture:** A small presentation adapter maps existing `LibraryEntry` data to rows, search, grouping, and typed display status. `TournamentLibrary` owns local search/filter/sort state and renders a reusable `TournamentListItem`. `App` hosts the library beside the unchanged imported workspace when a tournament is selected. No parser, metrics, replay, or storage changes.

**Tech Stack:** React, TypeScript, custom Nocturne CSS, Vitest, Testing Library, Playwright.

**Spec:** Approved R2 brief supplied 2026-11-17 and `docs/subframe-design/design-guideline.md`, especially its superseding four-line TournamentListItem rules. The brief's named `docs/design/subframe/nocturne-handoff.md` path is absent; the supplied guideline contains the approved handoff text.

## Global Constraints

- Main worktree; preserve unrelated changes. No commit, push, merge, deploy, new dependencies, or broad automatic verification.
- Primary target 1440 × 900; library width 364px. Preserve existing mobile fallback.
- Use real session entries only. Unknown Won and Finish remain unknown; no achievement, mistake, flagged, or analysis claims without verified source data.
- Import and replay behavior, selected hand, result privacy, parser, metrics, and right workspace internals remain unchanged.
- Reuse R0 primitives, R1 shell, and existing Lucide icons.

## Review Focus

- Two entries with the same name stay distinct by source ID; clicking either opens the right entry.
- Missing payout is never shown as zero, even when a buy-in exists.
- Sort is deterministic for equal timestamps and search covers name, source ID, and buy-in.
- A selected entry remains selected after search/sort changes and returning from the workspace.
- Narrow widths do not cause document overflow or hide the import path.

---

### Task 1: Real-data presentation adapter

**Files:** Create `src/ui/tournamentLibraryPresentation.ts` and `src/ui/tournamentLibraryPresentation.test.ts`.

**Interfaces:** Export `TournamentStatus`, `TournamentLibraryItem`, `presentTournament(entry)`, `selectTournamentItems(entries, query, segment, direction)`, and `groupTournamentItems(items, today)`. The item includes source key, name, ID, neutral buy-in, source-local date, format, hand count, typed status/label, and nullable verified-result fields.

- [x] Add tests using existing GG fixtures for unknown Won/Finish, unavailable analysis, no fake counts, and distinct same-name IDs.
- [x] Run focused tests and observe expected RED.
- [x] Implement the smallest typed mapping. Existing entries have no verified result or analysis object; map them to `unavailable`, leave payout/achievement/mistake/flagged absent.
- [x] Add tests for case-insensitive name/ID/buy-in search, date sort with stable tie break, and This week/Earlier grouping from local source dates.
- [x] Observe RED, implement, then run focused GREEN.

### Task 2: Nocturne library component and row

**Files:** Create `src/ui/components/TournamentListItem.tsx`; modify `src/ui/components/TournamentLibrary.tsx`, `src/ui/components/TournamentLibrary.test.tsx`, and `src/styles/tournament-library.css`.

**Interfaces:** `TournamentLibrary` keeps `entries`, `onOpen(key, tab)`, and `onImport()`, adding optional `selectedKey`. `TournamentListItem` receives a presented item, `selected`, and `onOpen` callbacks.

- [x] Add component tests for the four-line real-data row, selected state, keyboard activation, import, search/filter/sort, empty/no-match states, and retained overview/Replayer/Review Queue access.
- [x] Run focused tests and observe expected RED.
- [x] Implement the component using NocturneSurface/Button/SearchInput/SegmentedControl/EmptyState and compact row CSS. Keep unsupported analysis segments disabled.
- [x] Run focused GREEN and inspect accessibility/semantic assertions.

### Task 3: Host library beside unchanged workspace

**Files:** Modify `src/ui/App.tsx`, `src/ui/App.library.test.tsx`, and `src/styles/tournament-library.css`.

**Interfaces:** The Tournaments route always renders the library for real imports; `selectedKey` reflects the active `view`. The existing workspace or recovery error renders in a separate right host without changes to its internals. The library-only state keeps the existing demo entry point.

- [x] Add app integration test for persistent library, selected row, switching tournaments, and returning to library without losing session entries.
- [x] Run focused test and observe expected RED.
- [x] Add the page-level grid and pass selected state; keep right workspace JSX and behavior intact.
- [x] Run focused GREEN, plus related existing library/recovery/imported-tournament tests.

### Task 4: Scoped visual QA and handoff

**Files:** Create `tests/visual/nocturne-r2-library.spec.ts` and `docs/qa/nocturne-r2/README.md`; save screenshots under `docs/qa/nocturne-r2/`.

- [x] Add browser checks for 364px desktop width, internal scrolling, selected state, search-empty state, and 1280px usability using real fixtures.
- [x] Run focused browser checks; capture 1440 × 900 and 1280 states and inspect them against the approved Tournaments screenshot.
- [x] Record visual/data gaps, scoped test results, and review changes. Run scoped lint, formatting, and whitespace checks; leave project typecheck and broad suites to the user. The focused browser suite passed; three existing imported-tournament fixture cases timed out during the last combined unit run and are documented in the QA record.
- [x] Stop at R2 READY FOR REVIEW and provide numbered verification commands.
