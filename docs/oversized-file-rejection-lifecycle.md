# Oversized file rejection lifecycle

The Chromium lifecycle verifies that a record larger than the 20 MB case limit is rejected before hashing, storage, or processing.

The gate requires:

1. The browser creates a file exactly one byte above the limit without network fixtures.
2. The workspace identifies the filename and explains the 20 MB limit.
3. No file row, byte count, processing job, or partial original is created.
4. Case statistics remain at zero.
5. Reload confirms that nothing was persisted.
6. No external request, provider call, account dependency, or synchronization occurs.

Rejecting before hashing limits memory and processing work and prevents partial local state from misleading the user.
