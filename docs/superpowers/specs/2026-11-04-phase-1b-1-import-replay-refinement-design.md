# Phase 1B.1 - Import UX and replay visual refinement

Status: APPROVED, 2026-11-04, including the alias-first nameplate refinement.
Implementation has not started.

## Intent and boundaries

Make imported GG tournaments easier to inspect: distinguish missing metadata from
source anomalies, improve card readability, navigate to the beginning of reveals,
and give anonymized opponents stable display aliases. Preserve approved shell,
seat coordinates, table geometry, accounting, source identities and privacy.

This is a bounded refinement of the [Phase 1B design](2026-10-19-gg-replay-integration-design.md)
and [acceptance corrections](../../qa/phase-1b-corrections/README.md), not a new
parser or replay system. The [parser guide](../../specs/gg-parser.md) remains the
source of domain rules. All four real GG fixtures remain immutable.

No persistence, tournament library, storage API, AI, grading, solver, recommendations,
strategy engine, routing change or Phase 1C work. No new dependency is needed.
No commits, pushes or deployment are authorized.

## Approach and design calls

The user's constraints select reuse of the current parser/domain/adapter/engine
and shared React components. Extend presentation helpers and existing replay
navigation; leave poker truth in its current contracts. Independent per-widget
warning/deck/alias implementations and a replacement replay engine do not fit scope.

The user explicitly selected navigation **before** the first SHOW, without
consuming it. The approved implementation direction is:

- Classify diagnostics in presentation, without changing parser warning types.
- Consolidate the existing PlayingCard styling rather than add another deck.
- Build aliases from the complete imported roster, rather than independently hash
  each player into a small name pool. Roster assignment avoids collisions and long
  hash suffixes; its cross-export limitation is documented below.

The alias algorithm and card treatment below are approved. Table identity
presentation follows the alias-first refinement described below.

## Import status and neutral metadata

Add one pure presentation classifier used by the existing ImportDiagnostics in
both the upload summary and imported workspace. Preserve warning objects and
parser/import failure outcomes unchanged.

| Source diagnostic                   | Presentation | Main label                                              |
| ----------------------------------- | ------------ | ------------------------------------------------------- |
| unknown_timezone                    | Info         | Timezone not provided by GG                             |
| unresolved_currency                 | Info         | Currency could not be determined from the source symbol |
| missing_metadata, tournament format | Info         | Tournament format not specified                         |
| Other missing_metadata              | Info         | A readable field-specific metadata label                |
| SHORT_BLIND_POST                    | Warning      | Short blind post detected                               |
| ZERO_STACK_FOLD                     | Warning      | Zero-stack fold preserved from source                   |
| Other source_warning codes          | Warning      | Unusual source detail preserved                         |

Use an "Import status" section with expandable "Info (n)" and "Warnings (n)"
groups. Counts reflect original diagnostic entries; do not merge away individual
hand anomalies. Omit empty groups and show a neutral no-notices state on success.
Each entry offers expandable technical code, original message, hand ID, line and
available source detail. Keep source IDs unchanged there. Unknown source-warning
codes remain warnings; presentation must not silently downgrade anomalies.

Errors retain the existing import-failure alert and recovery behavior. An Info
or Warning is not a failed import and does not become an error alert.

Overview separates literal and normalized metadata:

- Buy-in (source): the recorded symbol and amount, or Unknown.
- Currency: the recorded ISO value, or Unknown; `$` never implies USD.
- First hand (source local time): the literal local timestamp.
- Timezone: the recorded value, or Not provided.
- Format: the recorded value, or Unknown.

Do not append alarming "currency unknown" prose to the source buy-in or infer
timezone, currency, tournament format or account identity.

## Shared playing-card treatment

Keep one PlayingCard component and its existing compact/hero/board contexts.
Hero and opponent cards on the table and cards in both navigator variants consume
that same system. No duplicated card markup or consumer-specific readability fix.

Consolidate overlapping face-style rules currently in global, poker-seat and
import CSS into shared card styling/tokens. Retain existing slot dimensions and
responsive seat anchors; location rules may size slots, not define competing
rank/suit/color systems. Keep development-only deck previews separate.

Use the approved ivory face, deep ink and burgundy palette with stronger rank
weight/contrast, a clearer suit glyph, defined border and restrained depth. Compact
cards must remain legible without enlarging the hand rows or table geometry.
Red/black distinction uses both color and suit shape. Rank and suit remain real
text with accessible card labels. Concealed cards expose neither rank nor suit.

Imported rows retain two actual Hero cards, ordinal, Hero position, player count
and subdued GG hand ID in the existing shared ImportedHandNavigator. No analysis
badges are introduced.

## Showdown cursor and active navigation

Extend the existing flattened-action navigation with a pure showdown-target helper.
Do not add SHOWDOWN to the domain's betting-street enum or rewrite replay state.
Cursor k continues to mean actions [0, k) have been consumed.

For the current hand:

1. If SHOW exists, return the index immediately before its first occurrence.
2. Otherwise, if SHOWDOWN exists, return its index, without consuming it.
3. Otherwise return unavailable; do not infer a boundary from WIN or summary cards.

The latest user decision applies even to early all-in reveals. For example,
TM6468725291 has preflop SHOW, SHOW, board runout, SHOWDOWN, collection: navigation
targets cursor 22 before BTN's SHOW, not the later marker after the runout.
TM6377255556 instead has three river reveals before its marker and collections.
Summary-only Ah in TM6378370688 does not create a timed SHOW.

Forward consumes one event at a time. Hide Result continues to conceal consumed
opponent cards and constrain navigation to its existing pre-collection limit;
turning privacy off does not expose an unconsumed SHOW. A target beyond the allowed
cursor is disabled. Never skip a collection to reach a reveal or manufacture a
boundary. If an unsupported event ordering lacks a target before collection,
keep Showdown unavailable rather than changing source order.

Add Showdown to the shared street-control navigation. Enable it only when a valid
target is reachable; legacy mock hands without explicit SHOW/SHOWDOWN keep it
disabled. Existing Preflop/Flop/Turn/River targets remain unchanged.

Derive the selected navigation label from cursor/events, not a sticky click state.
Showdown is selected at the reveal boundary and through its reveal segment. If an
early reveal is followed by a dealt flop/turn/river, that dealt street becomes
selected; the later explicit showdown boundary selects Showdown again. Stepping
back before reveals restores the appropriate betting-street label. The domain's
currentStreet and chip transfers remain unchanged.

## Tournament-local opponent aliases

Create one pure UI alias-map builder from all players in the imported tournament.
Deduplicate by the existing tournament-scoped player ID, exclude Hero, sort IDs by
deterministic code-unit order, then assign the fixed pool:

Alex, Ben, Chris, Daniel, Ethan, Felix, George, Henry, Ivan, Jack, Kevin, Leo, Max,
Nick, Oscar, Paul.

After the first pool, continue predictably as Alex 2, Ben 2, and so on. Every
observed opponent gets a unique alias. Compute the map from the complete roster
once per tournament value, never from the selected hand, cursor or encountered
player order. Do not use randomness, locale-dependent sorting or storage.

Pass the map through the imported replay presentation. PokerTable nameplates show
the alias as the primary visible identity; the full GG source ID need not be
visibly rendered there. Preserve the exact source ID internally and make it
available through appropriate title/tooltip, accessibility or detail surfaces.
Accessible names identify an "anonymized opponent". A concise workspace explanation
makes clear that aliases are display labels, not real names. In roomier hand details,
action history, diagnostics or expanded information, alias and muted source ID may
both be shown. Diagnostics retain their original source values.

Use the same mapping wherever imported player names appear, including action
history/ribbon labels and completed results; retain positions alongside aliases
where useful. Existing position-only labels need not invent a player identity.
Hero remains Hero. Demo identities remain unchanged. Parser data, event actors,
source locations, diagnostics, logs and internal mappings keep their original IDs.

Repeated imports with the same roster produce the same aliases, independently of
hand order and selection. Different partial exports with different observed
rosters can assign different aliases; continuity across those exports or across
tournaments is not promised by this memory-only increment. Truncated visual
aliases retain full accessible/title text; exact source IDs remain accessible
without being required on every visible table nameplate.

## Scope and verification plan

Expected changes: existing diagnostics/upload/workspace views; a small UI
classification helper and alias helper; PlayingCard/shared card CSS; nameplate and
name-formatting consumers; existing replay navigation helper and ReplayControls;
focused tests, Phase 1 status and new QA evidence. Refine current helpers rather
than introduce generic frameworks. Parser grammar, fixtures, ledger, adapter,
seat-layout coordinates and mock analytics remain unchanged.

Use TDD for classification, aliases, navigation and rendering changes. Cover
failure alerts, neutral metadata without mutation, alias repeatability/order
independence/overflow/Hero, exact source identity, compact/table/board cards and
concealment. Use the real hands above for SHOW timing, first-step inspection,
marker-only fallback, privacy, runouts and collection protection. Add a narrowly
constructed no-boundary Hand to test disabled navigation without inventing GG syntax.

Retain all four fixtures' parser/accounting/determinism/integration coverage and
verify hashes. Browser acceptance imports all four files at least once, exercises
a representative fixture at 1440/1024/768/430/390, and adds only combinations needed
for early/river reveals, marker-only navigation or anomaly presentation. Check
card/alias/action/stack bounds, shared row metadata, grouped notices, keyboard
navigation, privacy and absence of fabricated analytics.

Authorized card and navigation changes will alter pixels in existing demo
screenshots. Preserve the old approved images and unrelated hashes. Scope visual
assertion updates to the requested card/control changes, retain table geometry
and unaffected-region checks, and create new Phase 1B.1 evidence for manual review;
do not blindly regenerate old full-page baselines or disable verification.

Run lint, typecheck, the complete unit/integration suite with bounded workers,
applicable Playwright tests, build, scoped formatting and whitespace checks. Record
existing repository-wide formatting exceptions separately. Obtain an independent
final code review, reproduce/fix substantive findings, and verify before reporting.

Phase 0 and Phase 1A remain COMPLETE. Phase 1 remains IN PROGRESS, Phase 1B is
IN REVIEW/refinement, and Phase 1B.1 reaches READY FOR REVIEW only after acceptance
evidence. Written implementation planning follows approval of this document.
