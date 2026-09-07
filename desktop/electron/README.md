# Electron desktop spike

**Status:** disposable ADR 0003 measurement candidate; not a production-host decision or distributable release

**Supported measurement hosts:** Windows and macOS, x64 or arm64

This package renders the existing EvidenceSpace shell through a narrow Electron adapter. It intentionally does not replace the browser/local-first CaseFind implementation or modify the preserved 37-screen prototype.

## Pinned tooling

- Electron `44.2.0`
- `@electron/packager` `20.3.0`
- `@electron/fuses` `2.1.3`

All versions are exact and are checked by the repository dependency policy.

## Boundary and security

- `src/desktop/boundary.ts` remains the source of truth for protocol-v1 deep links and requests; the staging step compiles and copies it rather than recreating the contract.
- A secure custom protocol serves five explicitly allowlisted packaged shell assets. It does not expose arbitrary files.
- Response headers deny network access, framing, forms, objects, media, and workers.
- The renderer uses context isolation and sandboxing with Node integration, workers, subframes, webviews, insecure content, and DevTools disabled.
- Navigation, redirects, windows, webviews, and permissions fail closed.
- The preload exposes only `getCapabilities()` and `selectEvidenceFiles()`; raw Electron primitives are not exposed.
- The main process validates the sender and exact request shape before execution.
- Native picker paths stay in an in-memory main-process map. The renderer receives only opaque handles and evidence kinds.
- Deep-link activation is limited to global shell routes and synthetic Case `C-03` until production authorization exists.
- Packaging enables ASAR integrity and verifies every available Electron fuse explicitly. `ELECTRON_RUN_AS_NODE`, `NODE_OPTIONS`, CLI inspection, and file-protocol extra privileges are disabled.

## Commands

From the repository root:

```bash
npm run desktop:electron:install
npm run desktop:electron:stage
npm run desktop:electron:start
npm run desktop:electron:package
```

- `install` installs only this isolated candidate's pinned tooling.
- `stage` compiles the shared boundary and copies the explicit shell asset allowlist into `.desktop-build/electron/app`.
- `start` is a local development smoke path. It is not packaged evidence.
- `package` runs only on Windows or macOS x64/arm64, packages the current host/architecture, enables ASAR integrity and restrictive Electron fuses, verifies the resulting fuse wire, and writes ignored output under `dist/electron-spike`.

The output is unsigned and spike-only. Do not distribute it or treat it as Windows/macOS evidence until it is built from an exact commit, hashed, exercised through the full protocol, and recorded using `src/desktop/spike-evidence.ts`.

## Still required

This thin adapter does not yet implement or prove draft crash recovery, the 1,000-object Board fixture, operating-system protocol registration, accessibility-tree inspection, signed update verification, rollback, startup/memory/package thresholds, or any Windows/macOS observation. Tauri remains the mandatory comparator before a production-host decision.
