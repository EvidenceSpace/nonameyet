# Local image OCR cancellation lifecycle

The Chromium lifecycle verifies that users can stop in-progress local image OCR without creating derived evidence.

The gate requires:

1. A deterministic delayed local OCR runtime enters the visible processing state.
2. A visible Cancel action aborts the operation.
3. Late OCR output is discarded and the job becomes `Cancelled`.
4. No extracted-text viewer, AI-analysis action, or verified fact is created.
5. The original remains stored and independently previewable with its exact SHA-256.
6. Retry remains available and the cancelled state persists across reload.
7. No external request, provider call, account dependency, or synchronization occurs.

Cancellation is a trust and resource-control boundary. Users retain control over local processing, and output arriving after cancellation cannot silently become evidence.
