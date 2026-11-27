# Nocturne R8 Replay Controls Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task by task. The approved R8 brief forbids commits, pushes, merges, and deployment.

**Goal:** Integrate the supported replay controls and current-action message into one compact Nocturne dock beneath the R7 table.

**Architecture:** Keep `ReplayControls` as a presentation component consuming the existing cursor, hand, street, privacy state, and callbacks. Keep `PokerTable` responsible for the source-backed actor message and action count. Add opt-in R8 CSS after the R7 and shell styles. Do not change domain replay, parser, or hand selection logic.

**Tech Stack:** React, TypeScript, Radix Switch, lucide-react, custom Nocturne CSS, Vitest, Playwright.

**Spec:** Approved R8 brief supplied 2026-11-26; `docs/subframe-design/design-guideline.md` and `docs/subframe-design/design-screenshots/04_Hand_Replayer (2).png`.

## Global constraints

- Main worktree; preserve R0–R7 and unrelated edits.
- No domain, import, analysis-panel, hand-strip, or R7 geometry rewrite.
- Manual step, street, and Hide Result behavior are the existing controls. No autoplay or speed state currently exists, so do not display inactive Play/Pause or speed controls.
- Keep exact Back/Forward, street cursor, Showdown, privacy, and keyboard semantics. Add only a Start of hand shortcut to the already supported cursor-0 behavior.
- Focused TDD and visual QA; stop at **R8 — READY FOR REVIEW**. Broad verification belongs to the reviewer.

## Review focus

- Hidden results must cap reachable cursor without revealing future SHOW/WIN data.
- Source hands with no board street or Showdown keep those buttons disabled.
- Switching hands updates current street and progress without carrying a stale dock state.
- Keyboard arrows do not change replay while a dialog or editable control has focus.
- At 1440, 1280, 1024, 768 and narrow widths, all supported controls remain reachable without page overflow or seat overlap.

---

### Task 1: Control semantics and accessibility

**Files:** `src/ui/components/ReplayControls.tsx`, `src/ui/components/ReplayControls.test.tsx`, `src/ui/components/PokerTable.test.tsx`.

- [x] Add failing tests for compact named Back/Forward, Start of hand, street selection/disabled states, Hide Result state, action progress, bounds, and dialog-focused keyboard guards. Confirm RED.
- [x] Implement the smallest control markup/keyboard change using the existing callbacks and domain cursor helpers. Confirm focused GREEN.

### Task 2: Status hierarchy and Nocturne presentation

**Files:** `src/ui/components/PokerTable.tsx`, `src/styles/nocturne-replay-controls.css`, `src/main.tsx`, focused component tests.

- [x] Add failing assertions for a single source-backed current actor/status and progress within the command dock. Confirm RED.
- [x] Restructure only the table command deck and add scoped desktop/narrow CSS for one compact centered surface, segmented streets, focus/disabled/selected states, and tight table spacing. Confirm GREEN.

### Task 3: Browser QA and handoff

**Files:** `tests/visual/nocturne-r8-controls.spec.ts`, `docs/qa/nocturne-r8/README.md`.

- [x] Add and run focused Playwright checks for start, mid-hand, board streets, actor/status agreement, Hide Result, hand change, and dock geometry at approved widths. Capture and inspect representative screenshots.
- [x] Run focused unit/browser checks, typecheck, lint, build, targeted formatting, and diff checks. Obtain independent read-only review; address substantive findings. Record evidence and numbered broad reviewer commands.
