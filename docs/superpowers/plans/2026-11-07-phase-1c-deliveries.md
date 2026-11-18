# Phase 1C Delivery Plan Index

Status: DELIVERY INDEX AND SHARED CONTRACT APPROVED. 1C.1 accepted 2026-11-12; 1C.2 is READY FOR REVIEW with [evidence](../../qa/phase-1c/1c2/README.md). 1C.3-1C.4 remain gated. These are four delivery plans under one architecture, not permission for one uninterrupted execution.

**Spec:** [Approved Phase 1C design](../specs/2026-11-07-phase-1c-tournament-library-stats-design.md), especially section 1's binding visual clarification.

| Delivery | Executable plan                                                                         | Reviewable result                                                                                |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1C.1     | [Facts, metrics and corpus audit](2026-11-07-phase-1c-1-facts-metrics.md)               | Pure contracts, exact denominator regressions, independently audited corpus counts; no UI change |
| 1C.2     | [Session Tournament Library](2026-11-07-phase-1c-2-tournament-library.md)               | Multiple imports, duplicate/conflict handling and isolated tournament navigation                 |
| 1C.3     | [Hand filtering and navigation](2026-11-07-phase-1c-3-hand-navigation.md)               | Compact controls inside the existing navigator using the same facts                              |
| 1C.4     | [Tournament Stats and integrated acceptance](2026-11-07-phase-1c-4-stats-acceptance.md) | Real Overview stats, outcome privacy and integrated Phase 1C evidence                            |

## Shared execution contract

- Read the approved spec and the selected delivery plan. Earlier delivery interfaces are dependencies, not invitations to recreate their implementations.
- Work in the main PokerCoachApp worktree. Preserve existing dirty work. At each delivery start record working-tree hashes/copies for affected files, immutable fixtures and protected UI; compare task changes against this baseline, not only HEAD.
- Existing application sidebar, branding, typography, headings, navigation, spacing, buttons, workspace, cards and table are the visual source of truth. Mockups specify only approved feature structure and mobile behavior.
- No mockup banners/footers, proposal boxes, placeholder metric values, serif shell replacement, new sidebar treatment or schematic table. Production methodology goes in Definition/Coverage controls.
- No new dependency, central store, parser/ledger/replay rewrite, persistence, AI, strategy judgment, optional metrics or unrelated product change.
- Use mandatory TDD and study-poker-validation. Each task's tests must fail for its intended missing behavior before implementation, then pass. Preserve accepted domain/replay semantics and historical visual protection.
- No commits, push, merge or deployment are authorized by these plans. Preserve task evidence while uncommitted; do not run destructive cleanup. The usual skill commit steps are replaced by task-ledger/scope checkpoints under the user's authorization boundary.
- Each delivery ends at READY FOR REVIEW with executed checks, task-only scope, exclusions/limitations and a fresh independent review. Stop before the next delivery until that delivery is accepted and continuation authorized. 1C.1's independent source audit is distinct from its final code review; 1C.4's review assesses whole-phase integration as well as its UI delta.
- Native execution is recommended per delivery because interfaces are tightly coupled and each delivery already has an independent review boundary. Subagent-driven execution remains available if the user chooses it at plan approval. Do not infer Phase 1C execution authorization from the earlier card task.

## Verification common to all deliveries

At the delivery boundary, run these commands and read exit status/output; a plan checkbox is not evidence of a pass:

```powershell
npm.cmd test -- --maxWorkers=2
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Run `npx.cmd prettier --check` on the explicit changed-file list, excluding byte-preserved SVG/fixture inputs. Run `git -c safe.directory=C:/Arthur/Repos/Poker/PokerCoachApp diff --check` scoped to task paths, plus inspect new/untracked task files. Report pre-existing failures separately; do not broadly change formatting or weaken assertions. 1C.1 has no UI change and needs no new browser suite; UI deliveries specify browser commands below. Existing corpus unit suites must remain green (four files / 674 hands), with no presumed future test count.

Before browser runs, save historical QA output hashes/copies: some existing tests write screenshots into `docs/qa`. Restore only test-generated changes to those pre-run artifacts after verification, without discarding unrelated work. Store new acceptance screenshots under `docs/qa/phase-1c/<delivery>/`. Compare existing table/card geometry against the pre-delivery baseline; update only specific obsolete single-import assertions or intentionally added navigator-control area assertions, never regenerate broad references.

## Contract ownership

- 1C.1 owns `pokerMetricTypes.ts`, `handFacts.ts`, `preflopOpportunities.ts`, `pokerMetrics.ts`, definition version and corpus count provenance.
- 1C.2 owns session entries, upload-attempt state and selection/controller methods. Facts and metrics are derived once per entry and immutable thereafter.
- 1C.3 owns `HandFilter`, filter/count/navigation functions and navigator-local controls. The controller gains typed filter state here, not a parallel store.
- 1C.4 owns formatting/presentation and outcome-stat visibility controls. It consumes aggregates; it cannot recalculate eligibility or percentages in React.

## Documentation/status updates

At 1C.1 execution, update current Roadmap summaries to reflect user acceptance of 1B, 1B.1 and cards; retain historical dated evidence. Add Phase 1C and its four deliveries with checked items only as verified. Clarify session memory instead of the old generic persistence scope. Add `docs/adr/ADR-007-deterministic-poker-metrics.md` for the shared facts/opportunities/aggregation boundary. Subsequent deliveries append their evidence/status. Phase 1 stays IN PROGRESS; no completed history is renumbered.

## Planning self-review

Coverage checked against design sections 1-14 and final visual clarification. Explicit tasks cover the five highest-risk conditions in each plan's Review Focus. Cross-delivery names/types are defined once by the owning task; later plans consume them. The four stops are deliberate user review boundaries. Numeric corpus expectations are intentionally not invented in this plan: Task 4 of 1C.1 specifies their derivation, independent validation and pinning procedure. No product checks have been executed as part of writing these plans.

1C.1 accepted 2026-11-12. See [contracts, audited counts, verification and review fixes](../../qa/phase-1c/1c1/README.md). 1C.2 is authorized and in verification; 1C.3 and 1C.4 require separate approval.
