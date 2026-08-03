# Case detail failure and conflict recovery

Case titles, client names, amounts, summaries, and goals are local organizational metadata. Editing them must not modify original records, facts, or provenance, and a failed save must not appear successful.

If IndexedDB rejects a case-detail write, the editor remains open with every field preserved. The stored case and activity timestamp remain unchanged, and the message explicitly states that nothing was saved.

The editor captures the case activity version when it opens. Before saving, it reloads the current case and rejects the update if another tab or workflow changed that version. This prevents a stale editor from silently overwriting newer local work. The newer stored record remains intact while the stale draft stays visible for manual comparison.

Missing case records also fail closed. Browser lifecycle coverage verifies failed writes, stale-editor conflicts, draft preservation, stored-record equality, reload behavior, external-traffic absence, and unhandled-error absence.
