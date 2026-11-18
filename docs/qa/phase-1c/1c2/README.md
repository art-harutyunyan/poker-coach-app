# Phase 1C.2 Session Tournament Library — review evidence

Status: READY FOR REVIEW; human visual acceptance pending. Phase 1C.1 is accepted; 1C.3 and 1C.4 remain unauthorised.

The Tournament Library retains distinct GG tournaments in React session memory. Entries are keyed by `[room,tournament.id]`, prepared with the accepted 1C.1 facts and metrics, and shown newest successful import first. Library rows show source name/ID, imported hand count, game, source buy-in and first imported hand's source-local time. No metric values or grades appear in the Library.

An exact repeat of the parsed tournament, including original hand order, metadata and source text, is identified as already imported even under another filename. A same-ID import with different parsed contents is rejected with the approved message and leaves the original entry unchanged. Partial exports are not merged. Parsing, preparation and initial replay adaptation must complete before a new entry is published. Upload attempts are separate from the current workspace; a bad, cancelled or superseded file cannot replace an accepted tournament.

Selected hand, tab, cursor and Hide Result state belong to each tournament. Opening a Library section shortcut changes only that tournament's tab. Returning to Library leaves its selection intact. A full page reload clears the entries. The mock Dashboard links and explicit development demo remain separate from imported tournaments.

If a selected hand fails while rendering, its error panel keeps a Library return and a source-hand selector. Choosing another hand uses the existing cursor-0/Hide Result reset. The error is isolated to the selected tournament and hand.

## Visual review

- [Desktop Library, 1440 px](library-1440.png)
- [Mobile Library, 390 px](library-390.png)
- [Desktop selected Replayer, 1440 px](replayer-1440.png)
- [Mobile selected Replayer, 390 px](replayer-390.png)
- [Restored A Replayer: selected hand, action cursor and result visibility](restored-a-1440.png)
- [Restored B Review Queue](restored-b-1440.png)

The browser suite also checks 1024, 768 and 430 px. The current implemented Study shell, typography, tabs, table, seats and PlayingCard system remain the visual source of truth. No filter controls or Tournament Stats presentation are introduced here.

## Verification

Post-review verification: 484 unit tests passed across 39 files, including the accepted 1C.1 corpus snapshots; typecheck, lint and production build passed. Scoped Prettier and git diff checks passed. The combined Playwright run passed 24/24 cases across the new Library, existing tournament import, Phase 1B.1 and approved PlayingCard suites. It exercised all five widths (1440/1024/768/430/390), four real corpus imports, A/B state restoration, duplicate/conflict/reload, keyboard section actions, existing replay privacy and card geometry. Focused controller/service/replay tests passed 38/38 earlier in execution.

New browser tests first exposed a mobile Library return hidden by the existing responsive rule and a 36 px card geometry shift from its initial header placement. The return action now sits beside the existing Import button; all five historical approved-card geometry cases passed in the final run. No historical reference was regenerated.

The pre-delivery baseline and executed logs are held in `.superpowers/sdd/2026-11-07-phase-1c-2-tournament-library/`. All 300 historical QA artifacts were copied before browser verification; the final browser run regenerated 47, each restored to its pre-run SHA-256. All 16 protected parser/domain/replay/card/seat/fixture/1C.1 files in the task manifest remain byte-identical, including the accepted metric-count JSON and four original exports.

One fresh independent final code review found no Critical issue and one Important recovery defect: reopening a tournament after a deterministic hand-render failure retried that same hand without an in-UI escape. A deliberately throwing first-hand UI test failed RED at the missing selector. The scoped error-panel hand selector passed GREEN and the full checks above were rerun. The reviewer also identified missing explicit test coverage for equal-name rows, unknown buy-in, source-local time and secondary keyboard actions; component and browser assertions now cover those. No second review was dispatched.

Limits: duplicate identity compares the complete parsed tournament representation, so changed raw whitespace or hand order under the same tournament ID is a conflict. Upload cancellation and stale-completion races are verified at the hook boundary; the browser suite verifies failed imports and retained workspace, but does not simulate a slow in-flight browser cancellation. Browser tests were authored after the unit-proved UI skeleton rather than before every UI route, as recorded below. Session entries clear on reload and are never written to import storage. These screenshots need human visual acceptance.

## Execution rulings

- The approved main worktree and native PowerShell ledger/checkpoints replace the skill's isolated-worktree/commit steps under the user's explicit no-commit instruction. Recovery depends on task baseline copies and scratch evidence.
- Historical single-import assertions expecting a failed import to erase the selected tournament or a Tournaments navigation click to reopen it were updated to the approved Library semantics. The new regressions enforce preserved state.
- Browser tests followed the unit-proved UI skeleton; their first run still caught mobile return and table geometry defects before the scoped fixes. No historical card or seat reference was regenerated.
- The render-error selector lists source hand number and ID only; it uses the existing selection reset and does not change normal Replayer geometry. The cost is a compact extra control in the rare error state.

No commits, pushes, merges, deployment, filters, Tournament Stats UI or unrelated product changes were made.
