import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createPdfJsTextAdapter, type BinaryFileDescriptor, type PdfJsRuntime } from "../src/processing/adapters/pdfjs.js";

const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);
const hash = createHash("sha256").update(pdf).digest("hex");
function file(overrides: Partial<BinaryFileDescriptor> = {}): BinaryFileDescriptor {
  return { id: "p", caseId: "c", name: "p.pdf", type: "application/pdf", size: pdf.length, sha256: hash, readBytes: async () => pdf, ...overrides };
}
function runtime(state: { called: boolean }): PdfJsRuntime {
  return { getDocument() { state.called = true; return { promise: Promise.resolve({ numPages: 1, getPage: async () => ({ getTextContent: async () => ({ items: [{ str: "Readable contract text" }] }) }) }) }; } };
}
test("matching PDF reaches parser", async () => { const state = { called: false }; const result = await createPdfJsTextAdapter(runtime(state), { minTextCharacters: 1 }).extract(file(), {}); assert.equal(state.called, true); assert.equal(result.kind, "text"); });
test("mismatched and malformed hashes never reach parser", async () => { for (const sha256 of ["0".repeat(64), "bad"]) { const state = { called: false }; await assert.rejects(() => createPdfJsTextAdapter(runtime(state)).extract(file({ sha256 }), {}), (error: any) => error.code === "corrupt_file" && error.retryable === false); assert.equal(state.called, false); } });
test("missing PDF signature never reaches parser", async () => { const bytes = Uint8Array.from([1, 2, 3, 4, 5, 6]); const state = { called: false }; await assert.rejects(() => createPdfJsTextAdapter(runtime(state)).extract(file({ size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), readBytes: async () => bytes }), {}), (error: any) => error.code === "corrupt_file"); assert.equal(state.called, false); });
test("unavailable SHA-256 blocks parser retryably", async () => { const state = { called: false }; await assert.rejects(() => createPdfJsTextAdapter(runtime(state), { cryptoImpl: {} }).extract(file(), {}), (error: any) => error.code === "adapter_unavailable" && error.retryable === true); assert.equal(state.called, false); });
