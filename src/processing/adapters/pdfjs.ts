import { OriginalIntegrityError, assertOriginalBytesMatchHash, type Sha256Crypto } from "../integrity.js";
import { ExtractionOutputError } from "../normalize.js";
import { ProcessingAdapterError } from "../pipeline.js";
import type { AdapterExtractionResult, DocumentExtractionAdapter, FileDescriptor } from "../types.js";

export const PDFJS_ADAPTER_ID = "pdfjs-text";
export const PDFJS_ADAPTER_VERSION = "1.0.0";
export const DEFAULT_MAX_PDF_BYTES = 20 * 1024 * 1024;
export const DEFAULT_MAX_PDF_PAGES = 500;
export const DEFAULT_MIN_PDF_TEXT_CHARACTERS = 20;
export const DEFAULT_MAX_PDF_TEXT_CHARACTERS = 500_000;
export const PDF_HEADER_SCAN_BYTES = 1024;

export interface BinaryFileDescriptor extends FileDescriptor {
  readBytes(): Promise<Uint8Array>;
}
export interface PdfJsTextItem { str?: string; hasEOL?: boolean }
export interface PdfJsTextContent { items: PdfJsTextItem[] }
export interface PdfJsPage {
  getTextContent(options?: Record<string, unknown>): Promise<PdfJsTextContent>;
  cleanup?(): void;
}
export interface PdfJsDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
  cleanup?(): void;
  destroy?(): Promise<void> | void;
}
export interface PdfJsLoadingTask {
  promise: Promise<PdfJsDocument>;
  destroy?(): Promise<void> | void;
}
export interface PdfJsRuntime {
  version?: string;
  getDocument(options: {
    data: Uint8Array;
    isEvalSupported: false;
    useWorkerFetch: false;
    useSystemFonts: true;
    stopAtErrors: true;
  }): PdfJsLoadingTask;
}
export interface PdfJsAdapterOptions {
  maxBytes?: number;
  maxPages?: number;
  minTextCharacters?: number;
  maxTextCharacters?: number;
  cryptoImpl?: Sha256Crypto;
}

function isBinaryFile(file: FileDescriptor): file is BinaryFileDescriptor {
  return typeof (file as Partial<BinaryFileDescriptor>).readBytes === "function";
}
function hasPdfHeader(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.byteLength - 4, PDF_HEADER_SCAN_BYTES - 5);
  for (let index = 0; index <= limit; index += 1) {
    if (bytes[index] === 0x25 && bytes[index + 1] === 0x50 && bytes[index + 2] === 0x44 && bytes[index + 3] === 0x46 && bytes[index + 4] === 0x2d) return true;
  }
  return false;
}
function integrityFailure(error: OriginalIntegrityError): ProcessingAdapterError {
  const retryable = error.code === "hash_unavailable";
  return new ProcessingAdapterError(
    retryable ? "SHA-256 verification is unavailable in this session." : "The stored PDF bytes do not match their recorded SHA-256 provenance.",
    retryable ? "adapter_unavailable" : "corrupt_file",
    retryable,
  );
}
function textFromItems(items: readonly PdfJsTextItem[]): string {
  let text = "";
  for (const item of items) {
    if (typeof item.str !== "string" || item.str.length === 0) {
      if (item.hasEOL && text && !text.endsWith("\n")) text += "\n";
      continue;
    }
    if (text && !text.endsWith("\n") && !/^\s/.test(item.str) && !/\s$/.test(text)) text += " ";
    text += item.str;
    if (item.hasEOL && !text.endsWith("\n")) text += "\n";
  }
  return text;
}
function classifyPdfError(error: unknown): ProcessingAdapterError {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : "";
  if (name === "PasswordException" || /password/i.test(message)) return new ProcessingAdapterError("This PDF is password-protected. Unlock a copy before adding it.", "password_protected", false);
  if (name === "InvalidPDFException" || name === "FormatError") return new ProcessingAdapterError("The PDF structure is invalid or damaged.", "corrupt_file", false);
  if (name === "MissingPDFException") return new ProcessingAdapterError("The PDF bytes are unavailable.", "corrupt_file", false);
  return new ProcessingAdapterError("The local PDF parser failed safely.", "transient_error", true);
}

export function createPdfJsTextAdapter(runtime: PdfJsRuntime, options: PdfJsAdapterOptions = {}): DocumentExtractionAdapter {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_PDF_BYTES;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PDF_PAGES;
  const minTextCharacters = options.minTextCharacters ?? DEFAULT_MIN_PDF_TEXT_CHARACTERS;
  const maxTextCharacters = options.maxTextCharacters ?? DEFAULT_MAX_PDF_TEXT_CHARACTERS;
  return {
    id: PDFJS_ADAPTER_ID,
    version: `${PDFJS_ADAPTER_VERSION}+pdfjs-${runtime.version ?? "unknown"}`,
    supports: file => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    async extract(file, context): Promise<AdapterExtractionResult> {
      if (!isBinaryFile(file)) throw new ProcessingAdapterError("The PDF adapter requires access to the original local bytes.", "adapter_unavailable", false);
      if (file.size > maxBytes) throw new ProcessingAdapterError(`The PDF exceeds the ${Math.floor(maxBytes / 1024 / 1024)} MB processing limit.`, "file_too_large", false);
      if (context.signal?.aborted) throw new DOMException("PDF extraction was cancelled.", "AbortError");
      const bytes = await file.readBytes();
      if (context.signal?.aborted) throw new DOMException("PDF extraction was cancelled.", "AbortError");
      if (bytes.byteLength !== file.size) throw new ProcessingAdapterError("The stored PDF size no longer matches its file record.", "corrupt_file", false);
      if (!hasPdfHeader(bytes)) throw new ProcessingAdapterError("The original bytes do not contain a valid PDF signature.", "corrupt_file", false);
      try {
        await assertOriginalBytesMatchHash(bytes, file.sha256, options.cryptoImpl);
      } catch (error) {
        if (error instanceof OriginalIntegrityError) throw integrityFailure(error);
        throw error;
      }
      if (context.signal?.aborted) throw new DOMException("PDF extraction was cancelled.", "AbortError");
      const loadingTask = runtime.getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false, useSystemFonts: true, stopAtErrors: true });
      const abort = () => { void loadingTask.destroy?.(); };
      context.signal?.addEventListener("abort", abort, { once: true });
      let document: PdfJsDocument | undefined;
      try {
        document = await loadingTask.promise;
        if (document.numPages < 1 || !Number.isInteger(document.numPages)) throw new ProcessingAdapterError("The PDF does not contain a valid page count.", "corrupt_file", false);
        if (document.numPages > maxPages) throw new ProcessingAdapterError(`The PDF has more than ${maxPages} pages. Split it into smaller records.`, "too_many_pages", false);
        const pages: Array<{ pageNumber: number; text: string }> = [];
        const warnings: string[] = [];
        let readableCharacters = 0;
        let extractedCharacters = 0;
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          if (context.signal?.aborted) throw new DOMException("PDF extraction was cancelled.", "AbortError");
          const page = await document.getPage(pageNumber);
          try {
            const content = await page.getTextContent({ disableNormalization: false, includeMarkedContent: false });
            const text = textFromItems(content.items);
            extractedCharacters += text.length;
            if (extractedCharacters > maxTextCharacters) {
              throw new ExtractionOutputError(`Extracted PDF text exceeds ${maxTextCharacters} characters.`, "output_too_large");
            }
            readableCharacters += text.replace(/\s/g, "").length;
            if (!text.trim()) warnings.push(`Page ${pageNumber} has no readable text layer.`);
            pages.push({ pageNumber, text });
          } finally {
            page.cleanup?.();
          }
        }
        if (readableCharacters < minTextCharacters) return { kind: "needs_ocr", reason: "The PDF contains too little selectable text for reliable extraction.", warnings };
        return { kind: "text", pages, warnings };
      } catch (error) {
        if (context.signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
        if (error instanceof ProcessingAdapterError || error instanceof ExtractionOutputError) throw error;
        throw classifyPdfError(error);
      } finally {
        context.signal?.removeEventListener("abort", abort);
        document?.cleanup?.();
        await document?.destroy?.();
      }
    },
  };
}

export function descriptorFromBrowserFile(args: { id: string; caseId: string; sha256: string; file: File | Blob; name: string }): BinaryFileDescriptor {
  return { id: args.id, caseId: args.caseId, name: args.name, type: args.file.type || "application/pdf", size: args.file.size, sha256: args.sha256, readBytes: async () => new Uint8Array(await args.file.arrayBuffer()) };
}
