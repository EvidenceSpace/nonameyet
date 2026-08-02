# No-readable-text image OCR lifecycle

An image can decode successfully while yielding no usable text. CaseFind treats that outcome as a failed local extraction, not as an empty reviewable artifact.

The Chromium lifecycle uses an explicitly selected synthetic PNG and a deterministic local `TextDetector` that returns only blank blocks. The gate requires:

1. The source row shows `Failed` with the exact message `No readable text was found in this image.`
2. The original remains stored, previewable, and tied to its SHA-256 hash.
3. No extraction artifact, text-review action, or AI-analysis action is created.
4. No fact or suggestion is created automatically.
5. The failed state and message persist across reload.
6. No external request, provider call, account dependency, upload, or synchronization occurs.

This is intentionally different from low-confidence OCR. Non-empty uncertain text may remain reviewable with a visible warning; blank output must fail closed because there is no source text to inspect or ground downstream suggestions against.
