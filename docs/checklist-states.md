# Collection checklist states

## Purpose

A binary checkbox cannot distinguish a genuinely missing record from a category the user has not reviewed or that does not apply to the case. CaseFind therefore stores an explicit organizational state for each standard unpaid-work record category.

## States

- **Found:** the user marked this record category as collected.
- **Missing:** the category is not currently marked as collected.
- **Needs review:** the user wants to check whether the available records cover this category.
- **Not applicable:** the user decided this category does not apply to the case.

These states are user-controlled organizational labels. CaseFind does not infer that a category is found from a filename, an AI suggestion, or a loosely related fact. A state does not authenticate a record or determine whether it is legally required.

## Compatibility

Existing cases with the original `checklist` array continue to load: checked keys are treated as `found` and all other keys as `missing`. On the first state change, all six explicit states are written to `record.checklistStates`.

The legacy `record.checklist` array remains synchronized with only the `found` keys so backups and existing report code remain compatible. Explicit states are stored on the case record and are therefore included in encrypted backups and atomic restoration without a database migration.

## Readiness

The checklist component measures completed checklist review, not evidence quality. `Found` and `Not applicable` count as reviewed; `Missing` and `Needs review` remain visible next steps. The readiness detail always discloses all four counts.

## Privacy and trust

Checklist changes stay in the local case record. They require no AI request, network request, synchronization, or original-file access. The status is not legal advice and does not claim that a record is sufficient, authentic, or required.
