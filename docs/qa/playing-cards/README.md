# Approved playing cards � review evidence

Status: READY FOR REVIEW; human visual acceptance pending. Implementation date: 2026-11-07.

## Source and implementation

The final supplied Product Design PDF and Option A face / Option B back SVG pack are authoritative. The five files in `src/assets/playing-cards/` are byte-identical to the ZIP entries; see `asset-sha256.txt`. No generated or alternate suit art is used. Trusted static SVG imports preserve the normalized viewBox and currentColor; the original back is rendered inline with its supported explicit data-variant attribute. This preserves the Table motif and borders even when a constrained Table card is narrower than 32px.

`PlayingCard` owns compact/table/board tokens, full accessible names, T-to-10 presentation, and the identity-free concealed branch. The existing card/context props and development preview path remain compatible. Navigator and Review Queue share compact cards; Hero and opponent hole cards share table; community cards use board. No domain/parser/replay changes were made.

## Manual visual evidence

All screenshots use the real Daily Monster Stack GG fixture through the application upload UI, except the clearly labeled isolated specimen sheet. Widths: 1440, 1024, 768, 430, 390.

- [Exact approved-size specimens, all suits and all backs](approved-specimens.png)
- [Desktop navigator and compact Ten](board-1440.png)
- [Mobile navigator](navigator-390.png)
- [Desktop revealed opponent and Hero](revealed-1440.png)
- [Mobile revealed opponent and Hero](revealed-390.png)
- [Desktop concealed cards](concealed-1440.png)
- [Mobile concealed cards](concealed-390.png)
- [Desktop five-card board](board-1440.png)
- [Mobile five-card board](board-390.png)
- [Review Queue](queue-1440.png)
- [Mobile Review Queue](queue-390.png)
- [200% zoom](zoom-200.png)
- [Forced colors](forced-colors.png)

The same navigator/revealed/concealed/board/queue evidence exists for each requested width. Screenshots require human product acceptance; automated checks do not constitute that acceptance.

## Demonstrated layout constraints and deviations

The supplied sizes are exact for standalone cards and unconstrained table use. Compact is always exactly 24x34. The existing group gaps remain unchanged (the PDF lists group gaps as suggestions).

Full-size mobile boards overlapped fixed side nameplates at 430 and 390. Full-size table cards also collided with nameplates or committed-bet labels in existing 6/8/9-seat geometry tests. The fixes change card sizing only; no seat coordinates, nameplates, stacks, actions, chip anchors, or navigation were moved.

- Mobile board width is `min(46px, 14.8cqw - 20.8px)`, with height/rank/suit/padding scaled in the approved proportions. In the test viewport this is approximately 39.88x55.49 at 430 and 33.96x47.25 at 390. This reserves 4px beside the fixed 84px side plates and retains the existing 3px group gaps.
- Mobile Table cards use 35x47.25; nine-seat tables use 31x41.85 to clear the denser vertical spacing. Six-seat tables use width `min(40px, 17cqw - 31px)` and proportional height to clear their existing side commitment labels (approximately 31.9x43.065 at 390).
- Nine-seat desktop tables at stage heights up to 500px use 34x45.9, since the fixed adjacent plate spacing leaves only 47px for cards.
- Original board-holder heights (53 desktop / 46 small container / 39 mobile) remain, with cards centered in that slot. This preserves pot/brand/street text positions while allowing the approved larger artwork to occupy existing surrounding spacing.

These exceptions need explicit manual visual review. Colors, Arial-compatible font family, suit geometry, back artwork, and rank mapping are unchanged. Original variant shadows and radii remain.

## Geometry baseline provenance

`before-geometry-<width>.json` records the same imported river state with the pre-task CSS restored in the browser. Font URLs were resolved to the original local Seat Inter file before measurement. Seat/nameplate/action/stack/chip/navigation rectangles are compared exactly. Center text bounds allow less than 0.02px for fractional flex centering; no whole-pixel movement is allowed. The permanent tests read these frozen files and do not regenerate them.

Historical screenshots are not regenerated as new references. Existing card-only expectations change for full accessible names, approved border color, and the authorized PlayingCard source hash. Existing non-card pixel comparison and geometry protections remain.

## Verification

- Component RED/GREEN: new card contract, T mapping, source silhouettes, color mapping, concealed identity equivalence, and parent accessibility suppression; integration RED/GREEN catches the old opponent compact mapping.
- Full unit suite: 392 tests passed across 29 files, including existing fixture accounting/replay/determinism checks (674 hands).
- Seven new browser cases cover the five-width real import matrix, frozen non-card geometry, zoom/forced colors, approved specimens, and narrow Table back variants. Final post-review run: 7/7 passed (2.2m).
- Typecheck, lint, and production build passed after the review fix. Changed-file formatting and scoped git diff --check passed.
- 64 historical visual/privacy cases passed (62 in the main run, two after updating obsolete card labels); 12 table geometry cases passed across desktop/mobile 6/8/9-seat normal/all-in states. These runs preceded the final inline-back fix; the focused browser suite checks that fix and all five imported widths afterward. Historical QA artifacts were restored byte-for-byte after these runs.
- One fresh independent review completed: no Critical findings; one Important finding fixed with RED/GREEN regressions. Narrow Table backs previously selected Compact styling through the external SVG viewport. The supplied inline data-variant contract now explicitly preserves Table styling. Component verification passed 23/23 and the complete post-fix unit suite passed 392/392.

No commits, pushes, deployment, Phase 1C work, or unrelated product changes.

## Deferred minor and review limitations

The reviewer found that the compact Ten text-range guard permits intrusion into padding and uses an unscaled border allowance at 200% zoom. Actual measured Ten widths were 17.796875px at 100% and 35.59375px at 200%, within the respective 18px/36px content widths. No product clipping was observed. This test-strengthening minor is deferred under the executing-plans workflow.

The zoom screenshot verifies the compact navigator at 200%; it is not evidence of whole-application reflow acceptance. Forced-colors evidence is captured separately at normal zoom. Human acceptance of the supplied design and constrained-size exceptions remains pending.

## Scope and execution decisions

- Main worktree and uncommitted delivery follow the user's instruction; the pre-task working tree, including existing unrelated changes, is the comparison baseline. Scratch evidence is retained because there is no commit record.
- Demonstrated layout collisions justify the card-only size exceptions above; the cost is reduced card size in dense profiles, requiring human review.
- The supplied back's supported inline variant replaces the planned image URL. Original SVG files remain byte-identical; decorative SVG CSS is excluded from geometry text snapshots. The cost is additional static decorative markup, covered by concealed-identity equivalence tests.
- Existing card-only assertions were updated to the new design. Unrelated historical visual protection remains in place.
- No second review was dispatched: the one Important finding received one TDD fix pass and fresh verification, as required by the approved execution workflow.
