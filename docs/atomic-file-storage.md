# Atomic file storage and activity updates

Adding an original record changes two pieces of local state: the file record and the case's last-activity timestamp. They must commit in one IndexedDB transaction.

If the browser runs out of storage, the profile becomes unavailable, or the transaction is interrupted while either write is pending, CaseFind must not leave a stored file with a failed UI state or update case activity without the file.

The boundary requires:

1. The original file write and case activity update use one transaction spanning `files` and `cases`.
2. Any request error or explicit abort rolls back both writes.
3. The in-memory file list and statistics change only after transaction completion.
4. The user receives a clear local-storage error and can retry.
5. No processing job, extraction artifact, fact, or suggestion is created.
6. Reload shows the same pre-attempt state.
7. No external request or synchronization is used as a fallback.

The Chromium lifecycle injects an abort when the case activity update is queued after the file add. It verifies that IndexedDB rolls back the file, preserves the prior case timestamp, reports the failure without an unhandled browser error, and remains empty after reload.
