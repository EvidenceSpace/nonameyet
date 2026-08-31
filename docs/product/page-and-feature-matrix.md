# Page and feature implementation matrix

**Status:** Target V1 unless marked Future or Decision required.  
**Canonical navigation:** Brief → Space → Evidence → Research → Work → Room → Reports.

Each page implementation must cover loading, empty, populated, partial, stale, read-only, permission-denied, reconnecting, cancelled, error and recovery states as relevant. Drafts survive recoverable failure.

## Access and onboarding

| Surface | Primary outcome | Required content/actions | AI | Access/data | Future |
| --- | --- | --- | --- | --- | --- |
| Welcome/auth/recovery | enter or recover safely | create account, sign in, passkey/OIDC decision, recovery, product/privacy boundary | product help only | no case leakage before authorization | enterprise SSO admin |
| Profile | establish identity/preferences | display name, username, age only if justified, language, time zone, use type | explain fields | private by default; separate public/case identity | organization policy profiles |
| Legal context | set suggestions | nationality where justified, country, state/region, default jurisdiction | explain; never silently infer case jurisdiction | account default only | jurisdiction packs |
| Guidance | set explanation style | experience, terminology, depth, skeptical posture | truth/source rules invariant | private preference | specialist presets |
| Accessibility | control experience | motion, contrast, density, readability, keyboard support | no effect on truth | durable global setting | platform-specific assistive profiles |
| First case readiness | leave onboarding | review preferences, enter workspace, start case | optional next-step explanation | no story captured here | workspace templates |

## Global workspace

| Surface | Primary outcome | Required content/actions | AI | Permissions | Acceptance |
| --- | --- | --- | --- | --- | --- |
| Global Home | know what needs attention across cases | active matters, today, recent work, invitations, processing/security issues, quick start | cross-case summaries only with explicit authorized scope | never leak restricted titles in cards/notifications | one clear next action; not a second Brief |
| Cases | find/manage a case | search, filters, active/archived/invited, create, archive/restore/delete | suggest organization only | request-access path without title leak | lifecycle is recoverable and audited |
| New Case Story Field | turn narrative into reviewed case draft | user-owned narrative, people/dates/amounts/goals, questions, manual fallback, jurisdiction/type review, create | extraction is proposed; no permanent generic chat | private draft until creation/share | interruption restores draft; user can create without AI |

## Case lenses

| Lens | Owns | Main actions | AI behavior | Cross-links |
| --- | --- | --- | --- | --- |
| Brief | reviewed case understanding | review situation, progress dimensions, deadlines, unknowns, contrary material, activity, next step | cited briefing and one justified next step; no win score | every claim links to Evidence/Research/Work |
| Space | visual organization and relations | pan/zoom, add/move/group/frame/lock, connect, timeline, tasks, comments, history, outline | ghost proposals only; show sources/destination/impact/recovery | cards open canonical objects in other lenses |
| Evidence | original and derivatives | upload/capture, inspect original/hash/version/locators, review extraction, tag, permissions, delete consequences | extraction/claims provisional | backlinks to Space, Brief, Work, Room, Reports |
| Research | legal/factual source ledger | search, authority/freshness/jurisdiction, save excerpt/archive, cite, compare | show steps, primary sources and limitations | saved research is not user evidence by default |
| Work | action and requested information | task title/status/priority/assignee/deadline/instructions/requested source, checklist, dependencies | proposals marked NOT APPLIED | links to every supporting object/thread |
| Room | human collaboration | messages, threads, mentions, reactions, pins, decisions, presence, drafts, conversions | labelled shared Case AI; never impersonate people | deep links to object and return to thread |
| Reports | reviewed outputs | manifest, sections, inclusion, disputed/stale/private state, redaction derivative, versions, approve/export | may draft; cannot approve/export/send | every included claim resolves to source |

## Space object families

Evidence cards; research cards; people/organizations/locations; events with confirmed/estimated/disputed dates; issue tracks using case-appropriate terms; Work tasks; sticky notes; text; shapes; photo frames; licensed visual elements; markers; labels; groups; stacks; frames; timeline elements; typed semantic connectors.

Typed connectors include supports, contradicts, mentions, occurred before/after, communicated with, belongs to, located at, requires, and assigned to. A line without an accepted type is visual-only.

## Collaboration and attention

| Surface | Required behavior | Boundary |
| --- | --- | --- |
| Invitations/members | owner/admin/editor/reviewer/guest, scope, expiry, revoke, access preview | workspace membership ≠ case access |
| Shared Case AI | authorized shared history and source-linked summaries | private AI never appears automatically |
| Notifications | badge, focused toast, privacy-safe OS notice, drawer, View All, exact-object return | unsafe channels never contain case title/filename/quote |
| Workspace history | proposal, approval, execution, correction, sharing, permission and recovery receipts | Undo never deletes receipt |

Native voice/video is Future. V1 collaboration is primarily text, threads, comments, presence and secure previews.

## Professional support and payments

| Surface | Required V1 behavior | Safety/operations |
| --- | --- | --- |
| Find a Lawyer | Premium search/filter/compare, relevance vs sponsored disclosure, Saved and Bookings | essential emergency/public-aid guidance not blocked by Premium |
| Lawyer Profile | verified license scope/source/date, jurisdiction, services, languages, pricing, availability, rating/review methodology, disclosures | revalidation, suspension and appeal paths |
| Booking | consultation type, slot hold, timezone, request/accept/decline/reschedule, policy | concurrency-safe and idempotent |
| Conflict screening | minimum necessary parties/matter data | never reveal another client |
| Selective sharing | recipient, six-or-other selected objects, permission, expiry, downloads, redaction, preview | whole workspace never shared by default |
| Payment | separate consultation ledger, provider intent, webhooks, reconciliation, cancellation/refund/dispute | payment ≠ access; prevent double charge/booking |
| Reviews | completed verified-booking eligibility, moderation, response and appeal | no unverified review inflation |

Synthetic booking review values—B-07, £75, six items, zero downloads, View + comment, 8 Sep 2026—are examples only.

## Settings

| Category | Contents |
| --- | --- |
| Profile & identity | account identity, public/case-visible previews, language/time zone |
| Legal defaults | country/region/default jurisdiction; existing cases unchanged |
| Personalization | System/Light/Dark, density, typography and accessibility |
| AI & guidance | explanation depth, memory controls, private/shared defaults; truth invariant |
| Notifications | type, channel, mute, sound/attention, privacy-safe preview; no unread badge |
| Privacy & sharing | defaults, download rules, recipients, data export/deletion |
| Security | sessions, passkeys/MFA decision, recovery, devices, encryption claims |
| Workspace & members | memberships, roles, invitations; no automatic case access |
| Connections | explicit scopes/status/revoke; broad connectors Future |
| Workspace history | attributable receipts and recovery links |
| Billing | Premium plan, usage/invoices/cancel; lawyer fees separate |
| Help & support | product support, education, urgent safety, professional help separated |

## Data and state requirements

Every canonical object has ID, workspace/case scope, revision, creator/editor attribution, timestamps, visibility, lifecycle state, audit references and authorization policy. Source-backed objects additionally carry original/derivative identity, locator and freshness/staleness state.

## Analytics

Measure task completion, recovery, correction/rejection, source opening, time to first meaningful organization, collaboration handoff and support need using privacy-safe event metadata. Never send case titles, filenames, text, prompts, responses, participant names, source excerpts, tokens or payment credentials.

## Implementation rule

Do not build isolated screenshots. Each vertical slice includes domain/state, storage/migration, API, authorization, UI states, accessibility, tests/evaluations, telemetry, docs and rollback. The current prototype is mined for proven behavior, not copied wholesale into the target shell.
