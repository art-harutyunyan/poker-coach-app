# Nocturne R1 Application Shell Plan

**Goal:** Move the existing application into the approved Nocturne shell without changing page interiors or route behavior.

**Authority:** Approved R1 brief (2026-11-17), `docs/subframe-design/design-guideline.md`, approved screenshots, ADR-001 and ADR-002.

**Scope:** Main worktree only; no new routes, dependencies, page redesign, commits, or deployment. Preserve current responsive mobile selector and all existing local tournament/replay state.

## Steps

- [x] Add focused shell and route tests; run RED.
- [x] Extract the navigation rail and workspace wrapper; keep existing handlers in `App`.
- [x] Add Nocturne shell CSS using R0 tokens, with a 72px desktop rail and 8px workspace edge gutter.
- [x] Run focused GREEN and inspect desktop Tournaments, Replayer, Dashboard, plus mobile overflow.
- [x] Obtain independent read-only review, inspect scoped diff, and stop READY FOR REVIEW.

**Risks:** Legacy shell selectors in several stylesheets can override the new rail; imported/replayer workspaces have different scroll and padding rules. Keep all Nocturne overrides scoped to the shell and ordered last.

Independent review found one 1180–1439px avatar visibility regression from a legacy selector. It was reproduced at 1280px, fixed with a scoped display override, and visually rechecked. QA captures and observations are in `docs/qa/nocturne-r1/README.md`.
