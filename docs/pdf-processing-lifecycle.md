# Local PDF processing lifecycle

The Chromium lifecycle verifies that a selectable-text PDF can be processed entirely in the browser while its original and provenance remain intact.

The gate requires:

1. A synthetic two-page PDF starts as an explicitly stored, unprocessed local record.
2. PDF.js extracts both pages without external requests.
3. The workspace displays a clear ready state and page count.
4. The extracted-text viewer exposes one page at a time, its adapter version, and the exact source SHA-256.
5. Page navigation is bounded and deterministic.
6. The original PDF remains independently previewable with matching provenance metadata.
7. The processing result and extracted pages persist across reload.
8. No AI analysis runs without the separate user confirmation.

Extracted text is an organizational aid. Users must compare it with the original before confirming facts, and CaseFind does not authenticate the source or determine truth.
