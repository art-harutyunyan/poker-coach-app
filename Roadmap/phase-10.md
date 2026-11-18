# Phase 10 - Poker Academy: Adaptive Learning & Tournament Integration

## Status

NOT STARTED

## Goal

Close the loop between actual GGPoker tournament decisions, validated leaks, Academy practice, and longitudinal improvement without duplicating Phase 4 Player Development or Phase 5 Training ownership.

## Scope

- Reuse Phase 4 leak signals, opportunity-normalized progress, and Phase 5 training history to recommend targeted Academy scenarios; explain why each was recommended.
- Link validated analyzed hands from Phases 1-3 to Phase 9 coaching sessions with preserved original evidence, anonymized opponents, and hidden real outcomes until user submission.
- Recommend concept lessons and math checkpoints using performance by skill, attempt confidence, correction success, and spaced-repetition due dates.
- Introduce **Decision Training / Live Tournament Practice**: optional time limit, chips or BB input, rounded real-world chip amounts, approximate pot counting, restricted hints, and post-submission explanation. This is offline study, never real-time live-play assistance.
- Show skill progress for math, range reasoning, strategic reasoning, and confidence calibration, with uncertainty and sample sizes. Do not present false precision or confuse question accuracy with tournament ROI.
- Support a practice cycle: detected issue -> targeted hands -> improvement attempts -> later tournament recheck; preserve history and causal uncertainty.
- Ensure user-facing controls for training-history management consistent with existing authentication/privacy architecture.
- Instrument performance, accessibility, scenario quality, cost and regressions.

## Out of Scope

- New core parser, hand-history persistence, leak detection engine, generic training engine, or separate progress database.
- Claiming that training success proves tournament profit; unverified solver outputs or quantitative equity against unmodeled ranges.
- Live assistance on GG Poker or live tournament tables, screen scraping, real-time overlays, or restricted electronic decision aids.
- Full ICM/solver implementation in this phase unless a prior ADR explicitly authorizes a separately validated scope.
- Redesigning the existing app shell, table, seats, or Academy's Phase 8/9 established patterns.

## Dependencies

Phase 9; data/contracts from Phases 1-5; Phase 7 account/privacy controls; Phase 6 AI abstractions where needed.

## Task Checklist

- [ ] Reuse existing Phase 4 and Phase 5 metrics/schema; write an ADR for recommendation source-of-truth and avoid duplicate tracking.
- [ ] Define skill taxonomy, evidence provenance, confidence scores, minimum sample counts, and recommendation reason schema.
- [ ] Build links from validated analyzed hands to a safe scenario clone; preserve original hand ID and hide outcomes.
- [ ] Implement recommendation policy using explainable rules first, with deterministic tests; AI may propose text but cannot fabricate evidence.
- [ ] Implement spaced repetition based on attempts and confidence; store due dates and allow overrides.
- [ ] Add timed Decision Training mode with optional chips/BB, approximate pot exercise and end-of-hand review; never provide live-game prompts.
- [ ] Add learning-progress views integrating existing Phase 4/5 signals, with small-sample warnings.
- [ ] Add consent/privacy boundaries and training history controls using existing Phase 7 architecture.
- [ ] Run end-to-end upload -> analyze -> recommend -> practice -> re-evaluate test with anonymized fixture data.
- [ ] Document release metrics, validation evidence and roadmap completion log.

## Acceptance Criteria

- [ ] A validated recurring pot-odds mistake creates an explainable targeted lesson recommendation without additional fabricated leaks.
- [ ] Scenario launched from an analyzed hand is reproducible, anonymized, and does not reveal the result in advance.
- [ ] Practice results are linked to the existing training and development records rather than conflicting duplicate metrics.
- [ ] Timed mode uses realistic chip units and grades numeric math consistently with Phase 8.
- [ ] A user can review why a lesson was recommended and see progress with sample-size qualifiers.
- [ ] No real-time external poker client integrations or on-table suggestions are included.
- [ ] Test suite passes across existing Phase 1-9 functionality, mobile/tablet/desktop, and privacy controls.

## Decisions / ADRs

- Record recommendation rules, assessment taxonomy, evidence/sample-size thresholds, and retention requirements.

## Risks / Open Questions

- Misidentified leaks and biased scenario selection can produce false learning conclusions. Recommendations require validated inputs, provenance, and uncertainty labels.
- Do not infer solver/GTO certainty from coach text or limited tournament samples.

## Validation Evidence

- Not started. At completion attach fixture-backed end-to-end runs, policy tests, privacy checks and UX screenshots.

## Completion Log

- Not started.
