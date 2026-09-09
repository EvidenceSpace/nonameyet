# EvidenceSpace

EvidenceSpace is a source-backed case workspace for self-represented people,
legal professionals, educators, students, and invited collaborators.

**Status:** private prototype and migration work. The repository now contains
the first connected EvidenceSpace product slice alongside the older CaseFind
implementation. Neither surface is a production legal service.

EvidenceSpace helps people:

- preserve original source material and provenance;
- organize evidence, research, questions, tasks, discussions, and reports around
  one case;
- keep contrary material and uncertainty visible;
- use AI as a reviewable proposal, never as silent authority;
- move through one stable workspace instead of disconnected tools.

## Current runnable surfaces

### Connected EvidenceSpace slice

Run:

```bash
npm run preview
```

Open `web/evidencespace-shell.html?route=home` from the preview server.

The connected slice currently implements:

- Home;
- the Cases library;
- Case `C-03` Brief;
- Evidence `E-04` and its original-source review surface;
- the shared Context Lens;
- exact-object Back/Forward continuity;
- loading, empty, denied, error, narrow-window, dark, reduced-motion, and
  forced-colors behavior.

The route shell also exposes honest foundations for the remaining global pages
and case lenses. Those foundations are navigation contracts, not finished
product pages.

This slice uses synthetic fixtures. It does **not** provide production
authentication, persistence, collaboration, evidence ingestion, AI execution, or
legal advice. Preview confirm/correct controls change only the browser session
and say so in the interface.

### CaseFind migration asset

Run:

```bash
npm start
```

CaseFind remains runnable because it contains trust-critical behavior that the
new interface has not replaced yet, including local case persistence,
original-byte integrity checks, processing integrity, review transitions,
timeline behavior, export/report work, deletion, and recovery paths.

Do not delete CaseFind merely because it uses the earlier product name. Migrate
its proven invariants deliberately, with tests and rollback.

## Canonical design baseline

The connected prototype remains preserved at:

- [`design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`](design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html)
- [`design-prototypes/prototype-routes.json`](design-prototypes/prototype-routes.json)

It contains 37 named 1920×1080 source screens. The first connected slice is
visually anchored to screens 7, 8, 10, 11, and 12. Only eight source screens
have received individual route-level review so far; do not claim full visual QA
for the other 29.

Preservation references:

- repository blob: `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`;
- normalized SHA-256:
  `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`.

Do not reformat or casually replace the canonical HTML.

## Repository map

- `web/evidencespace-shell.*` — persistent application shell, route model,
  tokens, and responsive presentation.
- `web/evidencespace-pages/` — lazy-loaded page modules and synthetic fixtures
  for the connected slice.
- `web/` — CaseFind browser implementation and migration assets.
- `src/` — domain, AI, processing, report, and supporting TypeScript modules.
- `tests/` — deterministic, browser, security, contract, and migration-oriented
  checks.
- `design-prototypes/` — canonical visual source material.
- `docs/` — product, architecture, security, privacy, accessibility, operations,
  and decision records.
- `handoff/` — current state, next steps, and durable session history.
- `AGENTS.md` — mandatory repository instructions for contributors and agents.

## Product direction

The accepted structure is one connected application with addressable pages:

- global: Home → Cases → New case → Lawyers → Notifications → Settings →
  Security and help → Account;
- inside a case: Brief → Space → Evidence → Research → Work → Room → Reports;
- core loop: capture → preserve → organize → understand → decide → act → review.

Current and Target V1 behavior must stay separate. Future ideas belong in
future-state documentation, not in current-product claims.

## Interface quality

EvidenceSpace must feel intentionally made for the work:

- use familiar, human vocabulary;
- remove or shorten copy before shrinking type;
- keep headings proportional and helper text readable;
- create hierarchy through proportion, spacing, alignment, typography, and
  meaningful states;
- prefer a few clear actions over card density;
- keep motion restrained, causal, performant, and compatible with reduced
  motion;
- avoid ornamental AI imagery, arbitrary gradients, glass everywhere, filler
  cards, and animation for its own sake.

Refine the approved prototype. Do not replace it with a generic dashboard
aesthetic.

## Trust rules

Treat the repository as a private prototype:

- do not commit real client material, credentials, transcripts, private
  screenshots, or identifying fixtures;
- do not claim legal certainty, security guarantees, accessibility conformance,
  performance, platform support, or production readiness without evidence;
- keep sources, contrary material, uncertainty, freshness, jurisdiction,
  provenance, visibility, approval, and recovery visible;
- keep AI output distinguishable from user-accepted material;
- do not publish GitHub Pages or another public deployment without explicit
  visibility approval.

See [`SECURITY.md`](SECURITY.md),
[`docs/privacy-security.md`](docs/privacy-security.md), and
[`docs/ai-safety-and-evaluation.md`](docs/ai-safety-and-evaluation.md).

## Quality commands

Run the checks that apply to your change and report what actually ran:

```bash
npm run check:dependencies
npm run check:workflow-actions
npm run sync:pdfjs
npm run check:docs
npm run typecheck
npm test
npm run test:browser
npm run check
```

`tsconfig.json` covers `src/**/*.ts`; it does not prove the browser shell,
tests, scripts, or server are typechecked.

## Continuity

Start with:

- [`HANDOFF.md`](HANDOFF.md)
- [`handoff/CURRENT-STATE-AND-NEXT-STEPS.md`](handoff/CURRENT-STATE-AND-NEXT-STEPS.md)
- [`handoff/SESSION-LEDGER.md`](handoff/SESSION-LEDGER.md)

Update continuity documents whenever implementation truth, evidence, or the next
weakest area changes.

## License

[MIT](LICENSE)
