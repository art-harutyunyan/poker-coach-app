# Phase 1B.1 Import UX and Replay Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native task-by-task execution, or superpowers:subagent-driven-development if explicitly selected. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve imported tournament notices, shared card readability, reveal-phase navigation and opponent aliases while preserving poker truth and privacy.

**Architecture:** Reuse the existing parser/domain/adapter/engine. Add small pure presentation helpers, consolidate the existing card styles, and extend existing flattened-action navigation. Alias maps stay derived UI values; no domain or persistence model is added.

**Tech Stack:** Existing React, TypeScript, Zod contracts, custom CSS, Vitest/Testing Library, Playwright/Chrome and Vite. No new dependency.

**Spec:** [Approved Phase 1B.1 design](../specs/2026-11-04-phase-1b-1-import-replay-refinement-design.md), including the approved alias-first table presentation refinement.

**Execution:** Recommend retaining native execution with one fresh independent final review, consistent with the earlier Phase 1B preference. These tasks share presentation consumers and visual guards; implementation agents would duplicate inspection and coordinate edits to the same files. This plan awaits review; production implementation is not authorized by writing it.

## Global Constraints

- All four real GG fixtures remain immutable. The current corpus has 674 hands.
- No persistence, tournament library, storage API, AI, grading, solver, recommendations, strategy engine, routing change or Phase 1C work. No new dependency is needed.
- No commits, pushes or deployment are authorized. Use the existing main development worktree; preserve all pre-existing changes and do not stage files.
- Preserve shell, table geometry, seat coordinates, chip accounting, parser truth, source IDs, import replacement/cancellation safety and Hide Result.
- Before the first SHOW, no SHOW has been consumed. If there is no SHOW, stop before SHOWDOWN; if neither exists, Showdown is unavailable. Never navigate through collection to reach a reveal.
- PokerTable nameplates show the alias as primary identity. A visible full GG source ID is optional there; exact source ID must remain accessible through title/accessibility/detail surfaces. Hero remains Hero. The approved deterministic alias algorithm is unchanged.
- One shared PlayingCard and one imported hand-row implementation. No consumer-specific face styles or fake grades/analysis.
- Use the repository poker-validation, TDD, debugging, independent verification and final review workflows. Do not invent expected poker calculations.
- Context7 is only for genuinely needed external documentation. Existing APIs and repository patterns need no habitual documentation loading.

## Review Focus

1. Unknown warning codes and absent buy-in metadata must remain readable without silently downgrading source anomalies or guessing values (Task 1).
2. A large roster, reversed hand order, hand switches or a replacement import must not produce collisions, mutate IDs or leak an earlier alias map (Tasks 2/5).
3. A compact T, red/black suits or a concealed card must remain legible/opaque to inspection; masks must not hide a nameplate or geometry regression (Task 3).
4. Early all-in reveals, marker-only hands and a boundary coinciding with a dealt-street cursor must retain deterministic active navigation and collection privacy (Task 4).
5. Narrow screens and long aliases must preserve visible identity, accessible source traceability, non-overlapping action/name/stack lanes and readable diagnostic details (Tasks 2/5).

## File and dependency map

| Area                | Files and responsibility                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notice presentation | Create `src/ui/importPresentation.ts` and `.test.ts`; modify `ImportDiagnostics.tsx`, `ImportedTournamentWorkspace.tsx`, `TournamentUpload.tsx` only as needed for shared status semantics; add `ImportDiagnostics.test.tsx` |
| Aliases             | Create `src/ui/opponentAliases.ts` and `.test.ts`; extend `src/ui/format.ts`, `ImportedTournamentWorkspace.tsx`, `PokerTable.tsx`, `PlayerSeat.tsx`                                                                          |
| Shared deck         | Modify `PlayingCard.tsx`, `src/main.tsx`, existing card rules in `global.css`, `poker-seats.css`, `tournament-import.css`; create `src/styles/playing-cards.css` and `PlayingCard.test.tsx`                                  |
| Navigation          | Extend helpers in `src/domain/replay.ts` and shared `ReplayControls.tsx`; create `src/domain/replayNavigation.test.ts`; extend `PokerTable.test.tsx`                                                                         |
| UI/browser coverage | Extend `src/ui/importedTournament.test.tsx`, existing import/correction browser cases, and both migration guards; create `tests/visual/approvedFrame.ts`, `approved-frame.spec.ts`, `phase1b1-refinement.spec.ts`            |
| Handoff             | Update only relevant Phase 1 status, parser/replay guide cross-references and QA links; create `docs/qa/phase-1b-1/README.md` and scoped screenshots/hash evidence                                                           |

Component paths above resolve under `src/ui/components/`. Do not split/restructure unrelated large components. Preserve existing `ImportedHandNavigator` markup responsibilities and slot sizing.

Dependency order: Task 1 -> Task 2 -> Task 3 -> Task 4 -> Task 5. Tasks 1/2 both touch the workspace and shared import CSS; Tasks 3/4 both change approved-frame verification. Native execution avoids concurrent ownership.

## Execution setup, after plan approval

- [ ] Read the approved spec and executing-plans/TDD skills; record the shared interfaces below in the plan-owned execution ledger.
- [ ] Capture repository status, HEAD, native snapshots/hashes of existing files, all four fixtures, approved specs/reference images and prior QA outputs. Use an ignored plan-owned workspace; preserve recovery evidence outside formatter traversal at handoff. No new worktree or commit.
- [ ] Run `npm.cmd test -- --maxWorkers=2` and record the actual baseline. Run heavy unit, build and browser stages sequentially; do not reproduce the previous CPU-overload run. Do not alter global timeout/config settings to obtain green results.

### Task 1: Group import notices and display neutral metadata

**Files:** `src/ui/importPresentation.ts`, its tests, `ImportDiagnostics.tsx`, `ImportDiagnostics.test.tsx`, `ImportedTournamentWorkspace.tsx`, scoped import CSS; update affected assertions in `importedTournament.test.tsx` and existing browser import tests.

**Interfaces:**

```ts
type ImportNotice = Readonly<{
  severity: "info" | "warning";
  label: string;
  diagnostic: ParserWarning;
}>;
function presentImportNotices(warnings: readonly ParserWarning[]): {
  info: ImportNotice[];
  warnings: ImportNotice[];
};
// ImportDiagnostics({ warnings, error? }) keeps its current public props.
```

- [ ] **Write RED tests.** Table-driven literal warnings must classify unknown_timezone, unresolved_currency and missing_metadata as info; SHORT_BLIND_POST, ZERO_STACK_FOLD and an unfamiliar source_warning code as warnings. Assert readable labels from the spec, original object/data preservation, input immutability, empty lists and a missing buy-in field. An unfamiliar source code uses the warning fallback, never info.

  ```ts
  // metadata gaps are informative without changing their source diagnostic
  const input: ParserWarning[] = [
    {
      type: "unknown_timezone",
      field: "timestamp.timezone",
      message: "source message",
    },
  ];
  const result = presentImportNotices(input);
  expect(result.info[0]?.label).toBe("Timezone not provided by GG");
  expect(result.info[0]?.diagnostic).toBe(input[0]);
  expect(result.warnings).toHaveLength(0);
  ```

- [ ] **Write the component/app regressions.** Successful notices produce "Import status", "Info (3)" and "Warnings (4)" for the real Daily Classic fixture. Technical codes/messages/hand/line/raw detail appear in expanded details, rather than replacing the readable main labels. Info is not role=alert; malformed import still uses the existing error alert/retry flow. No notices has a neutral success state. Overview shows source buy-in separately from Currency=Unknown, Timezone=Not provided and Format=Unknown without changing parsed nulls.
- [ ] **Run RED:** `npm.cmd test -- src/ui/importPresentation.test.ts src/ui/components/ImportDiagnostics.test.tsx src/ui/importedTournament.test.tsx --maxWorkers=2`. Expect missing-helper/group/metadata failures; correct test setup errors before proceeding.
- [ ] **Implement the helper and existing views.** Match type/field/code as specified, keep original diagnostics in the wrapper, and use one renderer in upload and workspace. Keep counts as original entries and errors as failures. Add separate currency/timezone rows; retain literal source amount/time. Keep warnings visible without classifying harmless metadata as an error.
- [ ] **Run GREEN** with the same command; expect all targeted tests to pass. Record exact results and changed paths in the ledger; no commit.

### Task 2: Stable aliases with uncluttered table identities

**Files:** `src/ui/opponentAliases.ts`, its tests, `src/ui/format.ts`, workspace/table/seat consumers, scoped import CSS; extend table and imported-app tests.

**Interfaces:**

```ts
type OpponentAliases = Readonly<Record<string, string>>;
function buildOpponentAliases(
  hands: readonly Pick<ImportedHand, "players">[],
): OpponentAliases;
function playerDisplayName(
  player: Pick<Player, "id" | "name" | "isHero">,
  imported: boolean,
  aliases?: OpponentAliases,
): string;
// PokerTable and PlayerSeat gain optional opponentAliases?: OpponentAliases.
```

- [ ] **Write RED helper tests.** Controlled rosters in reversed order must yield literal assignments for sorted IDs, exclude Hero, deduplicate repeated IDs and remain unchanged after repeated/interleaved calls. With IDs p00..p16, expect p00=Alex, p15=Paul, p16=Alex 2; all 17 aliases are unique. Repeat with a larger roster and all four real fixture rosters, reverse hands/players, and verify input/source IDs unchanged. Different observed rosters are not asserted to share assignments.

  ```ts
  // use a validated fixture player as knownPlayer; these synthetic IDs test only presentation
  const roster = Array.from({ length: 17 }, (_, i) => ({
    players: [{ ...knownPlayer, id: `p${String(i).padStart(2, "0")}`, isHero: false }],
  }));
  const aliases = buildOpponentAliases(roster.reverse());
  expect(aliases.p00).toBe("Alex");
  expect(aliases.p15).toBe("Paul");
  expect(aliases.p16).toBe("Alex 2");
  expect(new Set(Object.values(aliases)).size).toBe(17);
  ```

- [ ] **Write RED rendering/integration tests.** Supply a literal alias map to PokerTable: `.player-name` contains Alex, not the source ID; its title/accessible identity includes "anonymized opponent" and exact source ID. `data-player-id` and actor records remain unchanged. Hero stays Hero; without import aliases, demo names remain unchanged. Across two hands sharing an opponent, record the alias, switch hands and return; expect the same alias. A replacement tournament must get its own derived map. Completed results can show alias plus muted source ID.
- [ ] **Run RED:** `npm.cmd test -- src/ui/opponentAliases.test.ts src/ui/components/PokerTable.test.tsx src/ui/importedTournament.test.tsx --maxWorkers=2`. Expect absent alias behavior to fail; do not regenerate expected names from the builder under test.
- [ ] **Implement the fixed algorithm.** Deduplicate scoped IDs from the full roster, use default code-unit sort, assign exactly Alex/Ben/Chris/Daniel/Ethan/Felix/George/Henry/Ivan/Jack/Kevin/Leo/Max/Nick/Oscar/Paul, then numbered cycles starting at 2. No randomness, localeCompare, persistence or parser mutation.
- [ ] **Integrate the derived map once per tournament value** using the workspace's memoized presentation data, not controller/domain state or selected-hand order. Extend existing name formatting and optional consumer props. Keep alias primary on table; expose source ID in title and accessible identity. Add a short explanation that aliases are display labels. Use the map in imported action/ribbon labels where names are shown, preserving positions and privacy masking; do not label a currently hidden action with its actor. Roomier results/details may show muted IDs; diagnostics/logs/internal mappings retain source values.
- [ ] **Run GREEN** with the targeted command and `npm.cmd run typecheck`. Expect all tests/typecheck to pass. Record the checkpoint, including the explicitly limited cross-partial-export stability; no commit.

### Task 3: One readable shared card system and precise visual guards

**Files:** shared card/component/CSS files in the map; `PlayingCard.test.tsx`, existing navigator/table tests; new browser files `approvedFrame.ts`, `approved-frame.spec.ts`, `phase1b1-refinement.spec.ts`; the two existing visual migration guards.

**Interfaces:** PlayingCard retains `card?`, `concealed?`, `context?: "compact" | "hero" | "board"`, `theme?`. No new deck/component props or domain card type. Test-only comparison helper:

```ts
type VisualMask = Readonly<{ x: number; y: number; width: number; height: number }>;
function compareUnmaskedPixels(
  page: Page,
  reference: Buffer,
  actual: Buffer,
  masks: readonly VisualMask[],
): Promise<{ sameSize: boolean; comparedPixels: number; mismatchedPixels: number }>;
```

- [ ] **Add semantic card regressions/characterizations** for compact/hero/board contexts, A/T/K, all four suits, visible rank/suit and accessible label, and concealment exposing no card identity. Retain existing navigator/table assertions proving actual Hero cards and consumed source reveals. Existing passing semantics are protections, not claimed RED evidence for a CSS change.
- [ ] **Write the visual RED.** In `phase1b1-refinement.spec.ts`, import the full Daily Monster Stack at 1440/390, select TM6468725291, disable privacy and navigate to a dealt board. Measure compact/navigator/table/board face contrast, rank/suit bounds and border definition. Require rank weight >=600, normal card text contrast >=4.5:1, border contrast >=3:1 against the face, and no clipped glyphs. Rank sizing must improve small-card reading within existing slots; inspect before/after screenshots as well as numeric checks. Existing consumer overrides should fail the weight/border checks. Never obtain RED from an unrelated missing upload/helper.

  ```ts
  // compact ranks remain visibly emphasized at the actual imported-row size
  const rank = page.locator(".importedHeroCards .cardCorner strong").first();
  expect(
    await rank.evaluate((el) => Number(getComputedStyle(el).fontWeight)),
  ).toBeGreaterThanOrEqual(600);
  ```

- [ ] **Run RED:** `npm.cmd run test:visual -- tests/visual/phase1b1-refinement.spec.ts --workers=1`. Expect the named readability assertions to fail, then preserve that evidence.
- [ ] **Implement the shared CSS.** Create `playing-cards.css`, imported once by `src/main.tsx`. Move default Study face/back/rank/suit treatment there, using the existing ivory/deep ink/burgundy palette and shared context/size tokens. Remove competing face/font/color overrides from global/seat/import rules. Keep slot dimensions, responsive anchors, holder gaps, state highlights, development deck assets/calibration and concealment behavior intact. Adjust shared PlayingCard markup only where needed; do not fork it per location.
- [ ] **Protect old approved frames without overwriting them.** Add the test-only comparator above: decode both PNGs through the same browser Canvas path, require equal dimensions, and compare every RGBA pixel outside the supplied rectangles exactly. Permit only measured PlayingCard bounds with baseline/current shadow padding (<=8px); do not mask name/action text. Task 4 adds only the street-control region. Assert masks are a small bounded fraction (<=10%) of the frame; reject full-frame masks. No whole-table masks or broad pixel tolerance.
- [ ] **Test that guard before using it.** In `approved-frame.spec.ts`, create controlled 100x100 browser screenshots: changing a 10x10 authorized patch must compare equal outside its mask; a changed pixel in an unmasked nameplate-like patch must report a mismatch; a full-frame mask must reject. Run `npm.cmd run test:visual -- tests/visual/approved-frame.spec.ts --workers=1`, observe missing-helper RED, implement comparison, then rerun GREEN.
- [ ] **Update only affected historical assertions.** In `visual-migration.spec.ts` and `tournament-subpages.spec.ts`, use unmasked comparison for authorized card changes, retaining unaffected pixels/geometry. Scope source-hash exceptions only to newly authorized `PlayingCard.tsx`/card rules in `poker-seats.css`; retain every other historical protected assertion and original reference file. Record why those two files can no longer be claimed unchanged.
- [ ] **Run GREEN:** card/navigator/table unit tests, the two new browser files, and the affected approved-frame cases in both migration suites. Expect readable cards, no hidden-card leaks, unchanged geometry and zero unmasked pixel differences. Record evidence, no baseline refresh or commit.

### Task 4: Navigate to the start of Showdown without consuming it

**Files:** `src/domain/replay.ts`, new `replayNavigation.test.ts`, `ReplayControls.tsx`, table/control tests, narrowly scoped navigation CSS and visual guard masks.

**Interfaces:**

```ts
type ReplayNavigationTarget = Street | "SHOWDOWN";
function findShowdownCursor(hand: Hand): number | null;
function currentNavigationTarget(
  hand: Hand,
  cursor: number,
  currentStreet: Street,
): ReplayNavigationTarget;
// Export these alongside existing replay helpers; Hand/Street/ReplayState stay unchanged.
```

- [ ] **Write RED helper tests** using a test-local `projectedFixture(index: number, id: string): Hand` that calls existing fixtureHand -> parser -> adapter. For TM6468725291, expect Showdown=22, no opponent cards at22, Ah5d at23, Hero KdKc at24, and no board before its DEAL_BOARD. For TM6377255556, expect the target to be exactly before the first mapped source SHOW, followed by its three reveals, marker and later recorded collections. Derive boundaries from the independently observed source sequence; do not compare the helper to itself.

  ```ts
  // navigation does not consume BTN's source SHOW
  const hand = projectedFixture(0, "TM6468725291");
  expect(findShowdownCursor(hand)).toBe(22);
  expect(
    buildReplayState(hand, 22).seats.find((p) => p.name === "ad116bad")?.revealedCards,
  ).toBeUndefined();
  expect(
    buildReplayState(hand, 23).seats.find((p) => p.name === "ad116bad")?.revealedCards,
  ).toEqual([
    { rank: "A", suit: "h" },
    { rank: "5", suit: "d" },
  ]);
  ```

- [ ] **Cover fallback/boundaries.** TM6378370688 has summary-only Ah: expect the explicit marker as target, never a fabricated SHOW. A narrowly constructed domain Hand without SHOW/SHOWDOWN returns null even if it has WIN or known Hero cards. Defensively reject targets at/after first WIN; do not skip payouts or guess missing events. Repeated/interleaved calls and before/after input snapshots must agree.
- [ ] **Pin active navigation.** For TM6468725291, expect Showdown at22/23/24, Flop at25, Turn at26 and Showdown at27 immediately before the explicit marker. Its domain currentStreet at27 remains RIVER. An event-boundary tie takes precedence over a betting-street label; no sticky click state. Before22, restore the current betting street; after marker/completion, keep Showdown. Other four street-target helpers must return their previous values.
- [ ] **Write RED control/privacy tests.** Showdown exists, clicking it calls onCursorChange(22), and does not consume/reveal an event. In the real imported app, Forward reveals Ah5d only with privacy off; privacy on conceals it before/after the same source step. Marker-only navigation is available, no-boundary navigation disabled, and any target beyond allowed totalActions disabled. Back/keyboard/street jumps still work; toggling Hide Result clamps collection exactly as before.
- [ ] **Run RED:** `npm.cmd test -- src/domain/replayNavigation.test.ts src/ui/components/PokerTable.test.tsx src/ui/importedTournament.test.tsx --maxWorkers=2`. Expect new helper/control/active-label failures while existing accounting tests remain unaffected.
- [ ] **Implement pure navigation in existing helpers.** Use existing flattenActions order; prefer the first eligible SHOW, otherwise explicit SHOWDOWN, strictly before collection. Return the event's pre-consumption index. Derive active labels from source transitions: an upcoming reveal/marker begins Showdown; consumed reveals retain it until a dealt board/betting transition; a later marker begins it again. Do not change buildReplayState transfer logic, source event order, street enum or engine phase to simulate UI selection.
- [ ] **Extend shared ReplayControls** with Showdown and the active-label helper. Retain allowed-total checks and the current controller's privacy guard; mock hands without explicit boundary show a disabled control. Fit the fifth control at every required width without moving table/seat geometry. Extend approved-frame masks only to `.streetNavigation` within the same <=10% cap; explicitly assert navigation/command/table bounds remain unchanged and controls remain operable.
- [ ] **Run GREEN** with targeted unit tests and the affected browser frame/control cases. Expect unchanged finances, exact before-event targets and preserved privacy. Record the checkpoint; no commit.

### Task 5: Integrated browser acceptance, independent review and handoff

**Files:** extend `phase1b1-refinement.spec.ts`, existing import/correction/shell tests where copy or identities deliberately changed; create `docs/qa/phase-1b-1/`; update `Roadmap/README.md`, `Roadmap/phase-1.md` and relevant QA/parser-guide cross-references only.

**Interfaces:** consume Tasks 1-4 exports/props unchanged. Real import continues through the existing input/service/controller; all selected-hand reset and failure outcomes remain authoritative.

- [ ] **Extend the browser tests, with RED before any remaining integration fix.** Reuse the Daily replay cases from Task 3 for before-SHOW/Forward/privacy/board navigation and alias/source details. Add complete Daily Classic at1440/1024/768/430/390 for Info/Warnings, neutral metadata, shared rows, long-alias fit and source ID accessibility. Add Fifty desktop and GGMasters mobile for refund/short-handed and separate-award regressions. This imports each of four fixtures once or more, without a 4x5 full-file matrix.
- [ ] **Check behavior and bounds.** Assert no page overflow; rank/suit inside card, readable compact cards, name/action/stack non-overlap after actions, selected-row metadata and IDs intact, both navigator variants share the card pattern, and aliases survive hand switches. Inspect source ID through title/accessibility or roomier details; do not require a second visible nameplate line. Test keyboard activation, disabled Showdown, grouped-detail expansion, re-import dialog focus and replacement safety. Keep no-fake-analytics, no import persistence/network, exact source identities and immutable fixture hash assertions.
- [ ] **Update obsolete test expectations, not protections.** Replace "Import warnings" headings with grouped notice assertions and "Opponent <ID>" primary-name assumptions with alias plus traceability assertions. Preserve exact cards/chips/privacy checks. Existing screenshot generation must use new QA paths or archive/restore prior outputs; do not silently replace historical screenshots.
- [ ] **Generate new review evidence:** desktop/mobile Overview notices, shared hand rail/Review Queue, readable table and board, Showdown before first SHOW, first reveal with privacy off, privacy on, and accessible alias/source details. Use `docs/qa/phase-1b-1/`, scroll to the intended origin, disable screenshot animations, and record fixture hashes and viewport matrix. Inspect the screenshots themselves; numeric layout checks do not establish perceived readability.
- [ ] **Run final verification sequentially, with bounded logs:**

  ```text
  npm.cmd run lint
  npm.cmd run typecheck
  npm.cmd test -- --maxWorkers=2
  npm.cmd run test:visual -- tests/visual/approved-frame.spec.ts tests/visual/phase1b1-refinement.spec.ts tests/visual/tournament-import.spec.ts tests/visual/phase1b-corrections.spec.ts tests/visual/visual-migration.spec.ts tests/visual/tournament-subpages.spec.ts tests/visual/replayer-shell.spec.ts --workers=2
  npm.cmd run build
  ```

  Expected: zero failures. This includes the existing all-four-fixture finances,
  adapter/replay determinism and import integration tests. Do not assume a final
  test count or claim checks before inspecting exits/output. Broaden only for a
  failure or unresolved risk. Run configured repository formatting and changed-file
  Prettier/whitespace checks; record the known pre-existing formatting exceptions
  separately, keep affected files unchanged, and check new untracked text directly.

- [ ] **Request one independent final code review.** Provide this spec/plan, only the native-baseline correction diff, focused source references, test evidence and screenshots. Preserve unrelated Phase 0/1A/1B work. Reviewer checks the five Review Focus items, performs independent applicable verification, and lists exclusions. Resolve Critical/Important findings with reproducing RED -> GREEN tests and a green relevant/full unit suite; record Minor findings and scope rulings. No implementation-agent fan-out or duplicate broad documentation survey.
- [ ] **Finalize status and scope after verification.** Phase 0 COMPLETE; Phase 1A COMPLETE; Phase 1 IN PROGRESS; Phase 1B IN REVIEW/refinement; Phase 1B.1 READY FOR REVIEW only if acceptance passes. Record files changed, actual commands/results, browser matrix/screenshots, review/fix evidence, existing formatting exceptions, partial-export alias limitations and memory-only imports. Verify all four fixture/reference/spec hashes; restore generated prior QA/compiler artifacts, archive the ledger/recovery evidence, and confirm no unrelated changes or commits.
- [ ] **Stop at the review handoff.** Report only the requested warning/card/Showdown/alias changes, files, tests/browser/checks, limitations and roadmap status. Do not start Phase 1C, commit, push or deploy.

## Plan self-review

Spec coverage maps to Tasks 1 (notices/metadata), 2 (aliases/traceability), 3
(shared cards/precise visual guards), 4 (navigation/privacy), and 5
(responsive acceptance, all fixtures, review/status). Every Review Focus item
has tests in its owning task. Helper names/types above are the contracts later
tasks consume; no new parser, adapter, calculation engine or domain model is planned.

Planning changed only this plan and the approved spec's presentation/status text.
Implementation remains pending plan review; no production changes or tests were
run as part of writing this document.
