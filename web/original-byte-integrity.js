function integrityError(code, message) {
  return Object.assign(new Error(message), { code });
}

export async function sha256Hex(input, { cryptoImpl = globalThis.crypto } = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (!cryptoImpl?.subtle?.digest) throw integrityError("hash_unavailable", "SHA-256 is unavailable.");
  let digest;
  try {
    digest = await cryptoImpl.subtle.digest("SHA-256", bytes);
  } catch {
    throw integrityError("hash_unavailable", "SHA-256 failed safely.");
  }
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function assertOriginalBytesMatchHash(input, expectedHash, options) {
  if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(expectedHash)) {
    throw integrityError("invalid_original_hash", "Stored original hash metadata is invalid.");
  }
  const actualHash = await sha256Hex(input, options);
  if (actualHash !== expectedHash.toLowerCase()) {
    throw integrityError("original_hash_mismatch", "Stored original bytes do not match their recorded SHA-256 hash.");
  }
  return actualHash;
}
