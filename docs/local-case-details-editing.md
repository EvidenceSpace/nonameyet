# Local case details editing

Case details can be changed from the workspace without recreating the case. Editable fields are title, client or organization, amount remaining, summary, and current goal.

Validation matches the intake boundaries and fails before persistence:

- title: 3–120 characters;
- client: 2–120 characters;
- amount: optional, at most 60 characters;
- summary: 30–4,000 characters;
- goal: one of the four supported intake goals.

Saving merges the normalized fields into the existing case record and updates `updatedAt`. IDs, archive state, checklist, files, facts, suggestions, processing artifacts, provenance, and original bytes remain unchanged. Because encrypted backups contain case details, the timestamp update correctly makes an older backup stale.

All editing and validation occur locally in the browser and make no network request.
