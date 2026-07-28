# Safe local case deletion

Case deletion is available only from the device-local case library. The confirmation dialog shows the affected record, fact, review, and original-byte counts plus the case’s encrypted-backup freshness state.

Deletion remains disabled until the user:

1. types the exact displayed case title, including case and spacing; and
2. checks the permanent-deletion acknowledgment.

The deletion itself uses one IndexedDB read/write transaction spanning `cases`, `files`, `facts`, `suggestions`, and `processing`. Related rows are selected by the `caseId` indexes and removed with cursors. The case record is deleted in that same transaction. If any operation aborts, IndexedDB rolls the transaction back instead of leaving a partially deleted case.

Deletion affects only local browser storage. It does not delete downloaded encrypted backups and does not contact an account or remote service.
