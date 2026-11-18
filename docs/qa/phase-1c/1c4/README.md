# Phase 1C.4 Tournament Stats and integrated acceptance

Status: **READY FOR REVIEW — 2026-11-13**. The requested final matrix, targeted reruns and independent whole-phase review are complete. Human visual/product acceptance remains pending. Phase 1 remains IN PROGRESS.

The current Study application shell is preserved. On an imported tournament's Overview, audited VPIP/PFR/3-Bet appear above Saw Flop/WTSD · source-confirmed/W$SD · collected a share. Each uses the accepted [1C.1 audit baseline](../1c1/source-audit.md): integer numerator/denominator and the pure domain percentage. Definition and Coverage are expandable; Coverage shows exclusion counts/reasons and links to source hands. Replayer filters never rescope Overview. W$SD starts masked per tournament; explicit Show outcome stat reveals it, while Hide Result or a new hand selection remasks it. Hidden outcome values and audit rows are omitted from the DOM.

The real fixture regression expectations are the independently verified 1C.1 counts:

| Tournament          | VPIP   | PFR    | 3-Bet | Saw Flop | WTSD  | W$SD  |
| ------------------- | ------ | ------ | ----- | -------- | ----- | ----- |
| Monster 314729652   | 52/222 | 38/222 | 7/84  | 30/222   | 13/30 | 11/13 |
| Fifty 314806258     | 42/190 | 31/190 | 8/78  | 33/190   | 22/33 | 13/22 |
| GGMasters 317697722 | 6/28   | 6/28   | 2/11  | 5/28     | 2/5   | 1/2   |
| Classic 309704619   | 48/232 | 38/232 | 13/96 | 29/232   | 11/29 | 8/11  |

Percentages are rounded to one decimal for display. Null denominator is unavailable (—), never 0%. The source-confirmed showdown and collected-share qualifications, conservative exclusions and synthetic-only boundaries remain as documented in 1C.1.

## Focused implementation evidence

- Component and formatter started RED because modules were absent; they then passed **5/5** focused tests. These cover null/rounding, ordering, denominator labels, Definitions/Coverage, excluded hand links and hidden W$SD DOM privacy.
- Controller and App integration started RED for missing visibility state and Overview stats; then passed **2/2** focused tests. A targeted historical fixture-0 Overview test passed after updating its obsolete VPIP-absent assertion. Per-entry privacy and Hide Result reset are tested without changing replay semantics.
- New browser suite initially reported all nine cases passing but its auto-started Vite child did not close in the sandbox, so that run was interrupted without a success exit. Running Vite as a separate local process yielded a clean **9/9 Playwright pass with exit code 0**. After adding an A/B visibility case, the three affected browser cases passed **3/3**. The user reported the final ten-case suite passing. A review-driven strengthening of the one-hand privacy case passed its focused rerun **1/1**.

## Real app screenshots for visual review

- [Four-tournament Library](library-four-tournaments-1440.png).
- [Desktop Overview, W$SD masked](overview-masked-1440.png)
- [Mobile Overview, W$SD masked](overview-masked-390.png)
- [Desktop Overview, W$SD revealed](overview-revealed-1440.png)
- [Coverage and source hand link](coverage-1440.png).
- [200% zoom](stats-zoom-200.png)
- [Forced colors](stats-forced-colors.png)

Earlier [Library](../1c2/README.md) and [navigator](../1c3/README.md) screenshots remain relevant. These screenshots are implementation evidence; human visual acceptance remains pending. The separately accepted pre-existing 768px demo committed-bet/hole-card overlap remains outside 1C.4 and is not modified here.

## Scope and acceptance handoff

Only Overview stat presentation, entry-specific outcome visibility, the focused tests/browser suite, scoped CSS and this evidence/status prose are intended changes. The pre-task hash/copy ledger is `.superpowers/sdd/2026-11-07-phase-1c-4-stats-acceptance/`. It includes the accepted metrics/Library/filters, protected styles and all four immutable GG fixtures for post-task comparison. No parser, ledger, replay engine, PlayingCard artwork, table-seat geometry, persistence, accounts, AI, billing or later phase work is authorized.

The focused four-file unit run passed **7/7** after formatting; scoped ESLint, Prettier and tracked-file `git diff --check` passed. Protected baseline comparison found only the intended controller, Overview, App wiring/test and roadmap files changed. All 314 historical QA files outside the intentionally updated Phase 1C index remain byte-identical to the task baseline.

No commit, push, merge or deployment.

## First returned final-check results and targeted fix

The user reported the remaining requested final checks passing, except `typecheck`/`build` and five widths of the historical real-import browser case. TypeScript correctly rejected the new presentation helper's `replaceAll` under the repository's ES2020 library. A focused ES2020 compile reproduced the error (RED); replacing it with a global regular-expression replacement preserved all-word reason labels and passed the focused compile and 3/3 formatter tests (GREEN). Scoped ESLint and Prettier passed.

The browser failures shared one obsolete assertion that the imported Overview had no VPIP. The assertion now verifies approved Overview VPIP and default W$SD masking; every subsequent historical import, privacy and geometry assertion remains. The 1440px case passed in a focused browser rerun. The user subsequently reported all three requested reruns green: `npm.cmd run typecheck`, `npm.cmd run build`, and the five-width `tournament-import.spec.ts` representative-real-import selection. Browser execution rewrote 99 historical `.png`/`.json` QA artifacts, then nine more on the targeted rerun; each was restored from hash-verified pre-run copies. All 314 other pre-existing QA files remain byte-identical to the task baseline; the Phase 1C index is intentionally updated for this handoff.

## Final review and verification

A fresh independent whole-phase reviewer examined the 1C.1 metrics consumption, 1C.2 session boundaries, 1C.3 filter independence, 1C.4 outcome privacy, tests and 1440/390 screenshots. The reviewer found no Critical functional defect. One Important handoff finding was stale status/evidence prose, corrected here and in the phase index/Roadmap. Two Minor findings were actionable: repeated bare Definition/Coverage control names, and a one-hand browser privacy check that inspected visible text but not hidden DOM. The first failed a focused accessibility test for the intended reason, then passed **3/3** after adding metric-specific accessible names without changing visible copy. The strengthened one-hand browser assertion checks hidden W$SD HTML for its percentage, numerator/denominator and winning-hand ID before reveal and after Hide Result; it passed **1/1**. The existing component test also verifies outcome values and winning-hand identity are absent from masked HTML. A follow-up two-file component/App check passed **4/4**; scoped ESLint passed.

The user's initial final matrix passed except the two documented first-round failures; the targeted typecheck/build/real-import reruns all passed. After the review fixes, the user reported all three requested final commands passing: `npm.cmd run typecheck`, `npm.cmd run build`, and `npx.cmd playwright test tests/visual/phase1c-stats.spec.ts` (ten browser cases). This completes automated verification for 1C.4; the reported results are user-run, while focused RED/GREEN, ESLint, Prettier and whitespace checks above were run by the implementer. The separately accepted 768px demo bet-label/card overlap remains out of scope. Human visual acceptance is still pending; no next delivery is authorized.
