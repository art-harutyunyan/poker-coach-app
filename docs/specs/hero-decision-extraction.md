# Hero decision extraction (A1)

`extractHeroDecisions(hand: ImportedHand): DecisionExtractionResult` produces strategy-neutral `HeroDecisionContext` records in `src/domain`. It reads the existing GG parser's canonical `ImportedHand.events` once in source order. It does not parse raw text, call Replay, grade play, recommend actions, or use AI. The Phase 0 `DecisionContext` remains an unrelated mock analysis contract with triage fields.

## Decision and evidence

One decision is a source Hero `FOLD`, `CHECK`, `CALL`, `BET`, or `RAISE` on preflop, flop, turn, or river while Hero has chips. Forced posts, antes, deals, opponent actions, returns, shows/mucks, showdown, and awards do not count. Each context has its source `eventId`, `sourceLine`, and a contiguous zero-based `decisionIndex` within the hand. A Hero action after another Hero action on the same street is a new decision. The board is the cumulative parsed board for the action's street and contains no future cards. The parser's seat positions and Hero hole cards are used directly.

`playersDealt` is the imported player count. `playersInHand` and `playersRemaining` include every non-folded player before Hero acts, including a player whose stack is already zero. The per-player record contains seat, position, remaining stack, live street commitment, and active/all-in state.

## Accounting and amount semantics

`HandLedger` owns chip and pot movement, gross contributions, returns, live street commitments, nominal preflop BB wager, and stack-capped call amount. `beginStreet(street)` resets street commitments before a pre-action read; the existing `apply(event)` also calls the same idempotent transition. The extractor takes a ledger snapshot before applying the Hero event. `potBeforeActionChips` includes all prior antes/blinds and voluntary contributions less prior valid returns, never the current action or later settlement. `contributionsByPlayerChips` records gross contributions up to that moment.

- `currentBetChips`: highest live street wager, floored by the declared BB preflop even when a posted BB is short.
- `facingAmountChips`: `max(0, currentBetChips - Hero live street commitment)`, before stack cap.
- `amountToCallChips`: `min(facingAmountChips, Hero stack before action)`; a short all-in call can therefore be smaller than the amount faced.
- `actualAction.amountAddedChips`: the canonical event's incremental chip movement. `raiseToChips` is separate and present only for a raise. `isAllIn` qualifies call, bet, or raise rather than replacing its kind.
- `amountAddedBb`: added chips divided by the hand's actual positive BB when chips move; otherwise null. `potFraction`: added chips divided by pre-action pot only for bet/raise with a positive pot; otherwise null.

The imported schema currently requires two Hero hole cards and a positive BB. Invalid input is excluded; nullable fields in the A1 type reserve honest unknowns if an upstream canonical version later allows them. Null is never converted into zero.

## A1 betting tracker

A1 tracks the last full raise increment, each actor's last acted wager and reopening threshold, the last aggressive action, folded actors, and the preflop voluntary action sequence. It never keeps a second pot, stack, contribution, or current-bet balance. Forced posts do not consume action rights. A full raise updates the increment; a short all-in raise leaves it unchanged. Cumulative short raises reopen action for a player who already acted only when their total faced increase reaches that player's last full increment. A check with no wager does not close the right to raise a later opening bet.

When Hero owes chips, legal betting actions are fold/call and, if rights, stack, and a contesting opponent permit, raise. When nothing is owed, check is available; bet is available on a street with no live wager, while the preflop BB option is check/raise. `minimumRaiseToChips` is the full-raise threshold and can exceed Hero's maximum when only a short all-in raise is possible. If a source under-raise or reopening sequence cannot be supported, `legalActions` is null with `UNSUPPORTED_RAISE_SEQUENCE`; it is never an empty list standing for unknown. A source action outside otherwise derived options is retained and marked `SOURCE_ACTION_CONFLICT`, not rewritten.

`facingAction` describes the current wager and last aggression, with `FACING_ALL_IN` taking precedence when the last aggressive wager was all-in. `potType` counts preflop voluntary raises observed before the decision: zero raises gives `UNOPENED` until a call, then `LIMPED`; one gives `SINGLE_RAISED`, two `THREE_BET`, and three or more `FOUR_BET_PLUS`. Postflop contexts retain the completed preflop pot type. `preflopSequence` contains ordered, source-backed voluntary actions only, up to but not including the current preflop Hero event; postflop it is complete.

For one contesting opponent, `effectiveStackBeforeChips` means additional Hero chips still contestable against that opponent: `min(Hero remaining stack, opponent remaining stack + max(0, opponent street commitment - Hero street commitment))`. This includes an unmatched wager already committed by an opponent who is now all-in. In multiway spots the scalar and its BB normalization are null with `MULTIWAY_EFFECTIVE_STACK_AMBIGUOUS`; the per-player contexts retain exact stacks and commitments. This is a decision-time contestable amount, not a starting-stack statistic.

## Recoverable and fatal outcomes

The parser's `ZERO_STACK_FOLD` warning identifies a ledger-supported forced-post anomaly. The fold is applied to player state, omitted as a Hero decision, and reported as a recoverable diagnostic with event and line evidence; other decisions from the hand remain. `SHORT_BLIND_POST` is reported without changing the declared BB. An unmarked zero-stack fold, invalid canonical shape/event order/actor, impossible ledger action, or failure to reconcile contributions and awards is fatal: the entire result is `excluded` with **no partial decisions**.

Structural validation also checks that observed Hero, board, shown, and summary cards cannot assign a physical card to different owners. After the single event pass, final player results and summary awards must reconcile with the ledger; this validation does not extract a second decision set. A warned zero-stack fold is absent from the voluntary preflop sequence. The current source action is size-checked before its context is emitted, so an unsupported non-all-in under-raise or under-minimum bet has unknown legal actions with a diagnostic. A short all-in opening bet below the BB is valid and retains the BB as the minimum full raise increment for later actions.

Each null critical field has a deterministic field/reason entry. `sourceConfidence` is `confirmed` when no warning or derived unknown remains, `partial` for documented warning or ambiguous effective stack, and `unknown` when legal actions cannot be established. These are source classifications, not probabilities or solver confidence.

## Replay and corpus validation

Replay is a QA oracle only. Curated tests and the corpus audit project canonical hands with `toReplayHand`, locate the source event cursor, and require exact equality for pre-action pot, Hero stack, visible board, and non-folded player-ID set. Documented source anomalies are reported separately. The 674-hand immutable GG corpus gate requires zero unexpected extraction failures, zero unexplained discrepancies, a reason for every unknown critical field, unchanged fixture SHA values, and decisions reported by street/action. The [audit](../qa/a1/decision-audit.md) and [real decision sample](../qa/a1/representative-decisions.json) provide evidence for manual poker review.
