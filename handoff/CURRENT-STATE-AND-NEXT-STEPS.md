# Current state and next steps

**Last reconciled:** 6 September 2026  
**Current `main` baseline for this slice:** `d4996d37df1f6b3b0e3e3f1fa8bca96a674eda1c`

## Current

- The application design foundation approved on 30 August 2026 remains the implementation baseline; recorded debt does not reopen the overall direction.
- Repository readiness is complete. PR #99 restored the durable four-part quality gate; exact-head run `33973538762` passed.
- The approved 37-screen connected EvidenceSpace prototype is preserved on `main` through PR #101; exact-head run `33973822119` passed.
- PR #102 merged the isolated EvidenceSpace static shell foundation; exact-head run `34016180978` passed all four durable jobs.
- CaseFind remains a runnable browser/local-first implementation with substantial provenance, processing, review, recovery, report, and test foundations.
- The shell provides semantic tokens, approved geometry, eight global destinations, seven canonical case lenses, safe route state, responsive reflow, accessibility behavior, and focused tests.
- The desktop architecture slice now defines protocol-v1 deep links and native bridge requests, a deny-by-default security baseline, and a complete Electron/Tauri × Windows/macOS evidence gate.
- Electron is the first packaged candidate; Tauri remains the mandatory comparator. No production host or renderer framework has been selected.
- TypeScript is `5.8.3`; `.github/workflows/quality.yml` is the only durable workflow; temporary diagnostics must not remain on `main`.

## Not implemented

No Electron or Tauri package, Windows/macOS measurement, native picker adapter, registered deep link, crash recovery, accessibility-tree inspection, signed updater, final renderer framework, persisted target settings, identity/recovery, cloud workspace, realtime collaboration, production case lenses, persistent copilot, research service, target reports, marketplace, booking/payment, or signed release is implemented or claimed.

The evidence records in tests are synthetic validation fixtures, not host measurements.

## Open PR disposition

- #86 is the only pre-existing open pull request. It predates the current IndexedDB schema version 6 and approved target/operation model. Review for narrow still-useful timeline/provenance behavior; do not merge the stale branch wholesale.
- PRs #87, #89, #90, #92, #97, #98, and #100 were closed without merge after supersession or selective extraction.

## Next five focused slices

1. Package the minimum Electron adapter against ADR 0003 and record exact Windows/macOS evidence.
2. Run the equivalent Tauri comparator and make or explicitly defer the production-host decision.
3. Measure renderer migration/bundle/accessibility/test cost plus canvas/operation/structured-outline behavior.
4. Build authentication, session expiry, recovery, and account-bound cache skeleton.
5. Build five-step onboarding, persisted preferences, workspace switching, reconnect, and draft recovery; then Cases/Story Field/Brief.

## Verification expectation

Every pull request records exact commands, versions, platforms, states, counts, results, unverified areas, migration/rollback, remote SHA, and CI. “Expected to pass” is not evidence. Keep CaseFind runnable until replacements prove and migrate its trust-critical behavior.
