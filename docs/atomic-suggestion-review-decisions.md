# Atomic suggestion review decisions

Confirming or correcting an AI suggestion is one user decision, not a sequence of independent database writes. CaseFind creates the user-decided fact, removes the pending suggestion, and updates case activity in one IndexedDB transaction spanning `facts`, `suggestions`, and `cases`.

Before writing, the transition verifies that the pending suggestion still exists and belongs to the same case and source file as the proposed fact. The user-entered correction is stored only in the confirmed fact; the source quote and original-file provenance remain unchanged.

The boundary requires:

1. Fact creation, suggestion removal, and case activity commit together.
2. Missing or mismatched suggestion provenance aborts the decision.
3. A storage failure leaves the original suggestion pending and creates no fact.
4. Failed correction preserves the user's draft in the open dialog for retry.
5. Review and fact counts change only after transaction completion.
6. Reload presents the pending suggestion and no partial fact.
7. No provider request or external synchronization is retried automatically.

Separate Chromium lifecycles inject transaction aborts for confirmation and correction. They verify complete rollback, stable provenance, preserved review state, retryable UI, and no external traffic.
