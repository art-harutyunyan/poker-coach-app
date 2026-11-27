# Nocturne R5 Tournament Import Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. Steps use checkboxes for tracking. The approved R5 brief prohibits commits, pushes, merges and deployment.

**Goal:** Present each tournament file import with the approved Nocturne entry and typed result states while preserving existing parser, library, and session semantics.

**Architecture:** Keep `useTournamentImport` as the only import controller. Retain its legacy `attempt` contract for existing callers and tests, and add a per-file typed result list. Let the upload view submit selected files sequentially through the existing `importFile` operation; keep parsing and duplicate/conflict decisions in their existing services. A presentation adapter maps real outcome data to display copy, and a reusable result component renders each typed state.

**Tech Stack:** React, TypeScript, Nocturne CSS tokens and primitives, Vitest/Testing Library, focused Playwright.

**Spec:** `docs/subframe-design/design-guideline.md` (primary) and the approved R5 brief supplied 2026-11-19. No separate import-state screenshot exists.

## Global Constraints

- Keep `src/services/tournamentImport.ts`, GG parser semantics, `prepareLibraryInsert`, replay, metrics, and R2–R4 designs unchanged.
- No invented progress, skipped counts, format, warnings, or cancellation action.
- Duplicate reuses the existing key; conflict rejects the incoming content and can show the existing key.
- Only display a warning import status when accepted hands and actual skipped count both exceed zero. Current importer has no such outcome, so it will not emit warning.
- Display safe base file names only. Batch selections run sequentially and stop submitting further files when the import dialog unmounts.
- Preserve the existing top-level and Library entry points and selected-tournament navigation.
- Run focused tests and visual QA only; provide the broad verification matrix for the user. Do not commit or push.

## Review Focus

- A slow import superseded by another must not leave a stale processing row or add a tournament.
- Closing the dialog during a batch must not start later files or publish a late result.
- A duplicate or conflict result must point to the existing entry and leave the library unchanged.
- A parser error must display its real reason without exposing a filesystem path or private exception.
- A completed file with metadata notices but no skipped hands must stay `success`, not `warning`.

## Files and responsibilities

- `src/ui/useTournamentImport.ts`: per-file result state, outcome publication, and existing-entry key for conflicts.
- `src/ui/importResultPresentation.ts`: pure source-backed display mapping and safe file name formatting.
- `src/ui/components/ImportResult.tsx`: typed, accessible result row with supplied actions.
- `src/ui/components/TournamentUpload.tsx`: Nocturne entry, drag/drop and picker, sequential submissions, summary, and result actions.
- `src/styles/nocturne-tournament-import.css`: import-specific Nocturne layout and state treatments; imported workspace styles remain intact.
- `src/ui/App.tsx`: pass result list and existing navigation callback to the upload view.
- Focused unit and browser tests: protect mapping, batch, navigation, and state visuals; update tests that assert superseded import copy.
- `docs/qa/nocturne-r5/README.md`: focused evidence, screenshots, responsive observations, gaps, and reviewer commands.

### Task 1: Per-file typed controller results

- [x] Add focused hook tests for processing, success, duplicate, conflict with existing key, error, supersession, and reset.
- [x] Run those tests RED against the absent result-list API.
- [x] Extend the controller with `fileResults` while retaining `attempt` and existing library/replay behavior.
- [x] Run focused hook tests GREEN.

### Task 2: Source-backed result presentation and component

- [x] Add focused adapter/component tests for all six typed states, known/unknown metadata, safe file name, no fake skipped count, and accessible actions.
- [x] Run RED.
- [x] Implement `presentImportResult` and `ImportResult` using Nocturne status tokens, with no business logic in the visual component.
- [x] Run GREEN.

### Task 3: Entry, batch, and navigation integration

- [x] Add focused upload/App tests for empty state, picker/drop, independent sequential rows, duplicate/conflict library stability, and correct Open/Show existing navigation.
- [x] Run RED.
- [x] Build the Nocturne import entry and result list, update App props, and add scoped responsive CSS. Keep dialog-close cancellation internal and omit a visible Cancel action.
- [x] Run focused integration tests GREEN and adjust affected legacy copy assertions to the approved wording.

### Task 4: Focused visual QA and handoff

- [x] Add focused Playwright coverage for real empty, processing if reproducible, success, duplicate, conflict, error, and mixed batch states at 1440, 1280, and a narrow width.
- [x] Run only focused Playwright cases, inspect captures, and fix material layout or state issues.
- [x] Run scoped lint/format and `git diff --check`; inspect changed files for protected-scope drift.
- [x] Record evidence, provisional layout notes, unavailable warning/skipped and cancellation behavior, and exact numbered broad verification commands in `docs/qa/nocturne-r5/README.md`.
- [x] Stop at **R5 — READY FOR REVIEW**.
