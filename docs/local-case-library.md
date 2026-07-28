# Local case library

`cases.html` is the device-local home for existing CaseFind work. It lists all cases in the current browser and computes record, verified-fact, pending-review, and original-byte totals from IndexedDB.

The library does not query the server, account session, or any connected source. Signing in does not populate or synchronize it. Search is performed only in memory against local case titles and client names.

Users can open a case, create a new case, or enter the encrypted restore flow. The page warns that clearing site data removes local cases and points users to encrypted backups before switching devices.
