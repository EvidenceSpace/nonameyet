# Desktop packaged observation capture

**Status:** privacy-safe capture infrastructure implemented; no Windows or macOS packaged observation has been accepted

**Scope:** bind one Electron or Tauri measurement draft to a clean source commit and a stable packaged-bundle digest without retaining host paths or machine identifiers

## Trust boundary

Run capture only from the exact clean checkout used to build and measure the candidate. The command:

- accepts one draft below `.desktop-build/observations` and one package directory below `dist/electron-spike`;
- rejects symlinks anywhere in either trusted root chain before changing permissions, reading a draft, or hashing a package;
- rejects tracked or untracked non-ignored source changes before binding `HEAD`;
- requires the draft platform and architecture to match the machine running capture;
- computes the package digest twice and rejects a package that changes during capture;
- rejects unknown draft keys, accessors, manually supplied commit or artifact fields, malformed metrics, and identifying fields;
- writes one new record with exclusive creation rather than replacing earlier evidence;
- uses owner-only directory and file modes where the operating system supports them; and
- prints only a bounded summary with no absolute path, filename inventory, case content, raw deep link, account value, token, or machine identifier.

The source draft and captured record remain under `.desktop-build`, which is ignored. Do not commit a record until a person has reviewed every field and confirmed that the hardware profile is approved for the intended audience.

## Package digest

`evidencespace-packaged-tree-sha256-v1` is a canonical SHA-256 digest for the unsigned spike bundle directory. It hashes a sorted root-relative entry stream containing:

- directory names and permission bits;
- regular-file names, permission bits, byte lengths, and content SHA-256 values; and
- relative symlink names and targets that remain inside the package root.

It rejects absolute or escaping symlinks, special files, oversized paths, more than 200,000 entries, more than 10 GiB of regular files, and files that change while being read. The digest excludes the package's absolute host path and volatile timestamps. `packagedArtifactBytes` is the sum of regular-file bytes in the same tree.

This is a spike-only bundle identity, not a substitute for a signed installer, notarization, Authenticode, code-signing verification, or a release-archive digest. Extended attributes are not represented.

## Draft format

The draft deliberately omits `commitSha`, `artifactDigestAlgorithm`, `artifactSha256`, and `packagedArtifactBytes`; capture derives those values. Start from this non-valid placeholder and replace every angle-bracket value:

```json
{
  "observationVersion": 1,
  "candidate": "electron",
  "platform": "<windows-or-macos>",
  "architecture": "<x64-or-arm64>",
  "hardwareProfileId": "<approved-sanitized-profile-id>",
  "hostVersion": "44.2.0",
  "osVersion": "<sanitized-os-version>",
  "measuredAt": "<YYYY-MM-DDTHH:mm:ss.sssZ>",
  "coldStartMs": "<positive-number>",
  "warmStartMs": "<positive-number>",
  "idlePrivateMemoryBytes": "<positive-integer>",
  "boardFrameP95Ms": "<positive-number>",
  "recoveredAfterCrash": false,
  "deepLinkValidated": false,
  "filePickerValidated": false,
  "accessibilityTreeInspected": false,
  "updaterSignatureValidated": false
}
```

Keep each quality gate `false` until the exact packaged artifact passes that scenario on the recorded host. A successful registration API call is not enough for `deepLinkValidated`; the operating system must launch or activate the app with the external link, the parser must reject adversarial cases, and the resolved synthetic target must be reauthorized.

Never add device name, device or product identifier, serial number, account name, local path, source filename, raw deep link, case content, token, signed URL, screenshot, or raw frame samples. Exact-key validation rejects additional fields and does not echo their values.

## Capture command

Package and measure on Windows or macOS from a clean exact commit. Save the completed draft below the ignored observation directory, then pass the package output directory:

```bash
npm run desktop:observation:capture -- \
  .desktop-build/observations/electron-windows-draft.json \
  dist/electron-spike/EvidenceSpaceSpike-win32-x64
```

A macOS arm64 package uses the corresponding output directory:

```bash
npm run desktop:observation:capture -- \
  .desktop-build/observations/electron-macos-draft.json \
  dist/electron-spike/EvidenceSpaceSpike-darwin-arm64
```

The command intentionally fails on Linux, on a platform or architecture mismatch, outside the two approved roots, when the Git worktree is not clean, when the package changes between digest passes, or when a destination record already exists.

## Interpretation

`accepted: true` means only that the record is exact-shaped, sanitized, host-matched, commit-bound, package-bound, and stored safely. It does not prove that the measurements were collected correctly, that a quality-gate boolean is truthful, that the candidate is production-ready, or that the host decision can be made. `assessDesktopHostEvidence()` still requires one valid record for Electron and Tauri on both Windows and macOS, with every non-negotiable gate passing and the Board p95 at or below 16.7 ms.
