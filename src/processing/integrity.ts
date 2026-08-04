export type OriginalIntegrityFailureCode = "invalid_original_hash" | "original_hash_mismatch" | "hash_unavailable";
export class OriginalIntegrityError extends Error {
    constructor(readonly code: OriginalIntegrityFailureCode) {
        super(code);
        this.name = "OriginalIntegrityError";
    }
}
export interface Sha256Crypto {
    subtle?: {
        digest(algorithm: string, data: BufferSource): Promise<ArrayBuffer>;
    };
}
export async function assertOriginalBytesMatchHash(bytes: Uint8Array, expectedHash: string, cryptoImpl: Sha256Crypto | undefined = globalThis.crypto): Promise<void> {
    if (!/^[a-f0-9]{64}$/i.test(expectedHash))
        throw new OriginalIntegrityError("invalid_original_hash");
    if (!cryptoImpl?.subtle?.digest)
        throw new OriginalIntegrityError("hash_unavailable");
    let digest: ArrayBuffer;
    const ownedBytes = Uint8Array.from(bytes);
    try {
        digest = await cryptoImpl.subtle.digest("SHA-256", ownedBytes.buffer);
    }
    catch {
        throw new OriginalIntegrityError("hash_unavailable");
    }
    const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (actual !== expectedHash.toLowerCase())
        throw new OriginalIntegrityError("original_hash_mismatch");
}
