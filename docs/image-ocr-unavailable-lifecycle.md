# Local image OCR unavailable lifecycle

The Chromium lifecycle verifies that CaseFind fails honestly when the browser has no supported local OCR engine.

The gate requires:

1. The image is explicitly stored as a local original before OCR is requested.
2. Missing browser OCR capability produces a clear failed state rather than fabricated text.
3. The message states that the image remains local and was not uploaded.
4. No extracted-text or AI-analysis action is offered without a valid extraction artifact.
5. A retry remains available for a future compatible runtime.
6. The original image remains independently previewable with its exact SHA-256.
7. The failed state and original persist across reload.
8. No external request, provider call, account dependency, or synchronization occurs.

This is an intentional trust boundary. CaseFind must disclose unsupported processing instead of pretending that text was extracted.
