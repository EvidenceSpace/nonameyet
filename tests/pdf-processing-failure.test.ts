import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { processPdf } from "../web/pdf-processing.js";
import { PDF_CORRUPT_MESSAGE, PDF_PASSWORD_MESSAGE, PDF_TRANSIENT_MESSAGE } from "../web/pdf-failure-recovery.js";

const bytes = new Uint8Array(8); bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
const fileHash = createHash("sha256").update(bytes).digest("hex");
const file = { id: "pdf-1", caseId: "case-1", sha256: fileHash, original: { arrayBuffer: async () => bytes.buffer } };
function runtimeFailure(name: string, message: string) { return { getDocument() { const error = new Error(message); error.name = name; return { promise: Promise.reject(error) }; } }; }

test("processPdf persists permanent corrupt-file metadata without an artifact", async () => { const result = await processPdf(file, { runtime: runtimeFailure("InvalidPDFException", "bad xref at internal offset") }); assert.equal(result.status, "failed"); assert.equal(result.message, PDF_CORRUPT_MESSAGE); assert.deepEqual(result.failure, { code: "corrupt_file", retryable: false }); assert.equal(result.artifact, undefined); });
test("processPdf persists password recovery without leaking raw PDF.js details", async () => { const result = await processPdf(file, { runtime: runtimeFailure("PasswordException", "Password required: code 2") }); assert.equal(result.message, PDF_PASSWORD_MESSAGE); assert.deepEqual(result.failure, { code: "password_protected", retryable: false }); assert.equal(result.message.includes("code 2"), false); });
test("unknown process failures remain retryable once with a safe message", async () => { const result = await processPdf(file, { runtime: runtimeFailure("UnknownError", "worker pointer 0x123") }); assert.equal(result.message, PDF_TRANSIENT_MESSAGE); assert.deepEqual(result.failure, { code: "transient_error", retryable: true }); assert.equal(result.message.includes("0x123"), false); });
