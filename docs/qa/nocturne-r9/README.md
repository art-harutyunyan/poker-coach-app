# Nocturne R9 visual QA

**Scope:** Replayer analysis panel and final R6–R9 composition. Primary design reference: `docs/subframe-design/design-guideline.md`; visual reference: `docs/subframe-design/design-screenshots/04_Hand_Replayer (2).png`.

## Captures

| State                              | Evidence                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Imported hand, preflop, 1440 × 900 | [imported-1440.png](imported-1440.png)                                           |
| Imported hand, 1280 × 900          | [imported-1280.png](imported-1280.png)                                           |
| Imported hand, 1024 × 900          | [imported-1024.png](imported-1024.png), [stacked panel](imported-panel-1024.png) |
| Imported hand, 390 × 900           | [imported-390.png](imported-390.png), [stacked panel](imported-panel-390.png)    |
| Imported hand, postflop            | [imported-flop-1440.png](imported-flop-1440.png)                                 |
| Second imported hand               | [imported-next-hand-1440.png](imported-next-hand-1440.png)                       |
| Demo fixture, Hero to act          | [demo-1440.png](demo-1440.png)                                                   |
| Demo fixture, opponent to act      | [demo-opponent-1440.png](demo-opponent-1440.png)                                 |

## Observations

- At 1440 and 1280, the analysis tile is 400px wide with an 8px gutter and aligns with the table tile. The unavailable state stays within the tile on action, street, and hand changes.
- Imported hands show only the unavailable explanation and existing source/alias guidance. They show no grade, EV value, recommendation, strategy mix, confidence, or demo tabs.
- The Phase 0 sample panel remains explicitly labelled **Illustrative analysis**. Its existing Decision and Context tabs and fixture content are retained. On a short desktop viewport it scrolls internally.
- At 1024 and 390, the tile stacks below the table without horizontal overflow. At a short desktop height, the imported panel is keyboard focusable and scrolls with PageDown.
- The top Replayer route tabs now use Nocturne text, line, accent, and focus styling. Table, seat, card, hand strip, and replay dock behavior were left intact.

## Verification boundary

Focused R9 application and Playwright checks, typecheck, lint, build, and formatting are run during implementation. The full unit and full Playwright suites remain for reviewer verification. No Strategy Engine or domain logic was implemented.

## Full-suite follow-up

The reviewer found six failures in the older `tournament-subpages.spec.ts`: five R1 tab-style comparisons expected the pre-Nocturne Replayer typography and colours, and one immutable-file check still protected `AnalysisPanel.tsx` despite its approved R9 changes. The guard now checks the approved Nocturne Replayer tab styles and keeps the remaining protected file hashes. The full `tournament-subpages.spec.ts` passes 18/18; a full Playwright rerun remains pending.
