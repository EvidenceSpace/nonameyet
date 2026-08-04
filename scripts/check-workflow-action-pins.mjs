import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const workflowsDirectory = fileURLToPath(new URL("../.github/workflows/", import.meta.url));
const immutableCommit = /^[0-9a-f]{40}$/;
const exactRuntimeVersion = /^\d+\.\d+\.\d+$/;
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
  console.error("Workflow supply-chain policy failed: no workflow files found.");
  process.exit(1);
}

const failures = [];
let externalActionCount = 0;
for (const file of workflowFiles) {
  const lines = (await readFile(file, "utf8")).split("\n");
  for (const [index, line] of lines.entries()) {
    const location = `${relative(process.cwd(), file)}:${index + 1}`;
    const actionMatch = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/);
    if (actionMatch) {
      const action = actionMatch[1];
      if (!action.startsWith("./")) {
        externalActionCount += 1;
        const separator = action.lastIndexOf("@");
        const revision = separator === -1 ? "" : action.slice(separator + 1);
        if (!immutableCommit.test(revision)) failures.push(`${location} must pin ${action} to a full commit SHA`);
      }
    }

    const runnerMatch = line.match(/^\s*runs-on:\s*([^\s#]+)/);
    if (runnerMatch?.[1].endsWith("-latest")) failures.push(`${location} must pin runner ${runnerMatch[1]} to a stable image`);

    const nodeMatch = line.match(/^\s*node-version:\s*['"]?([^\s#'"]+)/);
    if (nodeMatch && !exactRuntimeVersion.test(nodeMatch[1])) failures.push(`${location} must pin Node.js ${nodeMatch[1]} to an exact patch version`);

    const command = line.replace(/#.*$/, "");
    if (/\bnpx(?:\s|$)/.test(command)) failures.push(`${location} must execute a committed local package binary instead of npx`);
  }
}

if (failures.length) {
  console.error("Workflow supply-chain policy failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Workflow supply-chain policy passed for ${externalActionCount} external actions.`);
