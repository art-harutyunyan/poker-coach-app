# THE STUDY — Development Instructions

## Project

THE STUDY (PokerCoachApp) is a poker education,
hand-history analysis, and coaching application.

## Source of Truth

- Follow Roadmap/README.md and the relevant phase files.
- Respect existing architecture decisions (ADRs).
- Use the main PokerCoachApp worktree for development.
- Do not use design-experiment worktrees unless requested.
- Treat CODEX-INSTRUCTIONS.md as a historical task-specific
  document, not as permanent development instructions.

## Before Implementation

1. Read the relevant roadmap phase and existing ADRs.
2. Inspect affected code and existing tests.
3. Identify dependencies, risks, and acceptance criteria.
4. Propose a scoped plan for substantial changes.

## Development Rules

- Preserve existing functionality and approved designs.
- Follow existing architecture and coding conventions.
- Avoid unrelated changes and unnecessary dependencies.
- Keep deterministic poker mathematics independent of AI.
- Treat uploaded hand histories as untrusted input.
- Prefer small, reviewable changes.

## Execution Efficiency

- Apply these defaults only where mandatory Superpowers workflows leave discretion.
  Preserve TDD, independent verification, and required review.
- Prefer direct execution for small, clearly scoped tasks.
- Delegate when independent parallel work or specialized review adds meaningful value.
- Give agents focused source references; avoid duplicate broad documentation surveys.
- Reuse already-read, unchanged instructions within this session unless freshness
  or skill requirements demand rereading.
- Use targeted searches and bounded outputs; inspect full failure details when needed.
- Load only task-relevant roadmap phases, specifications, and fixtures.

## Testing

- Add regression tests for changed behavior.
- Use existing GG hand-history fixtures when applicable.
- Verify parser accounting and replayer correctness.
- Test invalid inputs and important edge cases.
- Never claim tests passed unless they were executed.

## Completion Requirements

- Run relevant tests, lint, typecheck, and build checks.
- Report changes, test results, and remaining risks.
- Update phase checklists and validation evidence when
  implementation requirements have been fulfilled.
- Do not mark a phase complete based on code alone.

## Safety

- Never expose credentials or secrets.
- Do not perform destructive operations without approval.
- Do not deploy or push without authorization.
- Do not modify unrelated files.
