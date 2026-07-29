import { detectFactConflicts } from "./consistency-model.js";

function locatorText(locator = {}) {
  if (locator.kind === "pdf_page") return `PDF page ${locator.page}`;
  if (locator.kind === "image_region") return `Image region x${locator.x}, y${locator.y}, ${locator.width}×${locator.height}`;
  if (locator.kind === "text_range") return `Text characters ${locator.start}–${locator.end}`;
  return "Whole file";
}

function escape(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function buildConsistencyAppendix({ record = {}, files = [], facts = [], options = {} }) {
  const includeNotes = options.includeConsistencyNotes === true;
  const includeQuotes = options.includeSourceQuotes !== false;
  const conflicts = detectFactConflicts({ record, files, facts });
  const items = conflicts.map((conflict) => {
    const resolution = conflict.resolution || null;
    const selected = resolution?.decision === "selected_fact"
      ? conflict.items.find((item) => String(item.factId) === String(resolution.selectedFactId)) || null
      : null;
    const decision = !resolution
      ? "No comparison decision recorded."
      : resolution.decision === "contextual"
        ? "User marked these values as potentially contextual."
        : `User selected “${selected?.value || "source-linked value"}” for the organized record.`;
    return {
      id: conflict.id,
      label: conflict.label,
      status: conflict.status,
      decision,
      selectedFactId: selected ? String(selected.factId) : null,
      note: includeNotes ? resolution?.note || "" : "",
      updatedAt: resolution?.updatedAt || "",
      values: conflict.items.map((item) => ({
        factId: String(item.factId),
        value: item.value,
        selected: selected ? String(item.factId) === String(selected.factId) : false,
        source: {
          fileId: item.sourceFileId,
          name: item.sourceName,
          sha256: item.sourceSha256,
          locator: locatorText(item.locator),
          quote: includeQuotes ? item.locator?.quote || "" : "",
        },
      })),
    };
  });
  const unresolvedCount = items.filter((item) => item.status === "unresolved").length;
  return {
    version: "casefind-source-consistency.v1",
    totalCount: items.length,
    unresolvedCount,
    resolvedCount: items.length - unresolvedCount,
    notesIncluded: includeNotes,
    items,
  };
}

export function renderConsistencyAppendixHtml(appendix) {
  const summary = `<section class="notice"><b>Source consistency boundary</b><p>CaseFind compared a narrow set of verified values with matching source provenance. A potential difference is a review prompt, not a finding that either source is wrong. ${appendix.unresolvedCount} comparison${appendix.unresolvedCount === 1 ? " remains" : "s remain"} unresolved.</p></section>`;
  if (!appendix.items.length) {
    return `<h2>Source consistency review</h2>${summary}<p class="empty">No supported cross-source differences were found among the verified facts included in this record.</p>`;
  }
  const items = appendix.items.map((item) => {
    const values = item.values.map((entry) => `<div class="source"><p class="value">${escape(entry.value)}</p>${entry.selected ? "<p><b>Selected for the organized record</b></p>" : ""}<p><b>Source:</b> ${escape(entry.source.name)} · ${escape(entry.source.locator)} · SHA-256 <code>${escape(entry.source.sha256)}</code></p>${entry.source.quote ? `<blockquote>${escape(entry.source.quote)}</blockquote>` : ""}</div>`).join("");
    return `<article class="fact"><div class="fact-number">${item.status === "resolved" ? "✓" : "!"}</div><div><h3>${escape(item.label)}</h3><p class="meta">${item.status === "resolved" ? "Reviewed" : "Needs comparison"}</p><p>${escape(item.decision)}</p>${item.note ? `<p class="private-note"><b>Included comparison note:</b> ${escape(item.note)}</p>` : ""}${values}</div></article>`;
  }).join("");
  return `<h2>Source consistency review</h2>${summary}${items}`;
}
