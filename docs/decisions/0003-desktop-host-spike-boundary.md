# ADR 0003: desktop host spike boundary and evidence gate

- **Status:** Accepted for measurement spike; production host and renderer choice pending
- **Date:** 6 September 2026
- **Decision owner:** EvidenceSpace engineering

## Context

EvidenceSpace targets Windows and macOS, starts from a web-rendered shell, and must add native file selection, deep links, encrypted account-bound cache, notifications, signed updates, crash recovery, and accessibility without giving the renderer general operating-system access.

The architecture contract requires a working cross-platform spike before choosing a desktop host. A preference-only comparison would be insufficient, while adding both full stacks to production code before the boundary is defined would create avoidable migration and security risk.

## Evidence reviewed

Official documentation reviewed on 6 September 2026:

- Electron documents a Chromium-style main/renderer/preload process model, a Node-capable main process, and a `contextBridge` path for narrow renderer APIs: https://www.electronjs.org/docs/latest/tutorial/process-model
- Electron’s security checklist requires context isolation, process sandboxing, restrictive content policy, navigation and new-window limits, sender validation, current releases, and no raw Electron API exposure: https://www.electronjs.org/docs/latest/tutorial/security
- Electron exposes Chromium accessibility behavior and automatically enables accessibility support when assistive technology such as JAWS or VoiceOver is present: https://www.electronjs.org/docs/latest/tutorial/accessibility
- Tauri separates a Rust core from a system-WebView frontend through IPC and capability configuration: https://v2.tauri.app/security/
- Tauri uses WebView2 on Windows and WKWebView on macOS, so web-platform behavior follows the relevant system runtime rather than one bundled engine: https://tauri.app/reference/webview-versions
- Tauri’s updater requires signed update artifacts and supports Windows and macOS: https://v2.tauri.app/plugin/updater
- Tauri warns that desktop deep links can be manually forged and must be checked against the expected format; macOS registration/testing also requires packaged configuration: https://v2.tauri.app/plugin/deep-linking/

These are framework capabilities, not EvidenceSpace measurements. Package size, startup, memory, frame pacing, recovery, updater operation, and accessibility remain unverified for this repository.

## Decision

1. Keep the renderer and case domain independent of the desktop host.
2. Establish a versioned, command-specific, fail-closed desktop boundary before adding either candidate runtime.
3. Give the renderer no general Node, Rust, filesystem, process, shell, or raw IPC surface.
4. Treat deep links as untrusted input. Validate scheme, route, case/object identifiers, duplicates, and unexpected parameters before navigation, then reauthorize the resolved object.
5. Let the native host own the evidence picker. The renderer requests accepted kinds and receives opaque handles; it never supplies or receives an absolute path through this contract.
6. Run Electron first as the packaged candidate because it is the documented default candidate, shares the current Chromium/web foundation, and minimizes engine variance during migration.
7. Keep Tauri as the serious comparator until the same Windows/macOS scenarios and evidence record are complete.
8. Do not select React or another final renderer framework in this ADR. The approved static shell remains the neutral reference until bundle, accessibility, testing, and migration evidence exists.

This is a decision about the spike boundary and order, not a production-host approval.

## Implemented boundary

`src/desktop/boundary.ts` provides:

- one protocol version;
- an allowlisted EvidenceSpace deep-link parser with privacy-safe failures;
- a capabilities handshake and native evidence-picker request contract;
- exact-key validation that rejects hidden path or command fields; and
- a host-neutral deny-by-default security baseline.

`src/desktop/spike-evidence.ts` makes a final host decision fail closed unless Electron and Tauri each have one valid Windows and one valid macOS observation. Every observation is bound to a commit and artifact hash and records package size, cold/warm startup, idle private memory, representative Board frame pacing, crash recovery, deep link, native picker, accessibility-tree inspection, and signed-updater verification.

## Required packaged spike

Both candidates must render the same EvidenceSpace shell and representative 1,000-object Board/structured-outline fixture. Use synthetic data only. Record:

- exact host, operating-system, architecture, commit, and artifact versions;
- packaged artifact bytes;
- cold and warm route-ready time;
- idle private memory;
- p95 Board frame time, with 16.7 ms as the current 60 FPS gate;
- crash/restart draft recovery;
- deep-link validation and object reauthorization;
- native evidence picker behavior without raw renderer paths;
- Windows accessibility tree plus keyboard path;
- macOS accessibility tree plus keyboard path; and
- signed update validation, failed-signature behavior, and rollback route.

Startup, memory, and package-size acceptance thresholds must be set from named representative hardware before production selection. They are recorded now for comparison and cannot be replaced by marketing claims.

## Security acceptance

A candidate fails the spike if it requires any of these:

- remote or mutable code with native privileges;
- unrestricted renderer access to host APIs;
- disabled isolation, sandbox, web security, content policy, or capability controls;
- unvalidated IPC sender, navigation, new-window, external URL, or deep-link input;
- case content, filenames, raw links, absolute paths, tokens, or signed URLs in general diagnostics; or
- an unsigned or unverifiable update path.

## Consequences

- The next implementation may build a disposable packaged Electron candidate against this contract without committing Electron as the final production host.
- Tauri remains required evidence, not a theoretical footnote.
- A consistent bundled renderer is an Electron advantage; package size, memory, and application-owned runtime patching are costs to measure.
- Tauri’s capability model and signed updater are advantages; Rust ownership and Windows/macOS WebView variance are costs to measure.
- The renderer-framework and Board-engine decisions remain separate ADRs.

## Migration and rollback

No user data, CaseFind schema, shell route, dependency, or production runtime changes in this ADR. The boundary is additive. If either candidate cannot meet the evidence gate, discard its adapter and keep the host-neutral contract. If the contract itself is unsafe, roll back this ADR and its two source modules before any production host relies on them.
