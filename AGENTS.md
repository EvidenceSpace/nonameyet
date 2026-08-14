# CaseFind engineering instructions

## Product boundary

CaseFind organizes user-provided material. It does not provide legal advice, authenticate evidence, predict outcomes, or decide who is right.

## Non-negotiable implementation rules

- Preserve originals; derived previews and redactions are separate objects.
- Every AI-derived fact or event must reference one or more source locations.
- AI output remains suggested until the user confirms it.
- Never silently resolve conflicting dates, amounts, participants, or claims.
- Make deletion and retention behavior explicit and testable.
- Avoid sending a full case to a frontier model when a smaller, scoped request is sufficient.
- Do not log document contents, extracted private data, access tokens, or signed file URLs.

## Development workflow

- Work in focused branches and open pull requests.
- Add tests for domain behavior and AI contract validation.
- Keep product decisions in `docs/` and update them with implementation changes.
- Do not introduce phone-wide access, background monitoring, or mailbox connections in V1.

## Working standards

Process rules — how a task is framed, planned, verified and reported — live in
`docs/build-os/`. Start at `docs/build-os/README.md`, which states the precedence
order and points to the right file.

- `docs/build-os/operating-rules.md` — the build loop, task sizing, decide-vs-ask,
  when to stop and report.
- `docs/build-os/quality-bar.md` — definition of done. Defers to
  `docs/continuous-quality.md` and `docs/browser-quality-gate.md` for CI and the
  browser gate.
- `docs/build-os/design-baseline.md` — portable UI, motion and accessibility
  rules. Styles themselves live in the existing `web/` CSS layers.
- `docs/build-os/stack-defaults.md` — **new projects only.** Read its warning
  before applying anything from it here.
- `docs/build-os/lessons-learned.md` — mistakes already made, as rules.

This file outranks everything in `docs/build-os/`. The product boundary and the
non-negotiable rules above win any conflict.
