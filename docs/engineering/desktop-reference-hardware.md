# Desktop reference hardware

**Status:** complete sanitized Windows reference profile recorded; packaged host measurements not run

**Purpose:** define a realistic lower-spec machine for Electron and Tauri comparison without retaining machine or license identifiers

## Windows low-spec reference v1

The machine-readable profile is `windows-low-spec-reference-v1` in `src/desktop/spike-hardware.ts`.

Packaged observation drafts bind to this sanitized identifier rather than copying hardware fields or machine identifiers into each result. The recorder's exact-key boundary rejects additional device, product, serial, account, path, and other identifying fields. See `docs/engineering/desktop-observation-capture.md`.

| Field                  | Sanitized value              |
| ---------------------- | ---------------------------- |
| Operating system       | Windows 11 Pro, version 25H2 |
| OS build               | 26200.9168                   |
| Architecture           | x64                          |
| Processor              | Intel Core i5-8365U          |
| Installed memory       | 8 GiB                        |
| Graphics               | Intel UHD Graphics 620       |
| Storage kind           | NVMe SSD                     |
| Storage capacity class | 512 GB, 477 GB formatted     |
| Touch input            | No                           |

Device name, device identifier, product identifier, serial number, account details, license data, and volatile used-space values are intentionally excluded. They are not necessary for performance comparison and must not enter source, fixtures, logs, screenshots, pull requests, or observation records.

This is a representative lower-spec Windows profile, not proof of minimum support. The profile contains the fields required to begin exact packaged-candidate measurements. Startup, memory, package-size, and interaction thresholds remain Decision required until Electron and Tauri are measured on this profile. Board p95 remains independently gated at 16.7 ms or below.

## Comparison rule

Both Windows candidates must be measured on this same profile, OS build, power mode, display configuration, and foreground workload. Reboot or otherwise establish the documented cold-start state, run enough samples for a meaningful distribution, and retain only sanitized aggregate observations. A different machine or changed configuration starts a new profile version rather than silently replacing this baseline.
