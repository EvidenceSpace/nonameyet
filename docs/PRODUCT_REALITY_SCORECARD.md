# CaseFind product reality scorecard

Status date: 2026-08-15

This is an engineering and product assessment, not a marketing progress report. Percentages are directional ranges for planning; they are not measured completion metrics.

## Executive view

CaseFind has a credible local-first safety foundation and a surprisingly broad feature set, but it is still an engineering beta rather than a coherent paid product.

- **Core beta scope implemented:** roughly 55–65%.
- **Trustworthy private-beta readiness:** roughly 40–50%.
- **Paid production-product readiness:** roughly 25–35%.
- **Overall progress toward the stated final vision:** roughly 35–45%.

The gap is not mainly “more features.” The largest gap is integration: one clear workflow, one visual and vocabulary system, reliable case-level concurrency, authoritative CI, realistic local testing, and evidence that target users understand and value the product.

## Current score by dimension

| Dimension | Current state | Directional score |
| --- | --- | ---: |
| Product boundary and privacy intent | Explicit uploads, local originals, consent before text-only AI, review-only suggestions, and non-legal boundaries are unusually clear. | 8/10 |
| Core local workflow | Case creation, library, uploads, extraction, review, timeline, report, backup, archive, and deletion exist, but the journey is fragmented. | 6/10 |
| Provenance and timeline integrity | Exact source snapshots, atomic timeline transitions, fail-closed editing, draft preservation, and real IndexedDB coverage are strong. | 8/10 |
| Case-record concurrency | Unconditional case replacement can still overwrite newer data or recreate a deleted case until every caller migrates together. | 4/10 |
| Extraction and AI value | Local extraction and consent boundaries are promising; end-to-end usefulness, model quality, cost, latency, and user confidence are not yet proven. | 5/10 |
| Information architecture and vocabulary | Too many concepts compete: case, draft, collection plan, workspace, record, source, file, fact, suggestion, readiness, and report. | 4/10 |
| Visual design system | First-run and library are improved, but page-scoped override styles do not yet form one maintainable product system. The workspace remains dense and inconsistent. | 4/10 |
| Interaction and motion | Busy, error, dialog, and reduced-motion behavior is improving; there is no coherent motion language or transition model across the product. | 4/10 |
| Accessibility | Good foundations and targeted automated coverage exist, but no complete screen-reader, 200% zoom, high-contrast, Firefox/WebKit, or formal WCAG audit is complete. | 6/10 |
| Reliability and release confidence | Focused failure-path testing is strong. Full integrated checkout, authoritative CI, and broad browser/device evidence are missing. | 4/10 |
| Security and privacy assurance | The architecture minimizes data movement, but formal threat modeling, CSP review, server/provider hardening, dependency audit, and incident/retention operations need completion. | 6/10 |
| Commercial readiness | No proven activation, repeat-use loop, support model, pricing validation, onboarding evidence, or operational readiness. | 2/10 |

## Strongest parts

1. **Product restraint.** The app does not claim to authenticate evidence, decide who is right, predict outcomes, or replace professional advice.
2. **Local-first originals.** Users choose individual files, and original bytes do not silently cross the AI boundary.
3. **Source-linked review model.** Confirmed information and timeline events retain provenance rather than becoming unsupported generated prose.
4. **Failure-path engineering.** The project tests rollback, stale views, deletion races, malformed provenance, duplicate actions, and storage failures instead of only happy paths.
5. **Backup and deletion foundations.** These are essential for a browser-local product and already receive serious attention.

## Weakest parts and why

### 1. Integrated release confidence

Several strong slices live in separate branches and draft PRs. The exact repository Actions failure is unresolved, and no single integrated branch has yet passed the entire authoritative matrix. This is the most important delivery weakness because every other quality claim depends on knowing exactly what was tested together.

### 2. Workspace experience

The workspace carries too many modules and state types at once. It looks and behaves like accumulated feature slices rather than one guided job. New users are asked to understand storage, checklist, extraction, suggestions, consistency, readiness, timeline, and report concepts before the core value is obvious.

### 3. Case-level atomic updates

The timeline boundary is strong, but checklist, case details, archive, backup metadata, and stale-card deletion still need one coordinated exact-current contract. Until this is fixed, stale tabs can cause serious trust failures.

### 4. Vocabulary and product model

Terms are not yet canonical. “Verify a fact” can sound more authoritative than “review and confirm a detail.” “Readiness” can be interpreted as legal or outcome readiness. “Private draft,” “case,” and “collection plan” describe overlapping states. The terminology must match what the product actually guarantees.

### 5. Proven user value

The project has many responsible features, but no evidence yet that freelancers complete the flow faster, understand their situation better, produce a more useful record, or return to maintain a case. Feature breadth is ahead of usability and value validation.

### 6. Visual and interaction coherence

The first-run and library overrides improve typography and density, but duplicate design tokens and page-specific layers will become expensive. The next step is not another isolated stylesheet. It is a small shared design system and a workspace redesign based on the primary task flow.

## Features to question or de-emphasize

- **Accounts before a clear account benefit.** If signing in does not sync, account UI can create expectations without meaningful value.
- **Static percentage-style readiness in marketing.** A “72%” example can appear algorithmically authoritative. Label examples explicitly and avoid legal-sufficiency implications.
- **Hard-coded currency.** A rupee-only amount field is acceptable only if India is the explicit first market; otherwise the model and copy need currency-neutral handling.
- **Generic collection checklist.** It should be framed as an editable starting point, not a complete evidence list.
- **Advanced report polish before workspace clarity.** Reports matter, but improving the daily organize/review loop should precede further export variants.
- **AI breadth before quality evidence.** Keep AI narrow until extraction accuracy, provenance coverage, user correction rate, cost, and latency are measured.

## Canonical vocabulary proposal

- **Case:** the user-created local container.
- **Source:** an explicitly uploaded original file.
- **Extracted text:** local derived content from a source.
- **Suggestion:** AI-proposed information that is not yet accepted.
- **Confirmed detail:** information the user reviewed and accepted or entered manually.
- **Timeline event:** a user-confirmed dated item linked to a source when applicable.
- **Organization progress:** neutral completion guidance; avoid “case readiness” where it could imply legal sufficiency.
- **Case summary:** the user-facing organized output; reserve “report” for an exported document.

## Design and motion direction

- Build one token layer for type, spacing, color, elevation, radius, focus, and motion.
- Use a restrained editorial/workbench aesthetic: high legibility, strong hierarchy, source context always visible, minimal decoration.
- Make the primary next action obvious on every page; secondary modules should progressively disclose.
- Use motion only to explain state: 120–220 ms transitions for panel changes, confirmations, progress, and local insertion/removal.
- Never animate in a way that hides provenance changes, destructive consequences, or recovery text.
- Preserve `prefers-reduced-motion`, keyboard flow, focus restoration, and draft content.

## Build order from here

1. Unblock dependency/CI visibility and establish one green integration baseline.
2. Finish exact-current case transitions and migrate every case writer together.
3. Run the complete local-first journey and package a reproducible local review build.
4. Define canonical vocabulary and simplify the workspace information architecture.
5. Consolidate design tokens/components and redesign the workspace around the next best action.
6. Validate extraction, suggestion review, consent, and provenance with a synthetic benchmark and consenting user sessions.
7. Harden reports, backup/restore, archive/deletion, accessibility, performance, security, and multi-browser behavior.
8. Run a private alpha, measure activation and task completion, then remove or change low-value features before beta.

## Planning timeline

Assuming one focused full-time engineering stream with regular product/design review:

- **Week 1:** local-review branch, CI diagnosis, exact-current case transition integration.
- **Weeks 2–3:** end-to-end workflow verification, canonical vocabulary, information architecture, workspace shell redesign.
- **Weeks 4–5:** upload/extraction/review/consent polish, performance budgets, reliable progress and recovery states.
- **Weeks 6–7:** report, backup, archive/deletion, accessibility, security, and multi-browser hardening.
- **Weeks 8–10:** private alpha with synthetic and consenting test cases; fix blockers and remove confusing features.
- **Weeks 11–14:** beta hardening, operational documentation, deployment and support readiness.
- **Paid-quality product:** likely 4–6 months, depending on user research, provider/runtime work, security review, and how much scope is removed rather than added.

These are planning ranges, not promises. Any unresolved data-loss, provenance, consent, or CI failure takes priority over visual polish and schedule.
