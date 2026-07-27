# PDF text extraction adapter

CaseFind's PDF adapter uses a caller-supplied PDF.js runtime to extract selectable
text locally. It implements the document-processing adapter contract and produces
page-numbered text for the existing normalization, provenance, and AI-handoff
pipeline.

## Privacy boundary

The adapter passes PDF.js a `Uint8Array` made from the original browser `Blob`.
It does not pass a URL and does not contain any network request. PDF.js is
configured with:

- `isEvalSupported: false`
- `useWorkerFetch: false`
- `useSystemFonts: true`
- `stopAtErrors: true`

The PDF.js runtime must be bundled with the application. It must not be loaded
from a third-party CDN at runtime, because doing so would weaken reproducibility,
offline behavior, and the supply-chain boundary.

## Limits

- Maximum PDF size: 20 MB by default.
- Maximum page count: 500 by default.
- At least 20 non-whitespace characters are required by default.
- The stored byte length must match the file record before parsing begins.

Limits can be lowered by a caller but should not be raised without performance
and memory testing on low-end mobile devices.

## OCR routing

PDF.js extracts selectable text; it is not OCR. If the whole PDF contains fewer
than the minimum readable characters, the adapter returns `needs_ocr`. Empty
pages are retained and reported as warnings so page numbering stays accurate.

## Error classification

| Condition | Failure code | Retryable |
| --- | --- | --- |
| Original bytes unavailable | `adapter_unavailable` | No |
| Stored size mismatch | `corrupt_file` | No |
| Password-protected PDF | `password_protected` | No |
| Invalid PDF structure | `corrupt_file` | No |
| PDF above byte limit | `file_too_large` | No |
| PDF above page limit | `too_many_pages` | No |
| Unexpected PDF.js/runtime failure | `transient_error` | Yes |

## Cancellation

The adapter checks cancellation before and after reading the browser Blob, while
PDF.js is loading, and before every page. Aborting also destroys the PDF.js
loading task. The post-Blob check is important: without it, an abort that happens
while `arrayBuffer()` is resolving can be missed.

## Provenance

Every returned page retains its real one-based PDF page number. The processing
pipeline then records exact character offsets, the original file ID and SHA-256
hash, the PDF.js adapter version, and the PDF.js runtime version. Only that
normalized artifact can cross into the hardened AI handoff.

## Known limitations

PDF text order depends on the structure and font mappings embedded in the PDF.
Some PDFs may produce unusual word order or unreadable glyphs even though they
have a text layer. Users must still review source quotes against the original
record. Image-only and poorly encoded documents should be routed to OCR rather
than treated as reliable extracted text.

The runtime is dependency-injected in this slice so the adapter and its privacy
rules can be tested without downloading code during CI. A following integration
slice will bundle a pinned PDF.js distribution locally and connect processing
states to the workspace UI.
