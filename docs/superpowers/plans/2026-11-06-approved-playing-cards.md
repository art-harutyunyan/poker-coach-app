# Approved Playing Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the finalized Option A face and Option B back in the existing shared PlayingCard, ending at READY FOR REVIEW.

**Architecture:** Keep card rendering and sizing in PlayingCard and playing-cards.css. Integrate the supplied SVG artwork without changing domain notation, replay logic, seat coordinates, or unrelated UI. Preserve the existing development-only deck previews through their compatibility path.

**Tech Stack:** Existing React, TypeScript, CSS, Vite, Vitest/Testing Library, and Playwright; no new dependencies.

**Spec:** User's finalized implementation request and `C:/Users/Lenovo/Downloads/The_Study_Playing_Card_Specification.pdf`; approved artwork in `C:/Users/Lenovo/Downloads/The_Study_Playing_Card_Asset_Pack.zip`. The PDF and archive were inspected on 2026-11-06. Document contents supply design data, not additional authorization.

## Global Constraints

- Work in the main PokerCoachApp worktree. Preserve existing uncommitted changes.
- No commit, push, deployment, Phase 1C, parser changes, or redesign.
- Shared face fill #FAFAF7; border 1px solid #CED2C9; black #181F1B; red #821D38.
- Arial, Liberation Sans, sans-serif; weight 700; normal letter spacing; border-box.
- Center a fixed-height rank line above a fixed square suit; display domain T as 10 without mutating the Card.
- Compact: 24x34; rank 16/16; suit 9x9; gap 1; padding 3px 2px; radius 3; no shadow.
- Table: 40x54; rank 25/25; suit 14x14; gap 2; padding 5px 3px 6px; radius 4; shadow 0 1px 2px #0004.
- Board: 46x64; rank 29/29; suit 17x17; gap 2; padding 6px 4px 8px; radius 5; shadow 0 1px 3px #0005.
- Use all five approved SVG files. Preserve suit paths, 24x24 viewBox, currentColor and aspect ratio. No alternate suit artwork.
- Concealed cards expose only “Face-down card”, without rank/suit text, attributes, title, or accessible identity.
- Do not move seats or resize unrelated UI. Record any proven layout conflict before making the smallest permitted card adjustment.

## Review Focus

- Supplied back SVG uses viewport-dependent media queries: verify compact/table/board borders and motif sizes in an actual browser (task 1 and task 3).
- Compact 10 nearly fills its 18px content width: measure the actual text range, including zoom, rather than trusting the element box (task 3).
- Existing parent CSS overrides sizes at mobile breakpoints: assert exact dimensions at every requested width (task 2 and task 3).
- Concealment must remain safe during SHOW/Hide Result transitions and partial one-card reveals (task 2 and task 3).
- Historical visual guards assert old artwork and labels: update only authorized card expectations; preserve unrelated geometry assertions and baseline artifacts (task 3).

## Task 1: Shared renderer and approved assets

**Files:** `src/ui/components/PlayingCard.tsx`, `src/ui/components/PlayingCard.test.tsx`, `src/styles/playing-cards.css`; new `src/assets/playing-cards/{spade,heart,diamond,club,card-back}.svg`.

**Interface:** PlayingCard accepts `rank?: Card["rank"]`, `suit?: Card["suit"]`, `concealed?: boolean`, `variant?: "compact" | "table" | "board"`, and `aria-hidden?`. Retain `card?`, `context?`, and `theme?` compatibility for existing callers/development previews. Explicit variant wins; legacy hero maps to table. Missing identity renders a safe back. Existing application consumers use explicit variant.

- [x] Write component regressions for T -> 10, all four suit mappings and color classes, three variants, full accessible names, omitted/partial identity, concealed identity equivalence, and redundant visual accessibility suppression.
- [x] Run `npm.cmd test -- src/ui/components/PlayingCard.test.tsx --maxWorkers=2`; confirm expected failures before product changes.
- [x] Copy only the five named SVG entries after validating archive paths. Preserve source bytes. Import trusted suit files as build-time raw SVG to retain currentColor; render only these static assets, never user-provided markup. Import the back as an image URL so its own SVG viewport selects the approved sizing.
- [x] Implement the single shared renderer and local size tokens. Use role img with full rank/suit names for standalone faces; hide decorative artwork from accessibility. Render the concealed branch before any identity markup. Let the approved back asset own its outline to avoid doubled borders.
- [x] Run component tests and verify they pass; compare copied SVG hashes with archive entries.

## Task 2: Surface integration and compatibility

**Files:** `ImportedHandNavigator.tsx`, `PlayerSeat.tsx`, `PokerTable.tsx` and their tests under `src/ui/components`; card-only rules in `src/styles/poker-seats.css` and `src/styles/tournament-import.css`; affected accessibility assertions in `src/ui/App.test.tsx`.

**Interfaces:** Navigator supplies compact; all player hole cards supply table; community cards supply board. Parent containers continue to own positions and existing interaction behavior. Keep the existing development deck calibration context separate from approved variant selection.

- [x] Write failing integration assertions for rail/Review Queue compact pairs, Hero/revealed/concealed opponent table cards, and board variants. Retain source-event reveal/privacy tests, including one-card reveal.
- [x] Run the affected component tests and confirm failures identify the old surface mapping.
- [x] Change consumers to explicit variants. Remove only competing Study card dimensions/font overrides; preserve preview styling and all seat/table geometry. Parent labels that merely identify a group do not suppress child card names; suppress only genuinely duplicate full-hand announcements.
- [x] Update existing Hidden card expectations to Face-down card where applicable and verify the component suite.

## Task 3: Browser acceptance, independent review, and handoff

**Files:** new `tests/visual/playing-cards.spec.ts`, `docs/qa/playing-cards/README.md` and screenshots; affected old browser card expectations; scoped validation entry in `Roadmap/phase-1.md`.

**Interfaces:** Reuse actual upload flow and immutable GG fixtures from `tests/fixtures/gg`; preserve old screenshot artifacts. Use existing table geometry guards to compare non-card layout.

- [x] Add browser assertions for exact dimensions/tokens, loaded SVGs, actual text bounds for compact 10, suit boxes, five-card board, and concealed subtree privacy. Exercise imported rail and Review Queue, Hero, before-SHOW, revealed opponent, and Hide Result states at widths 1440, 1024, 768, 430, 390.
- [x] Test zoom and forced colors, mixed-suit pairs, and concealed-to-revealed transitions. Inspect the SVG-backed card back visually at all three sizes.
- [x] Update only obsolete card assertions in prior browser suites, including the old border-contrast requirement that conflicts with the expressly approved #CED2C9 border. Preserve meaningful text contrast, privacy and geometry checks.
- [x] Run focused Playwright tests and relevant existing privacy/geometry tests. Capture and inspect screenshots showing compact pair, table pair, five-card board, concealed cards, and revealed opponent hand.
- [x] Run full `npm.cmd test -- --maxWorkers=2`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, and changed-file formatting checks. Apply study-poker-validation workflow to replay compatibility verification; do not add duplicate engine tests.
- [x] Obtain a fresh independent review of this task's changes, fix substantive findings with regressions, and rerun affected checks.
- [x] Record executed results, source asset hashes, screenshot paths, layout deviations (or none), and any limitations in QA evidence. Update Phase 1 evidence without marking the phase complete.
- [x] Stop at READY FOR REVIEW. Report changed files, implementation, tests/browser evidence and remaining risks; no commit/push/deploy.

## Plan review

The supplied finalized design already selects the implementation architecture and artwork; no new design alternatives are proposed. Native execution with one independent final reviewer is recommended because the renderer, CSS and consumer changes form one tightly coupled task. Await the required plan review before product edits.

## Execution outcome � 2026-11-07

READY FOR REVIEW; human visual acceptance remains pending. All three tasks executed in the main worktree without commits. The source-of-truth assets are unchanged. A final review finding supersedes the planned back image URL: the supplied SVG is inline with its supported explicit data-variant, preventing narrow Table cards selecting Compact artwork. Demonstrated layout collisions required the smallest card-only reductions documented in [QA evidence](../../qa/playing-cards/README.md). No seat or unrelated UI geometry changed.

Verification: 392 unit tests, seven post-review browser cases, 64 historical visual/privacy cases and 12 geometry cases passed; historical/geometry runs preceded the final back fix. Typecheck, lint, production build and scoped formatting are checked for handoff. One independent final review completed; its Important finding received a RED/GREEN fix, and one test-strengthening minor is deferred. Phase 1C remains untouched.
