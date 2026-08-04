import { OriginalIntegrityError, assertOriginalBytesMatchHash, type Sha256Crypto } from "../integrity.js";
import { ProcessingAdapterError } from "../pipeline.js";
import type { AdapterExtractionResult, DocumentExtractionAdapter, ExtractionContext, FileDescriptor } from "../types.js";
export const IMAGE_OCR_ADAPTER_ID = "local-image-ocr";
export const IMAGE_OCR_ADAPTER_VERSION = "1.0.0";
export const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_IMAGE_PIXELS = 20000000;
export const DEFAULT_MAX_IMAGE_EDGE = 10000;
export interface BinaryImageDescriptor extends FileDescriptor {
    readBytes(): Promise<Uint8Array>;
}
export interface ImageOcrResult {
    text: string;
    width: number;
    height: number;
    confidence?: number;
    warnings?: string[];
}
export interface ImageOcrRuntime {
    id: string;
    version: string;
    recognize(input: {
        bytes: Uint8Array;
        mimeType: string;
        signal?: AbortSignal;
    }): Promise<ImageOcrResult>;
}
export interface ImageOcrAdapterOptions {
    maxBytes?: number;
    maxPixels?: number;
    maxEdge?: number;
    minimumConfidence?: number;
    cryptoImpl?: Sha256Crypto;
}
const SUPPORTED = new Set(["image/png", "image/jpeg", "image/webp"]);
function isBinary(file: FileDescriptor): file is BinaryImageDescriptor { return typeof (file as Partial<BinaryImageDescriptor>).readBytes === "function"; }
function detectedType(bytes: Uint8Array) { if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a)
    return "image/png"; if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg"; if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP")
    return "image/webp"; }
function abortError() { return new DOMException("Image OCR was cancelled.", "AbortError"); }
function integrityFailure(error: OriginalIntegrityError) {
    const retryable = error.code === "hash_unavailable";
    const code = retryable ? "adapter_unavailable" : "corrupt_file";
    const message = retryable
        ? "SHA-256 verification is unavailable in this session."
        : "The stored image bytes do not match their recorded SHA-256 provenance.";
    return new ProcessingAdapterError(message, code, retryable);
}
export function createImageOcrAdapter(runtime: ImageOcrRuntime, options: ImageOcrAdapterOptions = {}): DocumentExtractionAdapter {
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_IMAGE_BYTES, maxPixels = options.maxPixels ?? DEFAULT_MAX_IMAGE_PIXELS, maxEdge = options.maxEdge ?? DEFAULT_MAX_IMAGE_EDGE, minimumConfidence = options.minimumConfidence ?? .7;
    return { id: IMAGE_OCR_ADAPTER_ID, version: `${IMAGE_OCR_ADAPTER_VERSION}+${runtime.id}-${runtime.version}`, supports: file => SUPPORTED.has(file.type), async extract(file, context): Promise<AdapterExtractionResult> {
            if (!isBinary(file))
                throw new ProcessingAdapterError("Local OCR requires access to the original image bytes.", "adapter_unavailable", false);
            if (file.size > maxBytes)
                throw new ProcessingAdapterError(`The image exceeds the ${Math.floor(maxBytes / 1024 / 1024)} MB OCR limit.`, "file_too_large", false);
            if (context.signal?.aborted)
                throw abortError();
            const bytes = await file.readBytes();
            if (context.signal?.aborted)
                throw abortError();
            if (bytes.byteLength !== file.size)
                throw new ProcessingAdapterError("The stored image size no longer matches its file record.", "corrupt_file", false);
            const actualType = detectedType(bytes);
            if (!actualType || actualType !== file.type)
                throw new ProcessingAdapterError("The image bytes do not match the declared image type.", "corrupt_file", false);
            try {
                await assertOriginalBytesMatchHash(bytes, file.sha256, options.cryptoImpl);
            }
            catch (error) {
                if (error instanceof OriginalIntegrityError)
                    throw integrityFailure(error);
                throw error;
            }
            if (context.signal?.aborted)
                throw abortError();
            let result: ImageOcrResult;
            try {
                result = await runtime.recognize({ bytes, mimeType: actualType, ...(context.signal ? { signal: context.signal } : {}) });
            }
            catch (error) {
                if (context.signal?.aborted || (error instanceof Error && error.name === "AbortError"))
                    throw error;
                if (error instanceof ProcessingAdapterError)
                    throw error;
                throw new ProcessingAdapterError("The local OCR engine failed safely.", "transient_error", true);
            }
            if (context.signal?.aborted)
                throw abortError();
            if (!Number.isInteger(result.width) || !Number.isInteger(result.height) || result.width < 1 || result.height < 1)
                throw new ProcessingAdapterError("The OCR engine returned invalid image dimensions.", "corrupt_file", false);
            if (result.width > maxEdge || result.height > maxEdge || result.width * result.height > maxPixels)
                throw new ProcessingAdapterError("The image dimensions exceed the local OCR safety limit.", "file_too_large", false);
            const warnings = [...(result.warnings ?? [])];
            if (typeof result.confidence === "number" && result.confidence < minimumConfidence)
                warnings.push("OCR confidence is low. Compare every extracted detail with the original image.");
            return { kind: "text", pages: [{ pageNumber: 1, text: result.text }], warnings };
        } };
}
export function descriptorFromImageBlob(args: {
    id: string;
    caseId: string;
    sha256: string;
    file: File | Blob;
    name: string;
}): BinaryImageDescriptor { return { id: args.id, caseId: args.caseId, name: args.name, type: args.file.type, size: args.file.size, sha256: args.sha256, readBytes: async () => new Uint8Array(await args.file.arrayBuffer()) }; }
