# Approved prototype screen catalog

**Status:** exact catalog of the user-approved connected HTML prototype  
**Source:** `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`  
**Use:** visual comparison and route continuity; not evidence of implementation

## Integrity

The prototype contains 37 unique embedded WebP screenshots, each 1920×1080. On 9 September 2026 the user reattached the original file. Its CRLF-normalized bytes matched the repository’s recorded `5,226,405` bytes and SHA-256 `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807` exactly.

Do not re-export, optimize, format, or replace the canonical HTML. Implementation screenshots are local review artifacts unless they are synthetic, privacy-reviewed, intentionally added, and clearly labeled.

## Fidelity direction

- Refine, do not redesign.
- Preserve the light blue/lilac atmosphere, floating white frame, compact left rail, quiet top bar, rounded composition, blue/violet focus, teal/coral/amber semantic accents, and connected page rhythm.
- Keep text short, familiar, and human. Reduce oversized headings and explanatory prose.
- Improve underused space with meaningful objects, progress, context, or interaction—not generic dashboard cards.
- Avoid AI-generated decoration, random gradients, excessive glass, huge hero copy, and decorative animation.
- Use restrained motion only for continuity, state, origin/destination, and recovery.

## Exact screenshot routes

| # | Route ID | Surface | Embedded source filename |
| ---: | --- | --- | --- |
| 1 | `auth` | Welcome & authentication | `EvidenceSpace-auth-welcome-v2.png` |
| 2 | `onboarding-profile` | Profile setup | `EvidenceSpace-onboarding-01-profile-4K.png` |
| 3 | `onboarding-legal` | Legal context | `EvidenceSpace-onboarding-02-legal-context-4K.png` |
| 4 | `onboarding-guidance` | Guidance preferences | `EvidenceSpace-onboarding-03-guidance-4K.png` |
| 5 | `onboarding-accessibility` | Accessibility | `EvidenceSpace-onboarding-04-accessibility-4K.png` |
| 6 | `onboarding-first-case` | Ready for the first case | `EvidenceSpace-onboarding-05-first-case-4K.png` |
| 7 | `home` | Global Home | `EvidenceSpace-global-home-v1.png` |
| 8 | `cases` | Cases Library | `EvidenceSpace-cases-library-v1.png` |
| 9 | `new-case` | New Case — Story Field | `EvidenceSpace-new-case-story-field-v2.png` |
| 10 | `brief` | Case Brief | `EvidenceSpace-case-overview-v2.png` |
| 11 | `space` | Case Space | `EvidenceSpace-signal-field-2027-keyframe-v3-4K.png` |
| 12 | `evidence` | Evidence Library & Source Viewer | `EvidenceSpace-evidence-viewer-v2.png` |
| 13 | `research` | Web Research | `EvidenceSpace-web-research-v2.png` |
| 14 | `work` | Work | `EvidenceSpace-work-v3-4K.png` |
| 15 | `room` | Room | `EvidenceSpace-room-v2.png` |
| 16 | `reports` | Reports | `EvidenceSpace-reports-v1.png` |
| 17 | `lawyers` | Find a Lawyer | `EvidenceSpace-lawyer-marketplace-v2.png` |
| 18 | `lawyer-profile` | Lawyer Profile | `EvidenceSpace-lawyer-profile-v2.png` |
| 19 | `booking` | Booking, Payment & Selective Sharing | `EvidenceSpace-booking-sharing-v1.png` |
| 20 | `notification-arrival` | In-app notification arrival | `EvidenceSpace-notifications-v6-01-in-app-arrival-4K.png` |
| 21 | `notification-windows` | Privacy-safe Windows notification | `EvidenceSpace-notifications-v6-02-windows-arrival-4K.png` |
| 22 | `notification-drawer` | Origin-preserving drawer | `EvidenceSpace-notifications-v6-03-open-drawer-4K.png` |
| 23 | `notifications` | All Notifications | `EvidenceSpace-notifications-v6-04-view-all-4K.png` |
| 24 | `settings-profile` | Profile & identity | `EvidenceSpace-settings-profile-account-01-identity-4K.png` |
| 25 | `settings-legal` | Legal & regional defaults | `EvidenceSpace-settings-profile-account-02-legal-defaults-4K.png` |
| 26 | `settings-system-theme` | Appearance — System | `EvidenceSpace-settings-personalization-v2-01-system-4K.png` |
| 27 | `settings-dark-theme` | Appearance — Dark | `EvidenceSpace-settings-personalization-v2-02-dark-4K.png` |
| 28 | `settings-accessibility` | Accessibility | `EvidenceSpace-settings-personalization-v2-03-accessibility-4K.png` |
| 29 | `settings-ai` | AI & guidance | `EvidenceSpace-settings-system-01-ai-guidance-4K.png` |
| 30 | `settings-notifications` | Notification delivery | `EvidenceSpace-settings-system-02-notifications-4K.png` |
| 31 | `settings-privacy` | Privacy & sharing | `EvidenceSpace-settings-system-03-privacy-sharing-4K.png` |
| 32 | `settings-security` | Security | `EvidenceSpace-settings-system-04-security-4K.png` |
| 33 | `settings-workspace` | Workspace & members | `EvidenceSpace-settings-system-05-workspace-members-4K.png` |
| 34 | `settings-connections` | Connections | `EvidenceSpace-settings-system-06-connections-4K.png` |
| 35 | `settings-history` | Workspace history | `EvidenceSpace-settings-system-07-workspace-history-4K.png` |
| 36 | `settings-billing` | Billing | `EvidenceSpace-settings-system-08-billing-4K.png` |
| 37 | `settings-support` | Help & support | `EvidenceSpace-settings-system-09-help-support-4K.png` |

## Route interpretation

The HTML uses one connected `auth` surface for welcome, sign-in/account creation, and recovery; one `evidence` route containing library and E-04 viewer; and three professional-support routes with Saved/Bookings reached inside those surfaces. `prototype-routes.json` mirrors this exact structure. Product specifications may describe sub-surfaces separately; implementation should preserve clear states without inventing unnecessary top-level destinations.

## Known corrections, not redesign permission

- Repair the clipped horizontal region in the authentication composition.
- Normalize active rail/tab state and top-bar ownership.
- Repair inaccurate hotspot and return connections.
- Reduce text density and heading scale where necessary.
- Strengthen blank areas with meaningful state and composition.
- Validate collapse/overlay behavior at narrower Windows widths.
- Preserve exact-object continuity and permission boundaries.

Every visual implementation records the source screenshot number, what stayed unchanged, the defect addressed, before/after inspection sizes, and any remaining drift.