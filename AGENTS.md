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
