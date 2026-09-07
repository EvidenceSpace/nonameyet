# Repository cleanup audit

**Snapshot:** 2026-09-07

**Repository:** `EvidenceSpace/nonameyet`

**Audited base:** `main` at `0f5caa568bfce7076379ceeeb9002066329d8f90`

**Status:** Review-ready cleanup plan; no product files or branch references are removed by this document.

## Purpose

Keep `main` as the only canonical integration line without discarding useful EvidenceSpace or CaseFind work. This audit separates branch-reference cleanup from product-code deletion and records the one unmerged branch whose behavior still needs targeted salvage.

## Snapshot and reconciliation

At the audited base, GitHub reports:

- 99 branch references, including `main`;
- 103 pull requests;
- 88 merged pull requests;
- 14 closed, unmerged pull requests;
- one open pull request, PR #86;
- no tags or releases; and
- no branch protection on `main`.

The 98 non-`main` branch references break down as follows:

- 88 heads from merged pull requests;
- eight heads from closed, unmerged pull requests;
- one open pull-request head (`timeline-exact-current-20260807`); and
- one superseded branch without a pull request (`docs/preserve-connected-prototype-v1-20260902`).

The arithmetic above is a branch-reference inventory, not an assertion that every historical commit should become target EvidenceSpace code.

## Non-negotiable preservation set

The following remain on `main` until a reviewed migration or replacement explicitly proves otherwise:

1. `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`, including its recorded size, Git blob, and 37-screen/37-route identity;
2. the connected navigation, route, application-map, and experience-contract files under `design-prototypes/`;
3. canonical product, design, engineering, decision, and handoff documents;
4. the accessible EvidenceSpace shell and desktop host-boundary contracts;
5. CaseFind provenance, immutable-source, extraction, OCR, review, consistency, recovery, backup, restore, deletion, report, and test behavior; and
6. the durable quality workflow and its strict deterministic and Chromium gates.

No file currently on `main` is classified as unrelated garbage by this audit. Legacy CaseFind code is migration input, not disposable debris.

## Merged pull-request branches

The 88 retained heads for merged PRs are safe to delete as branch references after `main` protection is enabled. Their reviewed changes are already represented on `main`, and their PR records remain available after branch deletion.

Merged ranges:

- PRs #1–#40;
- PRs #45–#73;
- PRs #75–#85;
- PRs #93–#96;
- PR #99; and
- PRs #101–#103.

Deleting these refs must not be combined with deleting corresponding files from `main`.

## Closed, unmerged branches

| Branch | PR | Disposition | Reason |
| --- | ---: | --- | --- |
| `ci/published-typescript-20260901` | #98 | Delete ref | The published TypeScript pin and complete quality repair landed through PR #99. |
| `ci-fix-published-typescript-20260808` | #87 | Delete ref | Proven recovery fixes were selectively carried into PR #99; the remaining diagnostic workflow is obsolete. |
| `design/first-run-foundation-20260811` | #89 | Delete ref; retain PR record | This is an unverified visual layer for the legacy CaseFind first-run surface, not the approved EvidenceSpace target system. |
| `design/library-foundation-20260811` | #90 | Delete ref; retain PR record | This stacked legacy CaseFind design draft depends on PR #89 and is superseded by the approved EvidenceSpace design foundation. |
| `docs/agent-operating-rules-20260811` | #88 | Delete ref | `AGENTS.md`, `AGENT.md`, the current handoff, and the quality standard are canonical on `main`. |
| `docs/build-os-standards` | #91 | Delete ref | Current engineering, quality, handoff, and delivery contracts supersede this unmerged documentation branch. |
| `fix/currency-neutral-workspace-20260902` | #100 | Delete ref | The currency-neutral workspace correction was selectively included in the verified PR #99 baseline. |
| `integration/local-review-20260815` | #92 | Delete ref | The PR explicitly marked itself unsafe to merge and has been superseded by the current EvidenceSpace foundation and restored quality baseline. |

Closed Dependabot PRs #41–#44, #74, and #97 have no retained branch references and require no branch cleanup.

## Superseded branch without a pull request

Delete `docs/preserve-connected-prototype-v1-20260902` after protection is enabled. It points to the already-merged PR #96 documentation baseline. The actual approved connected prototype is independently preserved on `main` through PR #101, so this branch is not its sole copy.

## Open PR #86: hold for targeted salvage

Do not merge or delete `timeline-exact-current-20260807` yet.

PR #86 predates the approved EvidenceSpace architecture and its exact-head check failed, so its implementation must not be transplanted wholesale. Before closing it, preserve these behavior-level requirements in target contracts and tests:

1. a transition must verify that the suggestion/event revision is still exact-current;
2. a user decision and any resulting accepted fact/event must commit atomically;
3. conflicts, retries, and interrupted writes must not leave an accepted claim without its source or a half-advanced suggestion;
4. concurrent or duplicate decisions must fail or recover deterministically;
5. busy, conflict, error, retry, and recovery states must be accessible; and
6. provenance and changed/deleted-source checks must continue to fail closed.

Once equivalent target-facing tests and implementation land with passing exact-head CI, close PR #86 and delete its branch reference. The PR remains the historical source of the candidate behavior.

## `main` protection before deletion

Before deleting retained branch refs:

- require pull requests for changes to `main`;
- require the aggregate `Typecheck, tests, assets, and browser lifecycle` check;
- block force pushes and branch deletion for `main`;
- require branches to be current before merge when the change can conflict; and
- enable automatic deletion of merged head branches.

The repository currently has one maintainer workflow, so protection should preserve emergency recovery without turning routine quality checks into optional gates.

## Safe execution order

1. Merge this audit after exact-head CI passes.
2. Enable `main` protection and automatic merged-branch cleanup.
3. Delete the 88 merged PR head refs.
4. Delete the eight closed, unmerged refs listed above.
5. Delete `docs/preserve-connected-prototype-v1-20260902`.
6. Keep PR #86 and its branch until equivalent target behavior is verified.
7. Re-list branches and confirm that only `main`, active reviewed work, and the temporary PR #86 salvage source remain.
8. Start each new unit of work from the latest verified `main`, use one focused PR, and delete the head branch after merge.

## What this audit does not authorize

- deleting the canonical connected prototype;
- deleting CaseFind code merely because it uses the former product name;
- copying unverified closed-branch code into `main`;
- treating a browser test as packaged Windows/macOS evidence;
- selecting Electron, Tauri, React, or a board engine without the documented evidence gate; or
- claiming that the target EvidenceSpace product is production-ready.

## Next implementation slice

After branch-reference cleanup is controlled, follow ADR 0003 and the desktop host spike protocol:

1. build a disposable thin Electron candidate against the versioned native bridge and deep-link contracts;
2. record safe, commit-bound Windows and macOS evidence;
3. build the equivalent Tauri candidate if Electron does not clearly satisfy the gate;
4. select a host only after the four-cell evidence matrix is complete; and
5. then begin the first production vertical slice for authentication, onboarding, draft recovery, workspace selection, case creation, evidence intake, grounded review, and source-linked output.
