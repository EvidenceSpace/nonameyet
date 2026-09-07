import { readFile } from "node:fs/promises";

const manifests = [
  { label: "package.json", url: new URL("../package.json", import.meta.url) },
  { label: "desktop/electron/package.json", url: new URL("../desktop/electron/package.json", import.meta.url) },
];
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const failures = [];
let directPackageCount = 0;

for (const manifest of manifests) {
  const packageJson = JSON.parse(await readFile(manifest.url, "utf8"));
  const seen = new Map();

  for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
      if (typeof version !== "string" || !exactVersion.test(version)) {
        failures.push(`${manifest.label}: ${section}.${name} must use an exact semver version; received ${String(version)}`);
      }
      if (seen.has(name)) failures.push(`${manifest.label}: ${name} is declared in both ${seen.get(name)} and ${section}`);
      seen.set(name, section);
      directPackageCount += 1;
    }
  }
}

if (failures.length) {
  console.error("Dependency policy failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Dependency policy passed for ${directPackageCount} direct packages across ${manifests.length} manifests.`);
