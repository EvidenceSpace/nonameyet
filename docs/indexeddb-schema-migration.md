# IndexedDB schema migration and blocked-open recovery

CaseFind keeps original records and all derivatives in the browser's IndexedDB database. Schema upgrades must preserve those records, repair missing indexes when safe, and fail without destructive guessing when an existing store is incompatible.

Database version 6 defines every store and index in one shared schema. During upgrade it:

1. Creates stores that are missing.
2. Preserves stores whose key paths match the expected schema.
3. Adds missing indexes and recreates malformed indexes without deleting stored records.
4. Aborts the upgrade if an object store uses an incompatible key path rather than replacing the store and losing data.
5. Closes successful connections when a newer CaseFind version requests another upgrade.

If an older CaseFind tab blocks an upgrade, opening fails promptly with instructions to close other CaseFind tabs and retry. The application does not silently reset, delete, or recreate the database.

Browser coverage seeds a partial version 5 database with a case, source file, and fact, upgrades it, and verifies that records and all required indexes remain available. A separate lifecycle holds an older connection open and verifies the blocked-upgrade error.
