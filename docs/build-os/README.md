# Build OS — portable engineering standards

This folder holds the portable standards that govern how work is planned, built,
reviewed and shipped here. It was mirrored from a Notion workspace so that any
coding agent working in this repository has the same rules locally, without
needing access to Notion.

These are process documents. They describe **how to work**, not what CaseFind is.

## Precedence — read this before applying anything in this folder

When two documents disagree, the higher item wins. No exceptions.

1. **`AGENTS.md` at the repository root.** The CaseFind product boundary and the
   non-negotiable implementation rules there override everything here.
2. **The existing specs in `docs/`.** They are the product's real design record.
3. **These `docs/build-os/*` documents.** Portable defaults, nothing more.

If anything in this folder contradicts the product boundary in `AGENTS.md`, the
file in this folder is wrong. Fix it, and record the fix in `lessons-learned.md`.

## Do not duplicate what already exists

This repository already has authoritative documents for several of these topics.
The files here defer to them instead of restating them, because a second copy of
a rule is a rule that will silently go stale and then quietly contradict the
first copy.

| Topic | Authoritative document | Role of build-os |
| --- | --- | --- |
| CI, dependency policy, lockfile status | `docs/continuous-quality.md` | defers |
| Browser quality gate | `docs/browser-quality-gate.md` | defers |
| Security and session expectations | `docs/security.md`, `docs/session-security.md` | defers |
| System architecture | `docs/architecture.md` | defers |
| Product scope and behaviour | `docs/product-spec.md` and the slice docs | defers |
| Processing and extraction behaviour | `docs/processing-pipeline.md`, `docs/ai-extraction.md` | defers |
| Working process, task sizing, review loop | `operating-rules.md` | owns |
| Portable definition of done | `quality-bar.md` | owns, deliberately thin |
| Portable UI/UX and accessibility rules | `design-baseline.md` | owns, partial |
| Mistakes not to repeat | `lessons-learned.md` | owns |

## Files

- `operating-rules.md` — how a task goes from idea to merged, and the rules that
  apply to every task regardless of what is being built.
- `quality-bar.md` — the portable definition of done. Thin on purpose: it points
  at this repository's real gates rather than inventing parallel ones.
- `design-baseline.md` — UI/UX and accessibility rules that are stack
  independent. It does **not** define design tokens. `web/` already has a CSS
  layering system and this folder must not compete with it.
- `stack-defaults.md` — **quarantined.** Defaults for starting a new project from
  nothing. It does not describe this repository. Read the warning at the top of
  that file before applying a single line of it.
- `lessons-learned.md` — mistakes already made, and the rule each one produced.

## Drift warning

These documents exist in three places: the Notion workspace they came from, and
two separate repositories. The three copies are **not** identical, and are not
meant to be. Each repository's copy is adapted to that repository's real stack
and real gates.

When you change a rule here, state in the pull request whether the change is
repo-specific or portable. Portable changes should be carried back to the Notion
source. Repo-specific changes stay here.

## Deliberately not in this folder

- **The Notion AI Instructions page.** It configures an assistant, not this
  codebase.
- **The `Build` skill.** Same reason.
- **Live task tracker contents.** Task state belongs in the tracker, not in git,
  where it would be stale within a day.
- **Model choice guidance.** These rules are model independent by design. A rule
  that only works on the strongest available model is a bad rule.
