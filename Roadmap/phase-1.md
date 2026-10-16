# Phase 1 - Tournament Upload + Parser + Replayer

## Status

NOT STARTED

## Goal

Import GGPoker tournament hand-history files, normalize hands/actions, and connect
real parsed data to the replayer.

## Scope

Parser, upload/import flow, normalized tournament persistence, parser errors, golden
fixtures, and deterministic replay snapshots from real hand histories.

## Out of Scope

AI analysis, solver integration, full long-term development, and training generation.

## Dependencies

Phase 0 product/design approval.

## Task Checklist

- [ ] Implement GGPoker import validation.
- [ ] Normalize parsed hands into Phase 0 schemas.
- [ ] Add parser fixture regression suite.
- [ ] Connect real normalized hands to replayer.

## Acceptance Criteria

- [ ] Real anonymized GGPoker fixtures parse into golden normalized outputs.
- [ ] Replayer consumes parser output without UI redesign.

## Decisions / ADRs

- To be added during Phase 1.

## Risks / Open Questions

- GGPoker format variations need real fixture coverage.

## Validation Evidence

- Not started.

## Completion Log

- Not started.
