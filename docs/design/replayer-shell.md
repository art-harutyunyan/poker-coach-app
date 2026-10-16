# Approved Replayer Shell Refinement

Date: 2026-10-16. Phase 0 remains **READY FOR REVIEW**.

## Reference and Scope

The supplied [Settings prototype](https://poker-coach-the-study.arthurharutyunyan.chatgpt.site/#Settings)
establishes the shared design language. The same prototype's Tournament > Replayer
screen establishes the review workspace. Both were inspected in Chrome; desktop
and mobile replayer captures are in `docs/qa/shell-source-replayer-{1440,390}.png`.
The previously supplied ZIP's CSS was used to verify tokens and spacing.

This is not a whole-prototype feature port. Poker Coach's domain contracts, mock
data, AI boundary, approved table artwork, card rendering and seat system remain
the existing implementation. The only PokerTable change wraps its existing
timeline in a disclosure; the stage, pot, board and seat markup are unchanged.

## Shell System

- `replayer-shell.css` owns scoped review-shell styles and responsive rules;
  `poker-seats.css` continues to own every table/seat geometry rule, unchanged.
- Local Inter (`Seat Inter`, already licensed/bundled) is the shell font. No new
  font service, icon dependency or image asset was introduced. Existing Lucide
  icons are retained; headings use 500-600 weight and zero letter spacing.
- Source palette: background `#101815`, sidebar `#131d17`, panel `#19231e`,
  border `#334238`, text `#efece2`, muted `#a1ada5`, gold `#d5bf90`, green
  `#8fc3a5`. Coral/amber remain assessment semantics, not decoration.
- Controls use 5px corners, 44px command targets, 180ms color/background changes,
  and visible gold keyboard focus. Motion respects reduced-motion preferences.
- Main/sidebar spacing uses 8/12/16/18/24/32px. Shell headers use fixed type steps,
  not viewport-scaled fonts. Typography changes do not reach the card assets.

## Responsive Modes

| Width         | Navigation                              | Review workspace                                          |
| ------------- | --------------------------------------- | --------------------------------------------------------- |
| 1440+         | 214px sidebar                           | 64/68px study rail, flexible table, 300/330px analysis    |
| 1251-1439     | 76px icon sidebar with accessible names | Rail, table and analysis remain side by side              |
| 1180-1250     | Compact sidebar                         | Analysis below table                                      |
| 701-1179      | Existing accessible top screen selector | Rail/table, analysis below                                |
| 700 and below | Compact top selector                    | Compact rail, full-width table, stacked controls/analysis |

The source's 1250px analysis breakpoint and the approved seat system's 700px
mobile breakpoint are retained. No seat coordinates or card dimensions changed.
The history has its own horizontal scrolling area; it cannot enlarge the table's
grid track. Development-only preview controls expand into four columns, or two
on phones. They start collapsed so the table remains the main surface.
On phones the compact rail replaces the duplicate hand heading; the tournament
title stays visible and Review Queue remains directly available in the section tabs.

## Interaction and Content Decisions

- The existing Overview, Review Queue and Replayer tabs are visible. Unsupported
  prototype sections (Mistakes, Analytics, Report, etc.) were not implemented as
  dead tabs or later-phase features.
- The rail contains the **one actual playable hand**, not the queue's five
  illustrative descriptions misrepresented as five different hands. Selecting
  it returns to the existing Hero decision. Reviewed status is session-local.
- Street buttons jump to the first existing action of that street, preserving
  cursor semantics: `[0, cursor)` applied, `cursor` pending. Missing streets are
  disabled. Back/Forward/keyboard and Hide Result behavior are retained.
- Action history is available as a disclosure. Its future-action masking is
  unchanged. A stable preflop assessment is not presented as a new assessment of
  each later-street action.
- Decision/Context are functional Radix tabs. Actual/recommended, severity,
  confidence, reason, strategy mix, alternative line and provenance are retained.
  Context describes the actual fixed decision binding and current replay cursor.
- Theory/exploit toggles were not fabricated without corresponding mock content.
  Ask Coach is explicitly unavailable; no AI provider is called.
- Upload and profile entries open accessible informational dialogs. They do not
  upload/process files, authenticate or write preferences. Both are available
  through the mobile screen selector as well as the desktop sidebar.
- Branding remains Poker Coach, not the source prototype's THE STUDY. Mock names,
  dates, grades, amounts and analysis copy are not replaced with screenshot data.
- Dashboard/development/training/playbook bodies are not redesigned. Shared brand
  and informational entry markup changes apply to navigation only.

## Verification

See `docs/qa/replayer-shell/README.md` and the current `design-qa.md` for results
and screenshots. Hash checks confirm PlayerSeat, seatLayout, PlayingCard,
poker-seats.css, visualThemes and the replay engine remain byte-for-byte unchanged.
