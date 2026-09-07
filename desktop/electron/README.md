# Electron desktop spike

**Status:** disposable ADR 0003 measurement candidate with deterministic Board renderer harness; not a production-host decision or distributable release

**Supported measurement hosts:** Windows and macOS, x64 or arm64

This package normally renders the existing EvidenceSpace shell through a narrow Electron adapter. A separate command-line flag opens a candidate-only synthetic Board measurement surface. Neither path replaces the browser/local-first CaseFind implementation or modifies the preserved 37-screen prototype.

## Pinned tooling

- Electron `44.2.0`
- `@electron/packager` `20.3.0`
- `@electron/fuses` `2.1.3`

All versions are exact and are checked by the repository dependency policy.

## Boundary and security

- `src/desktop/boundary.ts` remains the source of truth for protocol-v1 deep links and requests; staging compiles and copies it rather than recreating the contract.
- A secure custom protocol serves an explicit packaged-local allowlist: five approved shell files, three candidate-only renderer files, four compiled measurement modules, and one generated synthetic fixture module.
- The measurement surface can be selected only with `--evidencespace-measure-board`; it is not reachable through an EvidenceSpace deep link and is not accepted as a native-bridge sender.
- Response headers deny network access, framing, forms, objects, media, and workers.
- The renderer uses context isolation and sandboxing with Node integration, workers, subframes, webviews, insecure content, and DevTools disabled.
- Navigation, redirects, windows, webviews, and permissions fail closed.
- The preload exposes only `getCapabilities()` and `selectEvidenceFiles()`; raw Electron primitives are not exposed.
- The main process validates the sender and exact request shape before execution.
- Native picker paths stay in an in-memory main-process map. The renderer receives only opaque handles and evidence kinds.
- Deep-link activation remains limited to global shell routes and synthetic Case `C-03` until production authorization exists.
- Packaging enables ASAR integrity and verifies every available Electron fuse explicitly. `ELECTRON_RUN_AS_NODE`, `NODE_OPTIONS`, CLI inspection, and file-protocol extra privileges are disabled.

## Representative Board harness

Staging compiles the shared boundary, evidence gate, deterministic fixture, and measurement validator. It then regenerates the synthetic fixture, verifies all counts, computes its SHA-256, and writes an ignored packaged-local JavaScript module. The fixture remains deterministic:

- 1,000 Board objects;
- 4,000 typed relationships;
- 1,000 ordered outline rows containing every relationship;
- synthetic Case `C-03`; and
- no case text, filenames, absolute paths, account data, tokens, or machine identifiers.

The candidate-only renderer:

- validates exact fixture shape before drawing;
- renders every object and relationship on a fixed 1280 × 720 canvas;
- exposes a keyboard-selectable structured outline equivalent;
- collects 20 warm-up intervals followed by exactly 120 frame intervals;
- rejects accessors, malformed samples, partial runs, non-finite values, and intervals above the bounded validator limit;
- times out after 15 seconds without accepting a partial result; and
- calculates nearest-rank p95 plus minimum and maximum while exposing only the aggregate summary.

The current Board gate remains p95 at or below 16.7 ms. A browser or development-mode result is diagnostic only. It cannot become a host observation without a packaged artifact, exact commit and artifact hashes, sanitized hardware profile, UTC instant, and the complete procedure in `docs/engineering/desktop-host-spike-protocol.md`.

## Commands

From the repository root:

```bash
npm run desktop:electron:install
npm run desktop:electron:stage
npm run desktop:electron:start
npm run desktop:electron:measure
npm run desktop:electron:package
```

- `install` installs only this isolated candidate's pinned tooling.
- `stage` compiles shared contracts, regenerates and hash-binds the fixture, and copies only the explicit allowlist into `.desktop-build/electron/app`.
- `start` is a local shell smoke path. It is not packaged evidence.
- `measure` opens the candidate-only Board renderer and automatically runs one bounded frame sample. It is still a development smoke path, not packaged evidence.
- `package` runs only on Windows or macOS x64/arm64, packages the current host/architecture, enables ASAR integrity and restrictive Electron fuses, verifies the resulting fuse wire, and writes ignored output under `dist/electron-spike`.

The output is unsigned and spike-only. Do not distribute it or treat it as Windows/macOS evidence until it is built from an exact commit, hashed, exercised through the full protocol, and recorded using `src/desktop/spike-evidence.ts`.

## Still required

No accepted packaged Board result exists yet. Draft crash recovery, operating-system protocol registration, packaged startup and memory capture, accessibility-tree inspection, signed update verification, rollback, and any Windows/macOS observation remain unimplemented or unverified. Tauri remains the mandatory comparator before a production-host decision.
