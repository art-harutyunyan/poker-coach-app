# Phase 1B.1 validation and manual review

Status: **READY FOR REVIEW**. Phase 0 and Phase 1A are COMPLETE; Phase 1 remains
IN PROGRESS and Phase 1B remains IN REVIEW / refinement.

The approved [design](../../superpowers/specs/2026-11-04-phase-1b-1-import-replay-refinement-design.md)
and [plan](../../superpowers/plans/2026-11-04-phase-1b-1-import-replay-refinement.md)
govern this bounded refinement. No parser truth, adapter, accounting, seat anchors,
table geometry, persistence, AI or Phase 1C work is included.

## Behavior and coverage

- One notice presenter keeps metadata gaps in Info and source anomalies in Warnings.
  Original diagnostics remain available in expandable technical details. Source
  currency, timezone and format remain unknown when absent; nothing is inferred.
- One shared card stylesheet replaces competing face rules. Existing card slots,
  concealment and development deck previews remain intact. Browser checks require
  rank weight >=600, text contrast >=4.5:1, border contrast >=3:1 and bounded glyphs.
- Showdown targets the first source SHOW before collection, or the explicit marker
  when no prior SHOW exists. It consumes neither. Active navigation follows source
  reveals and dealt streets, independently of the engine's betting-street state.
- Full-roster, code-unit sorted IDs determine unique display aliases using the
  approved name pool and numbered cycles. Nameplates show the alias; title and
  accessible identity retain exact GG source IDs. Hero and internal IDs are unchanged.
- Added tests cover notice classification/fallbacks, source immutability, large and
  reordered rosters, interleaving, replacement imports, all card contexts/suits,
  concealment, early/river/marker-only reveals, no-boundary disabling and privacy.
  Existing all-fixture accounting and parser/adapter/replay determinism stay required.
- Screenshot inspection caught a 390px Showdown label wrap. A failing browser
  regression preceded the narrow whitespace/flex correction; table coordinates did
  not change.

## Verification

| Check                                         | Result                                           |
| --------------------------------------------- | ------------------------------------------------ |
| `npm.cmd run lint`                            | PASS                                             |
| `npm.cmd run typecheck`                       | PASS                                             |
| `npm.cmd test -- --maxWorkers=2`              | PASS: 381 tests / 29 files                       |
| Seven-suite browser acceptance, `--workers=2` | PASS: 74 tests                                   |
| `npm.cmd run build`                           | PASS                                             |
| Changed-file Prettier and whitespace checks   | PASS                                             |
| `npm.cmd run format`                          | FAIL: five unchanged baseline files listed below |
| Fresh independent final review                | No Critical, Important or Minor findings         |

Browser suites: `approved-frame`, `phase1b1-refinement`, `tournament-import`,
`phase1b-corrections`, `visual-migration`, `tournament-subpages`, `replayer-shell`
under `tests/visual/`. No test timeout or configuration was relaxed.

Repository-wide formatting flags only unchanged `AGENTS.md`, `CODEX-INSTRUCTIONS.md`,
`Roadmap/phase-8.md`, `Roadmap/phase-9.md` and
`.playwright-mcp/page-2026-10-18T13-52-07-008Z.yml`. These pre-existing files are preserved.

[Independent review and exhaustive execution rulings](review.md) include its fresh
41-test unit run, browser guard and read-only mobile checks. The author also verified
[32 immutable files and the unchanged replay engine body](preservation.json).
All four fixture hashes match the pre-task baseline. Historical QA outputs and the
compiler cache were restored; no commits, pushes or deployments occurred.

[Complete changed-file list](changed-files.md) isolates this task from earlier work.
Recovery baseline, full logs, ledger and isolated review diff are archived at
`C:/Users/Lenovo/AppData/Local/Temp/PokerCoachApp-phase1b1-2026-11-04/`.

Historical approved PNGs are never regenerated. The affected frame guards decode
both PNGs through browser Canvas and compare every RGBA pixel outside measured
card bounds plus <=8px shadow padding and the street-navigation rectangle. Masks
must cover <=10% of the frame. Guard tests prove that an unmasked changed pixel is
detected, a full-frame mask is rejected and dimension changes fail. The original
PlayingCard source hash remains protected; only the authorized seat-card CSS hash
exception was added to existing exceptions. Unaffected frame pixels remain exact.

## Browser matrix and screenshots

| Fixture             | Hands | Acceptance widths                   | Purpose                                                              |
| ------------------- | ----: | ----------------------------------- | -------------------------------------------------------------------- |
| Daily Monster Stack |   222 | 1440, 1024, 768, 430, 390           | Existing full import; refined early SHOW/card checks at 1440/390     |
| Daily Classic       |   233 | 1440, 1024, 768, 430, 390           | Info 3 / Warnings 4, metadata, shared rows, aliases, partial summary |
| Fifty Stack         |   191 | 1440; 390 for short-handed/recovery | Refunds, four-player rendering, replacement safety                   |
| GGMasters           |    28 | 390                                 | Return, all-in and separate recorded awards                          |

Four fixtures contain **674 hands**. [SHA-256 evidence](fixture-hashes.json)
records the immutable inputs. Exhaustive all-hand/cursor financial and determinism
checks remain in domain/integration tests; there is no four-fixture/five-width cross product.

| Surface                           | Desktop                       | Mobile                      |
| --------------------------------- | ----------------------------- | --------------------------- |
| Overview and grouped notices      | [1440](overview-1440.png)     | [390](overview-390.png)     |
| Shared table/rail cards and board | [1440](cards-1440.png)        | [390](cards-390.png)        |
| Before first SHOW                 | [1440](before-show-1440.png)  | [390](before-show-390.png)  |
| First consumed SHOW               | [1440](first-reveal-1440.png) | [390](first-reveal-390.png) |
| Hide Result restored              | [1440](privacy-1440.png)      | [390](privacy-390.png)      |
| Hand rail                         | [1440](hand-rail-1440.png)    | [390](hand-rail-390.png)    |
| Review Queue                      | [1440](review-queue-1440.png) | [390](review-queue-390.png) |

[Original desktop card treatment](cards-before-1440.png) is retained for readability
comparison. Numeric guards establish unchanged geometry; screenshots establish
perceived readability. Prior QA outputs are restored after test generation.

[Completed partial-summary details at 390px](partial-summary-390.png) show aliases
with muted exact source IDs in the roomier results surface. The single recorded Ah
stays partial and is never invented as a timed replay reveal.

## Manual review

1. Run `npm run dev -- --port 5180 --strictPort` if a preview is not already running.
   Open `http://127.0.0.1:5180`. Upload Daily Classic using the persistent navigation
   action. Open its Overview: expect 233 hands, Info (3), Warnings (4), source $10.00,
   Currency Unknown, Timezone Not provided and Format Unknown. Expand a technical
   detail and confirm the source message/hand/line remain traceable.
2. In Review Queue and Replayer, compare the real compact Hero cards, hand ordinal,
   position/player count and subdued GG hand ID. No grades or analysis are present.
3. Import Daily Monster Stack and select **TM6468725291**. Turn Hide Result OFF.
   Click Showdown: **Action 22**, opponent cards still hidden. Forward: **23**, BTN
   shows **Ah 5d**. Forward: **24**, Hero remains **Kd Kc**, with no board yet. Flop
   reaches 25, Turn 26; River at 27 highlights the upcoming Showdown boundary.
4. Turn Hide Result ON: opponent cards and reveal/result history stay concealed.
   Select another hand and return: cursor/privacy reset; the opponent's alias stays
   stable for this import. Inspect its nameplate title/accessibility for **ad116bad**.
5. Inspect 1440/1024/768/430/390 widths: navigation labels fit on one line, text and
   cards are readable, name/action/stack lanes do not collide, and only the hand rail
   intentionally scrolls horizontally. Re-import stays beside tournament context.
6. Import Fifty Stack and inspect **TM6471062694** for a distinct returned bet;
   GGMasters **TM6524470976** retains separate 628/629-chip recorded awards.

## Limits and execution decisions

- Imports remain memory-only. Reloading clears imported data; no tournament library,
  persistence, AI, solver or strategy features were added.
- Aliases are stable for the complete observed roster. Different partial exports can
  assign different aliases; there is no cross-export identity promise.
- Absent currency/timezone/format and real source anomalies are preserved, not resolved.
- Native execution reused the authorized development worktree without commits. A
  file baseline isolates this task from pre-existing changes; ledger/log recovery
  evidence is archived outside formatter traversal because Git history cannot do so.
- Browser coverage extends existing full-fixture cases rather than repeating them in
  another suite. All four imports and all five required widths remain covered.
- Independent review found no defects; [all rulings](review.md) are recorded.
  Deferred minors: none. No known new visual inconsistencies remain.
