# Information architecture

## Goals

The navigation must keep a complex product understandable. Users should always know:

- which workspace and case they are in;
- whether they are looking at global or case-specific content;
- what the AI can currently see;
- what is shared, private, suggested, or confirmed; and
- how to return to the board or next recommended action.

## Desktop app shell

### Global rail

Persistent at normal desktop widths; collapsible at narrow widths.

1. **Home** — cross-case overview and recent work.
2. **Cases** — searchable case library.
3. **Find a Lawyer** — Premium marketplace and bookings.
4. **Notifications** — mentions, assignments, deadlines, approvals, bookings, and system alerts.
5. **Help** — product guidance, support, feedback, and status.
6. **Profile / workspace switcher** — identity, plan, preferences, organizations, and sign out.

A prominent **New case** action remains available without competing with in-case actions.

### App title bar

- workspace name and switcher;
- current page or case breadcrumb;
- global search / command menu;
- synchronization and connection state;
- notifications;
- member avatars where relevant; and
- native window controls supplied by the desktop shell.

## Case shell

Inside a case, the local navigation is:

1. **Home** — overall situation, progress dimensions, next step, deadlines, recent activity, and AI briefing.
2. **Board** — primary visual workspace and evidence organization surface.
3. **Room** — team chat, decisions, shared AI, tasks, and presence.
4. **Reports** — reviewed summaries, timelines, evidence index, research, and exports.
5. **Case settings** — members, roles, jurisdiction, retention, integrations, billing context, archive, and deletion.

The AI copilot is a persistent right-side panel available from Home, Board, Room, and Reports. It is not a separate destination that loses the user’s location.

## Board layout

- **Top toolbar:** case title, board/view switcher, search, share, member presence, history, presentation, and contact-a-lawyer shortcut.
- **Left tool rail:** Select, Uploads, Evidence, Elements, Web Research, Timeline, Tasks, Text, Draw, Connect, and Frames.
- **Library drawer:** opens from the selected left tool and is resizable/collapsible.
- **Center canvas:** infinite 2D board with frames, nodes, edges, groups, and viewport history.
- **Right panel:** AI, Properties, Comments, and Activity tabs.
- **Bottom controls:** zoom, minimap, fit selection, focus mode, outline/list view, and help shortcuts.

The left drawer and right panel cannot both force the canvas below its usable minimum width. At constrained widths, one overlays and focus returns predictably when closed.

## Route and deep-link model

Exact route syntax is an implementation decision, but every durable object needs a shareable, permission-checked deep link:

- workspace;
- case;
- board and viewport/frame;
- evidence item and source locator;
- entity, event, issue track, task, message, report, research source;
- lawyer profile and booking.

Opening a deep link never bypasses membership or field-level access. If access is missing, show the object type and a safe request-access path without leaking title or content.

## Page inventory

| Surface | Target V1 | Later |
| --- | --- | --- |
| Welcome, sign in, account recovery | Yes | Enterprise SSO administration |
| Adaptive onboarding and profile | Yes | Organization policy templates |
| Global Home | Yes | Portfolio analytics |
| Cases library | Yes | Advanced saved searches |
| AI-guided case creation | Yes | Community/template marketplace |
| Case Home | Yes | Configurable dashboard layouts |
| 2D Board | Yes | Optional 3D mode and spatial audio cues |
| Evidence and source viewer | Yes | Advanced forensic adapters |
| Web Research | Yes | Private connectors and monitoring |
| Room and comments | Yes | Native voice/video calls |
| Reports and exports | Yes | Filing/portal integrations where permitted |
| Find a Lawyer, profiles, booking | Yes, staged | In-app calls and formal engagement workflows |
| Notifications | Yes | Cross-channel notification connectors |
| Settings, privacy, billing, support | Yes | Enterprise administration |

## Global search and command menu

Search must respect permissions and distinguish objects by case and type. Commands may navigate or propose actions, but destructive commands still require the normal confirmation flow.

Example results:

- case;
- evidence filename or extracted text hit;
- person/entity;
- event;
- task;
- message;
- research source;
- report; and
- lawyer profile.

## Naming rules

- Use **Web Research**, not “Discover,” inside a case; “discovery” has a formal legal meaning in many jurisdictions.
- Use **Find a Lawyer** for the marketplace.
- Use **Room** for the collaborative case space.
- Use **AI finding** or **suggestion**, not “fact,” until accepted by a user.
- Use case-specific terms for charges, claims, remedies, complaints, and educational theories.

## Empty-state navigation

Every page offers one clear first action:

- Home with no cases → Create first case.
- Empty case → Continue AI intake or add evidence.
- Empty board → Choose a starter layout, upload evidence, or begin blank.
- Empty Room → Invite a member or start a shared thread.
- Empty Reports → Review prerequisites and create a draft.
- No lawyer results → adjust filters, request matching support, or show verified external resources where permitted.