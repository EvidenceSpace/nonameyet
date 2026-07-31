# Case hub deletion lifecycle

The Chromium case-hub lifecycle verifies permanent deletion from a library containing more than one local case.

The gate requires:

1. The dialog identifies the selected case by its exact title.
2. Missing-backup risk is visible before confirmation.
3. A mismatched title keeps deletion disabled even after acknowledgment.
4. Canceling preserves every case.
5. Exact-title entry and explicit acknowledgment enable deletion.
6. Only the selected case disappears.
7. A separate local case remains available.
8. The result persists across a page reload.

This workflow is intentionally different from archiving. Permanent deletion removes the selected case and related local data atomically; it does not affect unrelated cases or any external service.
