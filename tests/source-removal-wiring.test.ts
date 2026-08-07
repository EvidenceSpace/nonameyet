import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storageSource = readFileSync("web/storage.js", "utf8");
const workspaceSource = readFileSync("web/case-workspace.js", "utf8");
const reviewStyles = readFileSync("web/review.css", "utf8");

test("source removal uses one exact-current six-store transaction", () => {
  assert.match(storageSource, /export class FileRemovalError extends Error/);
  assert.match(storageSource, /export function validFileRemovalSnapshot\(file\)/);
  assert.match(storageSource, /export function fileValuesMatch\(current, expected\)/);
  assert.match(storageSource, /export async function deleteFile\(expectedFile,/);
  assert.match(storageSource, /db\.transaction\(\["files", "processing", "facts", "suggestions", "events", "cases"\], "readwrite"\)/);
  assert.match(storageSource, /facts\.index\("sourceFileId"\)\.getKey\(expectedFile\.id\)/);
  assert.match(storageSource, /suggestions\.index\("fileId"\)\.getKey\(expectedFile\.id\)/);
  assert.match(storageSource, /events\.index\("sourceFileId"\)\.getKey\(expectedFile\.id\)/);
  assert.match(storageSource, /files\.delete\(expectedFile\.id\);/);
  assert.match(storageSource, /processing\.delete\(expectedFile\.id\);/);
  assert.match(storageSource, /cases\.put\(\{ \.\.\.caseRecord, updatedAt \}\);/);
  assert.doesNotMatch(storageSource, /export const deleteFile = \(id\)/);
});

test("workspace removal is snapshot-bound, recoverable, and visibly busy", () => {
  assert.match(workspaceSource, /const renderedFileSnapshots = new Map\(\);/);
  assert.match(workspaceSource, /const activeFileRemovals = new Set\(\);/);
  assert.match(workspaceSource, /function syncRenderedFileSnapshots\(currentFiles = \[\]\)/);
  assert.match(workspaceSource, /function requireRenderedFile\(fileId\)/);
  assert.match(workspaceSource, /syncRenderedFileSnapshots\(files\);/);
  assert.match(workspaceSource, /file = requireRenderedFile\(fileId\);/);
  assert.match(workspaceSource, /await deleteFile\(file\);\s*location\.reload\(\);/);
  assert.match(workspaceSource, /activeFileRemovals\.has\(fileId\)/);
  assert.match(workspaceSource, /setAttribute\("aria-busy", "true"\)/);
  assert.match(workspaceSource, /button\.disabled = busy/);
  assert.match(workspaceSource, /fileRemovalFailureText\(error, file\)/);
  assert.doesNotMatch(workspaceSource, /facts\.some\(\(fact\) => fact\.sourceFileId/);
  assert.doesNotMatch(workspaceSource, /deleteFile\(button\.dataset\.id\)/);
  assert.match(reviewStyles, /\.file-row\[aria-busy="true"\]/);
  assert.match(reviewStyles, /\.file-row\[aria-busy="true"\] button\{cursor:progress\}/);
});
