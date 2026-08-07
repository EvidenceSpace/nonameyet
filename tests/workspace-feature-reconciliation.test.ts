import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync("web/case-workspace.js", "utf8");

test("source removal preserves the established workspace contracts", () => {
  assert.match(
    workspaceSource,
    /^import \{ confirmSuggestionAsFact, syncRenderedFactSnapshots, syncRenderedSuggestionSnapshots \} from "\.\/review-transition\.js";/,
  );
  assert.match(workspaceSource, /fileInput\?\.setAttribute\("accept", "image\/png,image\/jpeg,image\/webp,application\/pdf"\);/);
  assert.match(workspaceSource, /const checklistItems = \[/);
  assert.match(workspaceSource, /record\.checklist\?\.includes\(key\)/);
  assert.match(workspaceSource, /record\.checklist = \[\.\.\.root\.querySelectorAll\("input:checked"\)\]/);
  assert.match(workspaceSource, /function activeSuggestions\(\) \{ return suggestions\.filter/);
  assert.match(workspaceSource, /syncRenderedSuggestionSnapshots\(active\);/);
  assert.match(workspaceSource, /file\.type === "application\/pdf" \? `<embed src="\$\{previewUrl\}" type="application\/pdf" \/>`/);
  assert.match(workspaceSource, /record\.amount \? `₹\$\{record\.amount\}` : "Not entered"/);
  assert.match(workspaceSource, /20 \* 1024 \* 1024/);
  assert.doesNotMatch(workspaceSource, /application\/pdf", "text\/plain"/);
});

test("the merged workspace keeps exact-current source removal", () => {
  assert.match(workspaceSource, /const renderedFileSnapshots = new Map\(\);/);
  assert.match(workspaceSource, /const activeFileRemovals = new Set\(\);/);
  assert.match(workspaceSource, /function syncRenderedFileSnapshots\(currentFiles = \[\]\)/);
  assert.match(workspaceSource, /file = requireRenderedFile\(fileId\);/);
  assert.match(workspaceSource, /await deleteFile\(file\);\s*location\.reload\(\);/);
  assert.match(workspaceSource, /data-id="\$\{file\.id\}"/);
  assert.doesNotMatch(workspaceSource, /facts\.some\(\(fact\) => fact\.sourceFileId/);
  assert.doesNotMatch(workspaceSource, /deleteFile\(button\.dataset\.id\)/);
});
