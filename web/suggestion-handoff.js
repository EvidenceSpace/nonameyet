const MAX_SUGGESTIONS = 100;
const MIN_CONFIDENCE = 0.15;

function cleanText(value, maxLength) {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean && clean.length <= maxLength ? clean : undefined;
}

function injectionSignals(text) {
  const signals = [];
  const rules = [
    ["instruction_override", /(?:ignore|disregard|override)\s+(?:all\s+)?(?:previous|prior|system|developer)\s+(?:instructions?|rules?)/i],
    ["role_impersonation", /(?:you are|act as|system message|developer message)\b/i],
    ["exfiltration", /(?:send|upload|email|post|share)\s+(?:the\s+)?(?:case\s+files?|documents?|secrets?|data)\b/i],
  ];
  for (const [kind, rule] of rules) if (rule.test(text)) signals.push(kind);
  return signals;
}

export function buildGroundedSuggestions({ caseId, file, processingJob, candidates, now = () => new Date().toISOString(), idFactory = () => crypto.randomUUID() }) {
  if (!caseId || !file || processingJob?.status !== "ready_for_ai") return [];
  if (processingJob.fileId !== file.id || processingJob.fileHash !== file.sha256) return [];
  if (!Array.isArray(processingJob.artifact?.pages) || !Array.isArray(candidates)) return [];
  const pages = new Map(processingJob.artifact.pages.map((page) => [page.pageNumber, page.text]));
  const seen = new Set();
  const suggestions = [];
  for (const candidate of candidates) {
    if (suggestions.length >= MAX_SUGGESTIONS) break;
    const label = cleanText(candidate?.label, 120);
    const value = cleanText(candidate?.value, 500);
    const quote = cleanText(candidate?.quote, 1000);
    const confidence = Number(candidate?.confidence);
    const pageNumber = Number(candidate?.pageNumber);
    const pageText = pages.get(pageNumber);
    if (!label || !value || !quote || !Number.isInteger(pageNumber)) continue;
    if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE || confidence > 1) continue;
    if (typeof pageText !== "string" || !pageText.includes(quote)) continue;
    const fingerprint = `${label}\u0000${value}\u0000${pageNumber}\u0000${quote}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    suggestions.push({
      id: `suggestion_${idFactory()}`, caseId, fileId: file.id, label, value, confidence,
      status: "suggested", aiSuggested: true, decidedByUser: false,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "pdf_text", pageNumber, quote } },
      injectionSignals: injectionSignals(pageText), createdAt: now(),
    });
  }
  return suggestions;
}

export const suggestionHandoffLimits = Object.freeze({ maxSuggestions: MAX_SUGGESTIONS, minConfidence: MIN_CONFIDENCE });
