import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";

const prototypePath =
  "design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html";
const expectedPrototypeSha256 =
  "676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807";
const expectedRouteIds = [
  "auth",
  "onboarding-profile",
  "onboarding-legal",
  "onboarding-guidance",
  "onboarding-accessibility",
  "onboarding-first-case",
  "home",
  "cases",
  "new-case",
  "brief",
  "space",
  "evidence",
  "research",
  "work",
  "room",
  "reports",
  "lawyers",
  "lawyer-profile",
  "booking",
  "notification-arrival",
  "notification-windows",
  "notification-drawer",
  "notifications",
  "settings-profile",
  "settings-legal",
  "settings-system-theme",
  "settings-dark-theme",
  "settings-accessibility",
  "settings-ai",
  "settings-notifications",
  "settings-privacy",
  "settings-security",
  "settings-workspace",
  "settings-connections",
  "settings-history",
  "settings-billing",
  "settings-support",
];

const required = [
  "AGENTS.md",
  "AGENT.md",
  "HANDOFF.md",
  "handoff/00-START-HERE.md",
  "handoff/APPROVED-SCREEN-CATALOG.md",
  "handoff/CONVERSATION-AND-DECISIONS.md",
  "handoff/CURRENT-STATE-AND-NEXT-STEPS.md",
  "handoff/IMPLEMENTATION-COMPENDIUM.md",
  "handoff/NEXT-AGENT-OPERATING-BRIEF.md",
  "handoff/REPOSITORY-CONTINUITY-PROTOCOL.md",
  "handoff/SESSION-LEDGER.md",
  "handoff/assets/README.md",
  "handoff/assets/MOTION-STATUS.md",
  "docs/README.md",
  "docs/product/information-architecture.md",
  "docs/product/page-and-feature-matrix.md",
  "docs/product/roadmap.md",
  "docs/design/approved-application-system.md",
  "docs/engineering/next-phase-readiness.md",
  "docs/engineering/quality-pass-checklist.md",
  "docs/decisions/0002-application-design-foundation-approved.md",
  prototypePath,
  "design-prototypes/evidencespace-connected-application-map.html",
  "design-prototypes/connected-navigation.json",
  "design-prototypes/prototype-routes.json",
];

for (const file of required) await access(file);

const textFiles = required.filter(
  (file) => !file.endsWith(".json") && file !== prototypePath,
);
const texts = await Promise.all(textFiles.map((file) => readFile(file, "utf8")));
const joined = texts.join("\n");
const failures = [];
const exactLenses = "Brief → Space → Evidence → Research → Work → Room → Reports";

if (!joined.includes(exactLenses)) {
  failures.push("canonical seven-lens order is missing");
}

for (const phrase of [
  "Payment does not grant case access",
  "Workspace membership does not grant case access",
  "design foundation approved",
  "NOT APPLIED",
  "first story",
  "Refine, do not redesign",
  "human-designed",
  "living continuity",
]) {
  if (!joined.toLowerCase().includes(phrase.toLowerCase())) {
    failures.push(`required contract phrase missing: ${phrase}`);
  }
}

for (const forbidden of [
  "/data/",
  "file://",
  "thread://",
  "session://",
  "TODO_REPLACE",
  "PLACEHOLDER",
]) {
  if (joined.includes(forbidden)) {
    failures.push(`machine/private/placeholder text found: ${forbidden}`);
  }
}

const prototypeBytes = await readFile(prototypePath);
const normalizedPrototype = Buffer.from(
  prototypeBytes.toString("utf8").replaceAll("\r\n", "\n"),
  "utf8",
);
const prototypeSha256 = createHash("sha256")
  .update(normalizedPrototype)
  .digest("hex");
if (prototypeSha256 !== expectedPrototypeSha256) {
  failures.push(
    `approved prototype SHA-256 changed: ${prototypeSha256} (expected ${expectedPrototypeSha256})`,
  );
}

const navigation = JSON.parse(
  await readFile("design-prototypes/connected-navigation.json", "utf8"),
);
const routeContract = JSON.parse(
  await readFile("design-prototypes/prototype-routes.json", "utf8"),
);
const expectedLenses = [
  "Brief",
  "Space",
  "Evidence",
  "Research",
  "Work",
  "Room",
  "Reports",
];
if (JSON.stringify(navigation.caseLenses) !== JSON.stringify(expectedLenses)) {
  failures.push("connected-navigation.json has the wrong case-lens order");
}
if (
  routeContract.routeCount !== expectedRouteIds.length ||
  routeContract.routes?.length !== expectedRouteIds.length
) {
  failures.push("prototype-routes.json must contain 37 routes");
} else if (
  JSON.stringify(routeContract.routes.map((route) => route.id)) !==
  JSON.stringify(expectedRouteIds)
) {
  failures.push("prototype-routes.json does not mirror the approved HTML routes");
}

if (failures.length) {
  console.error(
    "Canonical documentation check failed:\n" +
      failures.map((failure) => `- ${failure}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  `Canonical documentation check passed for ${required.length} required files, ${routeContract.routes.length} routes, and prototype ${prototypeSha256}.`,
);
