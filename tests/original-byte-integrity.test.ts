import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { assertOriginalBytesMatchHash, sha256Hex } from "../web/original-byte-integrity.js";

const bytes = new TextEncoder().encode("CaseFind original bytes");
const expected = createHash("sha256").update(bytes).digest("hex");

test("computes and accepts the exact stored SHA-256", async () => {
  assert.equal(await sha256Hex(bytes), expected);
  assert.equal(await assertOriginalBytesMatchHash(bytes, expected.toUpperCase()), expected);
});

test("rejects changed bytes and malformed hash metadata", async () => {
  await assert.rejects(() => assertOriginalBytesMatchHash(new TextEncoder().encode("changed"), expected), (error: any) => error.code === "original_hash_mismatch");
  for (const hash of [undefined, "", "0".repeat(63), "z".repeat(64)]) {
    await assert.rejects(() => assertOriginalBytesMatchHash(bytes, hash as any), (error: any) => error.code === "invalid_original_hash");
  }
});

test("fails safely when SHA-256 is unavailable", async () => {
  await assert.rejects(() => sha256Hex(bytes, { cryptoImpl: {} as Crypto }), (error: any) => error.code === "hash_unavailable");
});
