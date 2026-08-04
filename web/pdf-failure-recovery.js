export const PDF_PASSWORD_MESSAGE = "This PDF is password-protected. CaseFind did not extract text. Unlock a copy outside CaseFind, then add that copy explicitly.";
export const PDF_CORRUPT_MESSAGE = "This PDF appears damaged or incomplete. CaseFind did not extract text. The original remains stored locally; replace it with a complete PDF or review it manually.";
export const PDF_TOO_MANY_PAGES_MESSAGE = "This PDF exceeds the 500-page local processing limit. The original remains stored locally; split out only the pages you need and add those files explicitly.";
export const PDF_ENGINE_UNAVAILABLE_MESSAGE = "The local PDF engine is unavailable in this browser session. The original remains stored locally; reload CaseFind before trying again.";
export const PDF_TRANSIENT_MESSAGE = "Local PDF extraction failed safely. The original remains stored locally. Retry once; if it fails again, review the original manually.";
export const PDF_FILE_TOO_LARGE_MESSAGE = "This PDF exceeds the 20 MB local processing limit. The original remains stored locally; split out only the pages you need and add those files explicitly.";
export const PDF_TEXT_LIMIT_MESSAGE = "This PDF contains more than 2,000,000 selectable characters. CaseFind stopped before creating extracted text. The original remains stored locally; split out only the pages you need and add those files explicitly.";
export const PDF_TIMEOUT_MESSAGE = "Local PDF extraction did not finish within 60 seconds. The original remains stored locally. Retry once; if it times out again, split the PDF into smaller files and add only the pages you need.";
export const PDF_INVALID_SIGNATURE_MESSAGE = "This file does not contain a valid PDF header. CaseFind did not open it as a PDF or extract text. The original remains stored locally; verify the file format and add a genuine PDF explicitly.";
export const PDF_HASH_MISMATCH_MESSAGE = "This locally stored PDF no longer matches the SHA-256 recorded when it was added. CaseFind did not open it or save extracted text. Keep the original for review and add a verified copy explicitly.";
export const PDF_HASH_UNAVAILABLE_MESSAGE = "CaseFind could not verify this PDF with SHA-256 in the current browser session. No extracted text was saved. Reload CaseFind and retry before using extracted text.";

export function classifyPdfFailure(error) {
  const name = typeof error?.name === "string" ? error.name : "";
  const code = typeof error?.code === "string" ? error.code : "";
  const message = error instanceof Error ? error.message : String(error || "");
  if (name === "PasswordException" || /password (?:is )?(?:required|protected)/i.test(message)) {
    return { code: "password_protected", retryable: false, message: PDF_PASSWORD_MESSAGE };
  }
  if (code === "too_many_pages") return { code, retryable: false, message: PDF_TOO_MANY_PAGES_MESSAGE };
  if (code === "file_too_large") return { code, retryable: false, message: PDF_FILE_TOO_LARGE_MESSAGE };
  if (code === "text_limit_exceeded") return { code, retryable: false, message: PDF_TEXT_LIMIT_MESSAGE };
  if (code === "processing_timeout") return { code, retryable: true, message: PDF_TIMEOUT_MESSAGE };
  if (code === "invalid_pdf_signature") return { code, retryable: false, message: PDF_INVALID_SIGNATURE_MESSAGE };
  if (code === "original_hash_mismatch" || code === "invalid_original_hash") return { code, retryable: false, message: PDF_HASH_MISMATCH_MESSAGE };
  if (code === "hash_unavailable") return { code, retryable: true, message: PDF_HASH_UNAVAILABLE_MESSAGE };
  if (["InvalidPDFException", "MissingPDFException", "UnexpectedResponseException"].includes(name)
    || /invalid pdf|format error|xref|trailer|corrupt|malformed|truncated|unexpected end/i.test(message)) {
    return { code: "corrupt_file", retryable: false, message: PDF_CORRUPT_MESSAGE };
  }
  if (code === "adapter_unavailable" || /unexpected pdf\.js version|local pdf engine|dynamically imported module/i.test(message)) {
    return { code: "adapter_unavailable", retryable: false, message: PDF_ENGINE_UNAVAILABLE_MESSAGE };
  }
  return { code: code || "transient_error", retryable: true, message: PDF_TRANSIENT_MESSAGE };
}
