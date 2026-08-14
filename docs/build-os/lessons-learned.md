# Lessons learned

Mistakes already made, each reduced to a rule. Entries are added when something
goes wrong, not on a schedule. A rule that never fires gets deleted; a pattern
that fires three times gets promoted into `operating-rules.md`.

Each entry: what happened, why it happened, and the rule it produced. No
storytelling beyond that.

---

## 1. Verify a capability before promising it

**What happened.** Work was planned around running a headless browser and
capturing a screenshot as evidence. The environment had no code-execution
sandbox. The evidence could not exist, and had it been reported as collected it
would have been fabricated.

**Why.** The capability was assumed from the shape of the task rather than
checked.

**Rule.** Check that a capability exists in the current environment before
planning around it or promising its output. When it is missing, say so plainly,
say what a human must run instead, and never present unrun work as run. Marking a
gate passed without executing it is fabricated evidence.

---

## 2. Produce the artefact, not instructions for producing it

**What happened.** A request to set something up was answered with a description
of how the person could set it up themselves.

**Why.** Describing the work is faster than doing it and superficially resembles
an answer.

**Rule.** When asked to set something up, build the thing. Hand back a finished
artefact and, if manual steps genuinely remain, list only the ones that truly
cannot be automated — with the reason each one cannot.

---

## 3. Always-on rules must stay short enough to be followed

**What happened.** A standing instruction set grew long enough that compliance
became unreliable, particularly on smaller models.

**Why.** Rules that are always loaded compete with the task for attention. Past a
certain length they degrade into background noise.

**Rule.** Keep always-on rules under roughly 150 lines. Push depth into documents
that are loaded on demand, like the ones in this folder. Every added always-on
line makes every other line slightly less likely to be obeyed.

---

## 4. Check every standard against the repository it lands in

**What happened.** A portable standard demanding TypeScript with `strict` mode
was written into a project-specific rule for a repository that is plain
JavaScript. The rule was unfollowable there.

**Why.** A generic default stack was written into a project-specific rule without
reading that project's manifest first.

**Rule.** Check every standard against the repository it lands in. Match the
stack that already exists; never introduce a language, framework, bundler or
dependency the project does not already use. Portable standards are subordinate
to repo-specific ones, and must say so in writing.

**Confirmed in reverse, in this repository.** The same TypeScript-strict rule is
*correct* here, because `tsconfig.json` really does enable `strict`,
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. That is the proof
that the rule must be "read the manifest", not "prefer TypeScript" or "prefer
JavaScript". The same sentence can be right in one repository and wrong in
another, and the only way to tell is to look.

Three things were deliberately *not* copied into this repository for exactly this
reason: a duplicate quality bar (`docs/continuous-quality.md` and
`docs/browser-quality-gate.md` already own that), a CSS token block (`web/`
already has a layering system), and a default "add the framework and the
libraries" stack (this project enforces a near-zero dependency policy in code).

---

## 5. A second copy of a rule is a rule that will go stale

**What happened.** These standards now exist in three places: a Notion workspace
and two repositories.

**Why.** Mirroring is genuinely useful — an agent working in a repository should
not need access to an external tool to know the rules — but every copy is a place
the truth can diverge.

**Rule.** Where an authoritative document already exists, point at it instead of
restating it. Where a copy is unavoidable, mark it as a copy, name the source,
and state in the pull request whether a change is repo-specific or portable. The
copies here are intentionally *not* identical, and `README.md` says so.
