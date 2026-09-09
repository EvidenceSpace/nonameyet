# EvidenceSpace design prototypes

These are synthetic review artifacts, not production code or evidence of implemented behavior.

## Canonical connected end-to-end prototype

Open `EvidenceSpace-connected-end-to-end-prototype-v1.html` for the user-approved visual and workflow baseline used during implementation review.

Baseline metadata:

- Title: `EvidenceSpace — Connected End-to-End Prototype v1`
- Repository path: `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`
- Size with repository LF endings: `5,226,405` bytes
- Git blob: `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`
- Canonical normalized SHA-256: `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`
- Embedded screenshots: `37`
- Screenshot dimensions: `1920×1080`
- Connected screenshot routes: `37`

### 9 September 2026 source re-verification

The user reattached the original prototype. The attachment was `5,226,610` bytes with `205` CRLF line endings and raw SHA-256 `114d1e96debe2b6dda13a76782c55085ab6f479543a56a2c6f5071a921134c72`. Normalizing CRLF to LF produced exactly `5,226,405` bytes and SHA-256 `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`, matching the recorded canonical source. The content difference is newline encoding only; the repository prototype must not be replaced.

Route coverage in the HTML:

- Access: 1 connected welcome/authentication/recovery surface
- Onboarding: 5
- Workspace: 3
- Case C-03: 7
- Professional support: 3
- Attention and notifications: 4
- Settings: 14

The exact route-to-image catalog is in [`../handoff/APPROVED-SCREEN-CATALOG.md`](../handoff/APPROVED-SCREEN-CATALOG.md). `prototype-routes.json` mirrors the HTML route IDs rather than a different conceptual decomposition.

Known prototype limitations:

- The initial 1920×1080 authentication view contains a clipped horizontal stage region.
- Some bars, tabs, active states, hotspot returns, copy density, and blank areas need scoped correction during implementation.
- The artifact is a design/workflow baseline, not an accessibility, responsiveness, performance, security, or production-readiness sign-off.
- Implementations must follow canonical product, design, engineering, security, and AI-governance documents when they conflict with a prototype detail.

## Fidelity rule

Refine, do not redesign. Preserve the prototype’s recognizable visual character and workflow. Use the 9 September clarification in `../docs/design/approved-application-system.md`: simpler human copy, smaller hierarchy where needed, purposeful use of blank space, and restrained interaction without generic dashboard filler or decorative AI effects.

## Approved connected map

Open `evidencespace-connected-application-map.html`. It is self-contained and shows authentication, five-step onboarding, Global Home, Cases, Story Field, all seven case lenses, marketplace/booking/selective sharing, notifications, Settings, and exact-object continuity.

Supporting files:

- `connected-navigation.json`
- `prototype-routes.json`
- `connected-experience-contract.md`
- `../docs/design/approved-application-system.md`
- `../handoff/assets/README.md`

## Earlier core concept

`evidencespace-core-experience.html` remains historical design exploration. Where it conflicts with the approved connected system—especially visual language, case navigation, Settings, onboarding, or notifications—the newer approved system wins.

## Boundaries

No real evidence, legal analysis, authentication, storage, AI, collaboration, payment, or marketplace service is connected. Layout and motion values remain hypotheses until implemented and verified on Windows/macOS with accessibility and performance evidence.