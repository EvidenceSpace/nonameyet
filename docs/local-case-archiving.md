# Local case archiving

CaseFind’s library opens in the **Active** view. Users can switch between Active, Archived, and All without loading or uploading case content.

Archiving updates only the local case record:

- `archivedAt` records when the case was archived.
- `updatedAt` records that library activity.
- Files, facts, suggestions, processing artifacts, and original bytes remain unchanged.
- Restore removes `archivedAt` and returns the case to the Active view.

Archive and restore are deliberately reversible and therefore do not use the permanent-deletion confirmation. Permanent deletion remains a separate exact-title-gated action. Archive filters are computed in memory after the local IndexedDB library is loaded.
