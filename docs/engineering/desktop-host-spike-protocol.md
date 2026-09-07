# Desktop host spike protocol

**Status:** protocol-v1 boundary, thin Electron candidate, complete sanitized Windows reference profile, and deterministic measurement fixture implemented; packaged Windows/macOS measurements not run

**Scope:** Electron and Tauri comparison for Windows and macOS

**Non-goals:** final renderer framework, Board engine, cloud provider, production signing keys, or release claim

## User outcome

The selected desktop host must open the same EvidenceSpace shell, recover a draft after interruption, accept a validated deep link, select evidence through a narrow native picker, expose an inspectable accessible structure, and verify a signed update without giving the renderer broad system access.

## Candidate-neutral boundary

All candidate adapters implement the versioned contracts in `src/desktop/boundary.ts`.

- Packaged local renderer content only.
- Deny permissions, navigation, and new windows by default.
- No raw host bridge in the renderer.
- Validate command shape and sender before execution.
- Treat deep links as untrusted and reauthorize the resolved target.
- Native picker owns filesystem paths; renderer receives opaque handles only.
- General diagnostics exclude case content, raw links, filenames, paths, tokens, and signed URLs.

The current contract exposes only:

1. `desktop:get-capabilities`
2. `desktop:select-evidence-files`

Adding a command requires a versioned contract, authorization/permission model, failure taxonomy, privacy review, and tests in the same change.

## Thin Electron candidate

The isolated candidate under `desktop/electron` pins Electron `44.2.0`, `@electron/packager` `20.3.0`, and `@electron/fuses` `2.1.3`. The root dependency check validates both manifests.

The candidate:

- compiles and reuses the shared TypeScript boundary;
- serves only the five required shell assets through a secure custom protocol;
- applies a restrictive response content policy;
- keeps context isolation, sandboxing, web security, and command-specific preload exposure enabled;
- denies navigation, redirects, windows, webviews, permissions, raw Node access, and unapproved deep-link scope;
- keeps selected absolute paths in main-process memory and returns only opaque handles;
- packages into ASAR; and
- enables and verifies every Electron fuse known to the pinned fuse tool, including ASAR integrity validation and disabling run-as-Node, Node options, CLI inspection, and file-protocol extra privileges.

The candidate is disposable measurement infrastructure, not a production-host selection. Its deep-link authorization is intentionally limited to global routes and synthetic Case C-03 until a real authorization service exists. See `desktop/electron/README.md` for exact commands and remaining gaps.

## Evidence matrix

A host decision requires one valid observation for each pair:

| Candidate | Windows | macOS |
| --- | --- | --- |
| Electron | Required | Required |
| Tauri | Required | Required |

`assessDesktopHostEvidence()` rejects missing, duplicate, malformed, unbound, or failed observations. It does not choose a winner. Human review compares measured startup, memory, and package size only after every non-negotiable quality gate passes.

## Representative fixture

`createDesktopSpikeFixture()` produces synthetic and deterministic data for the approved EvidenceSpace shell:

- Case C-03 route continuity;
- one native evidence-picker request for PDF and image kinds;
- one valid and six invalid deep-link cases;
- exactly 1,000 Board objects;
- exactly 4,000 typed relations across supports, contradicts, sequence, and dependency edges;
- an equivalent ordered outline containing every object and relation; and
- a SHA-256-bound draft journal that can be recovered before, during, and after commit.

Run `npm run desktop:fixture` to write the ignored artifact to `.desktop-build/fixtures/desktop-spike-fixture.v1.json`. The command reports counts, bytes, and a SHA-256 without logging fixture content. Identical source and runtime inputs produce identical serialized output.

The fixture contains no real case names, filenames, source text, user accounts, tokens, signing keys, local paths, or machine identifiers. It is measurement input, not proof that either packaged candidate renders, recovers, or meets the frame budget.

## Reference hardware

The complete sanitized `windows-low-spec-reference-v1` profile records Windows 11 Pro 25H2 build 26200.9168 on x64, Intel Core i5-8365U, 8 GiB installed memory, Intel UHD Graphics 620, an NVMe SSD, and no touch input. Device, product, license, account, and serial identifiers are intentionally excluded. See `docs/engineering/desktop-reference-hardware.md`.

This profile is a practical lower-spec Windows target, not a minimum-support claim. Both candidates must be measured on the same profile and configuration before startup, memory, and package trade-offs are compared.

## Observation record

Each candidate/platform record contains:

- candidate, platform, architecture, host version, and OS version;
- exact source commit and packaged artifact SHA-256;
- UTC measurement instant;
- packaged artifact bytes;
- cold start, warm start, idle private memory, and p95 Board frame time;
- pass/fail for crash recovery, validated deep link, native picker, accessibility-tree inspection, and signed updater.

The current Board frame gate is p95 at or below 16.7 ms for the representative fixture. Startup, memory, and package thresholds remain Decision required until both candidates are measured on the complete reference profile.

## Test procedure

For each candidate and platform:

1. Build a packaged, non-development artifact from the exact commit.
2. Hash the artifact before installation.
3. Launch from a signed or explicitly spike-only package with synthetic state.
4. Record cold start from process request to shell `data-ready`.
5. Record warm start after a clean shutdown.
6. Record idle private memory after the shell settles.
7. Exercise the 1,000-object Board and record p95 frame time.
8. Interrupt a draft write, restart, and verify deterministic recovery.
9. Send valid, foreign-origin, duplicate-parameter, unknown-route, malformed-case, and oversized deep links.
10. Use the native picker and verify no absolute path reaches renderer state or diagnostics.
11. Inspect keyboard order and the operating-system accessibility tree.
12. Verify a valid signed update, reject an invalid signature, and document rollback.
13. Store only the safe observation record; keep signing material and raw diagnostics out of the repository.

## Decision gate

A candidate remains eligible only when:

- isolation/capability controls and content policy remain enabled;
- bridge sender, shape, authorization, and revision are validated;
- navigation, new windows, external URLs, permissions, and deep links fail closed;
- crash recovery, picker, accessibility, and updater gates pass on both platforms;
- the representative Board meets the frame budget; and
- any package/startup/memory trade-off is supported by named sanitized hardware and exact observations.

A browser-only run, development server, screenshot, framework description, source review, successful staging command, or vendor claim is not packaged desktop evidence.

## Current verification and candidate commands

Boundary, evidence-gate, fixture, adapter-policy, and wiring tests use the durable repository commands:

```bash
npm run typecheck
npm test
npm run desktop:fixture
npm run desktop:electron:stage
```

The candidate commands now exist:

```bash
npm run desktop:electron:install
npm run desktop:electron:start
npm run desktop:electron:package
```

`desktop:electron:package` intentionally rejects non-Windows/macOS and unsupported architectures. It emits an unsigned, ignored, current-host spike bundle only. A successful command still does not satisfy the evidence matrix without exact commit/artifact hashes and the complete procedure above.
