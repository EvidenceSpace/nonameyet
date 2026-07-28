# Safe workspace case deletion

Workspace deletion uses the same safety standard as library deletion instead of the previous generic confirmation.

Before enabling permanent deletion, the dialog shows:

- original-record count and byte size;
- fact and review-item counts;
- processing-result count in the acknowledgment;
- encrypted-backup freshness and an honest recovery warning.

The user must type the exact case title and separately acknowledge the complete local impact. The existing atomic `deleteCase` operation removes the case and its files, facts, suggestions, and processing records in one IndexedDB transaction. An abort rolls the transaction back.

The enhanced dialog replaces the original confirmation element after the workspace initializes, removing its earlier click handler. Successful deletion returns to the local case library. No remote service is contacted, and downloaded encrypted backups are not deleted.
