import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createProcessingFileIndex,
  resolveProcessingFileForRow,
} from "../web/processing-row-identity.js";

function fakeRow(controlIds: string[], assignedId = "") {
  const dataset: Record<string, string> = {};
  if (assignedId) dataset.fileId = assignedId;
  return {
    dataset,
    querySelectorAll(selector: string) {
      assert.equal(selector, ".preview-file, .source-file, .delete-file");
      return controlIds.map((id) => ({ dataset: { id } }));
    },
  };
}

test("resolves rows by stable file identity instead of display order", () => {
  const first = { id: "file-a", name: "A" };
  const second = { id: "file-b", name: "B" };
  const filesById = createProcessingFileIndex([first, second]);
  const secondRow = fakeRow(["file-b", "file-b", "file-b"]);
  const firstRow = fakeRow(["file-a", "file-a", "file-a"]);
  assert.equal(resolveProcessingFileForRow(secondRow, filesById), second);
  assert.equal(resolveProcessingFileForRow(firstRow, filesById), first);
  assert.equal(secondRow.dataset.fileId, "file-b");
  assert.equal(firstRow.dataset.fileId, "file-a");
});

test("fails closed when row controls disagree or identity changes", () => {
  const filesById = createProcessingFileIndex([
    { id: "file-a" },
    { id: "file-b" },
  ]);
  assert.equal(
    resolveProcessingFileForRow(fakeRow(["file-a", "file-b"]), filesById),
    null,
  );
  assert.equal(
    resolveProcessingFileForRow(fakeRow(["file-a"], "file-b"), filesById),
    null,
  );
  assert.equal(resolveProcessingFileForRow(fakeRow([]), filesById), null);
});

test("rejects malformed and duplicate stored identities", () => {
  const filesById = createProcessingFileIndex([
    { id: "" },
    { name: "missing id" },
    { id: "file-a", version: 1 },
    { id: "file-a", version: 2 },
  ]);
  assert.equal(filesById.size, 1);
  assert.equal(resolveProcessingFileForRow(fakeRow(["file-a"]), filesById), null);
});

test("processing UI wires rows through the identity guard", () => {
  const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
  assert.match(ui, /createProcessingFileIndex\(files\)/);
  assert.match(ui, /resolveProcessingFileForRow\(row, filesById\)/);
  assert.doesNotMatch(ui, /files\[index\]/);
  assert.doesNotMatch(ui, /row\.dataset\.fileId = file\.id/);
});
