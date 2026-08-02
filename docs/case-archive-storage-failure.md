# Case archive storage failure

Archiving is a reversible local organization action, but the library must not hide a case until the updated record is committed to IndexedDB.

The case card stays in its current view while saving. If the case write fails or aborts, CaseFind restores the Archive or Restore action, leaves counts and stored state unchanged, and displays a card-local status explaining that nothing changed and the action can be retried.

The Chromium lifecycle injects an aborted case write and verifies that the active case remains visible, archive counts stay accurate, `archivedAt` and `updatedAt` remain unchanged, reload preserves the active case, and no external traffic or unhandled browser error occurs.
