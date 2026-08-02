# Local image OCR resource-control boundary

The browser TextDetector path checks decoded image dimensions before starting text detection. This avoids spending OCR work on images outside CaseFind's current safety envelope while preserving the original local file.

Current limits remain:

- 10 MB per image for local OCR.
- 10,000 pixels on either edge.
- 20,000,000 total pixels.
- 30 seconds for the product OCR operation.

The byte limit is checked before reading the original. Browser APIs do not expose trustworthy decoded dimensions before decode, so the dimension check runs immediately after `createImageBitmap` and before `TextDetector.detect`. The decoded bitmap is closed on every success, rejection, and cancellation path.

Deterministic coverage requires that an oversized decoded image:

1. Fails with the existing resize-and-retry message and a non-retryable `file_too_large` code.
2. Never invokes text detection or creates a derived artifact.
3. Closes the decoded bitmap.
4. Does not alter or upload the original.

Cancellation is also required to settle promptly even when an underlying OCR runtime ignores its abort signal. Late runtime output cannot become reviewable text or downstream evidence.
