# Phase 0 - Product, Architecture & UX Foundation

## Status

READY FOR REVIEW

## Goal

Establish the documented product, architecture, data contracts, design foundation,
and high-fidelity mocked user experience required before real parser, poker engine,
strategy, or AI work begins.

## Scope

- Roadmap and ADR structure.
- React/TypeScript application skeleton.
- Core poker-domain schemas and replay-state contract.
- No-cost AI/provider boundary design.
- Mocked tournament overview, hand replayer, analysis panel, review queue, and
  development chart.
- Design-system research and custom dark-first visual direction.

## Out of Scope

- Real GGPoker parser.
- Real upload/import processing.
- Full poker math engine.
- Production strategy database or solver integration.
- Real LLM/API calls or Ask Coach implementation.
- ICM, opponent modeling, training generation, auth, billing, production hardening.

## Dependencies

Master product and technical requirements document. No previous project phase.

## Task Checklist

### Approved Replayer Shell Refinement

Status: READY FOR REVIEW (implementation validated; human approval pending).

- [x] Capture the supplied live Settings and Tournament/Replayer reference at desktop and mobile sizes.
- [x] Preserve the approved PlayerSeat, seat anchors, table/card geometry, theme contracts and replay engine.
- [x] Apply the reference sidebar, header, visible section tabs, study rail, controls and analysis surface.
- [x] Retain one real mock hand in the rail; do not fabricate additional playable hands or analysis.
- [x] Add sequential street navigation through existing action cursors and a collapsible detailed history.
- [x] Keep strategy provenance explicit, with Coach/import/account services unconnected.
- [x] Validate desktop/tablet/mobile shell and existing 6/8/9-max geometry; capture QA screenshots.
- [x] Run lint, typecheck, 89 unit tests, 40 browser tests and production build.

Validated at 1600, 1440, 1280, 1024, 768, 430, 390 and 375px. Added nine shell
browser checks and retained all 31 table/replay checks. The history disclosure's
intrinsic-width overflow was corrected without editing table/seat geometry.
Production smoke checks at 1440/390 verified native cards, street navigation,
local font loading and no page overflow. Browser coverage is Chrome only.

Implementation notes: `docs/design/replayer-shell.md`.
Screenshot index: `docs/qa/replayer-shell/README.md`.
Visual comparisons: `docs/qa/replayer-shell/comparison-{1440,390}.png` and
`comparison-analysis.png`. Dashboard and other feature-page bodies were not redesigned.

Overall Phase 0 remains READY FOR REVIEW. No Phase 1 implementation is authorized.

### Phase 0 Product / UX Remediation

- [x] Load explicit web fonts and define display/UI/numeric typography roles.
- [x] Replace the teal-heavy palette with richer graphite, felt, champagne, and
      semantic decision tokens.
- [x] Redesign dashboard hierarchy around tournament result, score, current leak,
      metrics, category performance, and review queue.
- [x] Replace decorative overall-score circle with an analytical score treatment.
- [x] Rework poker table so Hero is anchored bottom-center and seats are relative
      to Hero.
- [x] Render playing cards with real suit symbols and poker-card presentation.
- [x] Add spatial bet/chip markers between seats and pot.
- [x] Add visible dealer button and clearer BTN/SB/BB orientation.
- [x] Redesign player seats to emphasize position, name, BB stack, and state.
- [x] Strengthen current actor/action feedback and current decision context.
- [x] Present pot primarily in BB with chip count secondary.
- [x] Add compact street/action timeline linked to replay cursor and Hide Result.
- [x] Polish replay controls without overpowering the table.
- [x] Polish analysis panel while preserving mock/provenance clarity.
- [x] Validate responsive behavior and keyboard/focus basics after remediation.

### Phase 0 Final Visual Polish

- [x] Refine typography weights so page titles, tournament titles, metrics,
      labels, metadata, seats, and chart labels feel premium and restrained.
- [x] Remove remaining 700+ font weights from the application stylesheet.
- [x] Reduce card and border density while preserving current layout and
      information architecture.
- [x] Refine champagne/gold usage so it is reserved for score, active states,
      premium emphasis, and important poker actions.
- [x] Add a clearer surface hierarchy for app background, primary panels, and
      selected/interactive elements.
- [x] Polish table depth with restrained felt texture, cleaner rail/felt
      separation, and subtle internal shadows.
- [x] Refine playing-card proportions, suit rendering, rank placement, red suit
      tone, hidden-card styling, border, and depth.
- [x] Refine bet/chip markers into a consistent stacked-chip committed-bet
      language.
- [x] Make player seats quieter and less boxy while preserving position/name/BB
      stack/chip/action hierarchy.
- [x] Refine current actor treatment with restrained emphasis and transition
      timing.
- [x] Simplify the action timeline so completed actions read inline and only the
      current action receives a stronger pill treatment.
- [x] Simplify the analysis panel into one coherent surface with internal
      separators while preserving all required information.
- [x] Improve dashboard/sidebar readability, active states, hover states, and
      chart styling.
- [x] Formalize typography, color, spacing, radius, elevation, poker-specific,
      and chart tokens in `docs/specs/design-tokens.md`.

### Phase 0 Replayer Layout & Dashboard Hierarchy Fix

- [x] Rebuild Hand Replayer positioning around explicit logical seat anchors
      instead of screenshot-tuned percentage placement.
- [x] Define separate player-seat, committed-bet, dealer-button, and action-label
      anchors for each relative table position.
- [x] Preserve Hero bottom-center while rotating villain positions relative to
      Hero for 6/7/8/9-handed layouts.
- [x] Replace the broken split-rail table shape with one stable oval table rail.
- [x] Reduce the center pot/board footprint so the table communicates action flow
      instead of empty space.
- [x] Place committed street bets inside the table near the corresponding player
      and clear them naturally at street transitions.
- [x] Document and apply a single replay cursor semantic rule: the visible table
      shows state after actions `[0, cursor)`; `nextAction` is the action about
      to happen.
- [x] Update table, action summary, timeline, current actor highlight, and
      analysis cursor hint so they no longer describe the next action as already
      completed.
- [x] Compress the Dashboard tournament summary into a compact analytical header
      with grade, metadata, primary development target, and actions visible
      without a marketing-hero treatment.
- [x] Add replay-state regression coverage for key preflop, flop, and turn cursor
      states.

### Visual Asset Evaluation

- [x] Create development-only `/design/card-lab` route for visual review.
- [x] Keep production Hand Replayer poker components unchanged while evaluating
      candidate assets.
- [x] Evaluate The Public Domain Deck / OpenDecks-style CC0 SVG assets.
- [x] Evaluate Block52 poker-focused SVG card, chip, back, and dealer assets.
- [x] Evaluate `@letele/playing-cards` as a React/SVG component deck candidate.
- [x] Render the same representative cards across candidates: A-spade, A-heart,
      K-diamond, Q-club, J-spade, 10-heart, 7-club, and 2-diamond.
- [x] Include card back, Hero hand, flop, full board, hero-card size, board-card
      size, and compact/training-card size examples.
- [x] Add chip/dealer comparison using Block52 SVG assets and programmable Poker
      Coach BB-first chip markers.
- [x] Add three programmable table-skin experiments without using static poker
      table images.
- [x] Document licensing, commercial use, attribution, modification rights,
      recommendation, caveats, and integration effort in
      `docs/design/card-asset-evaluation.md`.

### Visual Theme Integration Preview

- [x] Add a compact development-only Visual Preview control to the real
      Tournament Review -> Replayer page.
- [x] Add reusable card-theme, table-theme, and chip-theme contracts in the UI
      design layer.
- [x] Integrate Block52 and `@letele/playing-cards` card renderers into the real
      replayer visual layer for live preview after asset acceptance review.
- [x] Normalize themed cards inside the existing Hero-card and community-card
      footprints so switching decks does not move seats or board placement.
- [x] Integrate Deep Emerald, Graphite Emerald, and Subtle Felt Texture table
      skins without changing seat geometry, bet anchors, pot placement, or replay
      logic.
- [x] Integrate Poker Coach programmable and Block52 chip/dealer preview styles
      while preserving programmatic BB labels.
- [x] Persist preview selection in `localStorage` under
      `poker-coach.visual-preview`.
- [x] Add smoke coverage that switching card/table/chip preview selections does
      not reset the replay cursor state.
- [x] Keep `/design/card-lab` and the live visual preview development-only and
      avoid turning this into a permanent product settings feature.

### Multi-Seat Replayer Geometry

- [x] Increase Hero hole-card footprint by roughly 20-30% while preserving the
      selected card theme footprint.
- [x] Increase community-card/board footprint by roughly 15-25% while keeping all
      five board slots centered.
- [x] Rework the programmable table rail into a substantially wider oval with a
      clearer horizontal axis.
- [x] Add development-only table-size preview control for 6-max and 8-max.
- [x] Add a table-size-aware preview contract without changing production poker
      domain schemas.
- [x] Add an 8-max mock preview hand with two extra mock players and inserted
      ante/fold actions so cursor, pot, stack, and timeline state stay coherent.
- [x] Preserve Hero-at-bottom rendering by rotating seat geometry relative to
      Hero seat number.
- [x] Define explicit 6-max and 8-max anchor sets with independent seat, bet,
      dealer, and action-label anchors.
- [x] Keep existing 7/9 geometry structure in place for straightforward later
      expansion.
- [x] Add smoke coverage that switching to 8-max keeps the current replay action
      context instead of resetting the replayer.

### Nameplate & 8-Max Seat Refinement

- [x] Reduce normal opponent nameplate width, height, padding, and visual weight
      so villain seats no longer compete with board, Hero cards, pot, or felt.
- [x] Preserve Hero as the larger/prominent seat because it carries visible hole
      cards and Hero context.
- [x] Move last-action text out of the nameplate and onto the existing
      action-label anchor so opponent plates stay compact.
- [x] Replace villain folded chip-count text with compact muted `folded` state.
- [x] Strengthen folded-seat quieting with lower opacity and saturation.
- [x] Keep current-actor emphasis restrained through brighter surface, border,
      text, and slight elevation.
- [x] Rebalance only the 8-max seat anchors so seats follow the table ellipse
      more naturally.
- [x] Update matching 8-max bet, dealer-button, and action-label anchors for BTN,
      BB, HJ/LJ, and top-center positions.
- [x] Leave approved table shape, table ratio, Hero card size, community-card
      size, board layout, pot layout, card themes, chip themes, and Dashboard
      unchanged.

### Card Theme Normalization & Acceptance

- [x] Add per-theme card calibration tokens for Hero, board, and compact
      contexts.
- [x] Apply calibration as inner artwork scaling while preserving stable outer
      card footprints.
- [x] Calibrate Block52 cards for the real Hand Replayer with light inner art
      scaling.
- [x] Calibrate `@letele/playing-cards` cards for the real Hand Replayer with
      stronger inner art scaling.
- [x] Keep Public Domain / OpenDecks available in `/design/card-lab` for asset
      evaluation only.
- [x] Remove Public Domain / OpenDecks from the real Hand Replayer card-theme
      selector because it remains visually weaker in the table context.
- [x] Migrate stale saved Public Domain preview selections back to the default
      Block52 replayer theme.
- [x] Add UI coverage that the lab still evaluates Public Domain while the real
      replayer selector exposes only accepted card themes.
- [x] Preserve table geometry, table shape, card outer sizes, board/pot layout,
      Dashboard, and replay semantics.

### 8-Max Nameplate Perimeter Alignment

- [x] Move 8-max opponent nameplate anchors outward toward the oval perimeter.
- [x] Keep Hero bottom-center and close to the bottom table edge.
- [x] Preserve true 8-max clockwise position order from Hero/SB perspective:
      BTN, SB/Hero, BB, UTG, UTG+1, LJ, HJ, CO.
- [x] Align top-center, upper-left, upper-right, left-middle, right-middle,
      lower-left, and lower-right 8-max seats to the same perimeter ring.
- [x] Keep committed-bet anchors inside the felt between each player and the pot.
- [x] Update matching 8-max dealer-button and action-label anchors so they remain
      associated with the same seat.
- [x] Leave table shape, table aspect ratio, table skin, card sizes, card-theme
      normalization, card selector, chip theme, pot/board position, Dashboard,
      analysis panel, and replay semantics unchanged.

### PlayerSeat Cluster Refactor

- [x] Refactor player-related table visuals into a cohesive `PlayerSeat` cluster
      owned by each player.
- [x] Move position, player name, BB stack, chip count/folded state, Hero cards,
      opponent card backs, current/recent action, committed chips, and dealer
      button under the seat cluster.
- [x] Keep `PokerTable` responsible for one table-relative seat anchor per player
      instead of independently placing every visual fragment.
- [x] Derive committed-chip, action-label, and dealer-button offsets locally from
      the seat's vector toward the pot.
- [x] Show two face-down cards for active opponents who have not folded.
- [x] Hide opponent card backs when that player folds and rely on muted folded
      seat state as the primary fold cue.
- [x] Use one seat-local committed-chip zone for antes, blinds, calls, bets,
      raises, and all-in actions.
- [x] Move current/recent action labels close to the owning seat instead of
      floating independently on the felt.
- [x] Define `PlayerSeatState` values for active, current, folded, and all-in.
- [x] Keep Hero bottom-center, face-up, and more prominent without changing Hero
      card size.
- [x] Keep table shape, aspect ratio, skin system, board/pot position, card sizes,
      card themes, Dashboard, analysis panel, and replay cursor semantics
      unchanged.

### Orientation-Aware PlayerSeat Geometry

- [x] Add a local `PlayerSeatGeometry` model with inward, outward, and tangent
      vectors derived from each seat anchor's radial relationship to the pot.
- [x] Derive card, committed-chip, action-label, and dealer-button offsets from
      the local seat geometry instead of stacking children in one fixed order.
- [x] Place opponent face-down cards on the table-facing side of the nameplate:
      below top seats, above bottom seats, inward/right of left seats, inward/left
      of right seats, and diagonally inward for corner seats.
- [x] Place committed chips farther inward than the card backs so the visual order
      reads nameplate -> cards -> chips/action -> pot.
- [x] Keep action labels close to the seat's local card/chip lane and preserve the
      existing short lifecycle for current/recent actions only.
- [x] Position dealer button using outward/tangent vectors so it belongs to BTN
      without joining the inward card/chip lane.
- [x] Preserve folded behavior: opponent card backs hide on fold, folded seats
      stay muted, and persistent chips only remain when relevant to the visible
      replay state.
- [x] Preserve 6-max and 8-max poker order, Hero bottom-center, table shape,
      aspect ratio, board/pot layout, card sizes, themes, Dashboard, analysis
      panel, and replay semantics.

### PlayerSeat Cohesion Correction

- [x] Correct the over-separated radial visual model so each player reads as one
      compact poker seat attached to the table rail.
- [x] Keep position, player name, BB stack, chip count/folded state, opponent
      card backs, and current/recent action physically close within the
      `PlayerSeat` cluster.
- [x] Move action text back into the compact seat unit instead of positioning it
      independently on the felt.
- [x] Keep opponent card backs attached to the table-facing side of the nameplate,
      using orientation only to choose above/below/left/right/diagonal attachment.
- [x] Reduce local card/action separation so card backs belong to the player seat,
      not to the table center geometry.
- [x] Keep committed chips as the only element with a clear inward offset toward
      the pot.
- [x] Shorten committed-chip offsets so ante/blind/bet markers sit closer to the
      posting player and do not form a ring around the board.
- [x] Preserve fold behavior: folded opponents hide card backs, mute the full
      cluster, and use compact folded text.
- [x] Preserve dealer-button ownership within the BTN seat cluster.
- [x] Preserve table shape, aspect ratio, board/pot placement, card sizes,
      card-theme normalization, visual theme system, Dashboard, analysis panel,
      replay semantics, and Phase 1 boundary.

### Foundation

- [x] Read master Product & Technical Requirements.
- [x] Create `Roadmap/` structure and roadmap files Phase 0-7.
- [x] Create project/repository application skeleton.
- [x] Document frontend/backend/domain architecture.
- [x] Create ADR structure/template.

### Domain / contracts

- [x] Define normalized tournament/hand/street/action schemas.
- [x] Define replay state/action cursor contract.
- [x] Define decision/strategy-reference schemas.
- [x] Define `HandAnalysis` schema.
- [x] Define `TournamentEvaluation` schema.
- [x] Define `DevelopmentMetric` schema.
- [x] Define `AIUsage` schema.
- [x] Add runtime validation strategy.

### Poker analysis specification

- [x] Document grading rules.
- [x] Document severity/impact rules.
- [x] Document confidence rules.
- [x] Document result-independence rule.
- [x] Document strategy provenance rules.

### AI / cost architecture

- [x] Document strict deterministic-vs-AI boundary.
- [x] Define AI provider/router abstraction.
- [x] Define decision-triage contract.
- [x] Define caching/versioning plan.
- [x] Define AI usage/cost ledger and benchmark method.
- [x] Confirm no real AI API usage exists in Phase 0.

### UX / Design

- [x] Research at least 3 design-system/component approaches.
- [x] Write Design System ADR.
- [x] Define global design tokens.
- [x] Define semantic decision states.
- [x] Build premium dark-first application shell.
- [x] Build mocked Tournament Overview.
- [x] Build premium mocked Hand Replayer.
- [x] Implement mocked action-by-action Back/Forward behavior.
- [x] Add keyboard replay controls.
- [x] Build Hand Analysis panel.
- [x] Build strategy-frequency visualization.
- [x] Build Review Queue.
- [x] Link Review Queue item -> corresponding replayer state.
- [x] Build at least one Development/Progress chart.
- [x] Add representative loading/empty/error state(s).
- [x] Validate responsive layout.
- [x] Validate basic accessibility/focus/keyboard states.

### Quality

- [x] Add lint/type-check/build/test scripts.
- [x] Add initial automated tests appropriate for Phase 0.
- [x] Document parser fixture/regression-test strategy.
- [x] Ensure mock content is typed and centralized.
- [x] Ensure no secrets/API keys are required for Phase 0.
- [x] Update roadmap with validation evidence.

### Review

- [x] Run all quality checks.
- [x] Summarize architecture decisions.
- [x] Summarize unresolved risks/questions.
- [x] Set `Roadmap/phase-0.md` to `READY FOR REVIEW`.
- [x] Stop and request product/design review. Do not start Phase 1.

## Acceptance Criteria

- [x] The project runs locally using documented commands.
- [x] Roadmap Phase 0-7 files exist and accurately describe sequencing.
- [x] The application architecture and domain boundaries are documented.
- [x] Core TypeScript/domain schemas exist and are coherent enough for Phase 1.
- [x] The UI does not contain a live AI dependency.
- [x] No production AI/API cost is incurred by normal Phase 0 usage.
- [x] At least three design-system approaches were researched and recorded.
- [x] The selected design foundation is customized beyond default library styling.
- [x] A polished mocked Tournament Overview exists.
- [x] A polished poker-native Hand Replayer exists.
- [x] Back/Forward changes mocked hand action state correctly.
- [x] The Hand Analysis UI compares actual and recommended decisions.
- [x] Strategy source/confidence/provenance can be represented.
- [x] A Review Queue can open the relevant hand/decision.
- [x] At least one development/progress chart demonstrates coaching UX.
- [x] Loading/empty/error behavior is represented consistently.
- [x] Basic responsive behavior and keyboard/focus interaction have been validated.
- [x] Tests/type-check/lint/build pass.
- [x] ADRs required by this phase are present.
- [x] Validation evidence is present and status is `READY FOR REVIEW`.
- [x] Codex has not started Phase 1.

## Decisions / ADRs

- [ADR-001 - Application Architecture](../docs/adr/ADR-001-application-architecture.md)
- [ADR-002 - Design System](../docs/adr/ADR-002-design-system.md)
- [ADR-003 - AI Boundary](../docs/adr/ADR-003-ai-boundary-provider.md)
- [ADR-004 - Strategy Evidence](../docs/adr/ADR-004-strategy-evidence-provenance.md)
- [ADR-005 - Analysis Caching](../docs/adr/ADR-005-analysis-caching-versioning.md)
- [ADR-006 - Schema Validation](../docs/adr/ADR-006-core-schema-validation.md)
- [Phase 0 Design Tokens](../docs/specs/design-tokens.md)

## Risks / Open Questions

- Visual design needs human product/design review before Phase 0 can become COMPLETE.
- Future persistence choice is documented but intentionally not implemented.
- Phase 0 mock frequencies are illustrative only and must not seed production strategy.
- Mobile replay may need further design refinement once real hand density is known.

## Validation Evidence

- Commands passed on 2026-09-04:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run test` - 3 files, 7 tests passed.
  - `npm.cmd run format`
  - `npm.cmd run build` - passed with Vite 8.2.2.
  - `npm.cmd install -D vite@8.2.2 @vitejs/plugin-react@6.1.1 vitest@5.0.0`
    - completed with `found 0 vulnerabilities`.
  - `npm.cmd run dev -- --port 5173` - local Vite server started at
    `http://127.0.0.1:5173/`.
  - `Invoke-WebRequest http://127.0.0.1:5173/` - returned HTTP 200.
- Product / UX remediation validation on 2026-09-04:
  - Dashboard hierarchy reduced oversized title treatment, removed decorative score
    circle, emphasized result metadata, overall grade, primary leak, core metrics,
    category performance, and review queue.
  - Typography now explicitly loads Sora for display/headline text and Manrope for
    UI/body/numeric data.
  - Color tokens now use graphite backgrounds, charcoal surfaces, deep felt table
    colors, restrained action green, champagne accent, warm text, and distinct
    semantic decision colors.
  - Hand replayer now anchors Hero bottom-center, renders real suit symbols, shows
    dealer button, BB-first pot, spatial bet/chip markers, actor pulse, compact
    seats, and a street/action timeline tied to the replay cursor and Hide Result.
  - Headless Chrome visual review screenshots captured:
    - `C:\Users\Lenovo\AppData\Local\Temp\poker-coach-dashboard.png`
    - `C:\Users\Lenovo\AppData\Local\Temp\poker-coach-replayer.png`
    - `C:\Users\Lenovo\AppData\Local\Temp\poker-coach-mobile-dashboard.png`
    - `C:\Users\Lenovo\AppData\Local\Temp\poker-coach-mobile-replayer.png`
- Final visual polish validation on 2026-09-04:
  - Commands passed after final polish:
    - `npm.cmd run typecheck`
    - `npm.cmd run lint`
    - `npm.cmd run test` - 3 files, 7 tests passed.
    - `npm.cmd run format`
    - `npm.cmd run build` - passed with Vite 8.2.2.
    - `Invoke-WebRequest http://127.0.0.1:5173/` - returned HTTP 200.
  - CSS typography audit confirms no `font-weight: 700` or `font-weight: 800`
    declarations remain in the application stylesheet.
  - Playing-card symbols are emitted from Unicode escapes for stable browser
    rendering and never expose raw internal card notation.
  - Timeline now renders completed actions as compact inline text with separators;
    only the current action uses stronger emphasis.
  - Analysis panel now uses one primary surface with internal dividers for Actual
    vs Recommended, metadata, strategy mix, reason, alternative line, provenance,
    result note, and cursor hint.
  - Chart styling now defines thinner analytic lines, muted gridlines, custom axis
    label typography, restrained markers, dashed target treatment, and premium
    tooltip styling.
  - Headless Chrome/Edge screenshot recapture was attempted for this final polish
    pass, but the Windows headless GPU process failed before output files were
    written. Human visual review in a normal browser remains required before
    Phase 0 can become COMPLETE.
- Replayer layout and dashboard hierarchy validation on 2026-09-04:
  - Commands passed after this focused fix:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - 3 files, 8 tests passed.
    - `npm.cmd run format`
    - `npm.cmd run build` - passed with Vite 8.2.2.
    - `Invoke-WebRequest http://127.0.0.1:5173/` - returned HTTP 200.
  - Replay cursor semantic rule validated in code and tests: cursor is pre-action;
    completed actions are applied to stacks/pot/folds; `nextAction` identifies
    who is about to act.
  - Representative replay states covered by regression tests:
    - before SB posting,
    - before BTN open,
    - before Hero/SB decision,
    - before BB decision after Hero call,
    - before first flop action,
    - before BTN turn action.
  - UI smoke tests validate the Hero decision state reads as `Hero to act` while
    facing the BTN raise, and then advances to `Next to act: BB` facing the Hero
    call.
  - Explicit anchor system now provides per-seat anchors for seat, bet marker,
    dealer button, and action label for 6/7/8/9-handed tables.
  - Dashboard summary no longer uses a large marketing-style hero; tournament
    title, metadata, score, development target, and actions are compressed into a
    compact analytical summary.
- Visual asset evaluation validation on 2026-09-05:
  - Commands passed after adding the lab:
    - `npm.cmd run typecheck`
    - `npm.cmd run lint`
    - `npm.cmd run test` - 3 files, 9 tests passed.
    - `npm.cmd run format`
    - `npm.cmd run build` - passed with Vite 8.2.2; production build does not
      emit a `CardLab` chunk because the route import is dev-gated.
    - `Invoke-WebRequest http://127.0.0.1:5173/design/card-lab` - returned HTTP 200.
  - `/design/card-lab` renders as a lazy-loaded development-only evaluation route
    outside the primary navigation.
  - Candidate licensing and visual recommendation documented in
    `docs/design/card-asset-evaluation.md`.
  - Production `PlayingCard` and `PokerTable` components were not replaced by the
    evaluated assets.
  - `@letele/playing-cards@0.1.0` installed only to support the React/SVG
    component-deck candidate in the lab.
- Visual theme integration preview validation on 2026-09-05:
  - Real Tournament Review -> Replayer includes a compact dev-only Visual Preview
    control for card deck, table skin, and chip style.
  - Preview changes are stored separately from replay cursor, Hide Result, tab,
    and analysis state.
  - UI tests verify switching to letele cards, graphite table, and Block52 chips
    preserves the current replay state.
  - Shared asset adapters map domain `Card` values to Public Domain, Block52, and
    letele visual representations without changing domain schemas.
- Multi-seat replayer geometry validation on 2026-09-05:
  - Commands passed after geometry/card-scale changes:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - 3 files, 11 tests passed.
    - `npm.cmd run build` - passed with Vite 8.2.2.
    - `npm.cmd run format` - all matched files use Prettier code style.
    - `Invoke-WebRequest http://127.0.0.1:5174/?route=tournaments&tab=replayer`
      - returned HTTP 200 from the local Vite server.
  - 6-max and 8-max now share the same anchor-driven table renderer, with Hero
    bottom-center and independent anchors for seats, committed bets, dealer
    button, and action label.
  - The 8-max development preview adds UTG+1/LJ mock seats and matching mock
    ante/fold actions, preserving replay cursor semantics and current-action
    mapping when switching table size.
  - Hero cards use dedicated larger hole-card tokens; board/community cards use
    larger shared card tokens and remain centered in the compact pot/board area.
  - The table rail now uses a wider programmable oval geometry; no static table
    image was added.
  - Headless Chrome and Edge screenshot attempts still fail in this Windows
    environment because the GPU process exits before rendering. Human visual
    review in a normal browser remains required before Phase 0 can become
    COMPLETE.
- Nameplate and 8-max seat refinement validation on 2026-09-05:
  - Commands passed after compact-nameplate and 8-max anchor changes:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - 3 files, 11 tests passed.
    - `npm.cmd run build` - passed with Vite 8.2.2.
    - `npm.cmd run format` - all matched files use Prettier code style.
    - `Invoke-WebRequest http://127.0.0.1:5174/?route=tournaments&tab=replayer`
      - returned HTTP 200 from the local Vite server.
  - Opponent nameplates are now compact secondary elements; Hero remains the only
    larger card-bearing seat.
  - Last-action labels now render from the separate action-label anchors instead
    of increasing opponent nameplate height.
  - Folded villains render with compact `folded` state plus stronger visual
    quieting.
  - 8-max seat, bet, dealer-button, and action-label anchors were adjusted
    together to better follow the table ellipse.
  - Approved table shape, card sizes, board/pot layout, visual preview system,
    Dashboard, analysis panel, and replay semantics were not changed in this
    pass.
  - Automated visual screenshots were not captured because headless Chrome/Edge
    still fail in this environment before rendering. Human browser review at
    approximately 1280px, 1440px, and 1600px+ remains required before Phase 0 can
    become COMPLETE.
- Card theme normalization and acceptance validation on 2026-09-05:
  - Commands passed after card-theme calibration and selector demotion:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - UI coverage confirms Public Domain remains in the lab
      while the real replayer selector excludes it.
    - `npm.cmd run build`
    - `npm.cmd run format`
  - Accepted real Hand Replayer card themes:
    - Block52 - acceptable with light calibration.
    - `@letele/playing-cards` - acceptable with stronger calibration.
  - Rejected/demoted from real Hand Replayer:
    - Public Domain / OpenDecks - kept only in `/design/card-lab` because it
      remains weaker in the actual table context than the accepted themes.
  - Calibration changes adjust inner SVG/image scale only. Approved table
    geometry, table shape, Hero/board card outer sizes, board/pot layout, visual
    theme system, Dashboard, analysis panel, and replay semantics were not
    redesigned.
- 8-max nameplate perimeter alignment validation on 2026-09-05:
  - Commands passed after 8-max anchor-only correction:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - 3 files, 11 tests passed.
    - `npm.cmd run build`
  - 8-max seat anchors now place BTN lower-right, Hero/SB bottom-center, BB
    lower-left, UTG left-middle, UTG+1 upper-left, LJ top-center, HJ upper-right,
    and CO right-middle to preserve clockwise poker order around the oval.
  - 8-max bet anchors remain inward from the nameplates, closer to the pot, so
    committed chips stay visually inside the table.
  - Dealer-button and action-label anchors were adjusted with the related 8-max
    seats.
  - 6-max anchors were not changed in this pass.
  - Table shape, table ratio, skin, card sizing, card-theme normalization, board,
    pot, Dashboard, analysis panel, and replay semantics were not changed.
- PlayerSeat cluster refactor validation on 2026-09-05:
  - Commands passed after consolidating player visuals:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - 3 files, 11 tests passed.
    - `npm.cmd run build`
    - `npm.cmd run format`
  - Each player now owns its identity plate, optional card backs/Hero cards,
    current/recent action label, committed-chip marker, and dealer button as one
    table-positioned cluster.
  - Active opponents show two face-down cards; folded opponents hide cards and use
    muted folded-state treatment.
  - Committed chips and action labels are positioned locally from the seat toward
    the pot, keeping the felt cleaner and preserving player/action ownership.
  - 6-max and 8-max use the same `PlayerSeat` cluster behavior; 8-max poker order
    and Hero bottom-center rotation are preserved.
  - Table shape, card sizing, card-theme normalization, visual preview system,
    Dashboard, analysis panel, and replay semantics were not redesigned.
- Orientation-aware PlayerSeat geometry validation on 2026-09-05:
  - Commands passed after local radial/tangent seat geometry correction:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test`
    - `npm.cmd run build`
    - `npm.cmd run format`
  - Opponent card backs now use each seat's inward vector instead of always
    rendering above the nameplate.
  - Committed chips are positioned farther inward along the same local vector, so
    they sit between cards/nameplate and pot.
  - Current/recent action labels sit near the same local lane and no longer use a
    fixed global felt position.
  - Dealer button placement uses the seat's outward/tangent vectors.
  - Table shape/aspect ratio, pot, board, card sizes, card themes, Dashboard,
    analysis panel, replay cursor semantics, and Phase 1 scope were not changed.
- PlayerSeat cohesion correction validation on 2026-09-05:
  - Commands passed after simplifying the cluster visual model:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
  - Cards and action text now stay attached to the compact nameplate cluster;
    committed chips are the only player-owned element with a farther inward
    offset.
  - Ante/blind/bet markers use the same shortened seat-local committed-chip zone
    so they stay closer to the posting player and away from the pot/board center.
  - Existing folded behavior is preserved: folded opponents hide card backs and
    mute the full seat cluster.
  - Table shape, card sizing, card-theme normalization, visual theme system,
    Dashboard, analysis panel, replay semantics, and Phase 1 scope were not
    changed.
- Mockup-Based Full UI Implementation validation on 2026-09-05:
  - Implemented the attached Phase 0 mockup handoff as the visual target for the
    full Hand Replayer screen while keeping replay/domain logic and Phase 0
    mock-data boundaries intact.
  - Global visual system updated for the replayer screen: sidebar lockup,
    tournament review header, dev preview controls, panel surfaces, button
    sizing, typography hierarchy, dark graphite/emerald surfaces, and restrained
    champagne/semantic accents.
  - Poker table presentation updated to match the mockup more closely: wide
    programmable oval rail, centered compact pot/board area, subtle watermark,
    cohesive player seats, attached opponent card backs, local committed-chip
    markers, and BTN-owned dealer button.
  - Replay controls now sit in a single lower command deck with Back, Forward,
    Hide Result, and the action summary using the existing pre-action cursor
    semantics.
  - Street timeline moved to the mockup-style step track with street separation,
    current-position highlight, and Hide Result support.
  - Right Hand Analysis panel restyled to match the mockup hierarchy while
    preserving Actual vs Recommended, Severity, Confidence, Strategy Mix, Reason,
    Alternative Line, provenance, and explicit mock-strategy disclaimer.
  - Development visual preview now defaults to the accepted 8-max Emerald /
    Classic-style review screen; rejected card themes remain excluded from the
    real replayer selector.
  - Visual preview storage was versioned to avoid stale local 6-max/theme
    selections masking the mockup-default review screen during Phase 0 review.
  - Commands passed after the mockup implementation:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - 3 files, 11 tests passed.
    - `npm.cmd run format`
    - `npm.cmd run build`
    - `Invoke-WebRequest http://127.0.0.1:5173/?route=tournaments&tab=replayer`
      - returned HTTP 200 from the local Vite server.
  - Phase 1 work, real AI/API calls, solver integration, parser work, backend,
    database, and training functionality were not started.
- Responsive Mockup Implementation validation on 2026-09-05:
  - Desktop reference implementation preserves the attached mockup composition:
    sidebar, flexible center replayer, and right-side Hand Analysis panel at
    1440-1600px+.
  - Main layout now has deliberate responsive modes:
    - 1600px+ / 1440px: full three-column premium layout.
    - 1280px range: compact sidebar, replayer, and narrowed analysis panel.
    - 1024px / tablet: mobile top navigation, replayer first, analysis below.
    - 768px and below: compact navigation, compact player seats, touch-friendly
      controls, responsive analysis, and horizontally scrollable timeline when
      needed.
    - 430px / 375px: no fixed mobile table height; table uses aspect ratio,
      compact seat labels, readable Hero/board cards, and page-level overflow is
      avoided by clamping seat anchors and scrolling only the timeline.
  - Normalized seat geometry was made more explicit with `TableLayout` and
    Hero-relative `RelativeSeat` anchors for 6/7/8/9 table sizes.
  - Seat coordinates remain table-relative percentages; committed-chip and
    dealer-button placement are derived from local inward/outward/tangent vectors
    through responsive CSS variables.
  - Opponent seats use desktop and mobile variants from the same `PlayerSeat`
    markup: full identity/card/chip-count treatment on desktop and compact
    position/BB/cards emphasis on mobile.
  - Analysis panel moves below the table on tablet/mobile and stacks internal
    comparison/status grids on phone widths.
  - Replay controls adapt from the desktop command deck to mobile action summary,
    two-button control row, and 44px+ touch targets.
  - Mobile navigation now provides an accessible compact screen selector instead
    of hiding the desktop sidebar with no replacement.
  - Theme preview controls wrap to four compact fields on tablet and a 2x2 grid
    on mobile.
  - Commands passed after this responsive implementation:
    - `npm.cmd run lint`
    - `npm.cmd run typecheck`
    - `npm.cmd run test` - 3 files, 12 tests passed.
    - `npm.cmd run format`
    - `npm.cmd run build`
    - `Invoke-WebRequest http://127.0.0.1:5173/?route=tournaments&tab=replayer`
      - returned HTTP 200 from the local Vite server.
  - Lightweight UI coverage now includes the accessible mobile navigation
    selector.
  - Headless Chrome screenshot capture was attempted at 1440px but failed before
    rendering because the Windows GPU process exited; human browser review at the
    requested widths remains required for final visual approval.
  - Phase 1 work, real AI/API calls, solver integration, parser work, backend,
    database, and training functionality were not started.
- Final PlayerSeat Cluster Correction validation on 2026-09-28:
  - Removed the separate `To act` label from `PlayerSeat`; current actor state is
    communicated through the highlighted seat/nameplate surface instead.
  - Position is now rendered as a compact `.seatPositionBadge` attached to the
    top-right corner of the nameplate for all seats and table sizes.
  - Main nameplate content is now player name, stack in BB, and optional chip
    count; position is no longer mixed into the identity row.
  - Opponent card backs and Hero hole cards remain mounted to and centered on the
    nameplate. Mobile keeps player names visible while compacting secondary
    details.
  - Action labels now live inside the nameplate under the card mount, with
    restrained semantic treatments for fold/check/call/bet/raise/all-in states.
  - Current actors suppress stale older action labels while retaining the active
    seat highlight.
  - Committed chips remain outside the text block and positioned inward toward
    the pot using the same seat-local vector system.
  - 9-max is now available through the development visual preview contract and
    mock preview hand, reusing existing Phase 0 legal position values without
    changing domain schemas.
  - Dev-only URL preview overrides were added for QA capture:
    `previewSeats`, `previewCards`, `previewChips`, and `previewTable`.
  - Regression tests cover exact removal of the old `To act` seat label,
    top-right badge rendering, position removal from the main identity row,
    current actor action-label suppression, and 9-max preview selection.
  - Visual QA screenshot targets are documented in
    `docs/qa/phase-0-seat-clusters/README.md`. Chrome headless screenshot
    capture was attempted for 1440 6-max, 1440 8-max, 1440 9-max, 1024 8-max,
    390 8-max, and 390 9-max but failed before rendering because the Windows GPU
    process was unusable. No screenshot files were produced in this environment.
  - Phase 1 work, real AI/API calls, solver integration, parser work, backend,
    database, and training functionality were not started.
- Responsive validation:
  - CSS breakpoints at 1180px and 780px cover sidebar collapse, single-column
    replayer layout, mobile tab sizing, mobile table height, and metric stacking.
  - Mobile replayer is compact and usable, but remains intentionally dense;
    product/design review should still approve target desktop/tablet/mobile widths.
- Accessibility/focus validation:
  - Radix Tabs/Switch/Tooltip primitives are used for core interactions.
  - Visible `:focus-visible` focus rings are defined globally.
  - Automated UI smoke tests cover review-queue navigation to the exact replay
    cursor and ArrowLeft/ArrowRight replay controls.
- Key modules: `src/domain/schemas.ts`, `src/domain/replay.ts`,
  `src/data/mockTournament.ts`, `src/services/aiProvider.ts`, `src/ui/App.tsx`,
  `src/ui/components`.
- Key routes/screens: Dashboard, Tournaments Overview, Tournaments Replayer,
  Tournaments Review Queue, Development, Training placeholder, Playbook placeholder.

## Approved Prototype Seat Integration

Status: READY FOR REVIEW. This is not product approval and does not authorize a
later phase. The approved ZIP supersedes the older seat-experiment notes above.

- [x] Inspect the approved ZIP source, design system, desktop/mobile browser renders.
- [x] Extract one typed PlayerSeat with centered mounted cards, top-right position,
      integrated action header, visible names/stacks and whole-plate actor styling.
- [x] Port the approved 6/8/9 desktop/mobile coordinates and commitment archetypes;
      preserve Hero-relative clockwise rotation and the existing 7-seat capability.
- [x] Remove obsolete radial/seat CSS instead of layering another seat experiment.
- [x] Keep domain replay semantics; expose street commitments and persistent fold/all-in
      state. Correct 9-max position/sequence fixtures and full-pot payout accounting.
- [x] Keep payout/winner hidden until explicitly revealed; preserve independent grades.
- [x] Finish responsive browser matrix, paired source comparison and screenshot index.
- [x] Complete the existing Letele adapter's 52-card mapping; actual flop faces no
      longer silently fall back to backs. Keep deck sizes/calibration unchanged.
- [x] Finish lint, typecheck, unit tests, formatting and production build.

Validation (2026-10-16):

- 83 unit/component tests across 7 files; includes every Letele card face.
- 31 Playwright tests: 24 width/table-size combinations, six all-in cases, one
  theme/control/Hide Result test. The updated Letele flop assertion also passed.
- Widths: 1600, 1440, 1280, 1024, 768, 430, 390, 375; all tested with 6/8/9 players.
- Every size checked at initial, blinds, raise, call, flop, check, bet, turn, river.
- 64 PNG screenshots under `docs/qa/approved-seat-system/`, including paired
  desktop/mobile source comparisons, native production cards and Letele boards.
- Production smoke checked at 1440 and 375: dev controls/QA overrides are absent;
  native cards and stepping remain functional.
- No measured plate/card/bet/dealer collisions or page overflow in the matrix.
- Supporting integration fixes: inspector minimum widths, mobile top-card clearance,
  decimal BB consistency, native-back contrast, hidden payout and winner leakage.
- See `docs/design/approved-seat-integration.md`, screenshot index and root
  `design-qa.md` for intentional differences, assets, verification and scope.
- Dashboard, sidebar, navigation and analysis content were not redesigned.
  Existing card/chip contracts remain; no Phase 1, backend/parser/database/solver
  or real AI/API integration was started.

## Completion Log (Historical)

- 2026-09-04: Phase 0 started from master requirements and phase prompt. Implementation
  is in progress.
- 2026-09-04: Phase 0 deliverables implemented and validation passed. Status set
  to READY FOR REVIEW, pending human product/design approval.
- 2026-09-04: Product / UX remediation pass completed. Phase 0 remains READY FOR
  REVIEW and is not marked COMPLETE.
- 2026-09-04: Final visual polish pass completed. Phase 0 remains READY FOR
  REVIEW and is not marked COMPLETE.
- 2026-09-05: Multi-seat replayer geometry/card-scale pass completed. Phase 0
  remains READY FOR REVIEW and is not marked COMPLETE.
- 2026-09-05: Nameplate and 8-max seat refinement pass completed. Phase 0
  remains READY FOR REVIEW and is not marked COMPLETE.
- 2026-09-05: Card theme normalization and acceptance pass completed. Phase 0
  remains READY FOR REVIEW and is not marked COMPLETE.
- 2026-09-05: 8-max nameplate perimeter alignment pass completed. Phase 0 remains
  READY FOR REVIEW and is not marked COMPLETE.
- 2026-09-05: PlayerSeat cluster refactor completed. Phase 0 remains READY FOR
  REVIEW and is not marked COMPLETE.
- 2026-09-05: Orientation-aware PlayerSeat geometry correction completed. Phase
  0 remains READY FOR REVIEW and is not marked COMPLETE.
- 2026-09-05: PlayerSeat cohesion correction completed. Phase 0 remains READY FOR
  REVIEW and is not marked COMPLETE.
- 2026-09-05: Mockup-based full Hand Replayer UI implementation completed.
  Phase 0 remains READY FOR REVIEW and is not marked COMPLETE.
- 2026-09-05: Responsive mockup implementation completed. Phase 0 remains READY
  FOR REVIEW and is not marked COMPLETE.
- 2026-09-28: Final PlayerSeat cluster correction completed. Phase 0 remains
  READY FOR REVIEW and is not marked COMPLETE.
