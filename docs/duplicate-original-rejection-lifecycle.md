# Duplicate original rejection lifecycle

The Chromium lifecycle verifies that identical source bytes are stored only once per case, even when the second selection uses a different filename.

The gate requires:

1. The first image is stored with its exact SHA-256.
2. A second filename with identical bytes is rejected as already present.
3. The original filename, hash, file count, and stored-byte total remain unchanged.
4. No duplicate row, processing state, or partial original is created.
5. Reload confirms that exactly one original remains.
6. No external request, provider call, account dependency, or synchronization occurs.

Deduplication is based on bytes rather than filenames. This reduces storage waste and prevents the same record from being presented as multiple independent sources.
