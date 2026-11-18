# Phase 1C.2 Session Tournament Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development task-by-task after authorization.

**Goal:** Retain multiple session tournaments, safely recognize duplicates/conflicts, and restore each tournament's selected workspace.

**Architecture:** A pure insertion boundary prepares immutable entries with 1C.1 facts/metrics. The existing import hook owns entries and per-entry view state separately from the transient upload attempt; existing replay remains the selected-hand projection.

**Tech Stack:** Existing React, TypeScript, Radix, Vitest and Playwright; no new store/router/dependency.

**Spec:** [Approved design](../specs/2026-11-07-phase-1c-tournament-library-stats-design.md), sections 1, 3-5; [shared contract](2026-11-07-phase-1c-deliveries.md). Dependency: accepted [1C.1 contracts](2026-11-07-phase-1c-1-facts-metrics.md).

## Global Constraints

- Main worktree, session memory only; no merge/replacement of same-ID conflicts, persistence or account inference.
- Current application shell and Study surfaces are visual authority. Metadata-only Library; no statistics in rows.
- Keep replay/card/seat semantics and existing demo/QA access. No mockup shell, banners, footer or proposal text.
- No filters or Stats UI yet. Stop at this delivery's review; no commit/push/deploy.

## Review Focus

- Failed/cancelled/superseded B must preserve A: Tasks 1/2.
- Same-ID altered export versus exact duplicate under another filename: Task 1.
- A/B state bleed and failed-hand error boundary: Tasks 2/3.
- Mock dashboard links accidentally opening a real tournament under mock metadata: Task 3.
- Same-name rows and mobile actions/keyboard access: Tasks 3/4.

## Task 1: Pure library identity and prepared insertion

**Files:** Create `src/services/tournamentLibrary.ts` and `.test.ts`. Consume `ImportedTournament`, `ParserWarning`, and 1C.1 metric APIs/types.

**Interfaces:**

```ts
interface LibraryEntry {
  key: string;
  tournament: ImportedTournament;
  warnings: readonly ParserWarning[];
  facts: readonly MetricInput[];
  metrics: PokerMetrics;
}
type LibraryInsertResult =
  | { status: "added"; entry: LibraryEntry }
  | { status: "already-imported"; key: string }
  | { status: "conflict"; key: string; tournamentId: string };
function tournamentKey(t: Pick<ImportedTournament, "room" | "id">): string;
function prepareLibraryInsert(
  entries: readonly LibraryEntry[],
  tournament: ImportedTournament,
  warnings: readonly ParserWarning[],
): LibraryInsertResult;
```

The helper returns an outcome, not a mutated collection. Key is JSON tuple `[room,id]`. Compare full parsed tournament content recursively with stable object-key ordering and original array order, including raw source/provenance; upload filename/separate warning filenames are not part of comparison. No time/random IDs or hash-only equality. Changed whitespace/newlines may conflict as approved. Facts generated only for added entries.

- [x] Write RED tests: A then B -> two stable distinct keys; same name/different IDs accepted; renamed identical file -> already-imported; same ID with different hands, metadata, source order or raw whitespace -> conflict. Deep-frozen existing entries unchanged; duplicate does not recompute facts or reset data. Unsupported metrics preserve entry with exclusions; metadata diagnostics retained.
- [x] Run `npm.cmd test -- src/services/tournamentLibrary.test.ts --maxWorkers=2`; expect failure for missing helper/outcomes.
- [x] Implement helper with canonical-data comparison and accepted 1C.1 composition. Unexpected preparation exceptions are handled as integration failures by controller, not partial insertions.
- [x] Rerun focused tests and `src/domain/pokerMetrics.test.ts`; all pass. Record task checkpoint, no commit.

## Task 2: Library controller and per-entry replay state

**Files:** Modify `src/ui/useTournamentImport.ts`, `src/ui/useTournamentImport.test.tsx`. Keep import service signature unchanged.

**Interfaces:** Export the following types from the hook module; retain `ReadyImportState` fields used by the existing workspace: status ready, tournament, warnings, selectedHandId, replay, frame, resultHidden. Make warnings readonly to accept LibraryEntry without mutation.

```ts
interface TournamentViewState {
  selectedHandId: string;
  activeTab: TournamentTab;
  cursor: number;
  resultHidden: boolean;
}
type ImportAttempt =
  | { status: "idle" }
  | { status: "reading"; fileName: string }
  | { status: "error"; error: ImportFailure }
  | { status: "conflict"; tournamentId: string }
  | { status: "complete"; key: string; duplicate: boolean };
type LibraryView = { kind: "library" } | { kind: "tournament"; key: string };
interface TournamentImportSession {
  entries: readonly LibraryEntry[];
  attempt: ImportAttempt;
  view: LibraryView;
  selected: ReadyImportState | null;
  activeEntry: LibraryEntry | null;
  activeTab: TournamentTab | null;
  replayError: { key: string; handId: string; message: string } | null;
  importFile(file: File): Promise<void>;
  cancelPendingImport(): void;
  resetImportAttempt(): void;
  openTournament(key: string, tab?: TournamentTab): boolean;
  showLibrary(): void;
  setTab(tab: TournamentTab): void;
  selectHand(id: string): boolean;
  setCursor(cursor: number): void;
  setResultHidden(hidden: boolean): void;
  reportIntegrationError(): void;
}
```

`useTournamentImport(readImport = importTournamentFile): TournamentImportSession` remains the entry point. Per-entry records stay private. Later deliveries add filter/outcome fields to this controller. App's demo view stays separate. A new entry initializes first hand/Overview/cursor 0/resultHidden true; success does not change current view. Open without tab restores saved state; explicit tab overrides only that tab. Entries are newest successful import first. One active replay cache keyed by entry+hand suffices; restore cursor/privacy from view records.

- [x] Write RED tests: real fixture A/B preserves both; restores A hand/cursor/hidden/tab after B; Library return changes no records; invalid key/hand/cursor safe; selectHand retains existing cursor-0/hidden reset. New import stays in current view until Open. Duplicate restores saved state; conflict/failure/cancel/stale generation/unmount cannot change entries/view. Preserve latest-attempt-wins/StrictMode tests, replacing only obsolete clear-old-success expectations. First adaptation failure rejects new entry atomically. Later replay/render failure is scoped; B remains selectable; successful valid-hand reselection clears the relevant error. No storage writes.
- [x] Run `npm.cmd test -- src/ui/useTournamentImport.test.tsx --maxWorkers=2`; confirm intended failures.
- [x] Implement separate entry/view/attempt state with existing generation/mount safeguards and synchronous ref/state publishing. Prepare facts plus first replay before publishing a new entry. Reuse existing clamps/adapter. Switching views never causes delayed navigation on completion. ResetImportAttempt invalidates pending generation and clears only upload status; use when opening a fresh upload dialog. Cancel likewise preserves entries/view. Error copy is fixed/safe, never raw exceptions.
- [x] Rerun hook tests, `src/services/tournamentImport.test.ts` and existing replay compatibility tests. All pass; checkpoint.

## Task 3: Library and existing-workspace integration

**Files:** Create `src/ui/components/TournamentLibrary.tsx`, `.test.tsx`, `TournamentUpload.test.tsx`, `src/styles/tournament-library.css`. Modify `src/ui/App.tsx`, `App.test.tsx`, `importedTournament.test.tsx`, `components/TournamentUpload.tsx`, `components/ImportedTournamentWorkspace.tsx`, `src/main.tsx`. Prefer keyed remounting of existing `ImportedReplayBoundary` over rewriting it. Propagate readonly warnings to `ImportDiagnostics` props if required; no diagnostic behavior changes.

**Interfaces:** `TournamentLibrary({entries,onOpen,onImport})` takes readonly LibraryEntry[], `onOpen(key:string,tab:TournamentTab):void`, `onImport():void`. TournamentUpload consumes `attempt: ImportAttempt`, `completedEntry: LibraryEntry|null`, `onImport(file:File):Promise<void>`, `onOpenReview(key:string):void`. Workspace retains ReadyImportState/replay callbacks and adds `onReturnToLibrary():void`.

- [x] Write RED tests: empty/import state, four metadata-only rows, unknown buy-in, source-local time without conversion, primary Overview and secondary shortcuts, no mock grades/profit/stats. B failure leaves A readable; duplicate/conflict preserve workspace. Conflict copy exactly: `Tournament {id} is already imported with different contents. The existing tournament has been kept. Combining exports is not supported yet.` Duplicate heading is `Already imported`; new success retains `Import complete`. A/B headings include correct name/ID; keyboard opens all actions; reload empties library. Error boundary key `${entry.key}:${selectedHandId}` permits recovery. Mock dashboard buttons open demo, never selected real entry.
- [x] Run `npm.cmd test -- src/ui/components/TournamentLibrary.test.tsx src/ui/components/TournamentUpload.test.tsx src/ui/App.test.tsx src/ui/importedTournament.test.tsx --maxWorkers=2`; observe RED.
- [x] Implement Library/selected view inside current tournaments route; sidebar/mobile Tournaments calls showLibrary. Preserve current shell/buttons/headings and three workspace tabs. Explicit dev/QA `?route=tournaments&tab=<valid-tab>` with empty library retains demo preview; normal production Tournaments opens Library. A clearly labeled development-only View demo tournament action may expose that preview; no demo row in real Library. Mock Dashboard tournament links explicitly open demo workspace. Imported selection never inherits demo cursor/tab. Current development Card Lab untouched. Add only scoped Library CSS and its main.tsx import.
- [x] Rerun component/integration tests. Update old assertions only for intentional single-import replacement; retain source/reveal/card coverage. Record checkpoint.

## Task 4: Browser evidence and delivery stop

**Files:** Create `tests/visual/phase1c-library.spec.ts`, `docs/qa/phase-1c/1c2/README.md` and screenshots. Scoped existing upload expectations/Roadmap evidence only.

- [ ] Write browser regressions and observe failures before UI completion: A=222 and B=233 imports; independent selected hands/cursor/privacy/tab; duplicate under another filename; conflicting A subset; cancel/failure; return; four actual corpus imports coexist. Five widths 1440/1024/768/430/390, same-name disambiguation, keyboard actions, no import storage writes or console errors. Compare table/card/seat rectangles on same hand/cursor to pre-delivery baseline.

  Execution variance: browser tests followed the unit-proved UI skeleton. They still exposed mobile visibility and card-geometry failures before their fixes. Browser coverage includes the real A/B/four-tournament, keyboard, failure, duplicate/conflict, reload, storage and five-width cases; cancellation races and same-name metadata cases are verified at the hook/component boundaries. See the [delivery evidence](../../qa/phase-1c/1c2/README.md).

- [x] Run `npx.cmd playwright test tests/visual/phase1c-library.spec.ts tests/visual/tournament-import.spec.ts tests/visual/phase1b1-refinement.spec.ts tests/visual/playing-cards.spec.ts`; require green. Preserve old QA artifacts per index. Capture Library desktop/mobile and restored A/B workspace.
- [x] Run common verification and a fresh independent review of races, demo separation, identity/conflicts and unchanged shell. Fix substantive findings with regressions. Record results/Roadmap and stop **1C.2 READY FOR REVIEW** before 1C.3.
