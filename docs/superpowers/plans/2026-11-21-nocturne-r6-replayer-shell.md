# Nocturne R6 Replayer Shell Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task by task. The approved R6 brief forbids commits, pushes, merges, and deployment.

**Goal:** Host the existing Replayer in the approved Nocturne hand strip and two-column page shell without changing poker behavior.

**Architecture:** A shared `ReplayerHandStrip` receives ordered, source-backed hand summaries and owns the horizontal scroll and pinned Browse all trigger. The imported Replayer reuses its existing filtered navigator inside the Browse all popover, preserving filter and selection behavior. Both imported and demo Replayers receive a scoped Nocturne tile layout; existing `PokerTable`, controls, and analysis contents remain mounted unchanged.

**Tech Stack:** React, TypeScript, existing Radix tabs, Nocturne CSS tokens, Vitest/Testing Library, focused Playwright.

**Spec:** `docs/subframe-design/design-guideline.md`, approved Hand Replayer screenshot, and approved R6 brief supplied 2026-11-21.

## Global Constraints

- Continue in the current main worktree and preserve all uncommitted R5 and unrelated files.
- Keep poker table internals, replay math, card timing, Hide Result, parser, imports, and Tournament pages unchanged.
- Use real source order, Hero cards, hand number, and deterministic position label; omit grades without real analysis.
- Pin Browse all outside the scrolling row, reuse existing imported hand filters and navigation, and expose selected and expanded state accessibly.
- Use existing `--noc-*` tokens. At 1440px target a 128px strip, an 8px tile gutter, and a 400px analysis tile; stack when necessary.
- Run focused tests and visual QA; give the reviewer numbered broad commands. Do not run broad suites or commit.

## Review Focus

- More hands than fit: selected item scrolls into view without document-level horizontal overflow.
- Active source filter: strip and Browse all preserve filtered order, including a current hand outside the filter.
- Browse all: keyboard opening, Escape dismissal, focus return, and click-through to an imported hand.
- Imported hand change: replay cursor and Hide Result follow existing controller behavior.
- Narrow layout: legacy table and controls remain usable, with the known historical 768px bet/card overlap tracked separately.

## Files and responsibilities

- `src/ui/components/ReplayerHandStrip.tsx`: ordered compact hand items, selected state, pinned Browse all, and popover shell.
- `src/ui/components/ImportedTournamentWorkspace.tsx`: pass filtered imported hands and existing navigator to the strip; keep table/analysis logic intact.
- `src/ui/App.tsx`: host the demo hand in the same shell, retaining its Key Hands action in Browse all.
- `src/styles/nocturne-replayer-shell.css` and `src/main.tsx`: scoped Nocturne strip, tiles, and responsive layout.
- Focused unit and Playwright tests: prove data order, selection, Browse all, navigation, privacy, layout and geometry.
- `docs/qa/nocturne-r6/README.md`: captures, observations, limitations, and exact reviewer commands.

### Task 1: Hand strip and Browse all

- [x] Write focused tests for source order, compact real cards, neutral grade slot, selected state, selection callback, Browse all count, keyboard dismissal and focus return.
- [x] Run RED against the absent component.
- [x] Implement `ReplayerHandStrip` with a fixed-width scroll row and a pinned Browse all trigger; render the supplied existing browser content in its popover.
- [x] Run focused GREEN.

### Task 2: Imported and demo integration

- [x] Add focused App tests for imported hand selection, filter preservation, tournament context, and Hide Result; keep demo Key Hands action reachable.
- [x] Run RED against the old rail layout.
- [x] Wire both Replayers into the strip and two-column shell without changing `PokerTable`, `ReplayControls`, or domain state.
- [x] Run focused GREEN and update only legacy tests whose access path moved to Browse all.

### Task 3: Scoped layout and visual QA

- [x] Add focused Playwright assertions for 1440×900, 1280, and one narrow width, including selected visibility, 8px gutter, about 400px analysis width, and no page horizontal overflow. Confirm analysis overflow styling in CSS and captures.
- [x] Run focused RED/GREEN while applying Nocturne CSS to the strip and bordered tiles.
- [x] Inspect captures for imported many-hand and demo Replayers; record the existing 768px table issue if still present.
- [x] Run scoped lint, formatting and `git diff --check`, inspect final diff, obtain independent review, and record evidence in `docs/qa/nocturne-r6/README.md`.
- [x] Stop at **R6 — READY FOR REVIEW**.
