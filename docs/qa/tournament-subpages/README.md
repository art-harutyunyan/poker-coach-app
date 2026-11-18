# Tournament subpage visual migration

Overview and Review Queue now reuse the approved Replayer/Tournaments presentation. The tournament tab bar uses the same rules in all three states. Replayer is unchanged, verified against pre-edit screenshots at every requested width.

## Screenshots

Chrome screenshots at a viewport height of 1000px. Overview and Review Queue desktop/mobile screenshots were visually inspected.

| Tab          | 1440 desktop              | 1024                      | 768                      | 430                      | 390 mobile               |
| ------------ | ------------------------- | ------------------------- | ------------------------ | ------------------------ | ------------------------ |
| Overview     | [View](overview-1440.png) | [View](overview-1024.png) | [View](overview-768.png) | [View](overview-430.png) | [View](overview-390.png) |
| Replayer     | [View](replayer-1440.png) | [View](replayer-1024.png) | [View](replayer-768.png) | [View](replayer-430.png) | [View](replayer-390.png) |
| Review Queue | [View](review-1440.png)   | [View](review-1024.png)   | [View](review-768.png)   | [View](review-430.png)   | [View](review-390.png)   |

`before/` contains the Replayer screenshots captured before editing, plus desktop/mobile captures of the old Overview and Review Queue. Replayer comparisons are byte-exact; tab comparisons cover font, color, border, spacing, radius, sizing rules, overflow, and active/inactive states. Button widths follow their label text.

## Changes

- `src/ui/App.tsx`: apply the existing `studyPage` presentation class to Overview and Review Queue. Routing, callbacks, component content, and data remain unchanged.
- `src/styles/global.css`, `src/styles/replayer-shell.css`: share the approved tournament tab rules across all values of `data-active-screen`. Replayer declarations and layout values are unchanged.
- `src/styles/study-pages.css`: reuse existing panel, metrics, progress, chart, typography, and responsive styles; add restrained state icons, category badges, and queue interaction states.
- `tests/visual/tournament-subpages.spec.ts`: responsive checks for all three tabs, queue data/target preservation, keyboard tabs, hover/focus, and protected-file hashes.

The poker table, PlayerSeat, seat positions, replay engine, analysis panel, replay controls, review component, chart component, and tournament fixtures have unchanged SHA-256 hashes from the beginning of this task. See `protected-files.json`.

## Validation

```text
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test tests/visual/tournament-subpages.spec.ts tests/visual/visual-migration.spec.ts --fully-parallel --workers=3
```

Results: lint, typecheck, build, and formatting passed. All 91 unit tests and all 47 focused browser tests passed.

The unit suite contains 91 tests. The focused browser run contains 47 tests: 18 tournament-subpage checks and the previous 29 visual-migration regression checks. This covers all five viewport widths, unchanged Replayer screenshots, exact shared tab styling, panels/chart labels/row clipping, every original queue target, keyboard navigation, replay stepping, and hover/focus states.

Baselines were captured on Windows/Chrome with local fonts; pixel rendering may differ on other operating systems.

## Remaining issues

No visual inconsistencies or responsive issues were found at the tested widths. Existing Phase 0 sample content, representative state examples, and queue semantics remain intact. No tournament, review, replay, or routing behavior was added or changed.
