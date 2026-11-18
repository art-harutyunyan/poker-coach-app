# GG Tournament Import and Real Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Import a local GG tournament file into real tournament navigation and
deterministic replay without mock analytics, AI, persistence, or visual redesign.

**Architecture:** Extend the existing replay contracts, adapter, and engine to
represent source events faithfully. A local file service supplies typed parser
outcomes to a React runtime controller; the existing application selects an
explicit demo or imported workspace. Keep chip calculations in the existing
domain layer and privacy in presentation/navigation.

**Tech Stack:** Existing React 18, strict TypeScript, Zod 3, Vitest/Testing Library,
Playwright/Chrome, and Vite. No new dependencies are planned.

**Spec:** [Approved Phase 1B specification](../specs/2026-10-19-gg-replay-integration-design.md),
approved 2026-10-19. Implementation approved 2026-10-19 with coordinate-based
seat uniqueness and a representative responsive browser matrix. Execution is native
task-by-task with one independent final review; no commits, pushes, deployments,
or Phase 1C work are authorized.

## Global Constraints

- Processing stays local and in memory. Refreshing may lose the import.
- Do not introduce another parser, adapter, replay engine, or tournament domain model.
- No AI/API calls, strategy calculations, solver, grading, recommendations,
  analytics engine, persistence, localStorage for imports, backend/cloud upload,
  authentication, profiling, ICM, subscriptions, or Phase 1C work.
- Preserve the approved visual system, routing approach, and unrelated functionality.
- Retain exact integer chips and reconcile pot plus stacks with starting stacks.
- Multiple source collections do not authorize side-pot construction, eligibility
  solving, hand-strength evaluation, or minimum-raise/action-order adjudication.
- Never invent expected poker calculations or regenerate expectations from parser output.
- Keep all three existing real GG fixtures byte-identical. Use the existing fixture
  helper and source-backed assertions; do not duplicate parser grammar in tests.
- Use TDD for changed behavior, required independent verification, and final review.
- Work in the existing main development worktree. Preserve all pre-existing edits;
  `.git` is read-only in this environment. Do not stage, commit, push, or create
  another worktree without authorization. Record verification at task checkpoints.
  Before implementation, record repository status and SHA-256 hashes of all three
  fixture files so final verification can distinguish new and pre-existing work.
- Use Context7 only for genuinely needed current external documentation and browser
  tooling for actual acceptance. Do not add documentation/tool calls by habit.
- Do not mark Phase 1 complete or start Phase 1C.

## Review Focus

1. A cancelled or slower import must not restore an earlier tournament after a
   replacement or failure; a StrictMode/unmount cleanup must not break the next
   import (Task 3).
2. An all-in refund followed by board-only streets must remain replayable with
   privacy on; refund and payout accounting/actor display must differ (Tasks 1/4).
3. Folded one-card shows and summary-only cards must never leak through table,
   history, hand list, titles, or accessible labels (Tasks 4/5).
4. Eight-max hands with only four/five/seven occupants and shuffled player arrays
   must not crash, invent players, or move Hero from bottom-center (Tasks 4/6).
5. Imported data must defeat demo QA/preview overrides, and a failed replacement
   must not silently show old imported or demo data (Tasks 3/5/6).

## File and dependency map

| Task | Responsibility and files                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Modify `src/domain/schemas.ts`, `src/domain/handHistory.ts`, `src/domain/replay.ts`, `src/domain/replayAdapter.ts`, and their existing tests. Make only the exhaustive type/label compatibility changes needed in `PokerTable.tsx` and `PlayerSeat.tsx`.                                                                                                                                             |
| 2    | Create `src/services/tournamentImport.ts` and `src/services/tournamentImport.test.ts`: browser-file boundary and unchanged parser outcomes. Explicitly bind the existing fixture helper's URL constructor to `node:url` for jsdom compatibility.                                                                                                                                                     |
| 3    | Create `src/ui/useTournamentImport.ts` and `src/ui/useTournamentImport.test.tsx`: in-memory controller, selection, cursor, privacy, and read cancellation.                                                                                                                                                                                                                                           |
| 4    | Modify existing `PokerTable.tsx`, `PlayerSeat.tsx`, `ReplayControls.tsx`, `seatLayout.ts`, and their tests; create `src/ui/components/PokerTable.test.tsx` for imported replay/privacy cases.                                                                                                                                                                                                        |
| 5    | Modify `src/ui/App.tsx`, `src/ui/App.test.tsx`, `src/ui/components/PrototypeDialog.tsx`, and `src/main.tsx`. Create `TournamentTabs.tsx`, `TournamentUpload.tsx`, `ImportDiagnostics.tsx`, `ImportedHandNavigator.tsx`, `ImportedTournamentWorkspace.tsx`, `ImportedReplayBoundary.tsx` under `src/ui/components/`; add `src/ui/importedTournament.test.tsx` and `src/styles/tournament-import.css`. |
| 6    | Create `tests/visual/tournament-import.spec.ts` and `docs/qa/phase-1b/README.md` with named PNG evidence. Adjust obsolete functional-file hash guards in the two existing migration suites; retain unchanged-file guards and visual comparisons.                                                                                                                                                     |
| 7    | Update `Roadmap/README.md`, `Roadmap/phase-0.md`, `Roadmap/phase-1.md`, and the existing parser guide's obsolete adapter limitations only after acceptance. Record exact checks/review evidence in the Phase 1B QA document.                                                                                                                                                                         |

Dependencies: 1 → 3/4; 2 → 3; 3 + 4 → 5 → 6 → 7. Do not implement
unrelated components or revise mock data, fixture files, assets, or approved geometry.
The existing parser exports/types and fixture helper remain the source of truth.

## Task 1: Source-complete projection through the existing replay engine

**Files:** Domain files/tests listed above; `src/domain/replayAdapter.test.ts`
owns all-three-fixture equivalence. Existing presentation files receive only
compile-compatible handling of the newly introduced event labels in this task.

**Interfaces:**

- Preserve `toReplayHand(source: ImportedHand): ReplayAdaptation`,
  `buildReplayState(hand: Hand, cursor: number): ReplayState`, `flattenActions`,
  `findActionCursor`, and `ReplayAdaptation.sourceEventIds`.
- Add `Hand.replayMode?: "source-events"`. Only the adapter sets it; omit this
  presentation discriminator when deriving `importedHandSchema` from `handSchema`.
  Hands without it preserve existing demo semantics.
- Extend existing `Action.type` with `RETURN_UNCALLED`, `SHOW`, `SHOWDOWN`, and
  `DEAL_BOARD`. Add optional `cards: Card[]`, `raiseByChips`, `raiseToChips`, and
  `isAllIn`; `cards` is cumulative for `DEAL_BOARD` and a partial/full reveal for
  `SHOW`. Only `DEAL_BOARD`/`SHOWDOWN` may have null actors; boundary/reveal steps
  have zero chips. Validate
  these constraints without replacing the composable Zod object schemas.
- Add optional `SeatSnapshot.revealedCards: Card[]` and
  `ReplayState.phase: "BETTING" | "SHOWDOWN" | "COMPLETE"`. Preserve compatibility
  with existing fixtures and callers that construct snapshots without new fields.
- Export `findCollectionCursor(hand: Hand): number`: first `WIN` index, or step
  count when absent. Export `findStreetCursor(hand: Hand, street: Street): number | null`:
  zero for Preflop, after the imported board-deal step for a dealt street, legacy
  first-player-action cursor for demo streets, and null for an unavailable street.

- [x] **Step 1 — RED: Extend existing adapter/engine regressions.** Reuse
      `fixtureHand`, `readFixture`, and the current goldens. Pin these observations
      before changing domain code:

  ```ts
  // TM6471062694: source-derived values already asserted in normalize.test.ts.
  expect(refund.type).toBe("RETURN_UNCALLED");
  expect(refund.amountChips).toBe(129067);
  expect(
    flattenActions(projected).findIndex((step) => step.type === "WIN"),
  ).toBeGreaterThan(refund.sequence);
  expect(afterRefund.seats.find((p) => p.id === refund.actorPlayerId)).toMatchObject({
    stackChips: 129067,
    isAllIn: false,
  });
  // TM6469820465: no betting actions on flop/turn; each deal is now step-able.
  expect(afterFlop.board.map((c) => c.rank + c.suit)).toEqual(["Ad", "6d", "6h"]);
  expect(afterTurn.board).toHaveLength(4);
  expect(afterRiver.board).toHaveLength(5);
  expect(atStart).toMatchObject({ cursor: 0, potChips: 0, board: [] });
  ```

  Define local test variables by locating the named projected events and calling
  the existing engine immediately before/after them. Add cases for one-card/folded
  reveals and no invented `SHOW` for `TM6470156513`; locate the existing partial-show
  hand through `normalize.test.ts`. Require null actors for boundaries, no actor
  highlight for non-player steps, zero-money board/show events, invalid boundary
  actor/amount/card-count rejection, and the existing zero-stack-fold warning.
  Test the newly required fields without introducing test-only parsing logic.
  Use existing exports for these behavioral failures. Test new navigation helpers
  through a module namespace inside their own cases so missing functions cannot
  prevent the other regressions from running.

  Prewrite the every-cursor fixture checks: advance the canonical ledger through
  mapped events, leave finances unchanged for derived deals, and compare pot/stacks
  at every step of every hand. Keep independent facts: Daily award 672100; Fifty
  refund129067, collection420450, recipient final stack549517; GGMasters
  contribution586/by495/to656, call5874, return417, and awards628/629. Assert final
  stacks/boards, conservation, repeat adaptation including diagnostics/mappings,
  cursor interleaving, input immutability, and unchanged earlier frames.

- [x] **Step 2 — Verify RED.** Run
      `npm.cmd test -- src/domain/replay.test.ts src/domain/replayAdapter.test.ts`.
      Observe failures in new behaviors; compilation/import failures alone do not
      establish a poker regression. Keep the schema compatibility suite alongside it.
- [x] **Step 3 — GREEN: Implement the contract and adapter changes.** Keep
      `handSchema`/`actionSchema` composable. In the existing adapter, merge ordered
      canonical events with `DEAL_BOARD` for each parsed postflop street, even with
      no actions. Source events retain their IDs; board IDs are
      `${source.id}:board:${street}` and have no source-event mapping. Use incremental
      street boards in `Hand.streets`, cumulative board payloads on deal steps, and
      dense replay sequences. Project `COLLECT_POT` to `WIN`; retain refunds and shows
      distinctly. Map canonical SHOWDOWN events to the last dealt betting street plus
      the explicit SHOWDOWN type. Preserve source warnings; retire diagnostics for
      supported refund/reveal/runout gaps. Reserved unobserved MUCK syntax remains
      outside parser support; do not invent its grammar. If a reserved canonical
      event is not projected, retain its explicit omission diagnostic rather than
      silently discarding evidence or claiming support.
- [x] **Step 4 — GREEN: Extend the existing engine's reconstruction.** Keep one
      chip-transfer loop: contributions debit stacks, returns/awards debit pot, and
      boundary/reveal steps move no chips. For source-events hands derive street/board
      from consumed deal steps, not the next action; clear live commitments at deals,
      reduce them on refunds, retain gross contributions separately, and clear payout
      commitments. Use current stack exhaustion for imported all-in display and
      accumulate consumed reveals without modifying input/previous frames. Leave
      legacy board timing and demo behavior compatible. Add neutral labels in the two
      presentation components so the expanded types compile; full rendering is Task 4.
      Implement the two declared cursor helpers in the existing replay module, using
      the same flattened steps as reconstruction and returning the specified absence
      value when no collection or street exists.
- [x] **Step 5 — Verify GREEN:** Run
      `npm.cmd test -- src/domain src/parsers/gg` and `npm.cmd run typecheck`.
      Expected: all selected tests/type checks pass; checkpoint the actual results.

## Task 2: Local file import service

**Create:** `src/services/tournamentImport.ts` and its test file.
**Modify:** The existing GG fixture helper only if needed to bind `URL` from
`node:url` explicitly: `src/parsers/gg/fixtureTestUtils.ts`. Keep its public API
and actual fixture files unchanged.
**Consumes:** Existing `parseGgTournament`, `ImportedTournament`, `ParserIssue`,
`ParserWarning`; the integration-error variant also uses `ReplayDiagnostic`.
**Produces:**

```ts
type ImportFailure =
  | {
      kind: "file";
      code: "invalid_type" | "empty_file" | "read_failed";
      message: string;
    }
  | { kind: "parser"; issues: ParserIssue[]; warnings: ParserWarning[] }
  | {
      kind: "integration";
      message: string;
      handId?: string;
      diagnostics?: ReplayDiagnostic[];
    };
type ImportOutcome =
  | { ok: true; tournament: ImportedTournament; warnings: ParserWarning[] }
  | { ok: false; error: ImportFailure };
export function importTournamentFile(file: File): Promise<ImportOutcome>;
```

- [x] **Step 1 — RED:** Create real browser `File` objects from `readFixture(i)`.
      In Node-backed test execution use the configured jsdom File/FileReader globals;
      fixture reads stay in tests. Assert success and 222/191/28 hands for all three,
      structured warnings retained, uppercase `.TXT` accepted, empty/generic MIME
      accepted, and `.txt` with image/PDF MIME rejected before parser invocation.
      Test wrong extension, zero bytes, whitespace-only text, non-GG text, and a real
      fixture mutation with unsupported game. Check parser issue type/context and no
      partial tournament. Simulate a FileReader error for `read_failed`.

  ```ts
  const result = await importTournamentFile(
    new File([readFixture(1)], "Fifty.TXT", { type: "text/plain" }),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected valid fixture import");
  expect(result.tournament.handsPlayed).toBe(191);
  expect(result.warnings).toContainEqual(
    expect.objectContaining({ type: "unknown_timezone" }),
  );
  ```

- [x] **Step 2 — Verify RED:** Run
      `npm.cmd test -- src/services/tournamentImport.test.ts`; confirm the missing
      import behavior is reproduced before implementation.
- [x] **Step 3 — GREEN:** Implement the declared function using FileReader to read
      UTF-8 text. Enforce the specification's extension/MIME/empty-input policy, then
      call the unchanged parser with `sourceName: file.name`. Preserve parser arrays
      directly; create only file-boundary errors here. Do not catch integration errors
      as parser failures. No raw-history logging, storage, network, or artificial waits.
      Reuse the existing fixture reader; explicitly import its filesystem URL
      constructor from `node:url` if jsdom globals otherwise shadow it.
- [x] **Step 4 — Verify GREEN:** Repeat the focused command, then
      `npm.cmd run typecheck`. Expected: all import cases pass; record the checkpoint.

## Task 3: In-memory import and replay controller

**Create:** `src/ui/useTournamentImport.ts` and its hook/integration tests.
**Consumes:** Task 2's service/outcomes; Task 1's adapter, engine, collection boundary.
**Produces:** exported `ImportState`, `ReadyImportState`, and `TournamentImportSession`:

```ts
type ImportState =
  | { status: "demo" }
  | { status: "idle" }
  | { status: "reading"; fileName: string }
  | { status: "error"; error: ImportFailure }
  | {
      status: "ready";
      tournament: ImportedTournament;
      warnings: ParserWarning[];
      selectedHandId: string;
      replay: ReplayAdaptation;
      frame: ReplayState;
      resultHidden: boolean;
    };
type ReadyImportState = Extract<ImportState, { status: "ready" }>;
interface TournamentImportSession {
  state: ImportState;
  importFile(file: File): Promise<void>;
  cancelPendingImport(): void;
  selectHand(id: string): boolean;
  setCursor(cursor: number): void;
  setResultHidden(hidden: boolean): void;
  reportIntegrationError(): void;
}
export function useTournamentImport(
  readImport?: (file: File) => Promise<ImportOutcome>,
): TournamentImportSession;
```

The optional I/O function is a narrow deferred-read test seam; its production
default is Task 2's service. Store the existing `ReplayState`, not independent
UI-computed finances. No additional tournament or replay domain record is needed.

- [x] **Step 1 — RED:** Use Testing Library `renderHook`/`act`, real fixture Files,
      and deferred outcomes for races. Assert initial demo, immediate clearing on
      selection, ready state, first chronological hand, zero cursor, privacy on,
      structured warning identity, and error states without prior tournament fields.
      Repeat selection A → B → A after stepping/revealing; each selection resets
      frame and privacy. Unknown/stale hand IDs return false without changing the
      valid selection; cursor updates outside ready state do nothing.

  ```ts
  const { result } = renderHook(() => useTournamentImport());
  await act(() => result.current.importFile(file)); // file: real GG File above
  expect(result.current.state).toMatchObject({
    status: "ready",
    resultHidden: true,
    frame: { cursor: 0, potChips: 0 },
  });
  ```

  Run all three fixtures through this actual hook: select every hand, replay to
  completion with privacy off, and verify final board/pot/results via the existing
  adapter/engine; use Task 1's detailed per-step tests rather than duplicate them.
  Compare repeated A → B → A imports, including successful/failed outcomes, IDs,
  warnings, and diagnostics, excluding transient browser read status only.
  Give full-file matrix tests the existing adapter suite's 30000 ms test budget;
  this is a test timeout, not an import-performance acceptance threshold.
  Prewrite deferred-read regressions for slow A/fast B, A success after B failure,
  cancellation, unmount, and StrictMode cleanup/reuse. Test injected adapter/engine
  exceptions and `reportIntegrationError()` as typed integration failures, not
  parser corruption. Test privacy toggling at completion: enabling clamps,
  disabling stays at that cursor, and refunds remain reachable.

- [x] **Step 2 — Verify RED:** Run
      `npm.cmd test -- src/ui/useTournamentImport.test.tsx` before writing the hook.
- [x] **Step 3 — GREEN:** Implement this application controller using existing
      React state/ref/effect patterns. Increment an attempt identity before every
      import; clear prior state before validation/read. Ignore superseded completions
      and invalidate pending reads on cancellation/unmount. Cancelling an active read
      leaves idle import state, not demo; closing after ready/error retains that state.
      Adapt once per successful selection and construct frames only with the existing
      engine. Catch projection/reconstruction exceptions into `kind: "integration"`
      with safe hand/diagnostic context. `reportIntegrationError()` handles a rendering
      boundary's notification by clearing ready state and publishing that same typed
      failure with selected-hand context, without exposing a raw exception. Reject
      noninteger cursor requests; clamp
      integer requests to zero/step count or the first collection boundary when hidden.
- [x] **Step 4 — Verify GREEN:** Repeat the focused tests and typecheck. Require
      every prewritten race, cancellation, integration-error, and privacy case to pass;
      no late update may restore old data. Checkpoint the executed results.

## Task 4: Existing table, controls, and short-handed/privacy rendering

**Modify/Test:** `src/ui/components/PokerTable.tsx`, `PlayerSeat.tsx`,
`ReplayControls.tsx`, `seatLayout.ts`, and existing corresponding tests.
**Create/Test:** `src/ui/components/PokerTable.test.tsx` for imported cases.
**Consumes:** Task 1's existing Hand/ReplayState extensions and navigation helpers.
**Produces:** unchanged `PokerTable`/`ReplayControls` public APIs;
`PlayerSeat` accepts an optional `resultHidden: boolean` prop, defaulting to true,
and `layoutPlayers<T extends Player>(players: readonly T[], tableSize: number)`
keeps its signature and existing anchor objects.

- [x] **Step 1 — RED:** Using actual projected hands, assert concealed opponents
      at zero even with privacy off, reveals only after consumed SHOW, concealment
      while hidden, a partial show with one unknown card, and a folded reveal with
      folded styling intact. Assert summary-only cards never appear as timed reveals.
      Inspect accessible labels/titles as well as visible content. History tests use
      a unique future card/amount from the selected fixture and prove it is absent
      from titles/accessible descriptions while hidden, without banning known Hero
      cards or legitimate past values. Check that a refund is labeled returned rather
      than won and no boundary/refund/award creates an acting player.
- [x] **Step 2 — RED:** Add all-three-fixture layout checks for each occupancy
      encountered, shuffled input, unique supported positions, and one Hero. Keep
      existing full 6/8/9 tests. Derive four/five-player examples from parsed fixtures,
      never by creating fake opponents. Pin Hero's existing anchor exactly:

  ```ts
  const seats = layoutPlayers(source.players, source.tableSize);
  expect(seats).toHaveLength(source.occupiedSeatCount);
  expect(seats.find((p) => p.seat.isHero)?.anchor).toMatchObject({
    x: 50,
    y: 89,
    mx: 50,
    my: 91,
  });
  const coordinates = seats.map(
    (p) => `${p.anchor.x}:${p.anchor.y}:${p.anchor.mx}:${p.anchor.my}`,
  );
  expect(new Set(coordinates).size).toBe(seats.length);
  ```

  Add controls regressions before implementation: imported Flop/Turn/River jumps
  consume the deal but no player action; absent streets stay disabled; Back/Forward
  move one step; privacy permits returns/runouts but stops before collection.
  Run `npm.cmd test -- src/ui/components`; observe the new source-data failures.

- [x] **Step 3 — GREEN:** Relax only the full-occupancy guard; keep capacity,
      Hero uniqueness, position uniqueness/order, supported profiles, and existing
      anchors. Pass privacy into PlayerSeat and use consumed `revealedCards`, leaving
      unknown slots concealed. Keep folded state when a legitimate reveal is shown.
      Update existing table labels/history/ribbon for source steps using explicit
      raise-to values and engine state, not new UI contribution calculations. Mask
      source future/SHOW descriptions consistently. Preserve legacy demo formatting.
- [x] **Step 4 — GREEN:** Make ReplayControls use `findStreetCursor`; retain its
      public props/keyboard behavior. Imported street buttons visit after the deal
      and before its first player event. Source step count includes boundaries;
      unavailable streets stay disabled. Back/Forward operate one actual step, and
      the caller-supplied collection limit allows refunds/runouts with privacy on.
- [x] **Step 5 — Verify GREEN:** Run component and App unit regressions plus
      typecheck. Require full 6/8/9 demo behavior and short-handed imported behavior
      to pass together. Do not change approved geometry, decks, or assets; checkpoint.

## Task 5: Real upload UI and imported tournament workspace

**Create:** Task 5's component/style files in the map; **modify** existing App,
PrototypeDialog, main stylesheet imports, and App tests. No new routes.
**Consumes:** `TournamentImportSession` and `ReadyImportState` from Task 3;
existing table/control components from Task 4; parser warning/error types.
**Produces:**

- `TournamentTab = "overview" | "replayer" | "review"` exported from
  `TournamentTabs.tsx`; `TournamentTabs({ value, onChange, header?, children })`
  wraps the current Radix root/list with identical classes and labels for both
  sources. `header`/`children` are ReactNode; `onChange(tab: TournamentTab): void`.
- `TournamentUpload({ state, onImport, onOpenReview })`, with `state: ImportState`,
  `onImport(file: File): Promise<void>`, and `onOpenReview(): void`.
- `ImportDiagnostics({ warnings, error? })`, with readonly structured
  `ParserWarning[]` and optional `ImportFailure`; reuse in upload and review.
- `ImportedHandNavigator({ hands, selectedHandId, onSelectHand, variant })`, with
  readonly `ImportedHand[]`, `onSelectHand(id: string): void`, and
  `variant: "rail" | "list"`. It shows only neutral known hand data, never outcomes.
- `ImportedTournamentWorkspace({ state, activeTab, onTabChange, onSelectHand,
onCursorChange, onResultHiddenChange })`, with `state: ReadyImportState` and
  callbacks matching Tasks 3/4. Share existing tab/table/control styling; do not
  fabricate grade-dependent `ReviewQueueItem` or `HandAnalysis` records.
- Add optional `children: ReactNode` content to `PrototypeDialog`; preserve its
  focus/escape/profile behavior. App supplies the real upload body.
- `ImportedReplayBoundary({ onError, children })` is a React error boundary with
  `onError(): void` wired to `reportIntegrationError`. Wrap imported tournament
  rendering only; show a neutral alert until the controller publishes error state.
  The existing error-state upload action permits recovery and a clean remount.

- [x] **Step 1 — RED:** Add `src/ui/importedTournament.test.tsx` integration tests
      with real File uploads and existing Testing Library. Cover summary/warnings,
      CTA → Overview, real name/ID/count, neutral analytics, full real hand navigation,
      repeated selection/reset, privacy on/off, complete replay, summary-only cards
      in final details only, and no demo grades/recommendations. Use stable labels:

  ```ts
  fireEvent.change(screen.getByLabelText("Hand history file"), {
    target: { files: [file] }, // real File containing one full fixture
  });
  expect(await screen.findByRole("heading", { name: "Import complete" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Open Tournament Review" }));
  expect(screen.getByRole("tab", { name: "Overview", exact: true })).toHaveAttribute(
    "data-state",
    "active",
  );
  expect(screen.queryByText("Mock heuristic review")).not.toBeInTheDocument();
  ```

  In this test file only, shim jsdom's missing dialog `showModal`/`close` methods
  by updating `open`; restore original descriptors after the suite. Keep browser
  tests responsible for native dialog focus and Escape behavior.

  Also test empty/invalid/parser failure, retry/same-file reselection, focus/close,
  failed replacement, and navigation away/back without losing ready state. Start
  with demo preview/QA query flags set, then import and require genuine names,
  seats, cursor zero, and neutral analytics. Reproduce a child render exception
  and require an integration alert/upload action, no white screen or parser blame,
  and successful retry. Retain existing demo App assertions.

- [x] **Step 2 — Verify RED:** Run
      `npm.cmd test -- src/ui/App.test.tsx src/ui/importedTournament.test.tsx`.
- [x] **Step 3 — GREEN:** Wire the hook at MainApp scope. Branch explicitly on
      status: demo uses the existing workspace; ready uses the imported workspace;
      idle/reading/error tournament views show neutral states/upload action. Replace
      mock labels/chrome only in imported views; other demo pages remain labeled.
      Do not run demo table-size/all-in mutations against imports. Cancelling the
      native file picker keeps prior success; a newly selected file clears it. Wrap
      imported rendering in `ImportedReplayBoundary` and route its callback through
      the controller's typed integration-error path.
- [x] **Step 4 — GREEN:** Implement the declared components with the approved
      surfaces/tokens. Input accepts `.txt`; service validation stays authoritative.
      Use `role="status"`/busy semantics and readable `role="alert"` failures, a
      disabled duplicate-submit path, expandable `Import warnings (N)`, and the exact
      `Open Tournament Review` CTA. Clear the file input after handling so retrying
      the same filename works. Keep metadata literal, with unknown currency/timezone
      unfilled. Overview and analysis use `Analysis not available yet`; no fake chart,
      scores, percentages, result summary, or recommendations. Hand selections open
      Replayer; rail/list scroll within existing surfaces. Completed-hand details may
      use canonical summaries only when privacy is off and the last step is consumed.
      Add only narrowly scoped dialog/list responsive rules in the new CSS file.
- [x] **Step 5 — Verify GREEN:** Run all unit tests and typecheck. Confirm error
      boundaries remain readable for service/adapter failures, imported source data
      never falls back to mocks, and demo functionality stays intact. Checkpoint.

## Task 6: Real browser acceptance and visual-regression scope

**Create:** `tests/visual/tournament-import.spec.ts`, `docs/qa/phase-1b/README.md`,
and named PNG evidence. **Modify:** only the obsolete functional-file hash checks
in `tournament-subpages.spec.ts` and `visual-migration.spec.ts`; document why.
Use existing Playwright configuration, fixture helper names, Chrome, and widths.

- [x] **Step 1 — Write browser assertions before fixing browser-only defects.**
      Import all three full fixtures through `setInputFiles`, not injected runtime
      state. Select known hands from the approved spec and step actual controls.
      Exercise all three tabs, warnings, malformed replacement/retry, repeat selection,
      partial/summary-only reveals, Hide Result, and named refunds/awards. Assert no
      page errors and no fetch/XHR/WebSocket calls introduced by the import workflow;
      distinguish baseline asset/dev-server traffic from application API calls. Verify
      imported state creates no localStorage/sessionStorage/IndexedDB records while
      tolerating pre-existing visual-preview preferences.
- [x] **Step 2 — Run real Chrome and inspect failures:**
      `node_modules/.bin/playwright.cmd test tests/visual/tournament-import.spec.ts`.
      Reproduce any failure in the nearest unit/integration test before a production
      fix; use systematic debugging, then rerun the affected browser scenario.
- [x] **Step 3 — Validate responsive acceptance:** Use widths
      `[1440, 1024, 768, 430, 390]` for one representative fixture; import all three
      fixtures through the real UI at least once. Add fixture/width combinations only
      for unique short-handed/refund/reveal/runout behavior. Check readable
      upload/warnings, list/tab/control access, unique seat placement, Hero anchor,
      no page overflow/clipped rows, and successful hand switching. Full street/refund/
      reveal stepping can use representative desktop/mobile scenarios in the same
      suite; do not repeat the entire domain cursor matrix in the browser. Record
      measured selection-to-summary times for all three full files without artificial
      delays or an invented performance threshold.
- [x] **Step 4 — Maintain honest regression guards:** Keep prior baseline images,
      visual/style comparisons, mocks, assets, and fixture hashes. Remove only
      Phase 0 claims that intentionally changed functional source files must remain
      byte-identical; enumerate those paths/reasons in Phase 1B QA evidence. Never
      refresh reference screenshots to hide changed demo visuals. Any actual visual
      difference needs root-cause inspection and product review before acceptance.
- [x] **Step 5 — Capture and verify evidence:** Follow existing PNG/README naming:
      `upload-success-1440.png`, `upload-error-390.png`, `overview-1440.png`,
      `overview-390.png`, `review-1440.png`, `review-390.png`, `replayer-1440.png`,
      `replayer-390.png`, `warnings-390.png`, and `refund-1440.png` under the phase
      directory. Include fixture/hand/cursor/privacy context in the README, no raw
      source histories. Run the full configured browser suite after narrow cases pass:
      `npm.cmd run test:visual`. Expected: all applicable new and existing cases pass.

## Task 7: Final verification, independent review, and roadmap evidence

**Consumes:** All prior deliverables and actual execution evidence.
**Modify only after verification:** Roadmap files and docs listed in the map.

- [x] **Step 1 — Run configured final checks:**

  ```text
  npm.cmd run lint
  npm.cmd run typecheck
  npm.cmd test
  npm.cmd run test:visual
  npm.cmd run build
  ```

  Execute Prettier `--check` over the explicit changed-file list (source, tests,
  CSS, and documents), preserving existing unrelated formatting exceptions. Run
  `git diff --check` for changed tracked files; check new untracked text files
  directly too. Record command, exit status, and test counts. Do not re-run passed
  suites without a new change/failure/risk; Task 6's full browser run can serve
  here if nothing relevant changed afterward. Keep generated build/cache artifacts
  out of the deliverable and inspect the final diff against the pre-task state.

- [x] **Step 2 — Verify all fixture hashes:** Compare the three full source files
      with the pre-implementation SHA-256 manifest; verify the approved spec, mocks,
      assets, and protected geometry remain untouched except explicitly scoped fixes.
      Verify no production parser grammar changes, AI/API integration, imported-data
      storage, new routes, or Phase 1C features slipped into the work.
- [x] **Step 3 — Obtain one independent final review:** Use
      `superpowers:requesting-code-review` and the execution workflow's applicable
      final-review procedure; a review satisfying both is one review, not duplicate
      dispatches. Supply the approved spec/plan, relevant diff/files, fixture/golden
      references, and executed evidence without copying this session's history.
      Prioritize accounting, source mappings, privacy/accessibility leaks, stale async
      state, short-handed rendering, and weakened regression guards. Resolve substantive
      findings with regressions and rerun affected checks; never claim unreviewed fixes
      are independently verified. Follow required re-review rules for those fixes.
- [x] **Step 4 — Update verified documentation:** Correct roadmap status to
      Phase 0 COMPLETE, Phase 1 IN PROGRESS, Phase 1A COMPLETE, Phase 1B READY FOR REVIEW.
      Record all-three-fixture results, actual check counts, timings, responsive/browser
      evidence, review disposition, and remaining source-format/product limitations.
      Update only obsolete adapter limitations in `docs/specs/gg-parser.md` to describe
      the new interactive support while preserving parser syntax/accounting evidence.
      Do not mark Phase 1 complete or start Phase 1C. Recheck formatting/diff after
      documentation changes; this does not require another application build.
- [x] **Step 5 — Deliver review handoff:** Report the user's requested implementation
      summary, changed files, upload/state/replay wiring, mock boundaries, added tests,
      all-three-fixture results, browser QA, exact checks, supported warnings/errors,
      integration fixes, limitations, roadmap status, and product/manual review needs.
      Stop at READY FOR REVIEW, without committing/pushing/deploying beyond authorization.

## Planning self-review and execution gate

Spec coverage maps to Tasks 1–7: source fidelity/accounting and determinism (1/3),
file/error boundary (2), runtime replacement/selection (3), seat/privacy controls
(4), real pages and demo separation (5), browser/responsive evidence and guard
maintenance (6), final checks/review/status (7). Each Review Focus item has owning
tests above. The public names and data fields in later tasks match their producing
Interfaces blocks; no parser/adapter/engine replacement is introduced.

Execution completed 2026-10-19 after user approval and the two planning corrections.
Tasks 1-7 are verified; independent review found one Important queue-scrolling
issue, fixed with RED/GREEN and regression evidence. Phase 1B is READY FOR REVIEW.
See docs/qa/phase-1b/README.md for checks, screenshots, limitations and manual review.
