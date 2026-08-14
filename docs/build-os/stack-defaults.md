# Stack defaults — for new projects only

> **This document does not describe this repository, and must not be applied to
> it.** It records defaults for starting a project from nothing. CaseFind already
> exists, already has a stack, and already has a deliberate dependency policy
> that several of these defaults would violate. If you are working in this
> repository, the only section below that applies to you is
> "[What this repository actually uses](#what-this-repository-actually-uses)".

This file exists for two reasons: so a greenfield project does not have to
re-derive its choices, and so the difference between a portable default and this
repository's reality is written down rather than assumed.

## Why the quarantine is at the top

A generic default stack was once copied into a project-specific rule without
checking that project's manifest first, and the rule was wrong for that project.
That is rule 4 in `lessons-learned.md`. The warning above is the structural fix:
the file states its own scope before it states any preference.

## What this repository actually uses

Verified from `package.json` and `tsconfig.json`. Match this; do not "upgrade" it
without a deliberate, reviewed decision.

| Concern | Reality here |
| --- | --- |
| Language | TypeScript 5.8, ES modules (`"type": "module"`) |
| Strictness | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` all on |
| Typecheck scope | `include: ["src/**/*.ts"]` only — `server/`, `web/`, `tests/`, `scripts/` are outside `tsc` |
| Runtime | Node `>=22 <25` |
| Execution | `tsx` for running TypeScript directly — no bundler, no build step |
| Front end | Plain HTML, CSS and JavaScript in `web/` — **no framework** |
| Tests | `node:test` via `tsx --test tests/**/*.test.ts` |
| Browser tests | Playwright 1.54.1 |
| Runtime dependencies | Exactly one: `pdfjs-dist` at an exact pinned version |
| Dev dependencies | Three: `typescript`, `tsx`, `playwright` |
| Lockfile | **None yet.** CI uses `npm install`, not `npm ci` — see `docs/continuous-quality.md` |
| Policy enforcement | `scripts/check-dependency-policy.mjs`, `scripts/check-workflow-action-pins.mjs`, both wired into `npm run check` |

### The dependency policy is enforced in code

Adding a package is not a small convenience here. It is a policy change that a
check script will fail. Before proposing one:

1. Establish that the standard library and the platform genuinely cannot do it.
2. Say what it costs: install size, transitive tree, maintenance surface, and the
   supply-chain exposure of a project that handles people's private documents.
3. Get agreement. Then pin it exactly, as `pdfjs-dist` is pinned.

"It is only one small package" is how every dependency tree starts. The absence
of a framework here is a feature of the design, not a gap waiting to be filled.

## Defaults for a new project

Everything below applies only when starting from an empty directory.

### Choosing a stack

- Prefer the boring, widely-deployed option. Novel tooling spends its advantage
  on debugging itself.
- Pick the smallest thing that covers the product's actual requirements. A
  framework chosen for features the product will never use is permanent overhead.
- Prefer tools whose failure modes are well documented in public. When something
  breaks at 2am, search results matter more than benchmarks.

### Sensible starting points

- **Static or content-first site:** plain HTML/CSS/JS, or a minimal static
  generator. Do not reach for a framework to render text.
- **Interactive app with real state:** one mainstream front-end framework, chosen
  once and not mixed with another.
- **Server:** whatever the team can operate. Operability beats elegance.
- **Data:** a relational database by default. Reach for anything else only when a
  concrete requirement rules it out.
- **Types:** TypeScript with `strict` on from the first commit. Turning it on
  later is a migration nobody schedules.
- **Tests:** the runtime's own test runner first. Add a framework only when it is
  actually needed.

### Rules that hold regardless of stack

- Pin versions. Commit the lockfile from day one, so "works on my machine" never
  becomes a conversation.
- One command to install, one to run, one to check. Written in the README.
- Configuration through the environment, with a committed example file and no
  secrets in git.
- Continuous integration on the first day, running the same commands a human
  runs locally. CI that diverges from local commands trains people to ignore it.
- Pin CI actions and images by digest or exact version, not by moving tag.

### Model choice

Deliberately absent. These rules are model independent, and a process that only
functions on the strongest available model is not a process. Any capable coding
model should be able to follow `operating-rules.md` and `quality-bar.md`; if one
cannot, the rules are too vague, and that is a bug in the rules.

## If this file ever conflicts with reality

Reality wins. Update this file, and add a line to `lessons-learned.md` explaining
what the stale default nearly caused.
