# Replayer Shell Refinement QA

Date: 2026-10-16. **final result: passed**

This is the implementation QA gate, not human approval. Phase 0 remains
**READY FOR REVIEW**. The historical table integration report follows below.

## Current Target and Evidence

Source: the supplied live prototype at
`https://poker-coach-the-study.arthurharutyunyan.chatgpt.site/#Settings`, followed
through Tournament > Replayer. Saved source:
`docs/qa/shell-source-replayer-{1440,390}.png`.

Implementation: `http://127.0.0.1:5180/?route=tournaments&tab=replayer`.
Same preflop Hero decision after BTN raise, 8-max. Source and app use different
mock names/amounts/grades, and the app retains accepted card artwork. This is a
shell design-language integration, not a clone of source content or later features.

| Comparison viewport | Source full PNG | Current app full PNG | Density               |
| ------------------- | --------------- | -------------------- | --------------------- |
| 1440x1000           | 1440x1155       | 1440x1391            | 1 CSS px : 1 image px |
| 390x1000            | 390x1738        | 390x2159             | 1 CSS px : 1 image px |

Paired full-view evidence: `docs/qa/replayer-shell/comparison-{1440,390}.png`.
Focused paired evidence: `docs/qa/replayer-shell/comparison-analysis.png`, using
native-density 300px-wide inspector crops. Both pairs were visually inspected.
The complete responsive/state matrix is indexed in
`docs/qa/replayer-shell/README.md`.

## Findings and Resolution

- [Resolved P2] The four expanded development selects pushed the table down.
  They now live in a keyboard-accessible disclosure, initially closed. On phones,
  the rail replaces the redundant hand heading. The final mobile pair shows the
  shorter header without removing tournament context or navigation.
- [Resolved P2] Opening action history expanded its intrinsic grid width and
  produced page overflow. A zero minimum width contains the scroller. Browser
  assertions cover both collapsed and expanded states at all eight widths.
- [Resolved P2] Inherited tablet header rules centered/stacked the title and
  grade unnecessarily. The source-aligned horizontal header is restored; mobile
  uses a compact left-aligned title and omits the secondary grade.
- [Resolved P2] Old CSS hid the local strategy-mix provenance label. It is visible
  again, in addition to the full persistent mock disclaimer below the panel.
- No remaining actionable P0/P1/P2 shell issues found in the tested matrix.

## Required Fidelity Surfaces

- Typography: bundled Inter is loaded and verified in-browser. Source-like
  500-600 weights, zero letter spacing, 28px desktop/20px mobile title, readable
  13px analysis copy. Existing card/seat type is unchanged.
- Layout: source 214px sidebar, 64/68px study rail and 300/330px inspector;
  source-like separators, 5px controls and restrained panel radius. Compact
  sidebar at laptop widths, analysis below at 1250px and below, compact mobile
  rail/controls. No horizontal page overflow with disclosures open.
- Tokens: source background `#101815`, panel `#19231e`, line `#334238`, text
  `#efece2`, muted `#a1ada5`, gold `#d5bf90`, green `#8fc3a5`. No added gradients,
  glow effects, new table skin or new icon dependency.
- Assets: approved table, all card normalization, chip themes and seat rendering
  are retained. The same locally licensed Inter font is reused for the shell.
  Final QA includes loaded local Letele and remote Block52 cards; early blocked
  remote-asset captures are not used as acceptance evidence.
- Content: existing typed analysis, amounts, reason, alternative line and mock
  provenance retained. Only one playable hand and three existing tournament tabs
  are exposed. No unsupported strategy modes or AI output are fabricated.

## Validation

- Lint, typecheck, formatting, production build: pass.
- Unit tests: 89/89 pass. Browser tests: 40/40 pass, plus a final nine-test shell
  rerun after refinements. Chrome only; eight widths from 375 through 1600px.
- Native-card production smoke checks: 1440/390, flop navigation, six seats,
  local font loading, preview controls absent, no page overflow.
- Tested controls: navigation, Queue, Decision/Context, reviewed toggle, street
  jumps, Back/Forward/keyboard, Hide Result, theme controls, history disclosure,
  upload/profile informational dialogs, Escape and focus restoration.
- No page errors in shell cases. Two earlier concurrent-run artifact failures
  were test-output-directory collisions, not UI failures; the final suite ran
  serially and passed. No browser suite is left running at handoff.
- PlayerSeat, seatLayout, PlayingCard, poker-seats.css, visualThemes and replay.ts
  hash-match the start of this pass. PokerTable only gains a history disclosure.

## Intentional Deviations / Residuals

The app uses Poker Coach branding, its real mock content and the existing mobile
screen selector. It retains more analysis/provenance copy, so the inspector and
mobile page are longer than the reference. There is no fake Next Hand action or
extra rail content when only one playable hand exists. Ask Coach is disabled;
profile/import entries explain their Phase 0 boundaries. No Phase 1 work began.

Remaining coverage gaps: Firefox/Safari, enlarged text/zoom, and unrequested
7-max visual QA. Remote Block52 artwork still requires network access, as before.
No production asset hosting change is included in this shell task.

---

# Historical Approved PlayerSeat Integration QA

Date: 2026-10-16

Scope: approved table/PlayerSeat system integrated into the existing Phase 0 app.
This is an implementation QA result, not human product approval.

## Comparison Target

Source visual truth: user-supplied `Poker-Coach-Responsive-Prototype (1).zip`,
rendered locally on port 5181; also inspected the supplied live prototype.
Implementation: `http://127.0.0.1:5180/?route=tournaments&tab=replayer`.

Both comparisons show the 8-max preflop SB decision after the BTN raise, with Hero
bottom-center. The source uses different mock players/stacks, a different sample
hand number and simple suit-icon artwork. The app keeps its typed mock data and
accepted card themes. These are not pixel-identical content snapshots.

All captures use Chrome at deviceScaleFactor 1; no device frame or density rescaling.

| Viewport  | Source full PNG | App full PNG | Source table crop | App table crop |
| --------- | --------------- | ------------ | ----------------- | -------------- |
| 1440x1000 | 1440x1155       | 1440x1328    | 776x416           | 824x416        |
| 390x1000  | 390x1738        | 390x2776     | 364x307           | 370x308        |

One-pixel crop differences come from fractional CSS bounds. Table widths differ
because the surrounding existing app shell is intentionally retained. Paired table
images show the crops at native density, not forced into equal-sized stretched frames.
Full-page comparison images are review canvases; source PNGs remain unscaled files.

Evidence, all in `docs/qa/approved-seat-system/`:

- `comparison-screen-1440.png`, `comparison-screen-390.png`: whole-screen context.
- `comparison-table-1440.png`, `comparison-table-390.png`: focused paired anatomy.
- `source-1440.png`, `source-390.png`: approved source browser renders.
- `1440-8max.png`, `390-8max.png`: running app full-page captures.
- `1440-8max-{initial,blinds,raise,call,flop,check,bet,turn,river}.png` and the
  corresponding 390px crops: state clarity.
- `production-table-375.png`: native production card-back verification.
- `letele-table-1440.png`, `letele-table-390.png`: actual board faces after adapter fix.

## Findings And Iterations

1. **P1, fixed: conflicting legacy table minimums.** The old desktop grid required
   820px for the table even when the inspector/shell left less space. Removed that
   minimum, isolated the approved seat CSS and removed 184 obsolete table/seat rules.
   Final 1280/1440/1600 captures show the inspector in bounds; geometry tests pass.
2. **P2, fixed: narrow inspector content overflow.** The existing Actual/Recommended
   columns had intrinsic minimums larger than the panel. Minmax tracks and readable
   wrapping fix this without changing content or structure. Mobile retains stacking.
3. **P2, fixed: top cards could enter the heading clearance during initial mobile play.**
   Added a 28px stage margin, retaining the exact approved mobile plate coordinates.
   Initial 6/8/9-max at all phone widths now passes card/plate collision checks.
4. **P2, fixed: BB rounding contradicted all-in labels.** The old formatter rounded
   amounts above 10 BB to integers. Seat and summary now both retain the decimal.
5. **P1, fixed: Letele faces silently became backs.** Its previous lab-only mapping
   omitted Ad/7s/2c and many other valid cards. The complete mapping has 52 face tests
   plus concealed-card coverage. Browser assertions verify the real flop SVG classes;
   post-fix captures show actual faces, not concealed cards. Calibration is unchanged.
6. **P2, fixed: native production backs had insufficient emphasis.** The approved
   green fill/light border is scoped to the native fallback, without altering preview
   decks or outer dimensions. Post-fix production captures confirm visible mounted backs.
7. **QA assertions corrected, not product defects:** the first overlap assertion
   included an invisible preflop label's rectangle; it now measures visible pot/board
   bounds. A grade-independence assertion compared innerText line breaks to textContent;
   it now compares the same representation. Both checks pass after these corrections.

Post-fix review used the paired evidence above, not just the presence of components.
No actionable P0/P1/P2 issues remain within the requested seat/table integration scope.

## Required Fidelity Surfaces

- **Typography:** approved Inter is loaded locally for table/seat content. Name,
  stack, action and badge scales match the source across desktop/phone; tabular numbers,
  ellipsis and full accessible names are retained. Global product fonts are unchanged.
- **Spacing/layout:** exact approved 6/8/9 normalized anchor sets, fixed shared plate
  anatomy, attached card pairs and archetype commitment lanes. Hero stays bottom-center.
  Table widths follow the preserved shell; the source's fictional multi-hand rail is
  not added to the current single-hand data model.
- **Colors/tokens:** plate, folded, actor, action and badge colors follow the source.
  The champagne actor border is not a floating indicator. No global palette changes.
- **Assets:** original approved felt/rail PNG is a decorative responsive skin, with
  real DOM seats/cards/board/chips on top. Outer matte clipping preserves the rail.
  Existing accepted preview decks are deliberately retained; their artwork differs
  from the source's simple faces. Native backs now use the approved green treatment.
- **Copy/content:** live stacks, bets, pot and actions come from replay state. No
  standalone To act label. Raise-to amounts include earlier street commitments.
  Folds/all-ins persist; ordinary street actions clear. Provenance remains explicit
  and payout/result hiding cannot change the decision grade.

## Validation

- `npm run lint`: passed.
- `npm run typecheck`: passed, including Playwright config/tests.
- `npm run test`: 83 passed across 7 files.
- `npm run build`: passed.
- `npm run format`: passed.
- `npm run test:visual`: 31 passed. The theme test was additionally rerun after
  adding the full-deck adapter assertions and passed.
- Matrix: 1600/1440/1280/1024/768/430/390/375, each with 6/8/9 players.
- State checkpoints: initial, blinds, raise, call, flop, check, bet, turn, river;
  separate all-in cases at 1440/390 for all three table sizes.
- Browser checks: plate/card/bet/dealer overlaps, board clearance, visible identity,
  top-right badges, exact card mounting, no page overflow, valid actor, folded cards
  hidden, keyboard/button stepping, all theme selectors, hidden payout and stable grade.
- Browser `pageerror` events: none in the matrix. Required table images loaded.
- Production smoke: native 6-max at 1440/375, forward action works, dev parameters
  and visual selectors are absent. Local bundled seat font and OFL distribution verified.
- Evidence: 64 PNG files, indexed in `docs/qa/approved-seat-system/README.md`.

## Intentional Differences / Residual Scope

- Existing navigation, sidebar, page heading, timeline and analysis content are not
  a wholesale clone of the prototype. They were retained per the no-redesign scope.
  Full-page comparisons are included to make those differences transparent.
- Card preview artwork remains Block52/Letele. Remote Block52 assets still require
  network access; native production faces/backs and the seat font are local.
- Mock-only replay remains a single-hand lesson. The all-in branch is development QA,
  not a solver/trainer or new analysis. No side-pot engine or showdown reveal feature
  was invented. The 7-seat layout is retained but is outside the requested visual matrix.
- Manual captures are Chrome-based; Safari/Firefox and >100% text zoom were not tested.
- Human design approval remains pending. Phase 0 is READY FOR REVIEW, never COMPLETE.

final result: passed
