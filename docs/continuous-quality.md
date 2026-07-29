# Continuous quality checks

## Purpose

Every pull request and every push to `main` should receive the same minimum automated verification before the repository is treated as healthy.

## Quality workflow

The `Quality` GitHub Actions workflow:

1. checks out the repository without persisting write credentials;
2. uses Node.js 24 within the supported Node.js 22–24 range;
3. installs dependencies with lifecycle scripts disabled and audit/funding network calls suppressed;
4. synchronizes the exact pinned PDF.js 4.10.38 browser assets;
5. runs the TypeScript typecheck and complete automated test suite;
6. fails if synchronized PDF.js assets differ from the committed files.

The job has read-only repository permissions, a 15-minute timeout, and concurrency cancellation so obsolete runs do not consume resources.

## Dependency maintenance

Dependabot checks npm and GitHub Actions dependencies monthly with low pull-request limits. Development-tooling minor and patch updates are grouped, as are GitHub Actions minor and patch updates.

Automated version-update pull requests exclude major releases. Major upgrades can change runtime requirements, generated assets, contracts, or security behavior and therefore require an intentionally prepared branch with migration notes and compatibility testing. This is especially important for PDF.js because the package version, local browser assets, synchronization script, and extraction tests must move together.

Security alerts and deliberately initiated upgrades still receive normal review. No dependency pull request is automatically merged; each must pass the quality workflow and a product-boundary review.

## Current installation constraint

The repository does not yet contain a dependency lockfile. CI therefore uses `npm install` rather than claiming reproducible `npm ci` behavior. Runtime PDF.js remains exact-version pinned and drift-checked. Adding a reviewed lockfile is the next supply-chain improvement when package metadata can be generated and validated in a network-enabled development environment.

## Product boundary

Quality automation receives source code and test fixtures only. It must not contain production evidence, case exports, credentials, provider keys, signed URLs, or extracted private document content.
