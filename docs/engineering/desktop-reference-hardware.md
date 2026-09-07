# Desktop reference hardware

**Status:** sanitized Windows reference profile recorded; packaged host measurements not run

**Purpose:** define a realistic lower-spec machine for Electron and Tauri comparison without retaining machine or license identifiers

## Windows low-spec reference v1

The machine-readable profile is `windows-low-spec-reference-v1` in `src/desktop/spike-hardware.ts`.

| Field | Sanitized value |
| --- | --- |
| Operating-system family | Windows 11 |
| Architecture | x64 |
| Processor | Intel Core i5-8365U |
| Installed memory | 8 GiB |
| Graphics | Intel UHD Graphics 620 |
| Touch input | No |
| Storage kind | Not yet observed |
| Windows build | Not yet observed |

Device name, device identifier, product identifier, serial number, account details, license data, and volatile used-space values are intentionally excluded. They are not necessary for performance comparison and must not enter source, fixtures, logs, screenshots, pull requests, or observation records.

This is a representative lower-spec Windows profile, not proof of minimum support. Startup, memory, package-size, and interaction thresholds remain Decision required until the exact packaged Electron and Tauri candidates are measured on this profile. Board p95 remains independently gated at 16.7 ms or below.

Before threshold calibration, record only the missing Windows build and whether the system disk is SSD or HDD. Keep all machine identifiers out of the repository.

## Comparison rule

Both Windows candidates must be measured on the same profile, OS build, power mode, display configuration, and foreground workload. Reboot or otherwise establish the documented cold-start state, run enough samples for a meaningful distribution, and retain only sanitized aggregate observations. A different machine or changed configuration starts a new profile version rather than silently replacing this baseline.
