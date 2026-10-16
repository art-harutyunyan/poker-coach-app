# Future GGPoker Parser Regression Strategy

Phase 0 does not implement the real parser.

When parser work begins, add:

- real anonymized GGPoker hand-history fixtures,
- golden normalized JSON outputs,
- edge-case fixtures for malformed files and partial histories,
- one regression test per parser bug,
- 6/7/8/9-handed position coverage,
- blind/ante level coverage,
- folds, calls, raises, all-ins, and side-pot coverage as supported,
- deterministic replay snapshot expectations before and after every action.

Parser tests should prove that downstream UI and analysis never depend on raw hand
history text once normalization succeeds.
