# Desktop host spike protocol

**Status:** protocol-v1 boundary and thin Electron candidate implemented; packaged Windows/macOS measurements not run

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

Use synthetic data:

- the approved EvidenceSpace shell;
- Case C-03 route continuity;
- one native evidence-picker request for PDF and image kinds;
- one valid and at least five invalid deep-link cases;
- a 1,000-object Board model with dense typed connections;
- an equivalent structured outline; and
- a draft journal that can be interrupted before, during, and after commit.

Do not include real case names, filenames, text, source quotes, user accounts, tokens, signing keys, or local paths in fixtures or artifacts.

## Observation record

Each candidate/platform record contains:

- candidate, platform, architecture, host version, and OS version;
- exact source commit and packaged artifact SHA-256;
- UTC measurement instant;
- packaged artifact bytes;
- cold start, warm start, idle private memory, and p95 Board frame time;
- pass/fail for crash recovery, validated deep link, native picker, accessibility-tree inspection, and signed updater.

The current Board frame gate is p95 at or below 16.7 ms for the representative fixture. Startup, memory, and package thresholds remain Decision required until representative minimum hardware is named and measured.

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
- any package/startup/memory trade-off is supported by named hardware and exact observations.

A browser-only run, development server, screenshot, framework description, source review, successful staging command, or vendor claim is not packaged desktop evidence.

## Current verification and candidate commands

Boundary, evidence-gate, adapter-policy, and wiring tests use the durable repository commands:

```bash
npm run typecheck
npm test
npm run desktop:electron:stage
```

The candidate commands now exist:

```bash
npm run desktop:electron:install
npm run desktop:electron:start
npm run desktop:electron:package
```

`desktop:electron:package` intentionally rejects non-Windows/macOS and unsupported architectures. It emits an unsigned, ignored, current-host spike bundle only. A successful command still does not satisfy the evidence matrix without exact commit/artifact hashes and the complete procedure above.
