# Current state and next steps

**Last reconciled:** 7 September 2026

**`main` baseline at Electron-candidate branch cut:** `17542417553a42c3f3d19a8a0511ac684811a2b4`

## Current

- The application design foundation approved on 30 August 2026 remains the implementation baseline; recorded debt does not reopen the overall direction.
- Repository readiness is complete. PR #99 restored the durable four-part quality gate; exact-head run `33973538762` passed.
- The approved 37-screen connected EvidenceSpace prototype is preserved on `main` through PR #101; exact-head run `33973822119` passed.
- PR #102 merged the isolated EvidenceSpace static shell foundation; exact-head run `34016180978` passed all four durable jobs.
- PR #103 merged the protocol-v1 desktop boundary and evidence gate; exact-head run `34017257691` passed all four durable jobs.
- PR #104 merged the non-destructive repository cleanup audit; exact-head run `34110882507` passed all four durable jobs. Historical refs have not been deleted and `main` protection has not been enabled.
- CaseFind remains a runnable browser/local-first implementation with substantial provenance, processing, review, recovery, report, and test foundations.
- The shell provides semantic tokens, approved geometry, eight global destinations, seven canonical case lenses, safe route state, responsive reflow, accessibility behavior, and focused tests.
- The repository now includes a disposable thin Electron adapter source and packaging path against protocol v1. It uses an allowlisted packaged-content protocol, restrictive BrowserWindow/preload settings, sender and shape validation, opaque picker handles, ASAR integrity, and verified Electron fuses.
- Electron `44.2.0`, `@electron/packager` `20.3.0`, and `@electron/fuses` `2.1.3` are isolated and exactly pinned under `desktop/electron`.
- Electron remains the first packaged candidate; Tauri remains the mandatory comparator. No production host or renderer framework has been selected.
- TypeScript is `5.8.3`; `.github/workflows/quality.yml` is the only durable workflow; temporary diagnostics must not remain on `main`.

## Not implemented or measured

No signed or distributed Electron build, Windows/macOS observation, production deep-link authorization or operating-system registration, draft crash recovery, 1,000-object Board measurement, accessibility-tree inspection, signed updater/rollback, Tauri adapter, final renderer framework, persisted target settings, identity/recovery, cloud workspace, realtime collaboration, production case lenses, persistent copilot, research service, target reports, marketplace, booking/payment, or signed release is implemented or claimed.

The evidence records in tests are synthetic validation fixtures, not host measurements. The Electron package command creates only an unsigned spike bundle for the current Windows/macOS host and architecture; a command or source file is not measurement evidence.

## Open PR disposition

- #86 is the only pre-existing open pull request. It predates the current IndexedDB schema version 6 and approved target/operation model. Review for narrow still-useful timeline/provenance behavior; do not merge the stale branch wholesale.
- PRs #87, #89, #90, #92, #97, #98, and #100 were closed without merge after supersession or selective extraction.

## Next five focused slices

1. Build the Electron spike from an exact commit on representative Windows and macOS hardware; hash it and record package, startup, memory, deep-link, picker, accessibility, recovery, updater, and Board evidence without committing private diagnostics.
2. Complete the missing crash journal, synthetic 1,000-object Board/outline fixture, operating-system deep-link registration, signed-updater test harness, and acceptance thresholds required by ADR 0003.
3. Run the equivalent Tauri comparator and make or explicitly defer the production-host decision.
4. Measure renderer migration/bundle/accessibility/test cost plus canvas/operation/structured-outline behavior.
5. Build authentication, session expiry, recovery, account-bound cache, onboarding, persisted preferences, workspace switching, reconnect, and draft recovery; then Cases/Story Field/Brief.

## Verification expectation

Every pull request records exact commands, versions, platforms, states, counts, results, unverified areas, migration/rollback, remote SHA, and CI. “Expected to pass” is not evidence. Keep CaseFind runnable until replacements prove and migrate its trust-critical behavior.
