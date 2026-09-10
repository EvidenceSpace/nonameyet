const SOURCE_STATES = new Set(["denied", "missing", "deleted", "stale", "changed", "error"]);
const HASH_PATTERN = /^[a-f0-9]{64}$/i;

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function unavailable(status, origin, reason = status) {
  return Object.freeze({ status, origin, reason });
}

function text(value, maximum = 2_000) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= maximum ? cleaned : null;
}

function textList(value, maximumItems = 12) {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  const cleaned = value.map((item) => text(item, 2_000));
  return cleaned.every(Boolean) ? cleaned : null;
}

function sourceReferenceMatches(reference, file) {
  return reference?.fileId === file.id
    && typeof reference.sha256 === "string"
    && reference.sha256.toLowerCase() === file.sha256.toLowerCase();
}

function originalMetadataMatches(file) {
  const original = file?.original;
  return Boolean(
    original
    && original.name === file.name
    && original.type === file.type
    && original.size === file.size
    && Number.isSafeInteger(original.size)
    && original.size >= 0,
  );
}

function statementTone(relation, fallback) {
  if (relation === "contrary") return "contrary";
  if (relation === "supports") return "confirmed";
  if (relation === "unknown") return "uncertain";
  return fallback;
}

function normalizeFact(fact, file, caseId) {
  if (!sourceReferenceMatches(fact?.sourceReference, file)
    || fact.sourceFileId !== file.id
    || fact.caseId !== caseId) return { status: "changed" };
  const id = text(fact.id, 40);
  const label = text(fact.label, 80);
  const quote = text(fact.value, 1_000);
  if (!id || !label || !quote || !["confirmed", "corrected"].includes(fact.status)) {
    return { status: "error" };
  }
  const tone = statementTone(fact.relation, "confirmed");
  return {
    status: "ready",
    statement: {
      id,
      label,
      quote,
      tone,
      state: tone === "contrary" ? "Contrary" : fact.status === "corrected" ? "Corrected" : "Confirmed",
      sourceReference: {
        fileId: file.id,
        sha256: file.sha256.toLowerCase(),
        locator: fact.sourceReference.locator || { kind: "whole_file" },
      },
    },
  };
}

function normalizeSuggestion(suggestion, file, caseId) {
  if (!sourceReferenceMatches(suggestion?.sourceReference, file)
    || suggestion.fileId !== file.id
    || suggestion.caseId !== caseId) return { status: "changed" };
  const id = text(suggestion.id, 40);
  const label = text(suggestion.label, 80);
  const quote = text(suggestion.value, 1_000);
  if (!id || !label || !quote
    || !["suggested", "uncertain"].includes(suggestion.status)
    || suggestion.aiSuggested !== true
    || suggestion.decidedByUser !== false) return { status: "error" };
  const tone = statementTone(suggestion.relation, "ai");
  return {
    status: "ready",
    statement: {
      id,
      label,
      quote,
      tone,
      state: tone === "contrary" ? "Contrary" : suggestion.status === "uncertain" ? "Uncertain" : "Ready",
      sourceReference: {
        fileId: file.id,
        sha256: file.sha256.toLowerCase(),
        locator: suggestion.sourceReference.locator || { kind: "whole_file" },
      },
    },
  };
}

function formatBytes(size) {
  if (size < 1_024) return `${size} B`;
  if (size < 1_048_576) return `${Math.round(size / 1_024)} KB`;
  return `${(size / 1_048_576).toFixed(1)} MB`;
}

export function adaptEvidenceSourceSnapshot(snapshot, {
  caseId,
  evidenceId,
  origin = "provider",
} = {}) {
  if (!text(caseId, 40) || !text(evidenceId, 40)) return unavailable("error", origin, "invalid_request");
  if (!snapshot || typeof snapshot !== "object") return unavailable("error", origin, "invalid_snapshot");
  if (snapshot.deletedAt) return unavailable("deleted", origin);
  if (snapshot.caseId !== caseId || snapshot.evidenceId !== evidenceId) {
    return unavailable("changed", origin, "route_identity_mismatch");
  }

  const file = snapshot.file;
  if (!file
    || file.caseId !== caseId
    || !text(file.id, 120)
    || !text(file.name, 240)
    || !text(file.type, 160)
    || !HASH_PATTERN.test(file.sha256 || "")
    || !Number.isSafeInteger(file.size)
    || file.size < 0
    || !text(file.createdAt, 80)
    || !originalMetadataMatches(file)) {
    return unavailable("changed", origin, "source_identity_mismatch");
  }

  const processing = snapshot.processing;
  if (processing && (
    processing.fileId !== file.id
    || processing.caseId !== caseId
    || typeof processing.fileHash !== "string"
    || processing.fileHash.toLowerCase() !== file.sha256.toLowerCase()
  )) return unavailable("stale", origin, "processing_identity_mismatch");

  const facts = snapshot.facts ?? [];
  const suggestions = snapshot.suggestions ?? [];
  if (!Array.isArray(facts) || !Array.isArray(suggestions)) {
    return unavailable("error", origin, "invalid_statements");
  }
  const statementResults = [
    ...facts.map((fact) => normalizeFact(fact, file, caseId)),
    ...suggestions.map((suggestion) => normalizeSuggestion(suggestion, file, caseId)),
  ];
  const failedStatement = statementResults.find(({ status }) => status !== "ready");
  if (failedStatement) return unavailable(failedStatement.status, origin, "statement_identity_mismatch");
  const statements = statementResults.map(({ statement }) => statement);
  if (new Set(statements.map(({ id }) => id)).size !== statements.length) {
    return unavailable("error", origin, "duplicate_statement_identity");
  }

  const details = snapshot.record;
  const preview = details?.preview;
  const previewBody = textList(preview?.body);
  const normalized = {
    caseId,
    evidenceId,
    origin,
    sourceFileId: file.id,
    sha256: file.sha256.toLowerCase(),
    filename: text(details?.filename, 240),
    title: text(details?.title, 240),
    kind: text(details?.kind, 160),
    source: text(details?.source, 240),
    date: text(details?.date, 120),
    imported: text(details?.imported, 120),
    addedBy: text(details?.addedBy, 160),
    integrity: text(details?.integrity, 160),
    visibility: text(details?.visibility, 160),
    assessment: text(details?.assessment, 2_000),
    backlinks: details?.backlinks,
    sizeLabel: formatBytes(file.size),
    processingStatus: text(processing?.status || "unprocessed", 80),
    statements,
    preview: {
      from: text(preview?.from, 320),
      to: text(preview?.to, 320),
      date: text(preview?.date, 120),
      subject: text(preview?.subject, 320),
      body: previewBody,
      receipt: text(preview?.receipt, 1_000),
      concern: text(preview?.concern, 1_000),
      closing: text(preview?.closing, 320),
      footerLeft: text(preview?.footerLeft, 160),
      footerRight: text(preview?.footerRight, 160),
    },
  };

  if (normalized.filename !== file.name
    || !Number.isSafeInteger(normalized.backlinks)
    || normalized.backlinks < 0
    || Object.values(normalized).some((value) => value === null)
    || Object.values(normalized.preview).some((value) => value === null)) {
    return unavailable("error", origin, "invalid_display_record");
  }

  return deepFreeze({ status: "ready", origin, record: normalized });
}

export async function loadEvidenceRecord({
  caseId,
  evidenceId,
  provider,
  fallbackRecord,
} = {}) {
  if (!provider) {
    return adaptEvidenceSourceSnapshot(fallbackRecord, { caseId, evidenceId, origin: "synthetic" });
  }
  const reader = typeof provider === "function"
    ? provider
    : typeof provider.readEvidenceRecord === "function"
      ? provider.readEvidenceRecord.bind(provider)
      : null;
  if (!reader) return unavailable("error", "provider", "invalid_provider");

  let result;
  try {
    result = await reader(Object.freeze({ caseId, evidenceId }));
  } catch {
    return unavailable("error", "provider", "read_failed");
  }
  if (SOURCE_STATES.has(result?.status)) return unavailable(result.status, "provider");
  if (result?.status !== "ready") return unavailable("error", "provider", "invalid_provider_result");
  return adaptEvidenceSourceSnapshot(result.snapshot, { caseId, evidenceId, origin: "provider" });
}
