# Codex Task: Extend THE STUDY Roadmap with Poker Academy Phases 8-10

## Source of Truth

- Repository: `art-harutyunyan/poker-coach-app`.
- Work in the existing **main development worktree** (`PokerCoachApp`), NOT the `PokerCoachApp-Taste` or `PokerCoachApp-Impeccable` design-experiment worktrees.
- Read `Roadmap/README.md`, `Roadmap/phase-0.md` through `Roadmap/phase-7.md`, existing ADRs, and repository instructions before making changes.
- The supplied `phase-8.md`, `phase-9.md`, and `phase-10.md` documents are the requested source of truth for new roadmap definitions, subject to alignment with existing repository contracts.

## Task — Documentation only

1. Inspect repository conventions and existing scope ownership, especially Phase 4 Player Development, Phase 5 Training, Phase 6 AI, and Phase 7 production hardening.
2. Add these three files *without changing the established phase format*:
   - `Roadmap/phase-8.md`
   - `Roadmap/phase-9.md`
   - `Roadmap/phase-10.md`
3. Append Phase 8, 9, and 10 rows to `Roadmap/README.md` using its existing columns and styles. All new statuses: `NOT STARTED`; dates unset; dependencies: Phase 8 -> Phase 7, Phase 9 -> Phase 8, Phase 10 -> Phase 9.
4. Make only necessary textual alignment changes to new documents if existing ADRs or contracts demand them. Explain any changes; DO NOT silently expand scope.
5. Report changed files, short summary, and `git diff --check` result. Do not start implementation of the new features.

## Non-goals / Hard Constraints

- Do NOT redesign UI, poker table, player nameplates, seat clusters, or replayer.
- Do NOT edit Phases 0-7 without a clearly documented compatibility conflict and explicit authorization.
- Do NOT implement components, change application code, install packages, generate HTML prototypes, or deploy anything in this task.
- Preserve the existing premium dark THE STUDY design decisions and one development source of truth.
- Phase 5 remains owner of generic training/scoring/progress foundation; new phases must reuse it.
- Pure deterministic math must be independent of AI and its outputs must never be replaced by guesses.

## Acceptance Criteria

- `Roadmap/README.md` includes correctly linked and numbered rows 8-10.
- All new phase files follow `Status / Goal / Scope / Out of Scope / Dependencies / Task Checklist / Acceptance Criteria / Decisions / ADRs / Risks / Validation Evidence / Completion Log` conventions.
- No existing files other than `Roadmap/README.md` are modified.
- No application source code has changed.
- All new phases remain `NOT STARTED`.

## Later Implementation Protocol

When instructed separately to begin a specific phase: first inspect its source-of-truth file, related prior phase contracts, and existing code; propose a bounded implementation plan; execute with tests first for deterministic math and scenario validation; validate responsive UX; capture evidence; update the current phase's checkboxes, ADRs, evidence, and completion log. Never mark complete based on code alone. Follow any applicable repository skills and avoid broad redesign/refactors.
