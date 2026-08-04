import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createImageOcrAdapter, type BinaryImageDescriptor } from "../src/processing/adapters/image-ocr.js";
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const hash = createHash("sha256").update(png).digest("hex");
function file(sha256 = hash): BinaryImageDescriptor { return { id: "i", caseId: "c", name: "i.png", type: "image/png", size: png.length, sha256, readBytes: async () => png }; }
function runtime(state: {
    called: boolean;
}) { return { id: "test", version: "1", async recognize() { state.called = true; return { text: "Invoice", width: 10, height: 10 }; } }; }
test("matching original reaches OCR", async () => { const state = { called: false }; const result = await createImageOcrAdapter(runtime(state)).extract(file(), {}); assert.equal(state.called, true); assert.equal(result.kind, "text"); });
test("changed bytes and malformed hash block OCR", async () => { for (const value of ["0".repeat(64), "bad"]) {
    const state = { called: false };
    await assert.rejects(() => createImageOcrAdapter(runtime(state)).extract(file(value), {}), (e: any) => e.code === "corrupt_file" && e.retryable === false);
    assert.equal(state.called, false);
} });
test("unavailable SHA-256 blocks OCR with retryable failure", async () => { const state = { called: false }; await assert.rejects(() => createImageOcrAdapter(runtime(state), { cryptoImpl: {} }).extract(file(), {}), (e: any) => e.code === "adapter_unavailable" && e.retryable === true); assert.equal(state.called, false); });
