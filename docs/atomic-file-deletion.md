# Atomic original and processing deletion

Removing an original record also removes its local processing state and updates case activity. These changes form one operation and must not be committed independently.

CaseFind performs file removal in one IndexedDB transaction spanning `files`, `processing`, and `cases`. A failure or abort rolls back every deletion and the activity update.

The boundary requires:

1. The original, its processing job, and case activity change commit together.
2. An abort preserves all three prior records.
3. The workspace removes its in-memory row only after transaction completion.
4. A failed removal displays a retryable local-storage message without claiming success.
5. Reload presents the same original and processing state.
6. No external service or synchronization is used as a fallback.

Facts and AI suggestions continue to block removal before the transaction because deleting a cited source would break provenance. The Chromium lifecycle covers a later transaction abort and proves that neither the original nor its processing state is partially removed.
