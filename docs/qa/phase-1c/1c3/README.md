# Phase 1C.3 hand filtering and navigation evidence

Status: **READY FOR REVIEW** (2026-11-13). The user returned the initial and post-review final commands as passing. The separate 768px demo geometry failure remains open and is identified below. Human acceptance is pending. No 1C.4 work has started.

The Replayer rail now reads the accepted 1C.1 `played`, `sawFlop` and `heroShowdown` facts in source order. All includes every imported hand; positive filters include only known true facts and report unknown classifications separately. The 1C.2 session controller stores the active filter per tournament. Switching filters leaves the current hand, replay cursor and Hide Result state intact. The existing Review Queue still lists all hands and a Queue selection returns to Replayer without clearing its filter. Previous/Next hand navigation does not wrap and uses the existing hand-selection reset.

Controls stay inside the existing navigator. Desktop narrow rails show all four filters in a compact two-column grid. On mobile, the controls and scrollable hand cards share the rail's original 115px height; this card-area layout adjustment keeps the previously frozen table position. Source hand numbering and approved compact cards remain unchanged. A selected hand outside the filter stays on the table with **Current hand is outside this filter** and **Show all hands**. Zero-match imports retain the table and offer the same All action. The control names differ from action Back/Forward.

## Focused RED/GREEN evidence

- Pure selector: missing-module RED; GREEN with accepted hand-facts tests, 31/31.
- Per-tournament controller: RED for missing `activeFilter`/setter; GREEN, 2/2.
- Controls: missing-component RED; GREEN, 3/3 after an outside-position correction.
- Navigator: RED for missing control/empty slots; GREEN, 4/4.
- App integration: RED for missing controls; GREEN with the real 28-hand import, 1/1. A test-only stale DOM reference was corrected after Queue tab switching.
- Final grouped 1C.3 unit run after formatting: **5 files, 14/14**.
- A subsequent focused app rerun after memoizing adjacent IDs timed out once at the 30-second test limit under a slow run, then passed unchanged. Its test limit was raised to 60 seconds without changing assertions; the user later reported the full suite passing with one worker and file parallelism disabled.
- Initial focused Playwright suite: **9/9** after two browser-driven fixes. At 430/390, an outside-filter notice initially shifted the table 52px; putting it in the compact navigation row removed that movement. At 1440, horizontal overflow initially hid filter choices; a two-column desktop grid shows all four. The suite covers 222/233-hand imports, per-entry restoration, Queue independence, zero matches, five viewport widths and 200% zoom.

## Returned final-verification results and targeted corrections

The user's first full unit run reported 490 passes and six timeouts, typecheck/build found a `never[]` inference in the new filter test, and lint found an unused test import. The type annotation and import were corrected; focused typecheck, scoped lint, Prettier and the two affected test files passed. The four unit files that timed out passed together when rerun alone (37/37), indicating full-run contention. The user then reported the full unit suite, typecheck, lint and build passing.

The user's historical browser run reported 17 demo Replayer/shell failures. A focused reproduction showed a blank page and Vite `504 Outdated Optimize Dep` for `@letele/playing-cards` from the already-running port-5180 server. After replacing that stale server, the user's shell rerun passed 9/9. The targeted demo Replayer rerun passed 7/8; the 768px 8-max case exposed a 4.125px overlap between the BTN committed-bet label and its hole cards at the bet checkpoint. A focused rerun reproduced the same collision. The 1C.3 pre-task copies show `poker-seats.css` and `PlayingCard.tsx` byte-identical, while the only `App.tsx` change passes props to the imported workspace; the failing demo path is unchanged. This is a separate pre-existing demo geometry defect, not evidence that the new imported-hand controls moved the table. No demo seat, bet, card or table geometry was altered under 1C.3.

The user's approved-card regression found an exact +94px table offset at 430/390. The mobile rail had grown from 115px to 209px when filters stacked above the hand cards. The mobile controls now occupy the original rail footprint alongside the horizontal hand list, with outside-filter notice and All action visible without changing table or seat coordinates. The user's targeted mobile browser rerun passed 18/18 across Library, navigation, import, tournament subpages and approved cards. Browser-generated historical QA files were restored from the pre-task copies; the latest run rewrote 37 of them, and those were restored from hash-verified copies.

The accepted source audit establishes Postflop/Showdown counts of 30/13 for Monster (222 hands), 29/11 for Classic (233 hands), and 5/2 for GGMasters (28 hands). Played browser expectations 53/50/6 were derived from the independent raw-source scanner ledger retained under `.superpowers/sdd/2026-11-07-phase-1c-1-facts-metrics/independent-hands.json`: a hand is counted when its source-scanned voluntary entry, Hero flop participation or confirmed Hero showdown is true, with unresolved eligibility excluded. These are filter expectations, not new poker metric baselines. The 1C.1 metric-count JSON remains byte-identical.

## Manual visual evidence

- [222-hand desktop Showdown navigation](filtered-222-desktop.png)
- [Desktop navigator with all four filters](navigator-1440.png)
- [Mobile navigator and outside-filter notice](navigator-390.png)
- [Mobile navigator with an unknown classification](unknown-390.png)
- [Controlled zero-match import](zero-match.png)
- [200% zoom](navigator-zoom-200.png)

These screenshots are implementation evidence for human visual review. Human acceptance remains pending. The browser suite found no horizontal page overflow in its five-width matrix and compared table/seat rectangles before and after filter changes. It did not establish a general performance bound for 674-hand lists; no virtualization was added.

## Scope and pending checks

The pre-task hash/copy ledger is `.superpowers/sdd/2026-11-07-phase-1c-3-hand-navigation/`. Its comparison shows only intended UI and Roadmap files changed among the protected baseline set. All 307 historical QA artifacts remain byte-identical. Parser, replay, accepted facts/metrics, PlayingCard assets, table styles and immutable GG fixtures were not edited.

The user reported passing reruns of `npm.cmd test -- --maxWorkers=1 --no-file-parallelism`, `npm.cmd run typecheck`, and `npm.cmd run build`; their full lint and scoped formatting checks passed. One fresh independent code review found no Critical issues and one Moderate mobile notice-placement defect. A real Classic import at 390px reproduced the unknown notice extending 16px below the navigator (RED). The first in-rail placement overlapped the outside-filter action; a strengthened regression caught that too. The final scoped CSS keeps the notice in the navigator's left column and compresses only that rare state. The focused browser case passed after the fix and formatting, with unchanged table/seat rectangles. The user subsequently reported the post-fix typecheck, build and focused browser rerun passing. Scoped ESLint, Prettier and tracked-file diff checks passed; all 307 historical QA hashes remain intact. The new screenshot above is review evidence, not acceptance. The separate 768px demo geometry failure remains open, so that historical browser case is not recorded as passing. No commits, pushes, merges, deployments, persistence or Stats UI changes were made.
