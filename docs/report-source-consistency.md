# Source consistency in verified reports

## Purpose

A verified report must not silently omit a supported cross-source difference that CaseFind already showed in the workspace. Doing so could make the exported record look more settled than the user's source material.

## Export behavior

Reports always disclose deterministic comparisons among verified agreed-price, payment-deadline, and delivery-date facts when the sources have exact matching file IDs and SHA-256 provenance.

Each disclosed comparison includes:

- every participating value;
- the source filename, locator, and SHA-256 hash for each value;
- whether the comparison still needs review;
- the user's current decision, if any;
- which source-linked value the user selected for the organized record, if applicable.

A resolution never deletes or hides the other participating values. Stale decisions fail closed and appear unresolved if participating facts change.

## Notes and excerpts

Source excerpts follow the existing report excerpt option. User-entered source-comparison notes are private by default and require a separate explicit opt-in. This option is separate from private fact notes so users do not accidentally disclose one category while choosing the other.

## Trust boundary

A potential difference is a deterministic comparison prompt, not a finding that either source is false or that one value is legally controlling. CaseFind does not authenticate the records, decide which source is true, determine legal rights, predict an outcome, or provide legal advice.

## Privacy

The report contains organized text, provenance metadata, and optional excerpts or notes. It never embeds original file bytes. Creating the appendix requires no AI request, synchronization, or network access.
