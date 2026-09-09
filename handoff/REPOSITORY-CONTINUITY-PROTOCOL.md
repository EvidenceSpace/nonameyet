# Repository continuity protocol

**Status:** mandatory living-documentation and takeover rule

## Purpose

EvidenceSpace must remain understandable from the repository alone. A future maintainer or advanced coding agent should not need the original chat, private tool logs, or the user to repeat settled decisions.

## What belongs on `main`

After review and applicable checks, `main` holds:

- durable product, page, design, engineering, security, AI, marketplace, and operations contracts;
- numbered ADRs and supersession records;
- accepted implementation and migrations;
- durable automated tests and synthetic fixtures that protect the code;
- approved design prototypes and privacy-reviewed synthetic handoff diagrams;
- runbooks, quality gates, and release criteria; and
- current handoff and implementation status.

Do not keep important accepted specifications only in a feature branch, issue comment, chat, local file, or generated artifact.

## What stays out of `main`

- unsigned packages and installers;
- raw desktop observations and machine-specific diagnostics;
- screenshots, videos, traces, crash dumps, or exports containing real/private content;
- rejected design experiments;
- temporary CI workflows or one-off debug scripts;
- personal paths, device/account/license identifiers, secrets, tokens, signed URLs, or production data; and
- generated build debris.

Durable tests belong on `main`; disposable test output does not.

## Required update matrix

| Material change | Update in the same pull request |
| --- | --- |
| User-visible page behavior or copy | canonical page spec, relevant design contract, tests, `HANDOFF.md` if status changes |
| Navigation or route ownership | page/feature matrix, route contract, visual comparison, handoff current state |
| Accepted or rejected design direction | approved-design record, conversation/decision log, screen catalog if affected |
| Domain/state/invariant | domain model, API/runtime schema, migration/rollback, tests |
| Architecture/provider choice | numbered ADR, readiness/roadmap, migration and rollback |
| Permission/privacy/provenance rule | canonical security/domain contract, negative tests, threat model, handoff risk |
| AI behavior/action | AI contract, evaluation, approval/audit/undo behavior, page copy |
| Marketplace/payment behavior | marketplace contract, state machine, idempotency/reconciliation tests, operations |
| Merged implementation slice | README status, `HANDOFF.md`, current-state file, session ledger, exact PR/SHA/CI |
| New observed limitation or failed validation | current-state file, blocker/next step, exact evidence; never rewrite as passed |
| Reordered roadmap or future scope | roadmap, implementation compendium, decision log |

If no continuity fact changed, the pull request must say why handoff updates are not needed.

## Handoff files and ownership

- `HANDOFF.md` — concise master report and latest exact repository state.
- `handoff/00-START-HERE.md` — takeover sequence and first task.
- `handoff/CURRENT-STATE-AND-NEXT-STEPS.md` — detailed Current/Partial/Target/Blocked status.
- `handoff/CONVERSATION-AND-DECISIONS.md` — accepted, rejected, and corrected product decisions.
- `handoff/SESSION-LEDGER.md` — chronological milestone record.
- `handoff/NEXT-AGENT-OPERATING-BRIEF.md` — mindset and non-negotiables.
- `handoff/IMPLEMENTATION-COMPENDIUM.md` — page/section/build/future map.
- `handoff/APPROVED-SCREEN-CATALOG.md` — exact visual route reference.
- `handoff/assets/` — privacy-reviewed synthetic diagrams and approved motion status.

Canonical specs live under `docs/`; handoff links them and records current truth. Do not create competing behavior rules in handoff.

## Per-slice closeout

Before merge:

1. refresh base, exact head, open PRs, and conflicts;
2. inspect the committed diff and changed-file list;
3. run every applicable gate and record exact output;
4. inspect the relevant visual states, not just render them;
5. list checks and platforms not run;
6. update canonical docs and living handoff;
7. verify no private data, local paths, rejected assets, or generated output entered the commit;
8. inspect exact-head CI; and
9. merge only coherent work with no known release-blocking defect in its claimed scope.

After merge, verify the resulting `main` SHA and update the next active work item if the merge materially changed it.

## Visual and media records

Screenshots or videos may be committed only when they are synthetic, privacy-reviewed, optimized, labeled with status/source commit/date, and useful for a durable contract. A visual artifact never proves behavior. Rejected work is recorded in words rather than retained as an apparent target unless its failure is itself an important study.

## Honesty rule

Use **Current**, **Partial**, **Target V1**, **Future**, **Decision required**, **Blocked**, and **Rejected** precisely. A source file, fixture, screenshot, browser preview, package recipe, or unit test does not prove an unobserved desktop or production outcome.

This protocol is living continuity: update it when the repository’s documentation or delivery model materially changes.