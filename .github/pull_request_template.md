# Pull request

## Problem and user outcome

-

## Scope

### Included

-

### Not included

-

## Product and trust boundary

- [ ] No legal-advice, evidence-authentication, truth-determination, or
      outcome-prediction claims were introduced.
- [ ] Explicit-upload, local-first, and no-implicit-synchronization boundaries
      remain intact.
- [ ] Original bytes do not cross the AI boundary; extracted text still requires
      explicit consent.
- [ ] AI-derived information remains suggested until user verification.
- [ ] New or changed facts and events retain exact source provenance.
- [ ] Missing, changed, stale, and malformed provenance fails closed.
- [ ] Privacy, retention, deletion, backup, restore, and recovery behavior was
      considered and accurately described.

## Risk and recovery review

- Concurrency and stale-tab behavior:
- Collision and duplicate-action behavior:
- Partial-write and rollback behavior:
- Draft preservation and user recovery:
- Security and private-data considerations:

## Verification evidence

List commands that were actually run and exact observed results. Use `N/A` with
an explanation rather than checking a gate that was not run.

### Dependency and workflow policy

- Command or method:
- Observed result:

### Typecheck

- Command or method:
- Observed result:

### Deterministic tests

- Command or method:
- Observed result:

### Chromium and IndexedDB

- Command or method:
- Observed result:

### Accessibility and responsive UI

- Command or method:
- Observed result:

### Generated assets and hygiene

- Command or method:
- Observed result:

### Secret and private-content scan

- Command or method:
- Observed result:

## Visual review

- Viewports and states reviewed:
- Keyboard, focus, live regions, and reduced motion:
- Screenshots or traces retained only as local diagnostics:

## Publication verification

- [ ] Base and head SHAs were reverified before publication.
- [ ] The resulting commit and changed-file list were inspected.
- [ ] Expected remote blobs were verified where the change was assembled
      outside a normal checkout.
- [ ] Required CI completed successfully, or the PR remains explicitly blocked.

## Limitations and next weakest area

-
