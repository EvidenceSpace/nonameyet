import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildPublicDemo, PUBLIC_DEMO_SOURCE_FILES } from "../scripts/build-public-demo.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedFiles = [
  ".nojekyll",
  "app.html",
  "evidencespace-pages/brief.js",
  "evidencespace-pages/cases.js",
  "evidencespace-pages/evidence.js",
  "evidencespace-pages/fixtures.js",
  "evidencespace-pages/foundation.js",
  "evidencespace-pages/home.js",
  "evidencespace-pages/page-utils.js",
  "evidencespace-shell-model.js",
  "evidencespace-shell.css",
  "evidencespace-shell.js",
  "evidencespace-tokens.css",
  "index.html",
  "robots.txt",
];

async function listFiles(root: string, directory = root): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    else files.push(relative(root, path).replaceAll("\\", "/"));
  }
  return files.sort();
}

async function createBuild(t: test.TestContext) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "evidencespace-public-demo-"));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const outputDirectory = join(temporaryRoot, "site");
  const result = await buildPublicDemo({ repositoryRoot, outputDirectory });
  return { outputDirectory, result };
}

test("the public demo contains only the allowlisted synthetic shell", async (t) => {
  const { outputDirectory, result } = await createBuild(t);
  assert.equal(result.fileCount, expectedFiles.length);
  assert.deepEqual(await listFiles(outputDirectory), expectedFiles);
  assert.equal(
    PUBLIC_DEMO_SOURCE_FILES.every(([source]) => source.startsWith("web/evidencespace")),
    true,
  );

  const combined = (
    await Promise.all(
      expectedFiles
        .filter((path) => !path.startsWith("."))
        .map((path) => readFile(join(outputDirectory, path), "utf8")),
    )
  ).join("\n");
  for (const forbidden of [
    "design-prototypes/",
    "EvidenceSpace-connected-end-to-end-prototype-v1.html",
    "/Users/",
    "/home/",
    "BEGIN PRIVATE KEY",
  ]) {
    assert.equal(combined.includes(forbidden), false);
  }
});

test("the public entry states the preview boundary before opening the app", async (t) => {
  const { outputDirectory } = await createBuild(t);
  const [landing, app, robots] = await Promise.all([
    readFile(join(outputDirectory, "index.html"), "utf8"),
    readFile(join(outputDirectory, "app.html"), "utf8"),
    readFile(join(outputDirectory, "robots.txt"), "utf8"),
  ]);
  assert.match(landing, /Everything shown is fictional/);
  assert.match(landing, /Do not enter real case information/);
  assert.match(landing, /Accounts, secure storage, payments, and AI actions are not connected/);
  assert.match(landing, /href="app\.html\?route=home"/);
  assert.match(app, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(app, /src="evidencespace-shell\.js"/);
  assert.equal(robots, "User-agent: *\nDisallow: /\n");
});

test("every relative JavaScript import in the public artifact resolves", async (t) => {
  const { outputDirectory } = await createBuild(t);
  const JavaScriptFiles = (await listFiles(outputDirectory)).filter((path) => path.endsWith(".js"));
  const importPattern = /(?:from\s+|import\()\s*["'](\.[^"']+)["']/g;

  for (const file of JavaScriptFiles) {
    const content = await readFile(join(outputDirectory, file), "utf8");
    for (const match of content.matchAll(importPattern)) {
      const target = resolve(outputDirectory, dirname(file), match[1]!);
      assert.equal((await stat(target)).isFile(), true, `${file} imports missing ${match[1]}`);
    }
  }
});
