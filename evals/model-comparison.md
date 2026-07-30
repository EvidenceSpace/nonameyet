# Safety-first model comparison

CaseFind compares only reports produced from the same benchmark-report version, canonical corpus, prompt version, and extraction contract. Mixing incompatible runs is rejected rather than normalized into a misleading leaderboard.

Eligibility is decided before cost or speed. The default gate requires:

- at least 95% micro precision;
- at least 90% micro recall;
- zero false-positive candidates;
- zero prohibited conclusions;
- every canonical fixture to pass.

Only eligible reports are ranked. Safety failures, missing cost data, and fixture-level details remain visible. Among equally safe and accurate candidates, known lower cost is preferred, followed by lower latency and a deterministic model key.

## Compare report files offline

Generate at least two canonical benchmark reports, then run:

```bash
npm run benchmark:compare -- comparison.json report-a.json report-b.json
```

The command accepts 2–25 distinct report files of at most 10 MiB each. It validates and reconstructs only comparison-safe fields, rejects incompatible or duplicate runs, and atomically writes a private comparison artifact. Raw provider responses and fixture source text are not copied into the comparison.

The comparison intentionally does **not** change CaseFind’s runtime model configuration or declare a production winner. A human review must inspect fixture failures, provider terms, privacy controls, regional availability, reliability, rate limits, version pinning, and observed beta behavior before deployment.

Synthetic comparisons measure this narrow corpus only. They do not establish legal correctness, authenticity, fairness, or real-customer accuracy.
