# Current state and next steps

**Last reconciled:** 6 September 2026  
**Current `main` baseline for this slice:** `fcc12ac9e1e04977f4bcefb7c7fa7bd0aa08a3da`

## Current

- The application design foundation approved on 30 August 2026 remains the implementation baseline; recorded debt does not reopen the overall direction.
- Repository readiness is complete. PR #99 restored the durable four-part quality gate; exact-head run `33973538762` passed.
- The approved 37-screen connected EvidenceSpace prototype is preserved on `main` through PR #101; exact-head run `33973822119` passed.
- CaseFind remains a runnable browser/local-first implementation with substantial provenance, processing, review, recovery, report, and test foundations.
- The repository now includes an isolated EvidenceSpace static shell foundation with semantic tokens, approved geometry, eight global destinations, seven canonical case lenses, safe route state, responsive reflow, accessibility behavior, and focused tests.
- The shell is framework-neutral and does not decide the desktop host, final renderer, canvas engine, cloud architecture, or provider stack.
- TypeScript is `5.8.3`; `.github/workflows/quality.yml` is the only durable workflow; temporary diagnostics must not remain on `main`.

## Not implemented

Target desktop host, final renderer framework, persisted target settings, identity/recovery, cloud workspace, realtime collaboration, production case lenses, persistent copilot, research service, target reports, marketplace, booking/payment, packaging/signing, updater, and signed releases.

## Open PR disposition

- #86 is the only pre-existing open pull request. It predates the current IndexedDB schema version 6 and approved target/operation model. Review for narrow still-useful timeline/provenance behavior; do not merge the stale branch wholesale.
- PRs #87, #89, #90, #92, #97, #98, and #100 were closed without merge after supersession or selective extraction.

## Next five focused slices

1. Desktop/renderer measured spike and ADR.
2. Canvas/operation/structured-outline measured spike and ADR.
3. Authentication, session expiry, recovery, and account-bound cache skeleton.
4. Five-step onboarding with persisted appearance, accessibility, legal, and guidance preferences.
5. Workspace creation/switching, reconnect, and draft recovery; then Cases/Story Field/Brief.

## Verification expectation

Every pull request records exact commands, versions, platforms, states, counts, results, unverified areas, migration/rollback, remote SHA, and CI. “Expected to pass” is not evidence. Keep CaseFind runnable until replacements prove and migrate its trust-critical behavior.
