# Security and privacy baseline

## Data principles

- Collect only what is necessary for the case workflow.
- Keep originals immutable and derivatives separately identifiable.
- Encrypt data in transit and at rest.
- Never use case material for advertising or model training.
- Do not expose document content in logs, analytics, notifications, or error messages.

## Retention

Every case has an explicit retention policy. Users can schedule automatic deletion and can permanently delete a case immediately. Deletion must cover originals, derivatives, extracted text, embeddings if introduced, exports, and queued processing artifacts.

## AI disclosure

Before processing, disclose which categories of data may be sent to an external model provider, why they are sent, and the applicable retention behavior. AI processing must be separable from deterministic extraction where practical.

## Authorization invariants

- Every read and write is scoped to a case membership.
- Signed file URLs are short-lived and never logged.
- Workers use scoped job identifiers rather than user sessions.
- Exports require a fresh authorization check.
- Case deletion invalidates pending jobs and download links.

## Threats to address before private beta

- Cross-case access through insecure object keys.
- Malicious or malformed PDF and image uploads.
- Prompt injection inside uploaded documents.
- Model output that invents unsupported facts.
- Reversible or incomplete redaction.
- Sensitive content leaking through telemetry.
- Deletion that leaves derived copies behind.
