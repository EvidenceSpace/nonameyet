# Current state and next steps

## Current

- `main` baseline before this handoff: `d983a7e8e720c164f2c3fab5bc6ced599ae2a5eb`.
- CaseFind browser/local-first implementation with substantial provenance, processing, review, recovery and testing foundations.
- Canonical target docs and prior handoff merged.
- Approved connected design system and synthetic artifacts.
- Remote quality check currently reports failure; exact log unavailable through the connected integration.

## Not implemented

Target desktop shell, cloud workspace, realtime collaboration, seven production lenses, persistent copilot, research service, marketplace, booking/payment and signed releases.

## Open PR disposition

- #87: broad CI/test/prototype changes; do not merge wholesale; extract proven minimal fixes.
- #86: timeline atomicity; reconcile with new domain/operation model.
- #89/#90: old first-run/library visual foundations; superseded visually, mine only useful behavior.
- #92: broad local integration draft; do not merge as target architecture.

## Next five focused PRs

1. CI install diagnosis and minimal repair.
2. Desktop/renderer spike + ADR.
3. Canvas/operation/outline spike + ADR.
4. Design tokens and accessible shell.
5. Auth/recovery/five-step onboarding vertical slice.

## Verification expectation

Every PR records exact commands, versions, platforms, states, counts, results, unverified areas, migration/rollback, remote SHA and CI. “Expected to pass” is not evidence.
