import { EXTENDED_SYNTHETIC_EXTRACTION_CASES } from "./extended-synthetic-extraction-cases.js";
import { SYNTHETIC_EXTRACTION_CASES } from "./synthetic-extraction-cases.js";

export const EXTRACTION_EVALUATION_CORPUS_VERSION = "synthetic-extraction.2026-07-30.v1";

/**
 * The canonical synthetic corpus. Changing membership or expected values
 * requires a new version so benchmark reports remain comparable.
 */
export const EXTRACTION_EVALUATION_CORPUS = Object.freeze({
  version: EXTRACTION_EVALUATION_CORPUS_VERSION,
  fixtures: Object.freeze([
    ...SYNTHETIC_EXTRACTION_CASES,
    ...EXTENDED_SYNTHETIC_EXTRACTION_CASES,
  ]),
});
