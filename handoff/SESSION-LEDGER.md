# Design, engineering, and planning session ledger

## Product definition

- Application first; marketing site later.
- Online desktop V1 for Windows and macOS.
- Broad audience with adaptive onboarding.
- 2D case environment, source preservation, AI guidance, collaboration, reports, and Premium lawyer discovery.

## Early design lessons

- First concepts were rejected as disconnected and infeasible.
- Dark deterministic boards improved structure but were too dark and concentrated.
- Light product-system exploration improved clarity but still felt generic.
- Threaded Casebook was rejected.
- Signal Field / Case Space established the accepted direction.
- Board element precision study was approved.

## Wider application approvals

- Global Home, Cases Library, Story Field, Brief, Space, Evidence, Research, Work, Room, Reports, lawyer marketplace/profile/booking, authentication/recovery, five-page onboarding, Notifications v6, Personalization, Profile/account, and complete Settings were approved through iterative review.
- Generic new-case chat was superseded by Story Field.
- Work became a first-class lens.
- Research was restored as the fourth case lens.

## Connected review — 30 August 2026

- Work count corrected to six open in the synthetic fixture.
- Connected application map passed 15 contract checks.
- Screenshot-backed review contained 37 connected routes and passed 32 contract checks.
- The user accepted the main design and idea while deferring small shell/tab/connection defects to implementation.

## Repository readiness and design preservation

- PRs #93–#95 established product, handoff, and design foundations.
- PR #99 repaired the durable quality gate.
- PR #101 preserved the connected prototype.
- PR #102 merged the accessible route-state shell.
- PR #103 merged the desktop boundary and evidence gate.
- PR #104 merged the non-destructive cleanup audit.

## Desktop spike — 7–8 September 2026

- PR #105 merged the secure thin Electron candidate.
- PRs #106–#108 added the deterministic fixture, sanitized Windows profile, and Board harness.
- PR #109 added external deep-link plumbing and privacy-safe observation capture.
- PR #110 fixed Windows staging.
- PR #111 added deterministic package author metadata.
- PR #112 disabled the unsupported browser-process-specific V8 snapshot fuse.
- The unsigned Windows x64 candidate then staged, packaged, verified fuses, and opened normally on the reference device.
- Real deep-link destination, picker, packaged Board result, timing, memory, accessibility, signing/updater, macOS, and Tauri remained unverified.

## Visual correction — 9 September 2026

- The user rejected the generic diagnostic shell as final product UI.
- A standalone six-route visual exploration was created locally, technically checked, shown, and rejected because it redesigned the app’s palette, background, composition, and copy instead of improving the approved system.
- It was never committed, pushed, or opened as a pull request.
- The user reaffirmed the approved HTML as the best design reference and required a human-designed result with simple vocabulary, less copy, smaller headings, useful blank space, and restrained interaction without AI-generated imagery or animation overload.

## Prototype source re-verification — 9 September 2026

- The user reattached the original 5.2 MB HTML.
- It contained 37 unique embedded WebP screenshots at 1920×1080.
- The attachment used 205 CRLF endings; LF normalization exactly matched the repository’s `5,226,405` bytes and canonical SHA-256 `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`.
- The HTML route catalog was extracted and aligned with `prototype-routes.json`.

## Continuity mandate — 9 September 2026

- The user required page/section specifications, build plan, V1/V2/future direction, quality standards, decisions, current progress, visual references, and next-agent context to stay in the repository.
- Routine branch, pull-request, and merge work is authorized without repeated permission.
- Durable accepted work and tests reach `main` after gates; temporary/private/rejected artifacts do not.
- `HANDOFF.md` is a living report and must change with material decisions, status, blockers, or sequence.

## Active phase

Build the first recognizable prototype-faithful product slice: Global Home, Cases, Case C-03 Brief, Evidence E-04, and Context Lens continuity. Resume the remaining desktop-host evidence after that slice unless it becomes blocking.