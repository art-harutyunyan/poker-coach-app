# Phase 1A — GG Poker Hand-History Parser Design

Status: approved on 2026-10-18, followed by written-spec and implementation-plan
approval. Phase 1A is READY FOR REVIEW after implementation, verification, and an independent
review fix pass. Repository formatting has unrelated concurrent-file failures
documented in `docs/specs/gg-parser.md`.

## Intent and boundaries

Implement a deterministic TypeScript parser for the three real GG tournament
hand-history exports in `tests/fixtures/gg/`. Produce validated poker records for
future replay, calculations, analysis, and statistics. Preserve facts and source
locations without inferring strategy or missing metadata.

Phase 0 is approved and complete. Phase 1 remains in progress. Phase 1A stops at
READY FOR REVIEW after verification; it does not complete Phase 1.

Scope is text ingestion, hand splitting, GG syntax parsing, normalization,
validation, fixture tests, and a small explicit replay adapter. Do not change UI,
routing, mock data semantics, `src/domain/replay.ts`, training, strategy, analysis,
upload presentation, persistence, or AI services. Add no dependencies or external
calls. Runtime AI cost is $0.

## Inspection evidence

All lines in all three files were inventoried, with representative complete hands
inspected for the observed variants. Independent exploratory arithmetic checked
contributions, returns, declared pots, awards, and stack conservation across every
hand. This audit is reconnaissance, not a substitute for parser tests.

| Fixture                               | Tournament ID | Hands | Occupied seats | Tables           | Returns | Multi-award hands |
| ------------------------------------- | ------------- | ----: | -------------- | ---------------- | ------: | ----------------: |
| Daily Monster Stack $2.50             | 314729652     |   222 | 5, 7, 8        | 21, 33, 112, 161 |     174 |                 3 |
| Fifty Stack $5.50                     | 314806258     |   191 | 4, 6, 7, 8     | 15, 39, 52, 65   |     133 |                 9 |
| GGMasters $150, $1M GTD [2-Day Event] | 317697722     |    28 | 7, 8           | 99               |      23 |                 1 |

All 441 hands declare 8-max NLHE tables and are exported newest first. Seat gaps
occur. Buttons are occupied, and posted blinds match the next occupied seats after
the button. Every declared pot equals contributions minus returns and the sum of
awards. Every listed rake/jackpot/bingo/fortune/tax amount is zero.

Observed variants to preserve:

- Names with multiple monetary tokens, punctuation, and `[2-Day Event]`.
- Comma-grouped and ungrouped integer chips.
- Empty opponent `Dealt to NAME` lines; only Hero is dealt visible hole cards.
- Raises with explicit raise-by and raise-to amounts, including prior blinds or
  raises by the same actor.
- Calls/bets/raises suffixed `and is all-in`, including short all-in calls.
- Returns on preflop and later streets, including returns to an all-in player.
- TM6471061841 posts a 4,243-chip SB at a 5,000 level after a 1,250 ante
  exhausts the 5,493 starting stack; GG then explicitly records a fold. Preserve
  the short post and fold with structured ambiguity warnings. The initial
  inventory missed this amount variant; full-file normalization exposed it.
- Shows before runout or after river, with or without a literal hand description.
- Four one-card reveals, including reveals by players who already folded.
- Multiple unlabeled collection lines, sometimes for the same winner.
- A split 1,257-chip pot awarded 628 to Hero and 629 to another player.
- Summary folds before flop/on later streets; optional button/blind labels;
  `collected`, `won`, `showed ... and won ... with ...`,
  `showed ... and lost with ...`, and `showed ... and collected` results.
- `SHOWDOWN` markers even for uncontested preflop wins. A marker alone does not
  establish that a contested showdown occurred.

## Architecture and public boundary

The pure public function is conceptually:

```ts
parseGgTournament(text: string, options?: { sourceName?: string }): ParseResult
```

Input is already decoded text, accepting UTF-8 BOM, LF, and CRLF. A file name is
diagnostic information only; poker metadata comes from file contents. No browser,
filesystem, persistence, network, or AI dependency belongs in the production API.

Pipeline:

1. Split text once into source-numbered hand blocks, preserving absolute line
   numbers, source hand ordinal, and original hand text. Reject non-whitespace
   preamble and empty/unknown input deliberately.
2. Tokenize headers, tables, seats, section markers, deals, actions, returns,
   collections, boards, and summaries with small anchored recognizers. Unknown
   substantive lines are errors rather than skipped text.
3. Assemble raw hands with a section state machine. Do not calculate poker facts
   in regular expressions. Require observed structural sections and reject
   truncation or illegal section progression.
4. Normalize cards, positions, amounts, cumulative street boards, and typed events.
   Use an exact chip ledger to derive contributions, pots, final stacks, and net
   results; reconcile independent summary facts.
5. Validate runtime schemas and poker consistency, then aggregate tournament
   metadata and chronological hands only after all hands validate.

GG syntax belongs under `src/parsers/gg/`; reusable normalized contracts,
positions, and validation belong under `src/domain/`. Keep the replay adapter
separate from syntax and the existing engine. Each file owns one responsibility.

## Domain contracts and reuse

Reuse `cardSchema`, `playerSchema`, `positionSchema`, and `blindLevelSchema` from
`src/domain/schemas.ts`. Derive import contracts from existing schema fields where
compatible. Keep mock/UI contracts backward compatible.

The current `Tournament` requires finish, metrics, evaluation, and improvement
copy absent from exports. Omit those requirements in the import contract instead
of fabricating values. The current `Hand` has incremental boards and a narrower
action vocabulary; retain richer normalized facts and expose a replay projection.

Tournament fields: source ID, room, exact source title, exact buy-in amount,
currency symbol, nullable ISO currency, nullable format classification, literal
format annotations where present, NLHE game, distinct tables, observed blind
levels, earliest/latest local timestamps, and imported hand count. Do not claim
the export contains every hand of the player's tournament.
Unavailable metadata, including buy-in, is nullable and produces a structured
warning rather than a fabricated value.

Hand fields: source ID, tournament ID, chronological ordinal, source ordinal/line
range/raw text, local timestamp, table ID/name/capacity, occupied count, button,
Hero ID/cards, players/starting stacks, blind/ante level and amounts, cumulative
boards, ordered events, summary pot/deductions, reveals/results, final stacks,
and net chips.

Preserve raw hand/tournament IDs. Scope player IDs to tournament/source identity;
do not assume anonymized names identify accounts across exports. Sort oldest
first by validated timestamp with stable source-order ties; preserve source
ordinals separately. No random IDs, machine-time dependencies, or input mutation.

## Exact amounts and actions

Use safe integer numbers for chips. Validate lexical syntax and range; reject
fractions, negatives, unsafe values, and unsafe sums. Parse buy-ins into integer
minor units plus scale, without floating-point money arithmetic. Derived BB values
must not replace original chips.

- `ANTE`, `SMALL_BLIND`, `BIG_BLIND`: exact incremental posts.
- `FOLD`, `CHECK`: zero chip movement.
- `CALL`, `BET`: exact incremental contributions.
- `RAISE`: explicit source raise-by, source raise-to, and derived contribution.
  Contribution equals raise-to minus the actor's existing live street commitment;
  raise-by equals raise-to minus the preceding live maximum. Antes are excluded
  from live street commitments.
- `RETURN_UNCALLED`: pot-to-player return, separate from winnings.
- `COLLECT_POT`: award, preserving each unlabeled collection separately.
- `SHOW` and `SHOWDOWN` boundary: nonfinancial events with source ordering.
  Reveals can precede runout or follow a fold. Allow one or two revealed cards;
  retain literal descriptions without evaluating hand strength.

Calls/bets/raises retain their underlying kind plus `isAllIn`; never replace them
with an ambiguous standalone all-in amount. The flag describes the event even if
an uncalled portion is later returned. Each event has a deterministic ID/sequence,
source street, actor where applicable, relevant chip/card fields, absolute line
number, and raw line. Do not move early reveals past board runout.

## Positions and boards

Derive clockwise occupied-seat order from seats and button, validating capacity
separately from occupied count. Never use player-name order or Hero's UI location.
Use existing enum spellings UTG_PLUS_1 and UTG_PLUS_2.

| Occupied players | Clockwise positions starting after BB      |
| ---------------: | ------------------------------------------ |
|                4 | CO, BTN, SB, BB                            |
|                5 | HJ, CO, BTN, SB, BB                        |
|                6 | UTG, HJ, CO, BTN, SB, BB                   |
|                7 | UTG, LJ, HJ, CO, BTN, SB, BB               |
|                8 | UTG, UTG+1, LJ, HJ, CO, BTN, SB, BB        |
|                9 | UTG, UTG+1, UTG+2, LJ, HJ, CO, BTN, SB, BB |

Fixtures cover 4–8 occupied players at 8-max capacity. Independent helper tests
cover full 6/8/9-max, wraparound, gaps, and shuffled input. Heads-up/three-handed GG
parsing is not evidenced; do not claim support without a tested blind/position
policy and real format evidence.

Store flop as three cards, turn as four, river as five. Validate repeated prefixes
on turn/river lines and reconcile summary boards. Repeated references by the same
owner are not duplicate deals; duplicate cards within one list or shared by
different owners are invalid. Later Hero reveals must agree with the deal.
Opponent cards remain unknown until revealed. Do not infer hidden cards/winners.
Cards disclosed only in a summary are retained as summary evidence with unknown
reveal timing; do not invent an earlier SHOW action for them.

## Validation and explicit outcomes

Return a discriminated union. Success contains the complete validated tournament
and structured warnings. Failure contains structured errors and preceding
warnings, without a misleading partial-success tournament.

Errors have stable type/message, hand ID/source ordinal when known, absolute
line/context/raw line, and optional source name. Types: unsupported_format,
malformed_hand, unsupported_game, incomplete_hand, invalid_action, invalid_card,
inconsistent_seats. Internal exceptions must not escape as random strings.

Reject duplicate IDs, mixed tournament/conflicting metadata, duplicate seats/names,
out-of-capacity seats, absent/unoccupied button, unknown actors, missing/ambiguous
Hero, negative/unsafe stacks, invalid cards/boards/prefixes, physical duplicates,
malformed/unrecognized actions, invalid amounts, contributions beyond stacks,
invalid returns, awards exceeding pots, summary disagreement, and unsupported
variants. Do not infer missing actions or silently skip serious corruption.

Validation is not a strategy/rules engine: no grading, hand evaluation, side-pot
eligibility solving, or ICM. Explicit contributions, returns, totals, and awards
are sufficient to reconcile recorded financial truth.

## Metadata ambiguity and unsupported cases

Exports provide `$`, not an ISO currency code, and local timestamps without a
timezone. Preserve both source facts, leaving ISO currency and timezone null with
structured warnings. Do not invent USD/UTC or use the machine's timezone. Validate
calendar components without Date normalization accepting impossible dates.

No standalone format classification, entry-fee split, payout/finish summary,
main/side-pot labels, muck lines, nonzero deductions, other variants, run-it-twice,
dead buttons, or short ante posts appear. A short SB without an all-in suffix
is observed in TM6471061841. Its subsequent zero-stack fold is unresolved source
behavior: warn with line context, retain the zero-movement event, and add a TODO
for GG clarification. Do not infer sit-out status or all-in eligibility. Preserve title annotations and
award order without inventing classifications or pot labels. Document specific
TODOs for unobserved grammar/policies; reject unfamiliar substantive syntax clearly
until supported by a fixture. Distinguish format limits from malformed input and
recoverable missing metadata. The action model can reserve muck support, but do
not claim an unobserved GG muck grammar is implemented.

## Replay compatibility

Leave `src/domain/replay.ts` and current UI unchanged. Add an adapter from validated
normalized hands to existing `Hand`, including source-event mappings and explicit
compatibility diagnostics. Map ordinary financial events to incremental
`amountChips`; cumulative boards to incremental cards; awards to `WIN` on the last
dealt betting street. Retain empty runout streets for final-board visibility.

The legacy engine's only pot-to-player transfer is `WIN`. The adapter may use that
mechanism for returns with an explicit return note, source-event mapping, and
compatibility diagnostic. This is only a replay projection: canonical events stay
`RETURN_UNCALLED` and returns never enter winnings statistics. Reveals/showdown
boundaries remain in canonical data when the legacy contract cannot show them.

Document legacy presentation limits: refunds can appear as `WIN`, and sticky
all-in/commitment display can differ after refunds. Do not hide those limits or
modify the engine to fix them in Phase 1A. Verify projected pot/stacks and chip
conservation against the normalized ledger at every projected cursor, and final
board/pot/stacks for all fixtures. Future UI integration must address diagnostics.

## TDD and acceptance evidence

For each increment: write focused tests, observe intended RED, implement minimum
behavior, observe GREEN, then refactor. Use existing Vitest discovery under
`src/**/*.test.ts`; keep real fixtures unchanged in `tests/fixtures/gg/`.

Coverage: splitting/line numbers/BOM/newlines/truncation; metadata/exact money;
seats/buttons/positions; blinds/antes; Hero/partial reveals; streets/boards;
fold/check/call/bet/raise/all-in/returns/awards; summary variants; safe-integer
ledger; malformed input and each validation category; determinism; replay adapter.

Parse all three full fixtures. Assert exact counts and meaningful facts from
multiple hands per export, without giant snapshots. Golden facts include:

- TM6469820465: Hero seat 8, button 5, 7c7h, 8,000/16,000/2,000; raise-by 232,050
  to 316,050 after an earlier 32,000 contribution; pot 672,100; Ad6d6h3s5h board;
  Hero final stack zero.
- TM6469819712: folded player's one-card Ts reveal; Hero's 171,130-chip return.
- TM6468777751: short 3,852-chip call; 8,000 returned; Hero awards 16,356 and 2,296.
- TM6471062694: Hero QcAh, BB seat 4; all-in call 160,225; opponent return 129,067;
  pot 420,450; Hero final stack zero.
- TM6470172527: seven occupied seats; Hero SB seat 2; raise-by 240 to 440 contributes
  340, return 240, collection 575, no board.
- TM6470156513: `showed ... and collected` summary.
- TM6524471450: Hero AdAh; 91-to-161 open, Hero 495-to-656 raise from BB; turn
  all-ins; return 417; pot 20,203.
- TM6524470976: 1,257-chip pot split 628 to Hero and 629 to b140c1d5.
- Earliest hands TM6469019406/TM6522429068: chronological ordering, seat gaps,
  early blinds, and turn/flop-only boards after folds.

Run configured lint, typecheck, unit tests, build, and formatting checks. Baseline
on 2026-10-18: lint/typecheck/build pass and 91 unit tests pass; `npm run format`
fails on `design-references/the-study-warm-dark-final.html`, which must remain
unchanged. Keep existing unrelated visual work intact. If an ignore policy is
needed, constrain it to the immutable reference instead of weakening checks for
product/parser code.

Update `Roadmap/README.md` and phase documents: Phase 0 COMPLETE, Phase 1 IN
PROGRESS, and Phase 1A READY FOR REVIEW only after acceptance and verification.
Record formatting evidence and adapter limits honestly. Do not mark Phase 1
complete or start Phase 1B.
