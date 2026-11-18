# Phase 9 - Poker Academy: Interactive Hand Coaching

## Status

NOT STARTED

## Goal

Turn THE STUDY Academy into guided, multi-street, reasoning-first coaching. Preserve the educational interaction proven in coaching conversations: scenario -> user decision and explanation -> coach critique -> relevant math checkpoint -> variation or continued street.

## Scope

- **Guided Learning** flow powered by structured, versioned, curated poker scenarios with realistic positions, players, stack sizes, blinds/antes, hole cards, board cards, pot/action history, street, legal actions, lesson goals, and range assumptions.
- User chooses an action/sizing and writes reasoning **before** revealing a strategic assessment. Capture decision confidence (low/medium/high) and optional numeric estimates.
- Assess reasoning along separate axes: math accuracy (deterministic), range construction, strategic coherence, and confidence calibration. Distinguish objective checks from coach interpretations.
- Explain errors, ask a targeted correction question, provide optional hints, and let the user revise their reasoning; preserve attempt history.
- Embed Phase 8 calculators as contextual, optional explanations, not as an automatic decision oracle.
- Continue the *same scenario* to turn/river with state preserved; also support branching to alternative actions and changing exactly one variable (sizing, stack, opponent tendency, or runout) with consequences explained.
- An integrated replayer-style read-only visual for hand state; reuse Phase 1 replayer and Phase 5 training components where possible, avoiding seat or table redesign.
- Scenario validation: legal actions, deck uniqueness, pot accounting, committed chips, stack bounds, turn order, valid streets, consistent reveals, and valid math checkpoints.
- Coaching engine abstraction: deterministic feedback must work without an AI provider; where Phase 6 Ask Coach is available, optional typed/cached/budgeted AI feedback can discuss reasoning but cannot invent solver outputs, range frequencies, or equity.
- Persist scenario, attempts, decisions, confidence, explanations, and explicit scenario/version IDs via existing Phase 5 training persistence.
- Design for 6/8/9-max scenario compatibility; test relevant supported layouts at desktop/tablet/mobile breakpoints.

## Out of Scope

- Reimplementing Phase 5 mistake quizzes, progress tracking, generic grading, or trainer infrastructure.
- Automatic scenarios generated from actual imported user hands (Phase 10).
- Solver-backed GTO frequency assertions without validated solver evidence; fabricated numeric strategy grades.
- Rewriting parser, existing table/seat geometry or product shell; always-on voice tutor; real-time hand assistance.

## Dependencies

Phase 8; existing Phase 5 Training infrastructure; optionally integrate with Phase 6 AI interfaces when available, but the core learning path must function without external AI calls.

## Task Checklist

- [ ] Audit Phase 5 and replayer interfaces to identify extensions rather than duplication; document compatibility.
- [ ] Define types and validation for versioned Scenario, StreetState, LegalAction, DecisionAttempt, MathCheckpoint, CoachingFeedback, and Branch/Variation.
- [ ] Write tests for scenario integrity and deterministic math feedback before implementing UI.
- [ ] Implement curated scenario runner with decision hidden until submission, free-text reasoning, and confidence input.
- [ ] Implement staged feedback: math correctness, reasoning strengths, missing assumptions, uncertainty, and follow-up prompt.
- [ ] Add optional hint and calculator reveal with tracked usage; never show answer before the student's first submission unless explicitly in study/reference mode.
- [ ] Support hand continuation and at least one-variable change; maintain internally consistent pots/stacks/actions after each branch.
- [ ] Persist progress/attempts using existing Phase 5 data model extensions and migrations as necessary.
- [ ] Add accessible responsive UI, integration/E2E tests, cost/safety evaluation when AI enabled.
- [ ] Update roadmap validation evidence and completion log.

## Acceptance Criteria

- [ ] An end-to-end curated hand supports flop -> turn -> river decisions with persisted action, explanation, confidence, and correct pot/stack state.
- [ ] User can compare a call vs. a fold and a different bet size without unsupported EV claims.
- [ ] A mathematical error (e.g., call 10 into 20 after a 10 bet requires 25%, not 33.3%) is detected from deterministic outputs and explained clearly.
- [ ] Correct but uncertain answers, incorrect but confident answers, and justified range-dependent decisions are assessed differently.
- [ ] Feedback labels the basis: mathematical fact, range assumption, strategic heuristic, or validated strategy evidence.
- [ ] No unvalidated generated scenario is marked solved; no existing Phase 5 exercises/regressions broken.
- [ ] The lesson is usable with no AI API credentials or while an AI provider is unavailable.

## Decisions / ADRs

- Record scenario and attempt schema, AI boundary, validation policy, and persistence reuse.
- Never equate a model's opinion with a solver result; display confidence and evidence limits.

## Risks / Open Questions

- Multiple defensible actions exist in poker; do not grade strategic disagreement as a deterministic error.
- Hidden-information leakage: never expose later cards, opponent hand, or final outcome before the appropriate step.
- AI coaching costs and hallucination need limits, versioned prompts, evaluation and safe fallback.

## Validation Evidence

- Not started. Attach curated fixture walkthroughs, tests, screenshots, and coaching-eval examples after implementation.

## Completion Log

- Not started.
