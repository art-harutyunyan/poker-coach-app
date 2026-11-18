# The Study — Dark Performance (Nocturne) handoff

Approved: Dashboard ("Nocturne — Dashboard") and Hand Replayer ("Nocturne — Hand Replayer (Refined)" plus the "· Hand browser open" state). The 6, 7 and 9-handed table frames are reference states. The `folio-*` tokens are kept only for a possible future light theme; don't use them in the dark UI.

## Tokens (theme)

- **Surfaces:** `noc-bg` #0E0F12 for the app, `noc-panel` #16181D for tiles, `noc-raised` #1F2229 for rows and plates, `noc-line` #2A2E37 for borders.
- **Text:** `noc-text` #ECEDEF for primary, `noc-text-2` #A9AEB8 for secondary, `noc-text-3` #828896 for tertiary (minimum for readable copy).
- **Accent:** `noc-accent` #D4F25A, with `noc-accent-ink` for text on it. Use it only for the primary action, the selected state and the current actor. Never for position badges.
- **Grades:** `noc-best`, `noc-good`, `noc-inaccuracy`, `noc-mistake`, `noc-major`. Always pair the colour with a text label.
- **Table:** `noc-felt` #2C2442 (aubergine) and `noc-rail` #08080B.
- **Position tones** (badge text / tint / border): blinds neutral #E4E5E9; early (UTG, UTG+1, UTG+2) blue #9CC0FF; middle (LJ, HJ) teal #7FDCD5; late (CO, BTN) violet #C8B9FF.
- **Card faces:** #F4F4F1, with red #D23A4A for hearts and diamonds and ink #16181D for spades and clubs. **Card back (approved option B, ivory inlay):** 2px ivory #F1EDE4 border, navy #1A2238 field, centred ivory ring.
- **Type:** `noc-display` (Funnel Display 28/34), `noc-heading` (17/24), `noc-metric` (34/40), `noc-body` and `noc-body-bold` (Geist 14/20), `noc-caption` (Geist 12/16), `noc-mono` (DM Mono 13/18) for every number, stack and bb value. 12px is the minimum size.
- **Corners:** `noc-md` 10px for rows, plates and buttons; `noc-lg` 16px for tiles.

## Layout (desktop, 1440 × 900)

- **Shell:** 72px icon rail, then content with 8px gutters between bordered `noc-panel` tiles.
- **Replayer:**
  - Hand strip tile on top, about 128px tall, with the hand cards on one horizontal scrolling row. A pinned "Browse all" tile opens the browser as a 640px popover anchored bottom-end.
  - Below the strip: the table tile (flexible width) beside a 400px analysis tile that scrolls internally.
  - Table stage is 900 × 470: rail 640 × 290 with a 14px border, board centred, control dock underneath.
- **Seat geometry:** Hero is always bottom centre. Other seats sit on an ellipse (centre 450,233; rx 370; ry 200), evenly spaced, in clockwise order from Hero. Action chips sit between the player and the pot, and must not overlap the board area (about x 305–595, y 152–272). Pixel positions for each table size are in the four table frames.
- **Opponent cards:** a face-down pair sits centred directly above the nameplate with a 4px gap (pair left = plate left + 49, pair top = plate top − 42). Build cards and plate as one seat unit in code so they move together.
- **Dashboard:** header strip, then a three-row tile grid (next session plus four metrics; quality, trend, leaks; tournaments, reviews, training).

## Components (folder "Replayer")

- **PlayingCard:** `rank` (shows "10", never "T"), `suit` (spade / heart / diamond / club), `size` (sm 22×28, md 44×62, lg 50×70), `variant` (face / back / empty). Use `back` for hidden opponent cards and `empty` for undealt board slots. Folded players show no cards.
  - `back` always renders at 27×38, whatever `size` is set.
  - On the table: Hero's cards are `lg`, board cards `md`, opponents 27×38. The hand strip and browser use `sm` faces.
  - A revealed opponent card must also render at 27×38 (wrap it), so it doesn't shrink when it flips.
- **SeatPlate:** `name`, `position`, `stack`, `status`, `state` (waiting / active / to-act / folded / all-in), `positionTone` (blinds / early / middle / late), `hero`. Plates are 156px wide, 188px when `hero` is set.
  - `status` is a text prop and is not derived from `state`. Pass matching labels: "Waiting", "In hand", "Your decision", "Folded", "All-in".
- **ActionChip:** `label`, `amount`, `kind` (bet / call / raise / check / fold / all-in). Keep these off the nameplates.
- **GradePill:** `label`, `grade` (best / good / inaccuracy / mistake / major).
- **HandStripItem:** `handNumber`, `spot`, `cards` slot, `grade` slot, `selected`. 176px wide.
- **AnalysisSection:** an expandable section (built on Subframe's Collapsible), with `trigger` and `children` slots and `open`/`defaultOpen`.

These components sync to code with the Subframe CLI, one folder per component, with an index.tsx wrapper for your logic. Pages are not synced: implement them from the Export tab or through the MCP server.

## What the design does vs. what the React app must implement

- **Design or prototype only:** static states, hover styles, the browser popover and expandable sections opening, and the toggles shown in their visual states.
- **App (Codex) must implement:**
  - hand-history parsing and replay state
  - pot and stack maths
  - seat assignment for 6 to 9-handed tables, including mapping each seat index to the ellipse slot relative to Hero
  - dealer-button ownership (always BTN)
  - action-chip lifecycle per street
  - card reveal timing and Hide result (never pass a face card for an opponent before the hand history allows it)
  - search and filters in the hand browser, keyboard navigation, playback timing and speed
  - analysis data, with source and confidence coming from the engine. All analysis values in these designs are illustrative.

## Known limitations

- Seat positions are fixed absolute coordinates for each table size. Generate them from the ellipse formula in code.
- In the editor, page frames preview at the 1100px default while the layouts are built at a fixed 1440. Check them at 1440.
- Icons are drawn inline in the designs because the project has no icon library. Replace them with the app's own icon set.

---

# Tournaments module — approved

Approved frames:

- "Nocturne — Tournaments": library plus a selected, analysed tournament.
- "Nocturne — Tournaments · Analysis not available": the same layout for a tournament without analysis results.
- "Nocturne — Tournaments · Import".
- "Tournaments — States": reference sheet for every component state, empty state and error state.

All data in these frames is illustrative.

## Tokens

No new tokens; Tournaments uses only the `noc-*` tokens above.

- **Selected tournament or hand:** `noc-accent` border on #22261A, the same as the Replayer's HandStripItem.
- **Status tints:**
  - success: #5EE0A0 at 12%
  - warning: #F2C14E at 12%, border at 28%
  - rejected / error: #F25C6E at 14%, border at 32%
- **Unavailable or not-yet-known values:** `noc-text-3`, an em dash, a hollow dot or a dashed border. Never use a grade colour for these.

## Layout (1440 × 900)

- **Shell:** 72px nav with Tournaments active, then 8px gutters between tiles. Both main tiles scroll internally, and the page never scrolls.
- **Library column, 364px:**
  - Header: Tournaments and count, plus the lime Import button.
  - Search by name, ID or buy-in.
  - All / Analysed / Needs action segment, plus a date sort.
  - Recency-grouped list of TournamentListItem.
  - Footer with totals and "Stored in this session only".
- **Workspace (flexible):**
  - **Overview tile:** name, status tag, meta line (source, ID, buy-in, date and time, format), up to two secondary pill actions, and the stats strip.
  - **Hand browser tile (remaining height):** segment tabs, search, filter chips, column header, HandTableRow list, and a selection bar with keyboard hints and the single lime "Open in Replayer".
- **Stats strip with analysis:** hands imported, finish (summary file only), decisions graded, reviewed, and a decision-quality bar with a labelled count per grade.
- **Stats strip without analysis:** hands imported and finish stay. The three analysis cells are replaced by one neutral panel: "Analysis not available for this tournament", with a note that hands can still be browsed and replayed.
  - Graded and Mistakes tabs show "—" and are disabled.
  - The Grade filter becomes a dashed "needs analysis" chip.
  - Rows show "Not analysed". Flagging still works.
  - No analytical figures are shown.
- **Finish:** shown only when a GG tournament summary was imported. Otherwise show "—" with "No summary file imported", never an estimate.
- **Lime:** Import in the library and Open in Replayer in the hand browser, plus the selected tournament and selected hand. No other lime.

## Components (folder "Tournaments")

### TournamentListItem

Props: `name`, `result`, `buyIn`, `date`, `format`, `handCount`, `statusLabel`, `mistakes`, `flagged`, `tournamentId`, `status`, `selected`. Pass "" to hide `result`, `mistakes` or `flagged`.

| status      | Default label                   | Dot                 | Label colour     | Use when                            |
| ----------- | ------------------------------- | ------------------- | ---------------- | ----------------------------------- |
| ready       | "Analysed {n}"                  | filled `noc-best`   | `noc-text-2`     | Imported and analysis results exist |
| warning     | "{n} hands skipped"             | `noc-inaccuracy`    | `noc-inaccuracy` | Imported, some records skipped      |
| analysing   | "Analysing · {done} of {total}" | `noc-text-3`        | `noc-text-2`     | Analysis running                    |
| unavailable | "Analysis not available"        | hollow `noc-text-3` | `noc-text-3`     | Imported, no analysis results       |
| empty       | "No usable hands"               | `noc-text-3`        | `noc-text-3`     | 0 hands accepted                    |

- `mistakes` is shown only for ready, or for warning when analysis exists. `result` is shown only with a summary file.
- There is no conflict status for tournaments. A conflicting import is rejected at import time, so it never enters the library, and the existing tournament keeps its own status.

### HandTableRow

Props: `handNumber`, `cards` slot (two PlayingCard `sm`), `position`, `spot`, `street`, `stack` (effective), `pot`, `grade` slot, `selected`, `reviewed`, `flagged`.

- **Grade slot:**
  - With analysis: GradePill, or "Not graded" when the hand has no graded decision.
  - Without analysis: "Not analysed" in `noc-text-3`.
- **Reviewed:** green check. **Flagged:** flag icon. Both can show together.
- **Selected:** accent border and an accent hand number. Hover uses `noc-raised`.
- **Column widths:** 48 hand, 56 cards, 56 position, flexible spot, 64 street, 64 stack, 80 pot, 112 grade, 48 status, then a chevron. The page header uses the same widths.

### ImportResult

One row per file. Props: `title`, `fileName`, `detail`, `message`, `actions` slot, `status`.

| status     | Icon / treatment             | Title                                            | Detail / message                                                                                                                                      | Actions                       |
| ---------- | ---------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| processing | Spinner, lime progress bar   | Tournament or "Reading file…"                    | "Parsing · {n} of ~{total} hands"                                                                                                                     | Cancel                        |
| success    | Green check                  | Tournament name                                  | "{id} · {n} hands accepted · 0 rejected · {format}"                                                                                                   | Open tournament (lime)        |
| warning    | Amber triangle, amber border | Tournament name                                  | Counts, then the reason for skipped records                                                                                                           | View skipped · Open           |
| duplicate  | Neutral copy icon            | "{name} — already imported"                      | "Identical to tournament {id} · existing tournament reused", "Nothing added."                                                                         | Show existing                 |
| conflict   | Red arrows, red border       | "{name} — rejected"                              | Same ID but different contents, naming what differs. Message: "File rejected. The existing tournament is unchanged — nothing was merged or replaced." | Show existing · Dismiss       |
| error      | Red ×, red border            | "Unrecognised file" or "Couldn't read this file" | "0 hands accepted" and the reason                                                                                                                     | Remove or Choose another file |

- **Conflict rows:** never offer Replace, Merge or Keep, and never imply contents can be combined.
- **Duplicate rows:** reuse the existing accepted tournament.

### EmptyState

Props: `icon` slot, `title`, `description`, `actions` slot (at most one lime action). Approved uses:

| Use                                                    | Action                   |
| ------------------------------------------------------ | ------------------------ |
| No tournaments yet                                     | Import .txt files (lime) |
| No tournaments match "{query}"                         | Clear search             |
| No usable hands                                        | Re-import · Remove       |
| No hands match these filters                           | Clear filters            |
| Couldn't read this file                                | Choose another file      |
| Analysis not available yet ("No analysis results" tag) | Browse hands             |

## Status integration rules (React)

- **Derive labels from a typed status:**
  - Define `type TournamentStatus = "ready" | "warning" | "analysing" | "unavailable" | "empty"` and `type ImportStatus = "processing" | "success" | "warning" | "duplicate" | "conflict" | "error"`.
  - Derive `statusLabel`, titles and default actions from these in each component's index.tsx wrapper, using the tables above.
  - A label override is allowed only for data-specific copy such as counts or field names. It must never change the meaning of the status.
- **Derive status from the import outcome, not from UI copy:**
  - 0 accepted hands → error or empty, never success.
  - Same ID with different contents → conflict, and nothing written.
  - Identical file → duplicate.
  - Skipped records with more than 0 accepted → warning.
- **Analysis:** availability comes from the analysis engine. Without results, use `unavailable` (or `analysing` while it runs) and blank every analytical prop. Never default grades or counts to 0.

## Import behaviour

- **Every file is checked for:**
  - GGPoker .txt format
  - tournament ID and buy-in from the hand headers
  - de-duplication by hand ID
  - same ID with different contents being rejected
- **Library:** imports only ever add tournaments. An existing accepted tournament is never modified, replaced or merged by a later import.
- **Batches:** several files and several tournaments can be imported at once. Each file reports its own result, and the summary chips count outcomes.
- **Storage:** session only, with no cloud persistence or sync.

## Codex integration responsibilities

- GG .txt parsing, validation, the duplicate and conflict rules above, and the counts of skipped hands.
- Tournament and hand stores for the session. Summary-file parsing for finish and prize, when one is provided.
- Search, filters and sort for tournaments and hands, with live counts in tabs and chips. Disable analysis-dependent filters when there are no results.
- Selection state, plus keyboard: ↑↓ moves, Enter opens, F flags. Reviewed and flagged state per hand.
- Opening the Replayer: pass the tournament ID and hand ID, keep the selected-hand context, and use the existing strip and Browse all model. Tournaments never renders playback.
- Analysis engine integration: grades, decision quality and reviewed counts only when results exist.

## Known limitations (Tournaments)

- In the editor, frames preview at the 1100px default while the layouts are built at a fixed 1440. Screenshots were checked as rendered 1440-wide surfaces, not in a live 1440 browser window.
- Status labels are free-text props on the Subframe components. The typed derivation belongs in the React wrappers.
- Hover is shown on the states sheet as a static style. Real hover, focus and disabled behaviour comes from the app.
- Icons are inline SVGs. Replace them with the app's icon set.

## Achievement badges (approved addition)

The player's verified tournament result. It is independent of analysis status: a tournament can show an achievement with no analysis at all.

### AchievementBadge (folder "Tournaments")

`variant`: itm / final-table / winner. A compact 22px tag with a 6px radius, a 12px icon and a 12px caption label. The square-cornered tag shape keeps it distinct from the round grade pills.

| variant     | Label       | Icon             | Text                                    | Fill / border        |
| ----------- | ----------- | ---------------- | --------------------------------------- | -------------------- |
| winner      | Winner      | crown            | champagne #E8C987                       | #E8C987 at 10% / 40% |
| final-table | Final table | table with seats | violet #C8B9FF (the late-position tone) | #C8B9FF at 8% / 28%  |
| itm         | ITM         | coin             | `noc-best`                              | #5EE0A0 at 7% / 25%  |

- **Colour:** never lime, which stays reserved for primary actions and selection. These are fixed colour values; no new theme tokens were added.

### Placement

- **TournamentListItem:**
  - New prop `achievement`: none (default) / itm / final-table / winner.
  - The badge sits at the right end of line 1 (name line), and the name truncates before the badge.
  - The finish (`result`) moved to the right end of line 2, so finish and badge form a right-hand column.
  - The hand count may truncate only when a very long finish needs the space.
  - The row stays three lines and grows about 2px.
- **Overview header:** the same badge sits after the tournament name, before the import/analysis tag. The Finish cell in the stats strip is unchanged. There is no other achievement widget.

### Priority and data rules (React)

- **One badge maximum:** the highest verified result wins, Winner › Final table › ITM. Never stack badges.
- **Winner:** confirmed 1st place.
- **Final table:** confirmed finish within that tournament's final-table size from the tournament data. Never assume 9 seats.
- **ITM:** confirmed paid finish or prize from the tournament summary. Bounty winnings or a positive net result alone never qualify.
- **No verified result** (no summary file, or incomplete data): `achievement="none"` and `result=""`. No badge, no finish, never a guess.
- **Verified finish with no prize:** show the finish with no badge.
- **Derivation:** compute `achievement` in the wrapper from a typed result object, for example `{ position, entrants, paid: boolean, finalTableSize?: number }`. If `finalTableSize` is unknown, Final table isn't awarded unless the position is 1st (which is Winner).

### Reference

"Tournaments — States", section 1b, shows Winner, Final table, ITM, No achievement and Result unknown, both with analysis complete and with analysis not available. All data is illustrative.

## Buy-in and Won (approved addition)

### TournamentListItem: updated layout (supersedes the earlier row description)

Four compact lines. Vertical gap 4px and padding 8px: the row is about 10px taller than the three-line version, so no value has to be truncated.

| Line | Left                           | Right                                                              |
| ---- | ------------------------------ | ------------------------------------------------------------------ |
| 1    | Name (truncates first)         | AchievementBadge                                                   |
| 2    | "Buy-in" `buyIn` · "Won" `won` | Finish (`result`)                                                  |
| 3    | Date · format · hand count     | Tournament ID (`noc-text-3`, the only element allowed to truncate) |
| 4    | Status dot and label           | Mistakes · flagged                                                 |

New props:

- `won`: a formatted amount string such as "$412.80".
- `wonState`: unknown (default) / verified / zero.

The `buyIn` value is now always neutral `noc-text`; it no longer turns lime when the row is selected.

### Display rules

- **Labels:** "Buy-in" and "Won" in `noc-caption` / `noc-text-3`. Amounts in mono 12px.
- **Buy-in:** neutral `noc-text`. The advertised entry amount, including the fee when known.
- **Won: three states, never inferred:**

| wonState          | Shows        | Colour       | Use when                     |
| ----------------- | ------------ | ------------ | ---------------------------- |
| verified          | `won` amount | `noc-best`   | Payout confirmed and above 0 |
| zero              | "$0.00"      | `noc-text-2` | Payout confirmed as 0        |
| unknown (default) | "—"          | `noc-text-3` | No summary or unverified     |

- **Unknown is never zero:** a missing summary is never shown as $0.00 or as a loss.
- **Not from position or hands:** a finishing position or hand activity never sets Won.
- **Won is the verified total payout:** placement prize plus bounties, with nothing counted twice when the reported payout already includes bounties.
- **Won is independent of the badge:** bounty-only winnings can be verified while ITM stays off.
- **Not on rows:** net profit, ROI and other calculations. They're reserved for the future Tournament Performance Tracker.

### Selected tournament overview

- **Meta line:** shows "Buy-in {amount}".
- **Finish cell:** subtext reads "of {entrants} · Won {amount}", using the same terms and values as the row.
- **Without a summary:** the Finish cell shows "—" with "No summary file imported", and Won is not shown.
- **No new financial widgets.**

### Financial data fields (future integration)

| Field            | Meaning                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `tournamentId`   | Stable ID used for de-duplication. Never count a tournament twice. |
| `buyIn`          | Advertised entry amount                                            |
| `entryFee`       | Fee component, when listed separately                              |
| `totalCost`      | Actual spend: entries, re-entries, rebuys, add-ons and fees        |
| `totalWon`       | Verified total payouts received                                    |
| `currency`       | ISO currency of all amounts                                        |
| `resultVerified` | Whether the payout and finish are confirmed                        |

- **Missing vs zero:** a missing value (`null`) is distinct from a confirmed `0` everywhere.
- **Display mapping:** `wonState` is `verified` when `resultVerified && totalWon > 0`, `zero` when `resultVerified && totalWon === 0`, and `unknown` otherwise.

### Future Tournament Performance Tracker (not designed yet)

- **Net profit:** `totalWon − totalCost`.
- **ROI:** net profit ÷ `totalCost` × 100%.
- **Inputs:** only tournaments with `resultVerified` and a known `totalCost` are used. Exclude the rest and report how many were excluded.
- **Cost:** never assume `buyIn` equals `totalCost`, because re-entries, rebuys and add-ons change it.
- **Currency:** never sum different currencies without an explicit conversion method.

### Codex responsibilities

- **Extraction:** read buy-in, fee, payouts, bounties and finish from GG Poker tournament summaries when available. Plain hand histories usually can't confirm winnings.
- **Validation:**
  - set `resultVerified`
  - keep missing values distinct from zero
  - avoid counting bounties twice
  - de-duplicate by `tournamentId`
- **Formatting:** amounts in the tournament's currency with 2 decimals. Map to `wonState` and `achievement` in the TournamentListItem wrapper.

### Reference

"Tournaments — States" section 1c shows six cases:

- verified winnings (bounties only, no ITM)
- confirmed $0
- unknown
- Winner with winnings
- ITM with winnings
- analysis unavailable with verified winnings

Sections 1 and 1b now carry Won values too. All data is illustrative.

---

# Development — Stage 1 · proposed, pending review

Frames: "Nocturne — Development" (overview), "· Review queue" and "· Leak detail". All data is illustrative.

## Layouts (1440 × 900, 72px nav with Development active)

- **Overview:**
  - Summary strip: title and coverage line, decision-quality bar, and three small figures (major mistakes, active leaks, 30-day mistake rate).
  - Main tile: "Learning priorities", a ranked list of LeakCards.
  - 400px right column: review-queue entry points, study progress, and one lime "Next action".
- **Review queue:**
  - 240px category rail. By grade: Major mistake, Mistake, Inaccurate, Excellent. By situation: Missed open / steal, Missed 3-bet, Bet sizing, Blind defense, Large pot, All-in.
  - Table tile: search, filter chips, HandTableRow list (situation column includes the tournament), and a selection bar with the single lime "Open in Replayer".
- **Leak detail:**
  - Header: name, severity tag, category, and a stats strip (mistakes, estimated impact, coverage, reliability).
  - Decision patterns: actual vs recommended, with frequency.
  - Evidence hands: HandTableRow list.
  - 360px right column: Why it matters, Next steps (Replayer primary, Training, Playbook), and Source and confidence.

## New component: LeakCard (folder "Development")

- **Props:** `name`, `category`, `severityLabel`, `stat`, `explanation` (one line), `reliability`, `actions` slot, `severity` (high / medium / low / preliminary), `selected`.
- **Severity colours:**

| severity    | Bar and label colour                            |
| ----------- | ----------------------------------------------- |
| high        | `noc-major`                                     |
| medium      | `noc-mistake`                                   |
| low         | `noc-inaccuracy`                                |
| preliminary | dashed `noc-text-3` bar, hollow reliability dot |

- **Selected:** lime border on #22261A.
- **Reused as-is:** HandTableRow, GradePill, PlayingCard, EmptyState. AnalysisSection is available for expandable explanations.

## Severity and reliability rules

- **Severity:** estimated impact × frequency, as provided by the engine. Never shown for a preliminary pattern.
- **Reliability:**

| Level                             | Decisions | Treatment                                    |
| --------------------------------- | --------- | -------------------------------------------- |
| Well supported                    | ≥ 30      | —                                            |
| Moderate                          | 15–29     | —                                            |
| Preliminary / insufficient sample | < 15      | Labelled; never ranked above supported leaks |

- **Every figure shows its sample:** "14 of 46 decisions". Coverage shows analysed vs total spots, and unanalysed spots are excluded from counts.
- **Impact:** shown as "≈" with "engine estimate". Hidden when the engine doesn't provide it, never computed in the UI.
- **Source:** reference ranges from the analysis engine. Never present solver-level precision.

## States to support (design rules; a states sheet is still to do)

- **Analysis:** available, analysing (counts marked partial), or unavailable. When unavailable there are no grades, counts or EV: show EmptyState "Analysis not available yet" with a link to the hands in Tournaments.
- **Results:** no mistakes identified (EmptyState with positive copy), insufficient sample (preliminary LeakCard), no matching items in the queue (EmptyState with "Clear filters").
- **Hands and leaks:** reviewed (check), flagged (flag), selected (lime), unselected or selected leak.
- **Training:** available (ghost button) or unavailable (dashed, dimmed, "Training not available yet").

## Connections (Codex)

- **Dashboard priority → Leak detail:** pass the leak ID.
- **Tournaments → Review queue:** pass a pre-filter of tournament ID plus category (for example flagged).
- **Hand → Replayer:** tournament ID, hand ID and decision index. The Replayer opens at that decision.
- **Training → drill category:** only when Training exists; until then show the unavailable state.
- **Playbook → range or concept:** pass the concept ID.

## Data requirements

- **Per decision:** `handId`, `tournamentId`, `decisionIndex`, `grade`, `actualAction`, `recommendedAction`, `evLoss?`, `position`, `effStackBb`, `street`, `situationTags[]`, `reviewed`, `flagged`.
- **Per leak:** `leakId`, `name`, `category`, `decisions`, `mistakes`, `coverage { analysed, total }`, `impactEstimate?`, `reliability`, `patterns[]`, `source`.
- **Missing vs zero:** a missing value (`null`) is never shown as 0.

## Known limitations

- **Category counts:** shown for one selected category only. Live counts, sorting by EV loss, and the keyboard actions (R marks reviewed, F flags) are app logic.
- **Tournament column:** HandTableRow carries the tournament inside the situation text. A dedicated tournament column would need a component change, which is proposed for review only.
- **Frame width:** frames preview at 1100px in the editor and are built at 1440.
