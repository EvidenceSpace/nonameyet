import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const failures = [];
const seen = new Map();

for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
  for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
    if (!exactVersion.test(version)) failures.push(`${section}.${name} must use an exact semver version; received ${version}`);
    if (seen.has(name)) failures.push(`${name} is declared in both ${seen.get(name)} and ${section}`);
    seen.set(name, section);
  }
}

if (failures.length) {
  console.error("Dependency policy failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Dependency policy passed for ${seen.size} direct packages.`);
