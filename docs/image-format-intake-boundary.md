# Image format intake boundary

CaseFind should only advertise and accept image formats that its current local processing path can handle honestly.

V1 intake supports:

- PNG (`image/png`)
- JPEG (`image/jpeg`)
- WebP (`image/webp`)
- PDF (`application/pdf`)

HEIC is not accepted in the current V1 boundary. Although HEIC is common on phones, CaseFind does not yet have a pinned local decoder, reliable cross-browser preview, byte-signature validation, or OCR path for it. Storing HEIC while presenting no processing action creates a confusing dead end, so the uploader rejects it before hashing or persistence rather than implying support.

The Chromium lifecycle requires:

1. The file chooser advertises exactly the supported formats.
2. A programmatically supplied HEIC record is rejected with no stored row or statistics change.
3. A byte-signature-valid synthetic WebP record is stored locally and offered for local OCR.
4. Successful WebP extraction remains review-only and creates no fact automatically.
5. WebP text and SHA-256 provenance persist across reload.
6. No external request, upload, provider call, or synchronization occurs.

HEIC can be added later only with an explicit local decoding and resource-control design; it must not be enabled by filename or MIME label alone.
