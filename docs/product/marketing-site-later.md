# Deferred EvidenceSpace marketing website specification

**Status:** Future—design and implementation begin only after the application has a stable, demonstrable vertical slice.

## Why this exists now

The promotional website was discussed before the application scope was fully defined. The product decision is to build the application first, while preserving the website goals and creative direction so a later team or agent does not restart discovery or build a generic landing page.

This document is a brief, not evidence that the website exists.

## Outcomes

The website should:

- explain EvidenceSpace in language appropriate to individuals and professionals;
- demonstrate the capture → organize → understand → decide → act → review loop;
- show how the 2D board, evidence provenance, AI copilot, Room, reports, and Premium lawyer marketplace work;
- explain trust, privacy, jurisdiction, AI limits, and professional-help boundaries;
- offer verified Windows and macOS downloads when builds are actually available;
- present plans and pricing without manipulative pressure;
- provide support, product education, accessibility information, security contact, and feedback;
- publish release notes and current platform status; and
- convert qualified visitors without overstating current functionality.

## Audience paths

The same site serves multiple audiences through progressive detail:

- an individual trying to understand and organize a matter;
- a lawyer or legal team evaluating professional workflows;
- an investigator or reviewer connecting material;
- a student or educator exploring a labeled simulation; and
- an organization assessing permissioned collaboration.

Do not force a persona choice before visitors can understand the product. Audience selection may personalize examples, terminology, and calls to action without changing core claims.

## Proposed information architecture

1. **Home** — concise promise, interactive product story, trust boundary, current availability, and primary call to action.
2. **Product** — Case Home, 2D Board, Evidence, Web Research, AI, Room, Reports, and professional-help overview.
3. **How it works** — a source-linked case journey from intake through reviewed action.
4. **AI copilot** — Ask, Analyze, Plan, Research, Act, citation shape, approvals, memory, and limitations.
5. **Collaboration** — Room, roles, private/shared distinction, tasks, decisions, and audit.
6. **Find a Lawyer** — Premium discovery, verification, booking, selective sharing, and representation boundaries.
7. **Trust center** — privacy, security architecture, provenance, responsible AI, accessibility, jurisdiction handling, uptime/status, and vulnerability reporting.
8. **Pricing** — free/paid entitlements only after commercial decisions are approved; separate subscription from lawyer fees.
9. **Download** — signed Windows/macOS installers, requirements, checksum/signing guidance, release notes, and update policy.
10. **Resources** — tutorials, product guides, glossary, case-organization education, and lawful use guidance.
11. **Support and feedback** — searchable help, contact paths, incident/support status, feature feedback, and complaint/escalation routes.
12. **Legal** — terms, privacy notice, AI disclosures, marketplace terms, accessibility statement, cookie/analytics choices, and jurisdiction-specific notices.

Do not publish empty routes merely to appear complete. A focused launch site is better than a large collection of placeholder pages.

## Creative direction

The user wants an unusually polished, immersive, animated, and engaging experience using strong typography, imagery, video, and potentially three-dimensional storytelling.

A suitable narrative concept is **“Enter the case space”**:

- scattered fragments begin as files, messages, dates, and images;
- scrolling or deliberate interaction organizes them into a legible evidence map;
- source lines, timeline events, contrary material, and tasks appear in sequence;
- AI suggestions remain visibly provisional until a user approves a preview; and
- the final scene becomes a calm, structured workspace rather than a dramatic verdict.

This concept is directional, not a locked design. Conduct brand and usability exploration before production.

The site may take inspiration from the quality level of leading interactive experiences, but must not copy another company’s code, layout, motion sequence, assets, language, or visual identity.

## Visual and motion principles

- Calm authority before spectacle.
- Dark or cinematic sequences may be used, but reading surfaces maintain excellent contrast and restraint.
- Motion explains transformation, relationship, progress, or navigation.
- No celebratory treatment of allegations, criminal charges, personal conflict, or case outcomes.
- Avoid fake court imagery, gavels, police tape, generic scales-of-justice clichés, and sensational stock photography.
- Generated images or video must be licensed/owned, reviewed for misleading legal context, and never resemble a real person or case without permission.
- Product UI shown in marketing must match a real build or be clearly labeled concept/prototype.
- Every animated sequence has a reduced-motion equivalent and meaningful static composition.
- Audio is opt-in, muted by default, and never required.

## Interaction model

- The main story should remain understandable without scrolling tricks, WebGL, sound, or video autoplay.
- Interactive product simulations use synthetic cases only and visibly label sample data.
- Visitors can skip the immersive sequence and navigate directly to product details, trust, pricing, download, or support.
- Keyboard and assistive-technology paths receive the same information and calls to action.
- Focus, history/back behavior, deep links, and page titles remain correct despite transitions.
- Do not trap scrolling or pointer input.

## Performance and resilience

Set measurable budgets before implementation. At minimum:

- meaningful text and primary navigation render without the animation bundle;
- route content remains usable when JavaScript, WebGL, video, or third-party services fail;
- media uses responsive formats, explicit dimensions, lazy loading, and bandwidth-aware alternatives;
- no large animation downloads before intent is shown;
- Core Web Vitals are measured on representative mobile and desktop hardware even though the product itself targets desktop;
- content works at 200% zoom and supports reduced motion, high contrast, and screen readers; and
- support, download, privacy, and security routes remain available independently of marketing effects.

## Content and claims standard

Every capability is labeled as one of:

- available now;
- preview/beta;
- planned; or
- future exploration.

Never claim that EvidenceSpace:

- gives legal advice or replaces a licensed lawyer;
- predicts outcomes, guilt, liability, authenticity, admissibility, or success;
- verifies every lawyer worldwide;
- offers worldwide legal coverage;
- has end-to-end encryption if server-side processing requires plaintext;
- securely stores data without naming the implemented controls and evidence; or
- supports Windows/macOS until signed packaged builds were verified on those platforms.

Show citations or linked evidence for security certifications, accessibility audits, marketplace verification, performance, and reliability claims.

## AI on the website

A public product-assistant experience may answer product and documentation questions, but it must not become a public substitute for the case copilot.

- Do not accept sensitive case evidence into the marketing assistant.
- Route existing users to the authenticated application for case work.
- State what context is used and retained.
- Source answers from current published product/help content.
- Refuse unsupported legal analysis and avoid collecting privileged/confidential details.
- Escalate account, safety, billing, privacy, and marketplace complaints to appropriate support paths.

## Downloads and release integrity

The Download page launches only when:

- signed Windows and macOS packages exist;
- package hashes/signing and supported OS requirements are published;
- update, rollback, uninstallation, data-location, and recovery behavior are documented;
- release notes map to the shipped build;
- security and support contacts are active; and
- download analytics do not expose private case or account information.

## Support and feedback

Support includes:

- product help and onboarding guides;
- account and subscription support;
- privacy/data-access/deletion requests;
- security and vulnerability reporting;
- marketplace complaints and lawyer-verification disputes;
- accessibility feedback;
- service-status communication; and
- feature feedback tied to user outcome rather than vote-count popularity alone.

Urgent legal or safety needs should point to appropriate public/emergency/legal-aid resources without implying EvidenceSpace provides emergency representation.

## Analytics and experimentation

- Collect the minimum event data needed for product and conversion decisions.
- Never send case titles, filenames, case text, prompts, AI answers, legal-search queries, contact details, conflict-screening data, payment credentials, or download tokens to general analytics.
- Respect consent and regional privacy requirements.
- Avoid dark-pattern experiments, artificial scarcity, countdowns, fake social proof, hidden sponsorship, and confusing cancellation.
- Optimize for comprehension, qualified activation, successful download, and support resolution—not time-on-site alone.

## Readiness gate

Do not begin full website production until all are true:

1. At least one representative application journey is implemented and visually stable.
2. Product naming, brand foundation, screenshots/demo policy, and current/future claims are approved.
3. Windows/macOS availability language matches real packaged evidence.
4. Trust, privacy, legal, marketplace, and AI disclosures have owners.
5. Support and feedback operations have real destinations and response expectations.
6. Performance, accessibility, browser, motion, content, analytics, and security acceptance criteria are written.
7. The website cannot delay the next critical application vertical slice.

## Future deliverables

When the gate is met, create:

- a website-specific research and competitor-quality review;
- brand and content strategy;
- sitemap and conversion model;
- low-fidelity flow artifact;
- high-fidelity desktop/mobile design artifact;
- motion storyboard and reduced-motion storyboard;
- design tokens shared appropriately with—but not coupled to—the desktop client;
- content inventory and claims ledger;
- performance/accessibility threat and test plan;
- implementation ADR; and
- launch, rollback, measurement, and maintenance plan.
