# Interrupted processing recovery after restore

Encrypted backups can be created while local extraction is queued, actively running, or waiting to retry. Those states depend on an in-memory worker, timer, or abort controller that does not exist after a backup is restored.

Restore therefore converts `queued`, `extracting`, and `retry_wait` processing records into an explicit retryable failure before the atomic IndexedDB write. The recovered record uses the message:

`Processing was interrupted before this backup was restored. Process the source again.`

The recovery boundary requires:

1. No restored source remains permanently marked as processing without a worker.
2. Partial artifacts, retry timers, and stale failure details are discarded.
3. File ID, case ID, original SHA-256 provenance, and attempt metadata remain intact.
4. The user receives a normal retry action in the workspace.
5. Completed, failed, cancelled, and OCR-needed records retain their validated state.
6. Original bytes remain unchanged and no processing starts automatically during restore.

This is state recovery, not extraction. CaseFind does not infer or reconstruct missing text; the user must explicitly retry processing from the preserved original.
