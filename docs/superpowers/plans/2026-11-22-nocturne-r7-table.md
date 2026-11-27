# Nocturne R7 Table Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task by task. The approved brief forbids commits, pushes, merges, and deployment.

**Goal:** Polish the R6 Browse all popover, then replace the Replayer table, seat, card, and action presentation with the approved Nocturne design while preserving replay and privacy behavior.

**Architecture:** Keep `PokerTable` fed by the existing `ReplayState`. Replace the fixed seat coordinate tables with a shared ellipse calculation that retains the current clockwise position mapping. Let `PlayerSeat` own one seat unit with cards, `SeatPlate`, and separate `ActionChip`; keep all displayed values and timing sourced from the current snapshot. Restyle the existing poker table CSS with R0 tokens and leave the R6 strip and analysis content in place.

**Spec:** Approved R7 brief supplied 2026-11-22, `docs/subframe-design/design-guideline.md`, and `docs/subframe-design/design-screenshots/04_Hand_Replayer (2).png`.

**Constraints:** Main worktree; preserve R0–R6 and unrelated changes; no parser, domain replay, seat-position mapping, import, analysis, or control behavior changes. Focused TDD and visual QA. Stop at ready for review and give numbered broad commands; do not run the broad matrix or commit.

## Files and responsibilities

- `src/styles/nocturne-replayer-shell.css`, `tests/visual/nocturne-r6-replayer-shell.spec.ts`: R6 popover width, anchored placement, internal scroll, and visual assertion.
- `src/ui/components/seatLayout.ts` and its test: shared ellipse anchors for 6/7/8/9-max, current position mapping unchanged.
- `src/ui/components/SeatPlate.tsx`, `src/ui/components/ActionChip.tsx`, `src/ui/components/PlayerSeat.tsx`: explicit status and position tone, cards/plate as one unit, source-backed action chips and dealer.
- `src/ui/components/PokerTable.tsx`, `src/styles/poker-seats.css`, `src/styles/playing-cards.css`: Nocturne felt/rail, stage, board/pot, card sizes, and responsive geometry.
- Focused component/browser tests and `docs/qa/nocturne-r7/README.md`: state/privacy/size/overlap evidence and reviewer commands.

## Task 1: R6 Browse all polish

- [x] Add a focused browser assertion for a floating, bottom-end anchored popover near 640px wide with internal row scrolling; observe RED.
- [x] Tighten the existing popover layout without touching its React focus/keyboard handlers; run the focused browser test GREEN and capture desktop/mobile views.

## Task 2: Shared seat geometry

- [x] Add RED tests for Hero bottom center, unique clockwise 6/7/8/9 anchors, inward action positions, and unchanged position ownership.
- [x] Generate anchors from one ellipse/slot formula and run focused GREEN.

## Task 3: Seat unit and action presentation

- [x] Add RED tests for explicit statuses, Hero to-act treatment, folded/no cards, hidden and partial revealed cards, compact opponent cards, position tones, separate action chips with real amounts, all-in, and BTN dealer.
- [x] Extract focused `SeatPlate` and `ActionChip` views from `PlayerSeat`, keep snapshot data flow, and run focused GREEN.

## Task 4: Nocturne stage and responsive QA

- [x] Add browser geometry assertions for 1440, 1280, 1024/768, and narrow layouts, including plate/card/action/board non-overlap and table proportions; observe RED where layout is still legacy.
- [x] Replace legacy green table styling with R0 Nocturne felt/rail, align board/pot, and adapt the shared geometry at narrow widths; run focused GREEN.
- [x] Inspect captures for 8-max preflop/postflop, Hero/opponent to act, folded/revealed, 6-max, 9-max, and the historical 768px overlap.
- [x] Run focused unit/browser checks plus scoped lint, typecheck, formatting, and whitespace checks. Obtain independent read-only review. Record evidence and stop at **R7 — READY FOR REVIEW**.
