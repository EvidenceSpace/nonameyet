# Reproducible extraction benchmarks

CaseFind benchmark reports score already-captured provider responses. The report builder does not call a model, read credentials, or transmit files. This separation keeps provider spending and data transfer explicit.

A valid run must use a named corpus registry and include every fixture exactly once. Corpus identity is copied from that registry into the report; callers cannot supply a different label. Missing, duplicated, unexpected, or negatively metered records are rejected instead of producing a flattering partial score.

The canonical synthetic corpus is exported from `evals/corpus.ts`. Any change to fixture membership or expected values requires a new corpus version so historical reports remain comparable.

Each report records:

- provider, model, and immutable model version;
- run timestamp;
- canonical corpus, prompt, and extraction-contract versions;
- fixture-level latency, token usage, cost, and evaluation failures;
- aggregate micro precision and recall;
- whether every fixture passed the strict quality gate.

Reference fixture outputs test the machinery only. They are not model measurements and must never be presented as provider accuracy.

## Build a report offline

Prepare a JSON envelope with `metadata` and one captured `outputs` record for every canonical fixture, then run:

```bash
npm run benchmark:extraction -- captured-output.json benchmark-report.json
```

The command accepts at most 10 MiB of JSON and 1,000 captured records, validates the untrusted envelope, enforces canonical coverage, and writes the report through a temporary file. Input and output paths must differ. The generated report contains evaluation results and metering, not the captured raw responses or fixture source text.

## Controlled provider-run procedure

1. Select and record the exact model version. Do not use a floating alias when a pinned version exists.
2. Set an explicit maximum spend and request count before calling the provider.
3. Send extracted text only after the user-authorized analysis boundary; never send original image or PDF bytes.
4. Capture the raw response and metering information for every canonical fixture without editing failures.
5. Build the report with `createExtractionBenchmarkReport` and the canonical corpus registry.
6. Compare fixture failures, prohibited conclusions, latency, and cost—not only the aggregate score.
7. Keep benchmark artifacts out of product analytics if they contain any non-synthetic text.

Synthetic results establish regression coverage, not legal correctness, document authenticity, production readiness, or fairness across real-world languages and document quality.
