# Safe workspace case deletion

Workspace deletion uses the same safety standard as library deletion instead of the previous generic confirmation.

Before enabling permanent deletion, the dialog shows:

- original-record count and byte size;
- fact and review-item counts;
- processing-result count in the acknowledgment;
- encrypted-backup freshness and an honest recovery warning.

The user must type the exact case title and separately acknowledge the complete local impact. The existing atomic `deleteCase` operation removes the case and its files, facts, suggestions, and processing records in one IndexedDB transaction. An abort rolls the transaction back.

The static workspace fallback is fail-closed: its destructive button starts disabled and explains that safety checks are loading. The enhanced dialog replaces that disabled element only after it has loaded the local case, impact counts, and backup state. If the enhancement fails to load or initialize, permanent deletion remains unavailable rather than falling back to a weaker confirmation.

Successful deletion returns to the local case library. No remote service is contacted, and downloaded encrypted backups are not deleted.
