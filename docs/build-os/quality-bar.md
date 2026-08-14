# Quality bar — definition of done

This file is deliberately thin. This repository already has real, enforced
quality documents, and a second copy of them would go stale and then contradict
them.

**Authoritative, not restated here:**

- `docs/continuous-quality.md` — CI behaviour, Node version range, install flags,
  PDF.js asset pinning and drift checking, dependency policy, Dependabot policy,
  lockfile status, and what quality automation must never contain.
- `docs/browser-quality-gate.md` — the browser journey gate.
- `docs/security.md` and `docs/session-security.md` — security expectations.
- `AGENTS.md` — the non-negotiable implementation rules, which outrank this file.

What follows are the gates that are **not** already written down somewhere else.
A task is done when all of them hold.

## The commands

```
npm run check        # check:dependencies && check:workflow-actions && typecheck && test
npm run test:browser # Playwright browser journeys
```

Run both before calling a task finished. "Done" means these were executed and
their output was read, not that they were expected to pass.

**Known coverage gap, do not paper over it:** `tsconfig.json` sets
`include: ["src/**/*.ts"]`, so `typecheck` does not cover `server/`, `web/`,
`tests/` or `scripts/`. A change confined to those directories can pass
`npm run check` while being type-broken. When work lands outside `src/`, say so
in the task report under **Not verified by me**, and lean on the tests and the
browser journeys instead of assuming the typechecker looked.

## Portable gates

### 1. It works for the user, not just for the developer

The stated user outcome is achievable from a cold start with no hidden setup and
no console open. If it needs a special sequence to work, it is not done.

### 2. Every state is handled

Loading, empty, partial, error, offline, interrupted-midway, permission-denied
and absurdly-large-input all have a designed result. No dead ends: every error
state tells the user what happened and what they can do next.

### 3. Behaviour is covered by tests, not implementation details

Tests assert what the user or caller observes. A test that only restates the
implementation will pass through a rewrite that breaks the product.

For bug fixes, the regression test existed and failed for the right reason before
the fix landed.

### 4. The second run behaves like the first

Re-running, refreshing, double-submitting, retrying after a failure, and
restoring a session all produce a correct state. Half-written data is either
completed or cleaned up, never left visible as if it were whole.

### 5. No silent failure

Nothing is swallowed. Every caught error either recovers deliberately or surfaces
something the user can act on. Empty `catch` blocks are a defect.

### 6. Accessible and keyboard-complete

See `design-baseline.md`. Focus order is sane, focus is visible, every
interactive control is reachable and operable by keyboard, and nothing depends on
colour alone.

### 7. Documentation matches reality

If behaviour changed, the relevant document in `docs/` changed in the same pull
request. A spec that describes last month's behaviour is worse than no spec,
because it is trusted.

### 8. The diff is honest

No dead code, no commented-out blocks, no leftover debug logging, no unrelated
reformatting, no `TODO` without an owner and a follow-up task.

## CaseFind-specific gates

These come from the product boundary in `AGENTS.md` and exist because getting
them wrong is not a bug, it is a broken promise to the user.

### 9. Every derived fact is traceable

Any fact, date, amount, participant or event that the system derived rather than
received directly must reference the source location it came from, and that
reference must survive round-tripping through storage. A displayed fact with no
reachable source is a defect, regardless of whether it is correct.

### 10. Suggested stays suggested

AI or extraction output is presented as a suggestion until the user confirms it.
Nothing auto-promotes itself to confirmed, and confirmation is a distinguishable
state in storage, not a rendering choice.

### 11. Conflicts are surfaced, never resolved silently

Conflicting dates, amounts, participants or claims are shown as conflicts. Code
that picks a winner without telling the user fails this gate even when its pick
is reasonable.

### 12. Originals are intact

The user's original material is preserved byte-for-byte. Previews, redactions,
rasterisations and extractions are separate objects, never in-place edits.

### 13. Deletion and retention are testable

Any change touching storage states what is kept, for how long, and what deletion
actually removes — and a test proves it. "It should be gone" is not a test.

### 14. Nothing sensitive reaches a log or an artifact

No document contents, extracted private data, access tokens or signed file URLs
in logs, error messages, test fixtures, benchmark outputs or CI artifacts. This
extends `docs/continuous-quality.md`'s rule to application code.

### 15. The smallest sufficient request

No sending a whole case to a frontier model when a scoped request answers the
question. Where a request was widened, the reason is written down.

## Performance

Measure before optimising, and record the before and after number in the task
report. Optimise in this order: eliminate the work, defer it, shrink it, then
cache it. Caching first hides the real problem and adds an invalidation bug.

If an optimisation does not move the number it was meant to move, revert it. A
complexity increase with no measured benefit is a permanent cost.

## What this bar is not

It is not a checklist to be ticked without running anything. Nine of these gates
cannot be assessed by reading a diff. If a gate was not actually checked, the
honest report is "not verified" — which is useful — rather than a tick, which is
fabricated evidence and forbidden by `operating-rules.md`.
