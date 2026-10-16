# Phase 0 Design Tokens

These tokens define the Phase 0 premium poker-analysis visual language. Future
phases should extend these values instead of inventing a new style.

## Typography

- Display/headline: Sora, explicitly loaded from Google Fonts.
- UI/body/data: Manrope, explicitly loaded from Google Fonts.
- Numeric poker data: Manrope with tabular numerals.

| Role             | Family          | Size guidance          |  Weight | Line height |
| ---------------- | --------------- | ---------------------- | ------: | ----------: |
| Page title       | Sora            | `1.3rem` to `1.76rem`  |     600 |        1.15 |
| Tournament title | Sora            | `1.74rem` to `2.72rem` |     600 |        1.08 |
| Section title    | Sora            | `1.1rem`               |     600 |        1.25 |
| Metric value     | Manrope tabular | `1.58rem`              |     600 |        1.00 |
| Player name      | Manrope         | component-relative     |     600 |        1.30 |
| Body copy        | Manrope         | `0.94rem` to `0.98rem` |     400 |   1.50-1.70 |
| Metadata         | Manrope         | `0.78rem` to `0.94rem` | 400-500 |   1.45-1.55 |
| Badge/label      | Manrope/Sora    | `0.72rem` to `0.82rem` | 500-600 |        1.20 |

Avoid 700+ weights in normal product UI. Use hierarchy through spacing, surface
contrast, and type scale before weight.

## Color

| Token             |       Value | Usage                             |
| ----------------- | ----------: | --------------------------------- |
| `--bg-0`          |   `#070706` | near-black application background |
| `--bg-1`          |   `#0d0d0c` | graphite page foundation          |
| `--bg-2`          |   `#151514` | charcoal panels and overlays      |
| `--surface-1`     | translucent | quiet level-1 surface fill        |
| `--surface-2`     | translucent | primary panel fill                |
| `--surface-3`     | translucent | selected/interactive surface      |
| `--border-1`      | translucent | subtle separators                 |
| `--border-2`      | translucent | hover/focus separators            |
| `--felt-0`        |   `#06120e` | deepest poker felt                |
| `--felt-1`        |   `#0b2a1f` | primary poker table felt          |
| `--felt-2`        |   `#124733` | table depth and felt highlight    |
| `--action`        |   `#8ecf9c` | primary action/control accent     |
| `--champagne`     |   `#d8bd7a` | premium/high-value emphasis       |
| `--text-1`        |   `#f3eadb` | warm off-white primary text       |
| `--text-2`        |   `#bcb6aa` | secondary text                    |
| `--text-3`        |   `#817d75` | metadata text                     |
| `--excellent`     |   `#60c878` | excellent decisions               |
| `--good`          |   `#9cc66f` | good decisions                    |
| `--inaccurate`    |   `#dda94e` | warnings/inaccuracies             |
| `--mistake`       |   `#ee765f` | mistakes                          |
| `--major-mistake` |   `#ff5d57` | major mistakes                    |

The poker-table green must remain distinct from the primary action green. Reserve
champagne for score/grade emphasis, active states, current poker actions, and
high-value highlights; normal headings should use warm off-white.

## Spacing

| Token       |  Value | Usage                    |
| ----------- | -----: | ------------------------ |
| `--space-1` |  `4px` | tight internal gaps      |
| `--space-2` |  `8px` | compact controls/cards   |
| `--space-3` | `12px` | seat and panel rhythm    |
| `--space-4` | `16px` | section internals        |
| `--space-5` | `20px` | primary panel padding    |
| `--space-6` | `24px` | page gutters             |
| `--space-7` | `32px` | large section separation |

## Radius

| Token         |  Value | Usage                                  |
| ------------- | -----: | -------------------------------------- |
| `--radius-sm` |  `5px` | buttons, compact controls              |
| `--radius-md` |  `8px` | panels, tabs, small cards              |
| `--radius-lg` | `10px` | brand mark and premium accent surfaces |

Cards and poker seats use component-specific radii so they read as poker-native
objects rather than generic dashboard cards.

## Elevation

| Token           | Usage                         |
| --------------- | ----------------------------- |
| `--shadow-1`    | primary panel depth           |
| `--shadow-2`    | elevated compact surfaces     |
| `--shadow-seat` | player-seat table integration |

Shadows should be soft and dark, never glow-heavy. Motion should stay in the
`150ms` to `250ms` range with `--ease-premium`.

## Poker-Specific Tokens

| Token      |  Value | Usage                      |
| ---------- | -----: | -------------------------- |
| `--card-w` | `47px` | board-card width           |
| `--card-h` | `66px` | board-card height          |
| `--chip-w` | `24px` | compact committed-bet chip |
| `--chip-h` |  `9px` | compact committed-bet chip |

Poker object rules:

- Hero remains bottom-center in table layouts.
- Dealer button is a required orientation marker.
- Pot values are BB-first with chip count secondary.
- Player seats prioritize position, name, BB stack, chip count, then state/action.
- Folded seats are subdued through opacity and saturation, not hidden.
- Only Hero, current actor, all-in, selected, or focused players receive emphasis.
- Bet markers represent committed chips spatially between the player and pot.
- Playing cards must render actual suit symbols, never raw internal notation.

## Chart Language

- Main analytic series: action green, `2.4px` stroke.
- Target/comparison line: champagne, dashed, `1.6px` stroke.
- Gridlines: warm off-white under `0.06` opacity.
- Axis labels: Manrope, `12px`, regular weight, muted warm gray.
- Point markers: small, restrained, visible on data points.
- Tooltips: charcoal surface, subtle border, warm text, soft depth.

Charts should feel integrated with Poker Coach surfaces rather than default chart
library output.
