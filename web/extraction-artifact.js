export const MAX_ANALYSIS_CHARACTERS = 200_000;
export const MAX_ANALYSIS_PAGES = 500;
const MAX_METADATA_LENGTH = 200;
const MAX_WARNINGS = 100;
const MAX_WARNING_LENGTH = 1_000;
const MAX_WARNING_CHARACTERS = 20_000;

function boundedText(value, maximum = MAX_METADATA_LENGTH) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

export function isValidAnalysisPages(pages, maxCharacters = MAX_ANALYSIS_CHARACTERS) {
  if (!Array.isArray(pages) || pages.length === 0 || pages.length > MAX_ANALYSIS_PAGES) return false;
  const numbers = new Set();
  let characters = 0;
  let readableCharacters = 0;
  for (const page of pages) {
    if (!Number.isInteger(page?.pageNumber) || page.pageNumber < 1 || numbers.has(page.pageNumber) || typeof page.text !== "string") return false;
    numbers.add(page.pageNumber);
    characters += page.text.length;
    readableCharacters += page.text.trim().length;
    if (characters > maxCharacters) return false;
  }
  return readableCharacters > 0;
}

export function isValidExtractionArtifact(artifact, { maxCharacters = MAX_ANALYSIS_CHARACTERS } = {}) {
  if (!artifact || typeof artifact !== "object") return false;
  if (!boundedText(artifact.adapterId) || !boundedText(artifact.adapterVersion)) return false;
  if (!isValidAnalysisPages(artifact.pages, maxCharacters) || typeof artifact.text !== "string" || artifact.text.length > maxCharacters) return false;

  const expectedText = artifact.pages.map((page) => page.text.trim()).filter(Boolean).join("\n\n");
  if (artifact.text !== expectedText) return false;

  if (artifact.warnings !== undefined) {
    if (!Array.isArray(artifact.warnings) || artifact.warnings.length > MAX_WARNINGS) return false;
    let warningCharacters = 0;
    for (const warning of artifact.warnings) {
      if (!boundedText(warning, MAX_WARNING_LENGTH)) return false;
      warningCharacters += warning.length;
      if (warningCharacters > MAX_WARNING_CHARACTERS) return false;
    }
  }

  const hasRanges = artifact.pages.some((page) => page?.start !== undefined || page?.end !== undefined);
  if (hasRanges) {
    let offset = 0;
    for (const page of artifact.pages) {
      const text = page.text.trim();
      if (!text) return false;
      if (!Number.isInteger(page.start) || !Number.isInteger(page.end) || page.start !== offset || page.end !== offset + text.length) return false;
      offset = page.end + 2;
    }
  }
  return true;
}
