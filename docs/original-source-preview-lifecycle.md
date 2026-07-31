# Original source preview lifecycle

The Chromium source lifecycle exercises exact local file handling without an AI or network boundary.

The gate requires:

1. A generated PNG is stored in IndexedDB with its exact SHA-256 digest.
2. The workspace displays the filename and abbreviated digest.
3. Preview uses a local `blob:` URL and renders the image bytes.
4. The preview dialog shows the complete digest, MIME type, and filename.
5. Closing the preview clears its rendered content.
6. The original remains previewable after a page reload.
7. Uploading identical bytes under another filename is rejected as a duplicate.
8. Removing the unlinked source persists across a reload.

The lifecycle prohibits external requests and browser runtime errors. It validates byte preservation and local preview behavior, not document authenticity or truth.
