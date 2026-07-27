# AI provider runtime

CaseFind uses an OpenAI-compatible server adapter. Original file bytes remain in IndexedDB; only user-approved extracted page text is sent to `/api/analyze`.

## Mandatory consent and usage controls

Every analysis action shows what will be sent and requires explicit confirmation. Both the browser client and server reject requests without `analysis-consent.v1`.

The runtime also:

- coalesces concurrent requests for the same client and file hash;
- caches successful source-bound responses for five minutes;
- allows at most 10 new analyses per client per minute;
- allows at most 400,000 extracted text characters per client per minute;
- returns `429` with `Retry-After` before calling the provider when a limit is reached;
- never caches failed provider responses.

These in-memory controls protect the single-process preview. A distributed store and authenticated account quotas are required before multi-instance production deployment.
