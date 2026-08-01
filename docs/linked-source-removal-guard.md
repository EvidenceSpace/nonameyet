# Linked source removal guard

The Chromium integrity lifecycle verifies that an original record cannot be removed while a confirmed fact still depends on it.

The gate requires:

1. A source is stored locally.
2. A user-entered confirmed fact is linked to that source.
3. Source removal is rejected with clear guidance.
4. Both the source and fact remain after reload.
5. Removing the confirmed fact releases the source-removal guard.
6. The now-unlinked source can be removed.
7. Both removals persist across reload.

This prevents a confirmed fact from silently losing its provenance. It does not determine whether the source or fact is true, authentic, or legally sufficient.
