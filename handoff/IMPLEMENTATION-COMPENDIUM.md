# EvidenceSpace implementation compendium

**Audience:** a new human maintainer or advanced coding agent with no prior chat context  
**Purpose:** route from the approved product and design to coherent implementation slices  
**Status:** living handoff summary; canonical product, design, engineering, and ADR files win on detail

## Product in one sentence

EvidenceSpace is an online Windows and macOS case workspace that helps people preserve source material, organize it visually, understand it with skeptical source-backed assistance, collaborate with authorized people, produce reviewed outputs, and optionally find and book a verified lawyer.

## Experience promise

A user should always understand:

- where they are;
- which case and object are active;
- what is source material, human input, AI suggestion, accepted fact, contrary material, or unknown;
- who can see the current content;
- what the main next action is; and
- how to recover or undo safely.

The app must feel intentionally human-designed. Use familiar words, short labels, compact headings, clear hierarchy, and purposeful interaction. Do not compete through visual noise, feature count, generic dashboards, imitation, or unsupported claims.

## Current versus target

| Layer | Current | Target |
| --- | --- | --- |
| Proven implementation | Runnable CaseFind browser/local-first prototype | Migrated EvidenceSpace trust-critical behavior |
| Product shell | Accessible route-state foundation; visually rejected as final UI | Prototype-faithful production shell |
| Desktop | Unsigned Electron candidate starts on one Windows reference device | Signed, measured Windows/macOS host after Electron/Tauri comparison |
| Data | Local IndexedDB schema 6 in CaseFind | Permissioned cloud workspace plus encrypted minimal recovery cache |
| AI | Narrow extraction/review foundations | Source-backed copilot with proposal, approval, audit, and safe recovery |
| Collaboration | Not implemented | Authorized Room, comments, presence, tasks, notifications, and revocation |
| Marketplace | Not implemented | Premium discovery, verification, booking, payment, and selective sharing |

## Shell and continuity

The global rail owns Home, Cases, New case, Lawyers, Notifications, Security/help, Settings, and Account. A case exposes exactly Brief, Space, Evidence, Research, Work, Room, and Reports. The top bar preserves current workspace, case, object, sync, and visibility context without becoming a large header.

Signature patterns:

1. **Case Spine** — stable case context and lens navigation.
2. **Provenance Rail** — reachable source identity and locators.
3. **Context Lens** — AI, details, comments, and activity only when useful.
4. **Ghost Proposal** — visible, unapplied AI change with sources, destination, audience, effect, and recovery.
5. **Workspace receipt** — proposal, approval, execution, failure, correction, and undo remain attributable.

## Page and section build plan

### Access and onboarding

| Surface | Contains | Build and acceptance |
| --- | --- | --- |
| Welcome/auth/recovery | concise promise, sign in/create account, recovery, privacy/support links | No case leakage; preserve intended destination; recover expired/failed sessions; keyboard and screen-reader complete |
| Profile | name, optional organization/role/avatar, language/time zone | Role personalizes language; it never proves professional status |
| Legal context | country/region and default jurisdiction | Defaults are suggestions; every case confirms its own jurisdiction |
| Guidance | explanation depth and terminology preference | Truth, sources, contrary material, and approval rules never weaken |
| Accessibility | motion, contrast, density, text, keyboard hints | Durable and available again in Settings |
| First case | preference review and enter workspace | Story stays in New Case; onboarding does not force sensitive upload |

### Global workspace

| Surface | Contains | Build and acceptance |
| --- | --- | --- |
| Global Home | recent cases, attention, assigned work, invitations, processing/security issues, consultations | One useful next action; no unauthorized title leakage; not a second Case Brief |
| Cases | search, filters, active/archived/invited, accessible list, compact visual preview, lifecycle actions | No win score; archive reversible; deletion deliberate and audited |
| New Case Story Field | user-owned narrative, reviewable people/dates/amounts/goals, high-value questions, manual fallback | Draft survives interruption; AI failure cannot block creation; extracted structure remains proposed |

### Case lenses

| Lens | Owns | Required outcome |
| --- | --- | --- |
| Brief | reviewed situation, organization progress, deadlines, issues, unknowns, contrary material, next step | Every material claim links to Evidence or Research; no outcome probability |
| Space | 2D organization, frames, cards, timeline, tasks, typed connectors, history, outline | Precise direct manipulation plus full structured keyboard equivalent; AI changes remain ghosts until approved |
| Evidence | immutable original, derivatives, processing, metadata, locators, review, permissions, backlinks | Editing metadata never changes original bytes; broken provenance fails closed with repair |
| Research | question, scope, jurisdiction, authority/freshness, results, saved source ledger, history | Official/primary sources prioritized; summaries never replace sources |
| Work | tasks, requested information, status, priority, assignee, deadline, instructions, dependencies | Ownership and source context stay together; AI tasks marked NOT APPLIED until approval |
| Room | topics, messages, threads, mentions, pins, decisions, presence, conversions, shared Case AI | Human-first; conversions preview destination and visibility; private AI never leaks |
| Reports | templates, sections, inclusion, redaction, versions, citations, review, export/share history | Human approves/exports/sends; disputed, stale, private, and omitted material stays visible |

### Professional support

| Surface | Contains | Build and acceptance |
| --- | --- | --- |
| Find a Lawyer | search/filter/compare, verification scope/date, jurisdiction, language, price, availability, rating basis, sponsored disclosure | Premium never hides urgent public-help paths; relevance and paid placement are distinct |
| Lawyer Profile | credentials, licenses, services, reviews, availability, terms, report/save/book | Profile is not EvidenceSpace endorsement; verification supports revalidation and appeal |
| Booking/payment/selective sharing | service/time, minimal conflict screen, exact shared items, permission/expiry/downloads, price/tax/policy, payment/refund states | Atomic slot/payment transitions; payment never grants access; whole case never shared by default |

### Attention and notifications

Badge → focused toast or privacy-safe OS notice → origin-preserving drawer → All Notifications → exact authorized object with backlink. Settings controls delivery only. Security/access changes may remain mandatory. Lock-screen copy never contains case titles, filenames, quotes, or participant names.

### Settings

Profile & identity; Legal & regional defaults; Appearance; Accessibility; AI & guidance; Notifications; Privacy & sharing; Security; Workspace & members; Connections; Workspace history; Billing; Help & support.

System follows the OS appearance. Explicit Light or Dark disables automatic switching. Existing cases do not silently change when account defaults change. Workspace membership, case access, object visibility, operation permission, payment, and lawyer sharing remain separate.

## Cross-cutting implementation contracts

### Data and provenance

Preserve every original byte-for-byte. Bind derivatives and claims to exact version/hash and typed locators. Maintain revision, ownership, visibility, lifecycle, audit, archive, retention, deletion, cache, search/index, embedding, backup, and restore behavior.

### Authorization

Default deny at API, realtime, download, AI retrieval, export, and sharing boundaries. Test cross-workspace, cross-case, cross-object, stale revision, revoked access, replay, and cached-content paths.

### AI

Retrieved content is untrusted data. AI shows sources, contrary material, assumptions, unknowns, coverage, jurisdiction, freshness, and next step. Structured actions pass deterministic schema, policy, authorization, revision, preview, human decision, idempotent execution, verification, receipt, and safe undo when possible.

### Reliability

Design loading, empty, partial, stale, reconnecting, read-only, denied, cancelled, oversized, duplicate, concurrent, interrupted, error, and recovery states. Preserve drafts and explain what was saved and what changed.

### Accessibility

WCAG 2.2 AA target; full keyboard journeys; visible focus; semantic names; async announcements; modal trap/restore; 200% zoom/reflow; practical targets; forced colors; reduced motion; and structured board outline.

### Performance

Measure representative low-spec Windows and macOS devices. Prioritize input responsiveness, progressive rendering, virtualization, cancellation, deterministic rollback, reconnect, and no full-case reload for small actions. Every claim names build, device, dataset, percentile, and date.

## Delivery sequence

1. Prototype-faithful shell slice: Home, Cases, Brief, Evidence E-04, Context Lens.
2. Finish packaged Electron observations and Tauri comparator; decide or explicitly defer host.
3. Renderer and canvas/operation ADRs.
4. Identity, recovery, five-page onboarding, workspace switching, draft recovery.
5. Cases, Story Field, Brief.
6. Evidence foundation and CaseFind import.
7. Space and structured outline.
8. AI copilot and Research.
9. Work, Room, collaboration, and notifications.
10. Reports and professional consultation package.
11. Premium marketplace, booking, payment, refunds, and reviews.
12. Signing, updater/rollback, security/accessibility audits, disaster recovery, beta migration, and staged release.

## V1 and later

V1 excludes native voice/video, broad private connectors, background collection, 3D, required sound, mobile apps, autonomous external/destructive actions, outcome prediction, and unqualified worldwide coverage. V2+ may consider selected connectors, native calls, optional spatial/3D modes, opt-in sound, mobile capture, advanced jurisdiction packs, richer temporal/entity analysis, enterprise controls, and permitted filing integrations only through explicit scope review.

## Where detail lives

- Page behavior: `docs/product/page-specifications.md`
- Page placement and V1/future matrix: `docs/product/page-and-feature-matrix.md`
- Space and AI: `docs/product/board-and-ai-copilot.md`
- Collaboration and marketplace: `docs/product/collaboration-and-lawyer-marketplace.md`
- Visual baseline: `docs/design/approved-application-system.md`
- UX and copy: `docs/design/ux-quality-bar.md`
- Domain: `docs/engineering/domain-model.md`
- Architecture: `docs/engineering/target-architecture.md`
- Quality: `docs/engineering/quality-standard.md`
- Exact visual routes: `handoff/APPROVED-SCREEN-CATALOG.md`
- Current truth and next action: `HANDOFF.md` and `handoff/CURRENT-STATE-AND-NEXT-STEPS.md`

This file is a map, not a substitute for those contracts.