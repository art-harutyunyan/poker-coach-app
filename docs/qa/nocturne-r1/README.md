# Nocturne R1 shell visual check

Checked the Vite development build in Chromium on 2026-11-17. R1 changes only the shared shell; the page interiors in these captures retain their previous presentation.

| View                            | Capture                                      | Shell observation                                                                        |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Dashboard, 1440 × 900           | [dashboard-1440.png](dashboard-1440.png)     | Fixed 72px rail; Dashboard active; Nocturne background and 8px workspace edge gutter.    |
| Tournaments library, 1440 × 900 | [tournaments-1440.png](tournaments-1440.png) | Tournaments active; library remains usable in the workspace.                             |
| Demo Replayer, 1440 × 900       | [replayer-1440.png](replayer-1440.png)       | Tournaments active; page header and replay content align after the rail.                 |
| Demo Replayer, 1280 × 800       | [replayer-1280.png](replayer-1280.png)       | Compact desktop rail remains 72px; avatar visible after fixing a legacy breakpoint rule. |
| Demo Replayer, 390 × 844        | [replayer-390.png](replayer-390.png)         | Existing mobile screen selector shown; rail hidden; no horizontal document overflow.     |

Browser geometry checks found no horizontal document overflow in these views. The desktop rail used `position: fixed` and measured 72px wide. At 390px, the mobile selector was visible and the main workspace began at x=0. Vertical page scrolling remains as before for legacy interiors. The mobile navigation presentation is provisional until a Nocturne mobile design is approved.

## Verification follow-up

The reported imported-tournament assertions now match the R1 rail: the visible action says “Import” and retains the accessible name “Upload tournament.” The large import fixture test has a 15-second timeout to accommodate full-suite contention; the focused file passed all nine tests.

The visual tests for the legacy page interiors now check their content and interaction inside the R1 shell. The playing-card test compares table placement relative to the felt across the five approved viewport widths. Focused Playwright runs passed: visual migration 29/29, tournament subpages 18/18, imported cards 5/5, and the corrected mobile import notice 1/1. These focused runs do not establish that the entire visual suite passes.

Playwright writes `playwright-report/index.html` and `playwright-report/results.json` after a run. To share a complete failure report, include the entire `playwright-report` directory and `test-results` directory; the HTML entry point alone may not contain traces and screenshots.
