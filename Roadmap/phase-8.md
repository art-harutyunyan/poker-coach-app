# Phase 8 - Poker Academy: Mathematics Foundation

## Status

NOT STARTED

## Goal

Extend THE STUDY with a deterministic, understandable poker-mathematics learning foundation. Users must be able to learn the meaning, conditions, and limitations of pot odds, hand equity, expected value (EV), stack-to-pot ratio (SPR), and common drawing probabilities, then explore the results interactively.

## Scope

- A dedicated **Poker Academy** navigation destination consistent with the Phase 0 approved design. No broad redesign.
- Concepts Library with beginner-friendly definitions, why/when to use each concept, formulas, worked examples, common mistakes, and explicit assumptions.
- Interactive, accessible calculators: pot odds / required equity, simplified call chip EV, SPR, bet size as a fraction of pot, BB-to-chip conversion, draw hit probability, and pure-bluff break-even fold frequency.
- Static reference table for opponent bet size vs. required equity (25%, 33.3%, 50%, 66.7%, 75%, 100%, 150%, 200% pot); explain that this is *call* equity and not a win-probability prediction.
- Inputs in BB or chips (including realistic live tournament chips such as 234,600). Reuse existing design tokens, components, data contracts, and responsive conventions after repository inspection.
- Formula walkthroughs that reveal the intermediate amounts: pot before bet, opponent bet, amount to call, final pot, required equity, estimated equity, EV relative to folding.
- Clearly separate user-supplied equity estimates from known mathematical values; offer no imaginary opponent range equity.
- Unit and integration tests covering arithmetic and UI behavior.

## Out of Scope

- New hand-history parser, solver, equity-versus-range engine, live-play assistance, ICM solver.
- Automatic grades for strategic choices, AI coaching dialogue, persistence of learning progress, personalized lesson generation (Phases 9-10).
- Rebuilding Phase 5 trainer or changing existing replayer table, nameplates, seat cluster, page shell, approved dark visual language, or navigation behavior outside the new Academy entry.
- Production feature unrelated to Academy.

## Dependencies

Phase 7 complete; reuse Phase 5 training primitives and Phase 6 AI boundaries if applicable. The Academy math functions must remain deterministic and independent from AI services. Do not duplicate existing utilities.

## Mathematical Contracts

- With `P` as pot before villain bets, `B` as villain bet, `C` as incremental call amount, and no other contributors: `finalPot = P + B + C`; `requiredEquity = C / finalPot`.
- For a standard heads-up matched bet, `C = B`, so `requiredEquity = B / (P + 2*B)`.
- For one remaining decision with all equity realized, no ties/rake/future betting: `callEV = equity * finalPot - C`. Equivalent to `equity*(P+B) - (1-equity)*C`.
- The generic calculation MUST use *incremental amount to call*, not the bettor's total raise; account for previous hero contribution in raise scenarios or explicitly restrict the UI to facing a simple bet.
- `SPR = smaller remaining effective stack / pot at the current decision point` (effective stack defined using both players' remaining stacks for the modeled confrontation). Explicitly label whether amounts are pre- or post-action.
- Pure-bluff break-even fold frequency for bet `B` into pot `P`, assuming zero showdown equity when called and no raises: `B / (P+B)`.
- Single-card clean-outs probability: `outs / unseenCards`; for a two-card runout without further decisions and identical clean outs, use exact complement probabilities, not `outs*4` as an exact answer.
- Equity includes ties when relevant; simplify to a no-tie model only where clearly disclosed.
- Chip-unit scaling MUST NOT change resulting percentages. Floating-point output needs stable, consistent rounding; never round intermediate comparisons.

## Task Checklist

- [ ] Inspect current code, roadmap, phase-5 training implementation and design system; record reuse decisions.
- [ ] Define typed, pure domain functions for mathematical contracts and exhaustive validation of invalid/zero/non-finite inputs.
- [ ] Write arithmetic unit tests first using independently calculated examples and edge cases.
- [ ] Build Academy navigation and Concepts Library using approved UI patterns.
- [ ] Build interactive calculators with editable values, visible formula steps, correct empty/error states, unit switching, mobile/tablet layouts, and accessible labels.
- [ ] Implement required-equity cheat sheet; test formula/table consistency.
- [ ] Write integration/E2E tests for input changes, unit conversion, and no-overflow responsive layouts.
- [ ] Document known limitations and study-only positioning; update roadmap evidence and completion log.

## Acceptance Criteria

- [ ] Example `P=20, B=C=10, equity=30%` shows final pot 40, required equity 25%, call EV +2 BB.
- [ ] Example `P=12, B=C=6, equity=9/46` shows required equity 25%, call EV approximately -1.30435 BB.
- [ ] Example `P=500000, B=C=234600` yields approximately 24.206% required equity; shown as ~24.2%, regardless of chip/BB mode.
- [ ] A zero-equity 5 BB pure bluff into 10 BB requires 33.333...% folds to break even.
- [ ] An arbitrary sizing reference never silently implies the user actually has that equity.
- [ ] All deterministic tests pass; no existing replayer/regression failure; approved dark design and seat clusters unchanged.
- [ ] Clear explanations distinguish pot odds, equity, EV, SPR, and fold equity.

## Decisions / ADRs

- Record whether the existing app architecture supports a shared math library or whether a new domain module is required; favor reuse.
- Treat numeric math functions as source of truth; AI must never override their outputs.

## Risks / Open Questions

- Incorrect handling of prior contributions, uncalled excess in all-ins, side pots, or rake would silently teach wrong math; keep MVP calculator scope explicit and prohibit misleading results.
- Do not use drawing probability as a substitute for real equity against unknown ranges.

## Validation Evidence

- Not started. At completion, include test commands/results, representative screenshots, and checked formula examples.

## Completion Log

- Not started.
