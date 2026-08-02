# Analysis input validation boundary

The browser validates extracted pages before requesting a security session or asking a configured AI provider to analyze text.

The client gate requires:

1. At least one page and no more than 500 pages.
2. Positive, unique integer page numbers.
3. String page text with at least one character across the artifact.
4. No more than 200,000 extracted characters in total.
5. An exact file identifier and SHA-256 match before page validation.
6. Rejection before session creation, consent transmission, or provider traffic.

The Chromium lifecycle covers duplicate page numbers, oversized extracted text, and empty artifacts. Every invalid artifact returns `invalid_extraction` with zero fetch calls.

Server-side validation remains authoritative. This client boundary prevents obviously corrupt or abusive local derivatives from causing unnecessary network, session, and provider work.
