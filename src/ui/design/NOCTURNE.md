# Nocturne foundation (R0)

`NocturnePrimitives.tsx` exports opt-in surfaces, buttons, icon buttons, status badges, grade pills, search inputs, filter chips, segmented controls, an unavailable value and an empty state. Importing a primitive loads `nocturne.css`; current pages do not import them. For existing Radix tabs, apply `noc-tabs-list` to the list and `noc-tabs-trigger` to triggers when that page migrates. `NocturneGradePill` uses the handoff contract `grade: best | good | inaccuracy | mistake | major` plus a required visible `label`. Later page work maps domain grades to these visual grades.

The CSS defines `--noc-*` surface, text, accent, table, position, card, grade, status, type, spacing, radius and layout tokens. Use `noc-type-*` classes for display, heading, metric, body, caption and mono roles. `--noc-selected` is the approved `#22261A` surface for selected items. Focus uses a visible outline distinct from the selected border. Empty and unavailable states use neutral text and border treatments.

The guideline names five grade tokens without hex values. Their values in `nocturne.css` were sampled from the flat decision-quality bar in `01_Study_Overview (2).png`: Best `#5EE0A0`, Good `#A6D86C`, Inaccuracy `#F2C14E`, Mistake `#F28A4E`, Major mistake `#F25C6E`. Each grade component includes its text label.

Funnel Display, Geist and DM Mono are not present as project assets. The font tokens name them first, then use existing Sora/Manrope or system stacks. No font files or dependencies were added. The card and felt values are tokens only; existing PlayingCard and table rendering remain untouched.
