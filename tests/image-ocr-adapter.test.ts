import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createImageOcrAdapter, descriptorFromImageBlob, type BinaryImageDescriptor, type ImageOcrRuntime, } from "../src/processing/adapters/image-ocr.js";
import { createProcessingJob, runProcessingJob } from "../src/processing/pipeline.js";
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const pngHash = createHash("sha256").update(png).digest("hex");
function image(overrides: Partial<BinaryImageDescriptor> = {}): BinaryImageDescriptor {
    return { id: "img", caseId: "case", name: "message.png", type: "image/png", size: png.length, sha256: pngHash, readBytes: async () => png, ...overrides };
}
function runtime(result: any = {}): ImageOcrRuntime {
    return { id: "test-ocr", version: "1", recognize: async () => ({ text: "Invoice total ₹5,000", width: 1200, height: 900, confidence: 0.94, ...result }) };
}
test("extracts one provenance page from local image bytes", async () => {
    const file = image();
    const job = await runProcessingJob(createProcessingJob({ id: "job", file }), file, { adapters: [createImageOcrAdapter(runtime())] });
    assert.equal(job.status, "ready_for_ai");
    assert.equal(job.artifact?.adapterId, "local-image-ocr");
    assert.equal(job.artifact?.pages[0]?.pageNumber, 1);
});
test("rejects MIME spoofing, byte mismatch, and oversized files", async () => {
    const adapter = createImageOcrAdapter(runtime(), { maxBytes: 20 });
    await assert.rejects(() => adapter.extract(image({ type: "image/jpeg" }), {}), (error: any) => error.code === "corrupt_file");
    await assert.rejects(() => adapter.extract(image({ size: 10 }), {}), (error: any) => error.code === "corrupt_file");
    await assert.rejects(() => createImageOcrAdapter(runtime(), { maxBytes: 5 }).extract(image(), {}), (error: any) => error.code === "file_too_large");
});
test("rejects dangerous image dimensions after decoding", async () => {
    await assert.rejects(() => createImageOcrAdapter(runtime({ width: 10001, height: 10 })).extract(image(), {}), (error: any) => error.code === "file_too_large");
});
test("low confidence stays review-only with a warning", async () => {
    const file = image();
    const job = await runProcessingJob(createProcessingJob({ id: "low", file }), file, { adapters: [createImageOcrAdapter(runtime({ confidence: 0.2 }))] });
    assert.match(job.artifact?.warnings[0] || "", /low/i);
});
test("empty OCR output fails closed", async () => {
    const file = image();
    const job = await runProcessingJob(createProcessingJob({ id: "empty", file }), file, { adapters: [createImageOcrAdapter(runtime({ text: "   " }))] });
    assert.equal(job.failure?.code, "empty_text");
});
test("cancellation never creates an OCR artifact", async () => {
    const controller = new AbortController();
    let started = () => { };
    const ready = new Promise<void>((resolve) => { started = resolve; });
    const engine: ImageOcrRuntime = { id: "slow", version: "1", recognize: async ({ signal }) => { started(); await new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new DOMException("cancelled", "AbortError")), { once: true })); return { text: "never", width: 1, height: 1 }; } };
    const file = image();
    const pending = runProcessingJob(createProcessingJob({ id: "cancel", file }), file, { adapters: [createImageOcrAdapter(engine)], signal: controller.signal });
    await ready;
    controller.abort();
    const job = await pending;
    assert.equal(job.status, "cancelled");
    assert.equal(job.artifact, undefined);
});
test("creates a byte-backed browser image descriptor", async () => {
    const blob = new Blob([png], { type: "image/png" });
    const descriptor = descriptorFromImageBlob({ id: "i", caseId: "c", sha256: "b".repeat(64), file: blob, name: "proof.png" });
    assert.deepEqual([...await descriptor.readBytes()], [...png]);
});
