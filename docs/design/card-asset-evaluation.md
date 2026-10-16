# Card Asset Evaluation

Phase 0 visual review surfaces:

- `/design/card-lab` for isolated asset comparison.
- Tournament Review -> Replayer for live dev-only visual preview on the real
  mocked hand state.

This document records candidate card, chip, dealer, and table-skin directions for
Poker Coach. The lab and live preview are temporary Phase 0 review tools and do
not represent a permanent product personalization feature.

## Evaluated Card Candidates

| Candidate              | Source                                                                                          | License | Commercial use | Attribution                                             | Modification | Notes                                                                                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ------- | -------------- | ------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The Public Domain Deck | https://github.com/AustinGabriel/The-Public-Domain-Deck-Public-Domain-and-CC0-Playing-Cards     | CC0-1.0 | Allowed        | Not required                                            | Allowed      | Very strong licensing posture. Includes SVG/PNG cards, card backs, ornate courts, and explicit public-domain/CC0 provenance. Better as a safe fallback than the first visual choice because it reads more classic/ornate than analytical.        |
| Block52 Cards          | https://github.com/block52/cards                                                                | MIT     | Allowed        | Copyright/license notice required in substantial copies | Allowed      | Poker-focused SVG repository with direct raw/CDN usage, card backs, chips, and dealer assets. Best first candidate for Poker Coach because it covers more of the poker visual system with one license model.                                     |
| @letele/playing-cards  | https://github.com/letele/playing-cards and https://www.npmjs.com/package/@letele/playing-cards | CC0-1.0 | Allowed        | Not required                                            | Allowed      | React/SVG component package built from Adrian Kennard public-domain designs. Technically convenient and permissive, but package activity and visual direction are more traditional than premium analytical software. Installed only for the lab. |

## Chip / Dealer Candidates

| Candidate                      | Source                                               | License       | Commercial use | Attribution                                             | Modification | Notes                                                                                                                                                                        |
| ------------------------------ | ---------------------------------------------------- | ------------- | -------------- | ------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Block52 chips and dealer       | https://github.com/block52/cards                     | MIT           | Allowed        | Copyright/license notice required in substantial copies | Allowed      | Includes `dealer.svg`, `chipsm.svg`, `chipmd.svg`, and related chip assets. Useful for dealer/icon reference, but production bet markers should keep BB amount programmable. |
| Poker Coach programmable chips | Local CSS/SVG-style components in `/design/card-lab` | Project-owned | Allowed        | Not required beyond project license                     | Allowed      | Best suited for committed-bet markers because BB amount remains primary, chip count can be dynamic, and visual style can adapt to semantic action states.                    |

## Table Skin Candidates

The lab compares three programmable table skins:

- Deep emerald felt with subtle rail.
- Darker graphite/emerald felt.
- Subtle felt texture/noise variant.

The table should remain HTML/CSS/SVG-based. Do not use a fixed poker-table PNG/JPG
as the final replayer surface because the production replayer must support
dynamic seats, Hero rotation, bet anchors, dealer anchors, community cards, chip
movement, actor highlighting, and responsive resizing.

## Recommendation

Use Block52 as the first integration candidate for cards, card backs, chip/dealer
reference assets, and naming conventions. Pair it with Poker Coach programmable
bet markers, because the product must prioritize BB amounts and dynamic betting
state over literal chip denominations.

For the table, continue with programmable HTML/CSS/SVG geometry and evaluate the
subtle felt texture direction. It gives the table more tactility without pushing
the product toward casino imagery.

Licensing caveat: if Block52 assets ship in production, include the MIT copyright
and license notice in the product/license attribution bundle.

Expected integration effort after approval:

- Create a card asset adapter for internal `Card` values to deck asset names.
- Create one reusable card renderer with size variants for Hero, board, compact,
  showdown, hidden, and training states.
- Create a programmable bet-marker component using local chip stacks and optional
  Block52 dealer/icon reference.
- Keep the replayer table programmable; only skin and asset wrappers should change.

## Live Preview Implementation Notes

The dev-only visual preview uses shared theme contracts:

- Lab `CardTheme`: `public-domain`, `block52`, `letele`.
- Real replayer preview `ReplayerCardTheme`: `block52`, `letele`.
- `TableTheme`: `deep-emerald`, `graphite-emerald`, `felt-texture`.
- `ChipTheme`: `poker-coach`, `block52`.

Selections persist locally under `poker-coach.visual-preview` in `localStorage`.
The preview state is separate from replay cursor, Hide Result, selected tab,
analysis state, and mock hand data, so switching themes does not reset the hand.

The Public Domain Deck remains available in `/design/card-lab`, but it is no
longer offered in the real Hand Replayer preview because the actual table
experience showed weaker rank/suit readability after normalization than the
other candidates. Existing saved Public Domain preview selections are migrated
back to the default Block52 replayer theme.

Replayer card themes use per-theme calibration tokens for Hero, board, and
compact contexts. The outer card footprint remains stable while the inner
SVG/image artwork is scaled to compensate for each deck's internal whitespace
and visual weight.

Production builds do not expose `/design/card-lab` and the normal card renderer
falls back to the existing Poker Coach card component when no dev preview theme is
provided.
