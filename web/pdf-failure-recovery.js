export const PDF_PASSWORD_MESSAGE = "This PDF is password-protected. CaseFind did not extract text. Unlock a copy outside CaseFind, then add that copy explicitly.";
export const PDF_CORRUPT_MESSAGE = "This PDF appears damaged or incomplete. CaseFind did not extract text. The original remains stored locally; replace it with a complete PDF or review it manually.";
export const PDF_TOO_MANY_PAGES_MESSAGE = "This PDF exceeds the 500-page local processing limit. The original remains stored locally; split out only the pages you need and add those files explicitly.";
export const PDF_ENGINE_UNAVAILABLE_MESSAGE = "The local PDF engine is unavailable in this browser session. The original remains stored locally; reload CaseFind before trying again.";
export const PDF_TRANSIENT_MESSAGE = "Local PDF extraction failed safely. The original remains stored locally. Retry once; if it fails again, review the original manually.";

export function classifyPdfFailure(error) {
  const name = typeof error?.name === "string" ? error.name : "";
  const code = typeof error?.code === "string" ? error.code : "";
  const message = error instanceof Error ? error.message : String(error || "");
  if (name === "PasswordException" || /password (?:is )?(?:required|protected)/i.test(message)) {
    return { code: "password_protected", retryable: false, message: PDF_PASSWORD_MESSAGE };
  }
  if (code === "too_many_pages") {
    return { code, retryable: false, message: PDF_TOO_MANY_PAGES_MESSAGE };
  }
  if (["InvalidPDFException", "MissingPDFException", "UnexpectedResponseException"].includes(name)
    || /invalid pdf|format error|xref|trailer|corrupt|malformed|truncated|unexpected end/i.test(message)) {
    return { code: "corrupt_file", retryable: false, message: PDF_CORRUPT_MESSAGE };
  }
  if (code === "adapter_unavailable" || /unexpected pdf\.js version|local pdf engine|dynamically imported module/i.test(message)) {
    return { code: "adapter_unavailable", retryable: false, message: PDF_ENGINE_UNAVAILABLE_MESSAGE };
  }
  return { code: code || "transient_error", retryable: true, message: PDF_TRANSIENT_MESSAGE };
}
