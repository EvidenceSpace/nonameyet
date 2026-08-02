# Local image OCR timeout boundary

Local image OCR is bounded to 30 seconds in the product runtime. A stalled browser OCR adapter cannot leave a case permanently processing.

The Chromium gate uses a deterministic runtime that never resolves and a short injected timeout. It requires:

1. Processing returns a clear timeout failure within the configured bound.
2. The original file identity, case identity, and SHA-256 provenance remain intact.
3. The failure is retryable because device availability can change.
4. No extracted text or partial OCR artifact is accepted.
5. Late runtime completion cannot overwrite the settled timeout result.
6. No external request, provider call, account dependency, or synchronization occurs.

The same bounded wrapper also makes cancellation prompt even when an underlying browser OCR implementation does not respond to its abort signal.
