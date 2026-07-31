# Case hub archive lifecycle

The Chromium case-hub lifecycle verifies that archiving is reversible and remains local.

The gate requires:

1. A new case appears in Active.
2. Archiving removes it from Active and increments Archived.
3. The empty Active state explains how to continue.
4. The archived card is visibly marked and recommends restoration.
5. Selecting that recommendation restores the case without opening or mutating its records.
6. The case returns to Active with its normal next-step recommendation.
7. The restored state survives a page reload.

Archiving is organizational, not deletion. It does not remove original records, change facts, upload data, or imply that a dispute is resolved.
