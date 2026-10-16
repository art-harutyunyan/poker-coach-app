# ADR-002 - Design System and UI Foundation

## Status

Accepted for Phase 0

## Context

The product must feel like serious premium study software, not a generic casino
or AI dashboard. Phase 0 also requires research of at least three current React
design-system/component approaches before choosing a foundation.

## Candidates

| Candidate             | Accessibility                                  | Dark/theme support                          | Interaction quality                                       | Custom poker primitives                | Risk of generic appearance                           | Complexity    | Notes                                                                                                                                                                                            |
| --------------------- | ---------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Radix Primitives      | Strong WAI-ARIA, focus, keyboard patterns      | Unstyled, token-friendly                    | Dialog, tabs, tooltip, switch, menu primitives are mature | Excellent because visuals stay custom  | Low if we avoid default themes                       | Moderate      | Official docs describe unstyled accessible primitives and state attributes for styling. Sources: https://www.radix-ui.com/primitives and https://www.radix-ui.com/primitives/docs/guides/styling |
| React Aria Components | Very strong accessibility baseline             | Styling is flexible but more framework-like | Excellent keyboard and screen-reader patterns             | Strong, though APIs can be verbose     | Low                                                  | Moderate/high | Good fit for teams prioritizing maximal a11y infrastructure. Source: https://react-spectrum.adobe.com/react-aria/components.html                                                                 |
| Mantine               | Broad component suite with built-in dark theme | Native dark scheme and theme object         | Polished product components                               | Good, but visual defaults can dominate | Medium                                               | Moderate      | Fast to assemble dashboards; needs heavy customization for unique poker identity. Sources: https://mantine.dev/ and https://help.mantine.dev/q/are-mantine-components-accessible                 |
| shadcn/ui             | Radix-based components copied into app         | Tailwind/CSS-variable theming               | Good if maintained locally                                | Good                                   | Medium/high because defaults are widely recognizable | Moderate      | Useful registry, but adopting it wholesale risks a familiar admin-dashboard look. Source: https://ui.shadcn.com/docs/components                                                                  |

## Decision

Use Radix Primitives for accessible interaction behavior, custom CSS tokens for
the visual system, Recharts for Phase 0 charting, and lucide-react for icons.

## Why It Fits Poker Coach

- Poker table, cards, chips, grades, and replay controls need bespoke visuals.
- Radix keeps accessibility/focus behavior for tabs, switch, and tooltips without
  imposing a visual layer.
- Custom tokens allow a restrained dark-first product identity with semantic
  decision colors.
- Recharts is sufficient for Phase 0 trend visualization and can later be swapped
  behind chart components if deeper analytics need another library.

## What Remains Custom

- Poker table layout and seat geometry.
- Playing cards, stacks, pot display, action timeline, replay controls.
- Decision grades, strategy frequency display, review queue, and empty/loading/error
  state language.

## Styling and Token Strategy

Global CSS variables define backgrounds, surfaces, borders, text levels, accent,
semantic decision colors, radius policy, shadows, timings, and focus rings.
Component classes consume tokens directly. No default library theme is used.

## Charting Strategy

Use Recharts behind `DevelopmentChart` for Phase 0. Future chart needs should stay
behind poker-development components rather than leaking a charting API across the
product.

## Motion Strategy

Use subtle CSS transitions for replay emphasis and focus states. Avoid decorative
animation.

## Accessibility Implications

Radix handles common keyboard/focus patterns for tabs, switch, and tooltips. Custom
poker primitives still require semantic labels, visible focus, and non-color labels
for grades and severity.
