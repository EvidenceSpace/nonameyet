# Local activity and backup freshness

Every successful local file, fact, suggestion, or processing mutation updates the parent case’s `updatedAt` value. Deletes first resolve the stored record’s `caseId`, then update that case after removal. This keeps recent-activity ordering accurate without reading case content outside IndexedDB.

After an encrypted backup is generated and its download is initiated, CaseFind stores `lastBackupAt` on the local case without changing `updatedAt`. The case library compares these timestamps:

- **Backup recommended** — no successful backup is recorded.
- **Backup out of date** — case content changed after the last backup.
- **Backup current** — the last backup is at least as recent as case activity.

The timestamps are local metadata. They do not upload case content, confirm that a downloaded file still exists, or allow CaseFind to recover a backup password.
