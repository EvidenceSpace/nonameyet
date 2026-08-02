# Image media-type integrity boundary

The Chromium lifecycle verifies that local OCR refuses an image when its stored bytes do not match the declared media type.

The gate requires:

1. A PNG payload is intentionally presented as a JPEG record.
2. The original remains stored with its filename, declared type, and exact SHA-256.
3. Local processing reports the byte/type mismatch and fails closed.
4. No extracted-text viewer, AI-analysis action, or verified fact is created.
5. Retry remains available after the user repairs or replaces the source.
6. The failure state and original persist across reload.
7. No external request, provider call, account dependency, or synchronization occurs.

File extensions and browser-provided MIME labels are not trusted as proof of content. Byte-signature validation prevents a mislabeled or deceptive record from entering the extraction and AI pipeline.
