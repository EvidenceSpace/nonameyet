# Stale extraction provenance boundary

Derived text is usable only when its stored file hash exactly matches the current original record.

The Chromium lifecycle stores an otherwise valid extraction under the correct file identifier but a different SHA-256. The workspace must:

1. Treat the extraction as failed rather than text-ready.
2. Explain that the stored extraction does not match the original.
3. Hide the extracted-text viewer and AI-analysis action.
4. Create no verified fact or downstream suggestion.
5. Keep the original independently previewable with its real SHA-256.
6. Offer reprocessing so a new derivative can be grounded in the current bytes.
7. Preserve the fail-closed state across reload.
8. Make no external request, provider call, account dependency, or synchronization.

This prevents restored, stale, corrupted, or incorrectly associated derivatives from being presented as if they came from another original.
