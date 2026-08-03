export const IMAGE_UNSUPPORTED_TYPE_MESSAGE = "Local OCR currently supports PNG, JPEG, and WebP images.";
export const IMAGE_TOO_LARGE_MESSAGE = "This image exceeds the 10 MB local OCR limit. The original remains stored locally; resize or export a smaller copy and add it explicitly.";
export const IMAGE_CORRUPT_MESSAGE = "This image appears damaged or does not match its declared format. CaseFind did not run OCR. The original remains stored locally; verify the file and add a valid PNG, JPEG, or WebP copy explicitly.";
export const IMAGE_ADAPTER_UNAVAILABLE_MESSAGE = "Local image OCR is unavailable in this browser. Your image remains stored locally and was not uploaded.";
export const IMAGE_EMPTY_TEXT_MESSAGE = "No readable text was found in this image. The original remains stored locally; review it manually or add a clearer image explicitly.";
export const IMAGE_TIMEOUT_MESSAGE = "Local OCR timed out. Your original remains stored locally. Retry when the device is ready.";
export const IMAGE_TRANSIENT_MESSAGE = "Local image OCR failed safely. The original remains stored locally. Retry once; if it fails again, review the image manually.";

export function classifyImageOcrFailure(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  if (code === "unsupported_type") return { code, retryable: false, message: IMAGE_UNSUPPORTED_TYPE_MESSAGE };
  if (code === "file_too_large") return { code, retryable: false, message: IMAGE_TOO_LARGE_MESSAGE };
  if (code === "corrupt_file") return { code, retryable: false, message: IMAGE_CORRUPT_MESSAGE };
  if (code === "adapter_unavailable") return { code, retryable: false, message: IMAGE_ADAPTER_UNAVAILABLE_MESSAGE };
  if (code === "empty_text") return { code, retryable: false, message: IMAGE_EMPTY_TEXT_MESSAGE };
  if (code === "ocr_timeout") return { code, retryable: true, message: IMAGE_TIMEOUT_MESSAGE };
  return { code: code || "transient_error", retryable: true, message: IMAGE_TRANSIENT_MESSAGE };
}
