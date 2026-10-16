# Approved Seat System QA

Phase 0: READY FOR REVIEW. These are browser-rendered screenshots, not mockups.

## Review First

- [Desktop source / implementation](comparison-table-1440.png)
- [Mobile source / implementation](comparison-table-390.png)
- [1440 / 8-max](1440-8max.png)
- [390 / 9-max](390-9max.png)
- [390 / 8-max flop bet](390-8max-bet.png)
- [390 / 9-max all-in](390-9max-all-in.png)

The source and app use different mock players/stacks. Both comparisons show the
SB Hero decision after a BTN raise. Card artwork is the existing app preview theme;
the shared plate anatomy and normalized geometry follow the approved source.

## Responsive Matrix

Every cell has a full-page `<width>-<count>max.png` screenshot and browser assertions
at initial, blinds, raise, call, flop, check, bet, turn and river checkpoints.

| Width | 6-max                 | 8-max                 | 9-max                 |
| ----- | --------------------- | --------------------- | --------------------- |
| 1600  | [View](1600-6max.png) | [View](1600-8max.png) | [View](1600-9max.png) |
| 1440  | [View](1440-6max.png) | [View](1440-8max.png) | [View](1440-9max.png) |
| 1280  | [View](1280-6max.png) | [View](1280-8max.png) | [View](1280-9max.png) |
| 1024  | [View](1024-6max.png) | [View](1024-8max.png) | [View](1024-9max.png) |
| 768   | [View](768-6max.png)  | [View](768-8max.png)  | [View](768-9max.png)  |
| 430   | [View](430-6max.png)  | [View](430-8max.png)  | [View](430-9max.png)  |
| 390   | [View](390-6max.png)  | [View](390-8max.png)  | [View](390-9max.png)  |
| 375   | [View](375-6max.png)  | [View](375-8max.png)  | [View](375-9max.png)  |

Additional table crops: `1440-8max-<state>.png` and `390-8max-<state>.png` for all
nine checkpoints above. All-in captures: `1440-<count>max-all-in.png` and
`390-<count>max-all-in.png` for 6, 8 and 9 players.

`source-<width>.png`, `source-table-<width>.png`, `table-<width>.png` and paired
`comparison-screen/table-<width>.png` provide source evidence at 1440 and 390.

## Automated Checks

`npm run test:visual` checks player counts, visible names/stacks, top-right badges,
centered attached cards, fold removal, valid current actor, Hero bottom-center,
dealer ownership, no page overflow, plate/card/bet collisions and pot/board clearance.
The interaction test exercises Back, Forward, keyboard, both accepted card themes,
all three table themes, the alternate chip theme and Hide Result/grade independence.

The test runner uses installed Chrome. Initial remote assets must finish loading
before screenshots; failed images and page JavaScript errors fail QA.
Final results are recorded in [design-qa.md](../../../design-qa.md).

Screenshots are for human review, not automatic approval. Phase 0 is not COMPLETE.
