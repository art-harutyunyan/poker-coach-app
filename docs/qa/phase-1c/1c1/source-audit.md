# Phase 1C.1 independent source audit

Audit started 2026-11-11; revised-candidate verification completed 2026-11-12. Auditor: fresh independent source-audit agent, separate from the implementation and final code review.

**Conclusion: the revised candidate counts may be pinned.** The original candidate misclassified one 3-bet non-opportunity as excluded; the revised candidate fixes it. All 4,044 revised contribution rows, all 24 aggregate metric records, exclusion reasons and partition identities match independent raw-source calculations. No numerator or denominator discrepancy was found. This is a source audit, not product acceptance or a substitute for code review.

## Method and independence

Read the approved Phase 1C metric definitions and local poker-validation skill. Inspected original fixture text with absolute, one-based file line numbers. No production parser, facts, opportunity, aggregation or replay function was imported or called as the expected-value oracle.

A separate scratch Python scan reads the four original GG text files directly, tracks actual forced contributions, live preflop commitments, remaining stacks, folds, timed SHOW lines and board sections, and independently computes metric contributions. It also verifies contributions minus returns = recorded collections = source total pot for all 674 hands. Candidate rows are read only after this source calculation, for comparison. The script is retained at `.superpowers/sdd/2026-11-07-phase-1c-1-facts-metrics/independent-source-audit.py`; its source-derived hand ledger is `independent-hands.json` beside it. This scratch verifier covers observed grammar, not new parser support.

Executed `python .superpowers/sdd/2026-11-07-phase-1c-1-facts-metrics/independent-source-audit.py`: 674 hands, 4,044 metric rows, one initial classification discrepancy below. Representative manual action/arithmetic reasoning accompanies the full tally; it was not replaced by a second automated consumer of the implementation.

After the fix, executed the same script with argument `candidate-audit-revised`: **674 hands, 4,044 rows, zero mismatches**. Aggregate integer counts, percentages, exclusion reasons and all 24 partition identities also matched. The input files and revised candidate hashes appear at the end of this report.

Every metric in every tournament has a reviewed positive and eligible-zero representative, and a non-opportunity/exclusion representative whenever that category exists. Absent categories are explicitly marked in the matrix below. All initial unique exclusion reasons (`zero_stack_fold`, `short_open`, `ambiguous_reopening`) and their source hands were inspected; the revised corpus has no `ambiguous_reopening` exclusion after the correction. All four short blind posts, all four partial timed SHOW records and both multiple-Hero-collection hands were also inspected.

## Source-audit finding: original raiser is not a 3-bet opportunity

The first independent pass found one status-only difference: **TM6471059891**, Fifty Stack lines 4230-4283. Hero opens 8,000 at 4256; 13ab0373 raises to 20,000 at 4259; BB 990a4fab raises only 300 more to 20,300 all-in at 4262; Hero folds at 4263. Hero is the original raiser and never had a 3-bet opportunity in this hand. An opportunity-first scan therefore classified this as non-opportunity, whereas the candidate classified it excluded / `ambiguous_reopening`.

The approved definition explicitly makes an original raiser facing a re-raise a non-opportunity. The implementer preserved that known classification before considering later reopening exclusions, while retaining global zero-stack/source-warning exclusions, and reported a RED/GREEN regression. Independently verified fix: TM6471059891 is now non-opportunity; Fifty 3-bet stays **8/78**, excluded falls from **3 to 2**, and non-opportunity rises from **110 to 111**. This is a category partition correction, not a changed percentage or new betting-legality policy. Regenerated candidates now match the original independent source interpretation.

## Representative reasoning

File abbreviations in the tables refer to these immutable sources:

- C: [Daily Classic 10](<../../../../tests/fixtures/gg/GG20260905-2102 - Daily Classic 10.txt>) (309704619).
- M: [Daily Monster Stack 2.50](<../../../../tests/fixtures/gg/GG20260928-1307 - Daily Monster Stack 2.50.txt>) (314729652).
- F: [Fifty Stack 5.50](<../../../../tests/fixtures/gg/GG20260928-1905 - Fifty Stack 5.50.txt>) (314806258).
- G: [GGMasters 150](<../../../../tests/fixtures/gg/GG20261011-1700 - GGMasters 150, 1M GTD [2-Day Event].txt>) (317697722).

All ordinary rows below have a Hero deal, chips after forced posts and an observed preflop decision. Exceptions are stated explicitly. Award amounts below mean source collections, not net profit or reconstructed pot eligibility.

| Source / hand / absolute lines | Independent action and arithmetic justification                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C TM6376938321, 3885-3932      | BB 3,500. Opener's 5,679 minus ante 450 = 5,229 all-in; increment 1,729 < 3,500, hence short-open exclusion. Hero folds at 3910: VPIP/PFR/flop 0/1; showdown metrics non-opportunity.                                                                                                                                                                                                            |
| C TM6376938415, 3422-3482      | Full open 8,000 plus SB call; Hero has 96,165 - 500 - 4,000 = 91,665 remaining and owes 4,000. Both opponents can contest beyond 8,000. Hero calls at 3454: VPIP 1, PFR/3-bet 0; sees flop then folds at 3460, WTSD 0/1, W$SD non-opportunity.                                                                                                                                                   |
| C TM6376938430, 3375-3421      | Hero opens from SB to 8,800 at 3406, all others fold. Refund 4,800 does not erase VPIP/PFR. No preceding open means no 3-bet opportunity; no flop and uncontested settlement mean no showdown.                                                                                                                                                                                                   |
| C TM6376938439, 3327-3374      | Full open 8,000 at 3354, Hero remaining 94,165 > owed 8,000; opener's live capacity 180,876 > 8,000. Hero raises 25,085 at 3357: 3-bet 1/1. Subsequent refund does not erase it.                                                                                                                                                                                                                 |
| C TM6376938342, 3776-3833      | SB limps, BB Hero checks at 3808: no VPIP or PFR. Flop dealt with Hero active; river checks, timed Hero SHOW at 3819, two survivors, Hero collects 10,150 at 3821. Saw Flop, WTSD and W$SD each 1/1.                                                                                                                                                                                             |
| C TM6377255556, 9552-9617      | Declared BB 450; short BB pays 82 after ante 55 from starting 137. Full open is 900, not a raise relative to 82. Hero remaining 25,194 - 55 - 225 = 24,914, owes 675, opener live capacity 9,945 > 900: 3-bet eligible zero on call. River Hero SHOW at 9599; awards 343 + 343 + 11,058 = 11,744, all to opponents: W$SD 0/1. Short post alone does not exclude.                                 |
| C TM6377256916, 4852-4898      | SB starts 1,030, posts ante 300 and short blind 730, then folds at 4883 with zero remaining. Approved whole-hand unresolved-eligibility policy excludes all six metrics even though Hero folded earlier.                                                                                                                                                                                         |
| C TM6378370688, 174-241        | Hero folds at 204 before a later flop. No timed SHOW exists; opponent's summary-only Ah does not establish Hero showdown. VPIP/PFR/flop 0/1; WTSD/W$SD non-opportunity, not missing-Hero-reveal exclusion.                                                                                                                                                                                       |
| M TM6468722636, 9515-9571      | Hero opens 880, sees flop, bets river and opponent folds. VPIP/PFR/flop 1/1, WTSD 0/1, W$SD non-opportunity. 3,805 refund is not collection; SHOWDOWN marker at 9558 is not a contested showdown.                                                                                                                                                                                                |
| M TM6468722697, 9464-9514      | Hero unopened fold at 9496: VPIP/PFR/flop zero; no open faced and no Hero showdown. Opponent's BB walk does not become Hero's opportunity.                                                                                                                                                                                                                                                       |
| M TM6468722859, 9226-9284      | Full open 800 plus caller. Hero remaining 36,226 - 50 - 400 = 35,776 > 400 owed; opener has 40,325 live capacity > 800. Hero fold at 9262 is 3-bet 0/1; later opponent flop does not count as Hero seeing flop.                                                                                                                                                                                  |
| M TM6468724008, 7823-7875      | Full open 1,600, Hero SB has 45,465 remaining and owes 1,200; opener live capacity 29,785 > 1,600. Hero raises 5,216: 3-bet 1/1. Uncontested finish is not showdown.                                                                                                                                                                                                                             |
| M TM6468723561, 8368-8434      | Hero preflop calls (no PFR), survives complete river, SHOW at 8418 and 33,480 collection at 8421: WTSD/W$SD 1/1. River raise does not affect PFR.                                                                                                                                                                                                                                                |
| M TM6468724274, 7467-7524      | Hero opens then calls through river; timed Hero SHOW at 7510, opponent receives entire 12,982. Confirmed showdown 1 and collected-share 0, each with denominator 1.                                                                                                                                                                                                                              |
| M TM6468725291, 6485-6545      | Full open 2,800 plus two calls. Hero BB remaining 85,832 - 175 - 1,400 = 84,257 > 1,400 owed; live opponents can contest beyond 2,800. Hero raises then calls subsequent all-in: at most one 3-bet 1/1. Hero SHOW 6527 precedes board-only flop/turn/river 6528-6530; complete surviving contested runout and collection 59,420 establish flop, showdown and share, not premature replay reveal. |
| F TM6469897039, 9817-9874      | Hero unopened fold at 9843; later opponent board/showdown irrelevant. VPIP/PFR/flop 0/1; 3-bet/WTSD/W$SD non-opportunity.                                                                                                                                                                                                                                                                        |
| F TM6469897081, 9762-9816      | Full open 660, Hero remaining 45,212 - 35 - 300 = 44,877 > 360 owed; opener capacity 50,070 > 660. Hero call means VPIP 1, PFR/3-bet 0. River SHOW 9802 and collection 8,400 establish WTSD/W$SD 1/1.                                                                                                                                                                                            |
| F TM6469897386, 9419-9466      | SB limp and BB Hero raise to 1,771: VPIP/PFR 1, no prior open so 3-bet non-opportunity. Refunded 1,371 does not reverse entry.                                                                                                                                                                                                                                                                   |
| F TM6470154503, 9071-9133      | Hero preflop call 800, flop call 990, turn fold 9116: Saw Flop 1/1, WTSD 0/1, W$SD non-opportunity.                                                                                                                                                                                                                                                                                              |
| F TM6470154792, 8883-8948      | Hero opens, sees full board and SHOWs at 8932; opponent collects all 14,292 at 8935. WTSD 1/1 and W$SD 0/1.                                                                                                                                                                                                                                                                                      |
| F TM6470155670, 8267-8325      | Full open 1,600, Hero remaining 104,540 - 100 - 800 = 103,640 > 800 owed; opener live capacity 52,955 > 1,600. Hero raises 6,148 then calls 4-bet. One 3-bet 1/1, early Hero SHOW plus full runout and 107,110 award.                                                                                                                                                                            |
| F TM6470156513, 7573-7625      | Hero folds at 7603 before any raise. Opponent summary cards cannot create a timed Hero reveal. No Hero flop/showdown, no unknown-showdown exclusion needed.                                                                                                                                                                                                                                      |
| F TM6471059891, 4230-4283      | Original Hero open, full re-raise and short all-in re-raise 300 < prior increment 12,000. Hero never faces a 3-bet opportunity; non-opportunity takes precedence. See the source-audit correction above.                                                                                                                                                                                         |
| F TM6471060650, 3438-3502      | Opener starts 7,047 minus ante 750 = 6,297; opening increment 297 < declared BB 6,000. Hero raise does not count as supported 3-bet: short-open excluded. Hero remains through river and SHOWs; two Hero collections 33,891 + 41,252 = 75,143 count one W$SD 1/1.                                                                                                                                |
| F TM6471061841, 1618-1669      | SB starts 5,493, ante 1,250 plus short blind 4,243 exhausts it; folds at 1653. All six metrics excluded for zero-stack fold. No sit-out interpretation inferred.                                                                                                                                                                                                                                 |
| G TM6522429068, 1585-1641      | Full open 110 (increment 60 >= BB 50). Hero remaining 9,994 > owed 110; opener 9,994 live capacity. Fold 1617: 3-bet 0/1; VPIP/PFR/flop zero, showdown metrics non-opportunity.                                                                                                                                                                                                                  |
| G TM6524469107, 1526-1584      | Hero opens 100, sees flop, folds turn. VPIP/PFR/flop 1/1; no prior open so 3-bet non-opportunity; WTSD 0/1, W$SD non-opportunity.                                                                                                                                                                                                                                                                |
| G TM6524470976, 253-317        | Full open 154 (84 >= BB 70). Hero remaining 9,680 - 8 = 9,672 > 154, opener live capacity 10,299 > 154. Hero raises 544: 3-bet 1/1. River SHOW 301 and split awards 628 + 629 = 1,257: Hero's 628 counts one collected share, not half a win.                                                                                                                                                    |
| G TM6524471450, 1-66           | Full open 161 (91 >= BB 70) plus caller. Hero remaining 9,732 - 8 - 70 = 9,654 > 91 owed; opener capacity 10,141 > 161. Hero raises 656: 3-bet 1/1. Turn all-in SHOW 50 plus completed river 51 qualifies; opponent receives all 20,203, Hero W$SD 0/1.                                                                                                                                          |

## Additional boundary and anomaly checks

- C **TM6377257180**, lines 4081-4136: short SB 1,743 - 450 ante = 1,293, no impossible fold. At Hero fold 4111 a full open to 8,750 faces a Hero with 88,815 remaining; opener's live capacity is 104,830. 3-bet remains eligible zero. The post alone does not justify blanket exclusion. Along with the two zero-stack-fold hands and TM6377255556, these are all four short-blind sources.
- C **TM6376938612**, lines 2660-2708: Hero has 86,765 - 750 = 86,015 against 214,924 owed; cannot raise. All other live capacities also fall below that wager. Non-opportunity. C **TM6376938576** is the second observed insufficient-Hero-stack instance.
- C **TM6377256536**, lines 6122-6173: Hero has 39,266 remaining against 11,635 owed, but only opponent is all-in at 13,235 and every other player folded. No opponent can contest above opening wager: non-opportunity despite sufficient Hero chips. Same reason verified at C TM6377256244, M TM6469819992 / TM6468776313 / TM6468726716 and F TM6471060369 using all live stacks at the decision. For M TM6469819992, Hero has 334,550 > 83,184 owed but sole opponent's total is exactly 95,184. For F TM6471060369, Hero has 112,030 > 30,450 owed but sole opponent's total is exactly 35,450.
- M **TM6469769213**, lines 1616-1674: Hero folds at 1649, later SHOWs one card at 1659. Remains known false for Hero showdown. The other three one-card SHOW records are M TM6469819712 (587-645), M TM6468724217 (7577-7635), F TM6470156970 (7093-7153); each partial revealer already folded. In TM6469819712 Hero separately has a valid two-card early SHOW and confirmed showdown. Partial opponent art cannot supply Hero evidence.
- M **TM6468777751**, lines 3078-3138: Hero completes SB 2,500, so VPIP 1 but PFR 0; early SHOW plus completed turn/river confirms showdown. Hero collections 16,356 + 2,296 = 18,652 count once. Returned 8,000 is separate and not winnings. Together with F TM6471060650 these are both multi-Hero-award sources.

## Coverage limits

All four tournaments have eligible positive and zero rows for every exposed metric. No real-corpus hand leaves a surviving contested Hero without a timed reveal, so `missing_hero_reveal` is **not** empirically exercised in these counts; the two mandated summary-only hands have folded Heroes. No Hero forced-post exhaustion is present. No live confirmed one-card Hero showdown occurs; the one-card Hero example is folded. Missing/inconsistent awards, unsupported MUCK, unknown future warnings, short Hero all-in second raises and the precise all-in-300 / other-opponent-100 eligibility example require labeled synthetic evidence. Corpus evidence does not establish arbitrary betting legality or side-pot eligibility.

The independent scanner corroborates observed source counts, not a universal parser or validator. It assumes this immutable GG grammar and never evaluates hand strength. All zero award contributions rely on complete reconciled source collections. Source-confirmed WTSD and collected-share W$SD retain their qualified definitions; these numbers do not estimate an unbiased population or strategic quality.

## Independently corroborated counts

Percentages below are presentation-only rounding of the integer ratio. E = eligible denominator, X = exclusions, N = non-opportunities. For each row E + X + N equals the imported hand count.

| Tournament (hands) | Metric   | Numerator / E | Percent |   X |   N |
| ------------------ | -------- | ------------: | ------: | --: | --: |
| 309704619 (233)    | vpip     |      48 / 232 |   20.7% |   1 |   0 |
| 309704619 (233)    | pfr      |      38 / 232 |   16.4% |   1 |   0 |
| 309704619 (233)    | threeBet |       13 / 96 |   13.5% |   2 | 135 |
| 309704619 (233)    | sawFlop  |      29 / 232 |   12.5% |   1 |   0 |
| 309704619 (233)    | wtsd     |       11 / 29 |   37.9% |   1 | 203 |
| 309704619 (233)    | wsd      |        8 / 11 |   72.7% |   1 | 221 |
| 314729652 (222)    | vpip     |      52 / 222 |   23.4% |   0 |   0 |
| 314729652 (222)    | pfr      |      38 / 222 |   17.1% |   0 |   0 |
| 314729652 (222)    | threeBet |        7 / 84 |    8.3% |   0 | 138 |
| 314729652 (222)    | sawFlop  |      30 / 222 |   13.5% |   0 |   0 |
| 314729652 (222)    | wtsd     |       13 / 30 |   43.3% |   0 | 192 |
| 314729652 (222)    | wsd      |       11 / 13 |   84.6% |   0 | 209 |
| 314806258 (191)    | vpip     |      42 / 190 |   22.1% |   1 |   0 |
| 314806258 (191)    | pfr      |      31 / 190 |   16.3% |   1 |   0 |
| 314806258 (191)    | threeBet |        8 / 78 |   10.3% |   2 | 111 |
| 314806258 (191)    | sawFlop  |      33 / 190 |   17.4% |   1 |   0 |
| 314806258 (191)    | wtsd     |       22 / 33 |   66.7% |   1 | 157 |
| 314806258 (191)    | wsd      |       13 / 22 |   59.1% |   1 | 168 |
| 317697722 (28)     | vpip     |        6 / 28 |   21.4% |   0 |   0 |
| 317697722 (28)     | pfr      |        6 / 28 |   21.4% |   0 |   0 |
| 317697722 (28)     | threeBet |        2 / 11 |   18.2% |   0 |  17 |
| 317697722 (28)     | sawFlop  |        5 / 28 |   17.9% |   0 |   0 |
| 317697722 (28)     | wtsd     |         2 / 5 |   40.0% |   0 |  23 |
| 317697722 (28)     | wsd      |         1 / 2 |   50.0% |   0 |  26 |

## Per-tournament representative coverage matrix

Each ID below has original absolute lines and reasoning in the preceding table. “Absent” means the category does not occur in that tournament, not missing review. Exclusions list every distinct excluded source hand.

| Tournament | Metric   | Eligible 1/1 | Eligible 0/1 | Non-opportunity | Excluded                                                  |
| ---------- | -------- | ------------ | ------------ | --------------- | --------------------------------------------------------- |
| 309704619  | vpip     | TM6376938415 | TM6376938321 | Absent          | TM6377256916 (zero_stack_fold)                            |
| 309704619  | pfr      | TM6376938430 | TM6376938321 | Absent          | TM6377256916 (zero_stack_fold)                            |
| 309704619  | threeBet | TM6376938439 | TM6376938415 | TM6376938342    | TM6376938321 (short_open); TM6377256916 (zero_stack_fold) |
| 309704619  | sawFlop  | TM6376938342 | TM6376938321 | Absent          | TM6377256916 (zero_stack_fold)                            |
| 309704619  | wtsd     | TM6376938342 | TM6376938415 | TM6376938321    | TM6377256916 (zero_stack_fold)                            |
| 309704619  | wsd      | TM6376938342 | TM6377255556 | TM6376938321    | TM6377256916 (zero_stack_fold)                            |
| 314729652  | vpip     | TM6468722636 | TM6468722697 | Absent          | Absent                                                    |
| 314729652  | pfr      | TM6468722636 | TM6468722697 | Absent          | Absent                                                    |
| 314729652  | threeBet | TM6468724008 | TM6468722859 | TM6468722636    | Absent                                                    |
| 314729652  | sawFlop  | TM6468722636 | TM6468722697 | Absent          | Absent                                                    |
| 314729652  | wtsd     | TM6468723561 | TM6468722636 | TM6468722697    | Absent                                                    |
| 314729652  | wsd      | TM6468723561 | TM6468724274 | TM6468722636    | Absent                                                    |
| 314806258  | vpip     | TM6469897081 | TM6469897039 | Absent          | TM6471061841 (zero_stack_fold)                            |
| 314806258  | pfr      | TM6469897386 | TM6469897039 | Absent          | TM6471061841 (zero_stack_fold)                            |
| 314806258  | threeBet | TM6470155670 | TM6469897081 | TM6469897039    | TM6471061841 (zero_stack_fold); TM6471060650 (short_open) |
| 314806258  | sawFlop  | TM6469897081 | TM6469897039 | Absent          | TM6471061841 (zero_stack_fold)                            |
| 314806258  | wtsd     | TM6469897081 | TM6470154503 | TM6469897039    | TM6471061841 (zero_stack_fold)                            |
| 314806258  | wsd      | TM6469897081 | TM6470154792 | TM6469897039    | TM6471061841 (zero_stack_fold)                            |
| 317697722  | vpip     | TM6524469107 | TM6522429068 | Absent          | Absent                                                    |
| 317697722  | pfr      | TM6524469107 | TM6522429068 | Absent          | Absent                                                    |
| 317697722  | threeBet | TM6524470976 | TM6522429068 | TM6524469107    | Absent                                                    |
| 317697722  | sawFlop  | TM6524469107 | TM6522429068 | Absent          | Absent                                                    |
| 317697722  | wtsd     | TM6524470976 | TM6524469107 | TM6522429068    | Absent                                                    |
| 317697722  | wsd      | TM6524470976 | TM6524471450 | TM6522429068    | Absent                                                    |

## Audited input and candidate identity

SHA-256 values identify exactly the files read for this audit. They do not replace semantic source review.

| File                                                      | SHA-256                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| GG20260905-2102 - Daily Classic 10.txt                    | `3e5c4693d2c3a80b2434187dffc9e6c7a8f2660e8af177af691ce738e51b36dc` |
| GG20260928-1307 - Daily Monster Stack 2.50.txt            | `c966062804091b0ebca39576f78c67f59414a67b4474ccde33e4ef24bb66c427` |
| GG20260928-1905 - Fifty Stack 5.50.txt                    | `ddb42ab8cc06a3e833b990803ab92d24ef5a0448d6553cebc152c5b0c83bafbd` |
| GG20261011-1700 - GGMasters 150, 1M GTD [2-Day Event].txt | `38fc0e0fd3ee9320830c1383dc59783c5b18a9198edd3b837e9c7a76d60aa1a0` |
| candidate-audit-revised/counts.json                       | `05ac19b09b93129ebb10ccd073285023ae3be6d7ee6fe30adebcddfe03da3912` |
| candidate-audit-revised/rows.json                         | `a6001ffebdfa5d62045f27744a4f49767cdb794b42d4eb4d3b1c0d9f4abe7a35` |
