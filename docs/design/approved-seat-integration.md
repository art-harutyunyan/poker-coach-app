# Approved PlayerSeat Integration

Status: READY FOR REVIEW. Verification is recorded in the final QA log.

## Source

- User-supplied `Poker-Coach-Responsive-Prototype (1).zip`, inspected 2026-10-16.
- ZIP SHA-256: `D0AF88CCB2B0637AD0F96CA5601E97444D9CB9740D7E134FD2310006466A05BD`.
- [Approved live prototype](https://poker-coach-the-study.arthurharutyunyan.chatgpt.site/#Tournament).
- Primary references: `src/PokerTable.jsx`, `src/poker-seats.css`,
  `src/seatLayout.js`, `DESIGN-SYSTEM.md` in the supplied archive.

The ZIP is a visual/interaction specification, not the production architecture.
Its replay engine, application shell, deployment scripts and unrelated product
screens were not copied into this application.

## Frozen Anatomy

`src/ui/components/PlayerSeat.tsx` owns the plate, player name, stack, position,
cards, action, dealer and committed bet. It is shared by every supported table size.
`seatLayout.ts` owns normalized desktop/mobile plate coordinates and commitment
archetypes. Player positions rotate in clockwise poker order around Hero; array
order and historic mock seat-number mistakes cannot reverse the table.

- Mounted card pairs are centered at the top edge with 1px overlap.
- The position badge uses one top-right inset. UTG+1 and UTG+2 split over two lines.
- The action header is inside the plate, left of the badge. Fold persists; ordinary
  actions persist only within their street. Blind labels are transient.
- Current actor uses the approved 2px champagne border, brighter plate and modest
  shadow. `aria-current` and the group label identify it without a separate badge.
- Opponent backs disappear on fold. Folded plates retain name, stack and position.
- Zero-stack callers as well as explicit all-in actions get persistent all-in state.
- Dealer attaches to the owning plate's lower-left edge. Chips use inward lanes
  defined by archetype, not player-specific/card-specific table coordinates.
- Antes are collected directly into the pot; they do not create a ring of markers.
- Full player names and chip counts remain available through the nameplate title;
  the default visual prioritizes the name and BB stack.

Desktop plates: 94x70, increasing to 100x72 at 1600px. Mobile: 72x66 below 701px.
Hero widths: 98 / 104 / 78. Seat Inter is explicitly bundled and scoped to the
table, with the approved 13/15px desktop and 12/14px mobile name/stack hierarchy.
Global fonts and design tokens are unchanged.

## Integration Decisions

1. **Replay boundary retained.** Cursor N still means actions `[0, N)` have happened;
   action N is next. No prototype frame arrays or screenshot-specific state were
   substituted. `SeatSnapshot` now exposes current-street commitments, persistent
   all-in state and the appropriate displayed action/raise-to total.
2. **Fixture correctness.** Added the real UTG+2 position, corrected clockwise mock
   seat numbers, rebuilt 8/9-max sequences without duplicates, and corrected the
   full-pot award from 31,600 to 34,100 chips in the base hand. Added players' antes
   are included in preview payouts. A dev-only equal-stack all-in branch exercises
   the same replay engine; it is not a new training/analysis feature.
3. **Approved skin, programmable layout.** The supplied felt/rail artwork is used
   as a decorative layer, exactly as in the approved prototype. It contains no
   seats, cards, text, bets or controls. All those elements remain responsive DOM
   driven by typed state. This follows the latest source approval over earlier
   CSS-only skin experiments; it is not a fixed screenshot of the replayer.
   A rounded clip removes the artwork's rectangular exterior matte without
   relocating its rail. Existing development theme contracts remain available.
4. **No shell redesign.** Dashboard, navigation, sidebar, analysis content and
   broader responsive shell are retained. The table/analysis grid drops its old
   overflowing table minimum and follows the reference's 1250px inspector stacking
   threshold. The existing single-hand Phase 0 review navigation is retained;
   the prototype's fictional multi-hand rail and future analysis modes were not
   added. Those whole-screen differences are explicit scope constraints.
5. **Existing PlayingCard boundary retained.** Accepted Block52 and Letele preview
   decks still use their existing normalization. Their artwork differs from the
   source's simple suit-icon cards, deliberately; no deck/library was replaced.
   Production continues to use the native PlayingCard fallback as before.
6. **Small integration corrections.** A 28px mobile stage margin protects the top
   mounted backs during initial 9-max play. The analysis comparison columns now
   shrink/wrap instead of overflowing their narrower inspector. Below 701px their
   original stacked presentation is retained. No analysis redesign was performed.
7. **Hide Result.** The visible cursor stops before payout while hidden. Revealing
   permits payout; hiding again restores the unrevealed frame. Future timeline
   entries do not expose actors/actions, and result copy no longer leaks the winner.
   Grades stay independent. Arrow keys do not hijack select/input/button controls.

## Assets

- `src/assets/approved-poker-table.png`: copied unchanged from the user-approved ZIP.
- `src/assets/seat-inter-latin.woff2`: Inter variable Latin font from the prototype's
  `@fontsource-variable/inter` dependency. SIL OFL 1.1 is retained at
  `src/assets/Inter-OFL.txt` and distributed at `/licenses/Inter-OFL.txt`;
  font use is scoped to the table.
- Existing card/chip licensing and normalization remain documented in
  `card-asset-evaluation.md`; this task adds no third-party deck.

## Reproduction

```text
npm install
npm run dev -- --port 5180
npm run test:visual
```

Open `http://127.0.0.1:5180/?route=tournaments&tab=replayer`.
Dev-only QA parameters: `previewSeats=6|8|9`, `qaCursor=N`,
`qaScenario=all-in`, plus the existing card/chip/table preview parameters.
Chrome is the Playwright channel; browser tests need the existing remote preview
assets to be reachable. No AI/solver/backend request is involved.

For paired reference captures, run the extracted ZIP on port 5181, then
`node scripts/compare-approved.mjs`. `PROTOTYPE_URL` can override that source URL.
See `../../design-qa.md` and `../qa/approved-seat-system/README.md` for evidence.

No Phase 1 work, parser, database, solver or real AI integration was started.
