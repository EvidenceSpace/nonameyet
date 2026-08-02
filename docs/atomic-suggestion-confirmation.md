# Atomic suggestion confirmation

Confirming an AI suggestion is one review decision, not two independent database writes. CaseFind must create the user-decided fact, remove the pending suggestion, and update case activity together.

The transition uses one IndexedDB transaction spanning `facts`, `suggestions`, and `cases`. Before writing, it verifies that the pending suggestion exists and belongs to the same case and source file as the proposed fact.

The boundary requires:

1. The fact creation, suggestion removal, and case activity update commit together.
2. Missing or mismatched suggestion provenance aborts the transition.
3. A storage failure leaves the original suggestion pending and creates no fact.
4. Review and fact state changes only after transaction completion.
5. A failed decision displays a retryable local-storage message without claiming confirmation.
6. Reload presents the same pending suggestion and no partial fact.
7. No provider request or external synchronization is retried automatically.

The Chromium lifecycle injects an abort during the case activity update and verifies complete rollback, stable counts, preserved review state, and no external traffic.
