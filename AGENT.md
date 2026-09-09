# EvidenceSpace agent entry point

Some tools look for `AGENT.md`; the canonical repository-wide instructions are in [`AGENTS.md`](AGENTS.md).

Before changing anything, read in this order:

1. [`AGENTS.md`](AGENTS.md)
2. [`handoff/00-START-HERE.md`](handoff/00-START-HERE.md)
3. [`HANDOFF.md`](HANDOFF.md)
4. [`handoff/IMPLEMENTATION-COMPENDIUM.md`](handoff/IMPLEMENTATION-COMPENDIUM.md)
5. [`handoff/APPROVED-SCREEN-CATALOG.md`](handoff/APPROVED-SCREEN-CATALOG.md)
6. [`handoff/REPOSITORY-CONTINUITY-PROTOCOL.md`](handoff/REPOSITORY-CONTINUITY-PROTOCOL.md)
7. [`docs/README.md`](docs/README.md) and the relevant product, design, engineering, security, and ADR contracts
8. current code, tests, open pull requests, exact-head CI, and the intended vertical slice

## Operating promises

- **Refine, do not redesign.** The approved 37-screen prototype is the visual and workflow baseline. Inspect the exact source screen before altering a surface.
- Make the product feel intentionally human-designed: familiar words, short copy, restrained type, purposeful hierarchy, and only useful motion.
- Do not replace the approved character with generic dashboard cards, arbitrary gradients, glass effects, AI-generated decoration, or animation for its own sake.
- Keep Current, Partial, Target V1, Future, and Decision required distinct. Never claim a screenshot, fixture, test, or source file proves unobserved behavior.
- Treat documentation as living continuity. Every material decision, changed contract, merged slice, newly observed limitation, or reordered next step updates the canonical document and handoff in the same pull request.
- Durable tests belong with the code on `main`. Temporary packages, recordings, traces, observations, private screenshots, and machine-specific output do not.

Do not duplicate or weaken the rules in `AGENTS.md`. The approved design system is a target until implemented and verified.