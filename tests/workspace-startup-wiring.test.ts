import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("storage starts only the workspace bootstrap on case pages", async () => {
  const source = await readFile(new URL("web/storage.js", root), "utf8");
  assert.match(source, /import\("\.\/workspace-bootstrap\.js"\)/);
  for (const feature of ["processing-ui", "report-ui", "backup-ui", "case-details-ui", "timeline-ui"]) {
    assert.doesNotMatch(source, new RegExp(`import\\(\\"\\.\\/${feature}\\.js`));
  }
});

test("deferred workspace modules preserve every feature entry point", async () => {
  const source = await readFile(new URL("web/workspace-modules.js", root), "utf8");
  for (const feature of ["processing-ui", "report-ui", "backup-ui", "library-link", "case-details-ui", "workspace-delete-ui", "timeline-ui", "consistency-ui", "readiness-ui"]) {
    assert.match(source, new RegExp(`import\\(\\"\\.\\/${feature}\\.js\\"\\)`));
  }
});
