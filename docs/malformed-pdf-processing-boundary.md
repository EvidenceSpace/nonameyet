# Malformed PDF processing boundary

The Chromium lifecycle verifies that a truncated or structurally invalid PDF fails closed without damaging or discarding the local original.

The gate requires:

1. A deterministic malformed PDF is accepted only as an explicitly selected local original.
2. Local PDF.js processing reaches a clear failed state.
3. No successful-text claim, extracted-text viewer, or AI-analysis action appears.
4. Retry remains available in case the user later replaces or repairs the record.
5. The original remains independently previewable with its size and exact SHA-256.
6. The failure state and original persist across reload.
7. No external request, provider call, account dependency, or synchronization occurs.

A malformed record may still matter to the user, so CaseFind preserves it while refusing to derive facts from invalid extraction output.
