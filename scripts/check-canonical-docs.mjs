import { access, readFile } from "node:fs/promises";

const required = [
  "AGENTS.md", "AGENT.md", "HANDOFF.md", "handoff/00-START-HERE.md",
  "handoff/CONVERSATION-AND-DECISIONS.md", "handoff/CURRENT-STATE-AND-NEXT-STEPS.md",
  "handoff/NEXT-AGENT-OPERATING-BRIEF.md", "handoff/SESSION-LEDGER.md",
  "handoff/assets/README.md", "handoff/assets/MOTION-STATUS.md",
  "docs/README.md", "docs/product/information-architecture.md",
  "docs/product/page-and-feature-matrix.md", "docs/product/roadmap.md",
  "docs/design/approved-application-system.md",
  "docs/engineering/next-phase-readiness.md",
  "docs/engineering/quality-pass-checklist.md",
  "docs/decisions/0002-application-design-foundation-approved.md",
  "design-prototypes/evidencespace-connected-application-map.html",
  "design-prototypes/connected-navigation.json", "design-prototypes/prototype-routes.json"
];
for (const file of required) await access(file);
const texts = await Promise.all(required.filter(f => !f.endsWith('.json')).map(f => readFile(f, 'utf8')));
const joined = texts.join('\n');
const exactLenses = 'Brief → Space → Evidence → Research → Work → Room → Reports';
const failures = [];
if (!joined.includes(exactLenses)) failures.push('canonical seven-lens order is missing');
for (const phrase of ['Payment does not grant case access','Workspace membership does not grant case access','design foundation approved','NOT APPLIED','first story']) {
  if (!joined.toLowerCase().includes(phrase.toLowerCase())) failures.push(`required contract phrase missing: ${phrase}`);
}
for (const forbidden of ['/data/', 'file://', 'thread://', 'session://', 'TODO_REPLACE', 'PLACEHOLDER']) {
  if (joined.includes(forbidden)) failures.push(`machine/private/placeholder text found: ${forbidden}`);
}
const navigation = JSON.parse(await readFile('design-prototypes/connected-navigation.json', 'utf8'));
const routeContract = JSON.parse(await readFile('design-prototypes/prototype-routes.json', 'utf8'));
const expected = ['Brief','Space','Evidence','Research','Work','Room','Reports'];
if (JSON.stringify(navigation.caseLenses) !== JSON.stringify(expected)) failures.push('connected-navigation.json has the wrong case-lens order');
if (routeContract.routeCount !== 37 || routeContract.routes?.length !== 37) failures.push('prototype-routes.json must contain 37 routes');
if (failures.length) {
  console.error('Canonical documentation check failed:\n' + failures.map(x => `- ${x}`).join('\n'));
  process.exit(1);
}
console.log(`Canonical documentation check passed for ${required.length} required files and ${routeContract.routes.length} routes.`);
