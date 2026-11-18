# Tournaments visual migration

Dashboard, Development, Training, and Playbook now reuse the approved Tournaments Replayer palette, local typography, surfaces, buttons, borders, spacing, and responsive navigation. The same sidebar applies to every section and Tournament tab, as confirmed in the task clarification.

The approved Replayer is unchanged. The five `tournaments-*.png` images match the corresponding pre-migration images in `before/` byte for byte. Overview and Review Queue were subsequently migrated in the [tournament-subpage migration](../tournament-subpages/README.md).

## Screenshots

Chrome viewport height: 1000px. Desktop and mobile screenshots were visually inspected. Automated bounds and navigation checks cover all five widths.

| Page                 | 1440 desktop                 | 1024                         | 768                         | 430                         | 390 mobile                  |
| -------------------- | ---------------------------- | ---------------------------- | --------------------------- | --------------------------- | --------------------------- |
| Dashboard            | [View](dashboard-1440.png)   | [View](dashboard-1024.png)   | [View](dashboard-768.png)   | [View](dashboard-430.png)   | [View](dashboard-390.png)   |
| Development          | [View](development-1440.png) | [View](development-1024.png) | [View](development-768.png) | [View](development-430.png) | [View](development-390.png) |
| Training             | [View](training-1440.png)    | [View](training-1024.png)    | [View](training-768.png)    | [View](training-430.png)    | [View](training-390.png)    |
| Playbook             | [View](playbook-1440.png)    | [View](playbook-1024.png)    | [View](playbook-768.png)    | [View](playbook-430.png)    | [View](playbook-390.png)    |
| Approved Tournaments | [View](tournaments-1440.png) | [View](tournaments-1024.png) | [View](tournaments-768.png) | [View](tournaments-430.png) | [View](tournaments-390.png) |

## Files and scope

- `src/styles/study-shell.css`: extracted Tournaments tokens and shared navigation, including responsive and interaction states.
- `src/styles/study-pages.css`: scoped presentation for the four migrated pages.
- `src/styles/global.css`, `src/styles/replayer-shell.css`: remove page-specific navigation ownership; retain Tournament content styles.
- `src/main.tsx`: load the shared and migrated-page styles.
- `src/ui/App.tsx`: presentation classes only. Routes, handlers, data, and component content are unchanged.
- `src/ui/components/DevelopmentChart.tsx`: token-based chart colors, fonts, tooltip, and right margin for the final label. Data, axes, calculations, and interactions are unchanged.
- `tests/visual/visual-migration.spec.ts`: responsive geometry, screenshot preservation, navigation, interaction, and protected-file checks.

No poker table, PlayerSeat, seat layout, replay engine, data fixture, review-queue logic, or replay-control files were changed in this task. Their pre-migration SHA-256 hashes are recorded in `protected-files.json` and verified by the browser suite.

## Validation

```text
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test tests/visual/visual-migration.spec.ts --fully-parallel --workers=3
```

Results: lint, typecheck, build, and formatting passed. All 91 unit tests and all 29 migration browser tests passed.

The unit suite contains 91 tests. The migration browser suite contains 29 tests: 20 page/width checks, five exact Tournament screenshot comparisons, one protected-file check, two navigation/action flows, and one hover/focus/chart-tooltip check. Page checks cover horizontal overflow, clipped text, chart labels, panel treatment, runtime errors, and navigation styles against the approved source.

PNG baselines were captured on Windows/Chrome before editing. Refresh them only when an approved Tournaments visual change is intentional. Font rendering can differ on other operating systems.

## Existing limitations

Training and Playbook are Phase 0 placeholders in this checkout. They have no trainer, range matrix, or range selectors; their existing content and behavior were preserved. No new features or mock semantics were introduced.

The remaining Tournament Overview and Review Queue content styles were subsequently migrated. See the [tournament-subpage QA report](../tournament-subpages/README.md).
