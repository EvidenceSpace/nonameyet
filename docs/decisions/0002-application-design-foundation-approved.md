# ADR 0002: approve the connected application design foundation

- **Status:** Accepted
- **Date:** 30 August 2026

## Context

Early concepts were rejected for looking disconnected, overly dark, congested, generic, or infeasible. The product then moved through a light-first Signal Field/Case Space direction and page-by-page review covering Home, Cases, Story Field, Brief, Space, Evidence, Research, Work, Room, Reports, lawyer discovery/profile/booking, authentication, five-page onboarding, notifications, and Settings.

A connected route map and 37-route review prototype demonstrated end-to-end continuity. The user approved the main design and idea while identifying minor bar, tab and connection defects to fix during implementation.

## Decision

Adopt the system in `docs/design/approved-application-system.md` and the information architecture in `docs/product/information-architecture.md` as the production design target.

The case lenses are exactly:

**Brief → Space → Evidence → Research → Work → Room → Reports**

Evidence and Research remain separate. Work remains first-class. AI remains contextual and approval-gated rather than becoming a separate destination. The global Bell owns unread count. Overlay notification drawers preserve origin; dedicated routes own their context. Account creation precedes five-step onboarding; the first story belongs to New Case.

## Consequences

- Production work may begin after CI truth and measured ADR spikes.
- Screenshot coordinates are references, not code architecture.
- Shared shell components must eliminate bar/tab drift.
- Route and visual regression tests must cover active states and exact-object return.
- Accessibility, localization, platform conventions and performance may justify scoped changes.
- Small review defects are logged as design debt, not an invitation to replace the overall direction.
- The marketing site remains deferred.

## Rejected alternatives

- one highly concentrated dashboard;
- generic AI chat as the primary creation experience;
- a permanently dark evidence-board aesthetic;
- disconnected page mockups without canonical objects/backlinks;
- copying Notion, GitHub or Cursor rather than reaching their product-specific quality level;
- 3D, sound, native calls, broad connectors or mobile in V1;
- autonomous AI workspace mutation.

## Migration and rollback

CaseFind remains current until target vertical slices replace proven behavior. If implementation evidence invalidates a pattern, create a scoped ADR describing the measured issue, affected surfaces, migration, rollback and updated tests. Rollback means returning to the last accepted component/route contract—not to an unrelated rejected concept.
