import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const workflowsDirectory = fileURLToPath(new URL("../.github/workflows/", import.meta.url));
const immutableCommit = /^[0-9a-f]{40}$/;
const workflowFiles = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (/\.ya?ml$/i.test(entry.name)) workflowFiles.push(path);
  }
}

await collect(workflowsDirectory);
if (workflowFiles.length === 0) {
  console.error("Workflow action pinning policy failed: no workflow files found.");
  process.exit(1);
}

const failures = [];
let externalActionCount = 0;
for (const file of workflowFiles) {
  const lines = (await readFile(file, "utf8")).split("\n");
  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/);
    if (!match) continue;
    const action = match[1];
    if (action.startsWith("./")) continue;
    externalActionCount += 1;
    const separator = action.lastIndexOf("@");
    const revision = separator === -1 ? "" : action.slice(separator + 1);
    if (!immutableCommit.test(revision)) failures.push(`${relative(process.cwd(), file)}:${index + 1} must pin ${action} to a full commit SHA`);
  }
}

if (failures.length) {
  console.error("Workflow action pinning policy failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Workflow action pinning policy passed for ${externalActionCount} external actions.`);
