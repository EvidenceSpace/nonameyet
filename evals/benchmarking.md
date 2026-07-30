# Reproducible extraction benchmarks

CaseFind benchmark reports score already-captured provider responses. The report builder does not call a model, read credentials, or transmit files. This separation keeps provider spending and data transfer explicit.

A valid run must include every selected fixture exactly once. Missing, duplicated, unexpected, or negatively metered records are rejected instead of producing a flattering partial score.

Each report records:

- provider, model, and immutable model version;
- run timestamp;
- corpus, prompt, and extraction-contract versions;
- fixture-level latency, token usage, cost, and evaluation failures;
- aggregate micro precision and recall;
- whether every fixture passed the strict quality gate.

Reference fixture outputs test the machinery only. They are not model measurements and must never be presented as provider accuracy.

## Controlled provider-run procedure

1. Select and record the exact model version. Do not use a floating alias when a pinned version exists.
2. Set an explicit maximum spend and request count before calling the provider.
3. Send extracted text only after the user-authorized analysis boundary; never send original image or PDF bytes.
4. Capture the raw response and metering information for every fixture without editing failures.
5. Build the report with `createExtractionBenchmarkReport`.
6. Compare fixture failures, prohibited conclusions, latency, and cost—not only the aggregate score.
7. Keep benchmark artifacts out of product analytics if they contain any non-synthetic text.

Synthetic results establish regression coverage, not legal correctness, document authenticity, production readiness, or fairness across real-world languages and document quality.
