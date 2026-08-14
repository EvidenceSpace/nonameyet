# Operating rules and the build loop

How work moves from idea to merged. This file owns process. It does not restate
the product boundary (`AGENTS.md`) or the CI policy (`docs/continuous-quality.md`).

## The twelve non-negotiables

1. **Read before writing.** Open the actual manifest, config and neighbouring
   files before proposing a change. Never infer a stack, a script name, or a
   file's contents from a folder name or from memory.
2. **One slice per task.** A task changes one behaviour end to end. If a change
   cannot be described in one sentence without "and", it is two tasks.
3. **State assumptions out loud, before coding.** Every assumption that could be
   wrong gets written down where a reviewer can challenge it cheaply.
4. **No invented evidence.** Never report a test as passing, a check as green, or
   a screenshot as taken unless it actually ran in this session. If a capability
   is unavailable, say so and say what the human needs to run instead.
5. **Failing test first for every bug.** The test must fail for the right reason
   before the fix lands, otherwise the fix is unproven.
6. **No unrequested scope.** Refactors, renames, formatting sweeps, dependency
   bumps and "while I was in there" fixes go in separate tasks.
7. **Respect what exists.** Match the file layout, naming, module style and CSS
   layering already in the repository. Consistency beats personal preference.
8. **Every user-visible state is designed.** Loading, empty, partial, error,
   offline, permission-denied and too-much-data are all states. Shipping only
   the happy path is shipping a demo.
9. **Security is part of the slice, not a later pass.** Untrusted input,
   authorisation, retention and logging get considered in the same task that
   introduces them.
10. **Explain trade-offs, do not hide them.** When a shortcut is taken, name it,
    name the cost, and record where it will hurt later.
11. **Ask only when the answer changes the work.** Batch questions, propose a
    default for each, and keep going where you can.
12. **Write down what was learned.** Any mistake worth avoiding twice goes into
    `lessons-learned.md` as a rule, not a story.

## The build loop

Seven phases. Every task passes through all of them. Small tasks pass through
quickly; none are skipped silently.

### 1. Frame

Write, in three or four lines: who this is for, what they can do afterwards that
they cannot do now, and what "working" looks like from outside the code. Include
**who it is not for** and what is explicitly out of scope. If this cannot be
written, the task is not understood yet and coding will be wasted.

### 2. Spec

Define observable behaviour before implementation:

- The states listed in non-negotiable 8, each with what the user sees.
- What is **stored** versus what is **derived**. Derived data is recomputed, never
  duplicated into storage where it can rot.
- Failure modes: what breaks, how it is detected, what the user is told, and what
  they can do next.
- What must remain true afterwards (invariants), phrased so a test can check it.

### 3. Plan

Order the work **riskiest-first**. The step most likely to invalidate the plan
goes first, so failure is cheap. Identify the critical path, name what is
parallelisable, and state the checkpoint after each step. A plan whose first step
is cosmetic is a badly ordered plan.

### 4. Build

Small commits, each independently reviewable. Keep the working tree in a state
where the checks can be run at any point. When a step turns out harder than
planned, stop and revise the plan rather than pushing through with a worse
design.

### 5. Verify

Run the repository's own gates — see `quality-bar.md`, which defers to
`docs/continuous-quality.md` and `docs/browser-quality-gate.md`. Verification
means a command was executed and its output was read. Reasoning about what the
output probably is does not count.

### 6. Review

Re-read the diff as an adversary. Ask: what input breaks this, what happens on
the second attempt, what happens with an empty and with an enormous input, what
happens if the storage layer fails mid-write, and what does another user see.
For this product specifically: does every displayed derived fact still point at
its source, and is anything shown as confirmed that the user never confirmed.

### 7. Report and learn

Deliver the task report below, then update `lessons-learned.md` if the task
taught anything general.

## Task sizing

- Target **under ~400 changed lines** per slice, excluding generated files and
  fixtures.
- A pull request above that number needs a stated reason in its description.
- If a slice cannot fit, split by behaviour, never by layer. "Backend half" and
  "frontend half" are not two shippable slices; two narrower features are.

## Task report

Every finished task ends with:

- **What changed** — one paragraph in plain language, no file dump.
- **Files touched** — path plus one line on why each was touched.
- **How it was verified** — the exact commands run, and their result.
- **Not verified by me** — anything claimed but not observed in this session.
  This heading is mandatory and must never be quietly omitted.
- **Trade-offs and known gaps** — what was deliberately left undone.
- **Follow-ups** — concrete next tasks, not vague intentions.

## Decide versus ask

**Decide, then report:** naming, file placement, internal structure, test
strategy, error copy wording, animation timing, log levels, anything reversible
in under an hour.

**Ask before acting:** product scope, anything touching the product boundary in
`AGENTS.md`, storage or retention semantics, adding a dependency (see
`stack-defaults.md` — this repository has a deliberate near-zero dependency
policy), anything that changes what a user's data is used for, and anything
irreversible.

## Break protocol

Stop and report rather than continuing when:

- The same fix has failed twice. Two failures mean the diagnosis is wrong, and a
  third attempt is a coin flip.
- A required capability is missing. Report the gap, do not simulate the result.
- The task turns out to be larger than framed. Re-frame, then continue.
- A change would need to contradict a rule here. Raise the conflict; if the rule
  is wrong, fix the rule in the same pull request.

## Decision log

Decisions with lasting consequences — storage shape, trust boundaries, provider
behaviour, anything future work must respect — are recorded in `docs/`, next to
the spec they affect, with the alternatives that were rejected and why. A
decision that exists only in a chat transcript will be silently reversed by the
next contributor, and that reversal will look like a bug.
