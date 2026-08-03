# Unsaved intake navigation protection

New-case intake remains memory-only until the user reaches the final privacy confirmation and the IndexedDB save succeeds. CaseFind does not silently persist partial intake entries.

The form now states whether nothing has been saved, meaningful entries are unsaved, or a save is in progress. Meaningful entries include typed case details, a non-default goal, or the local-storage acknowledgement. Whitespace-only input and untouched defaults do not create a false warning.

While meaningful entries remain unsaved, browser navigation and reload attempts use the platform before-unload safeguard. The safeguard is removed only after successful case storage or an explicit form restart. A failed save remains protected because the visible form is still the only copy of the user’s entries.
