import { buildShellHref } from "../evidencespace-shell-model.js";
import { evidenceFixture } from "./fixtures.js";
import { escapeHtml, icon, pill, statePage } from "./page-utils.js";

function evidenceItem(item, selected) {
  return `
    <li class="es-source-item ${selected ? "is-selected" : ""}" data-tone="${escapeHtml(item.tone)}" ${selected ? 'aria-current="true"' : ""}>
      <div><span>${escapeHtml(item.id)} · ${escapeHtml(item.kind)}</span>${pill(item.state, item.tone)}</div>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.owner)} · ${escapeHtml(item.date)} · ${escapeHtml(item.size)}</p>
    </li>`;
}

function sourceStatePage({ caseId, status = "error" }) {
  const copy = {
    denied: ["You don’t have access", "Nothing private was shown. Ask a case owner if you believe you should have access."],
    missing: ["This source is not available", "The source record could not be found. Demo data was not substituted."],
    deleted: ["This source was removed", "The latest read says this source no longer exists. An older copy was not reused."],
    stale: ["This source needs to be checked", "Its processing record no longer matches the stored original. Nothing derived was shown."],
    changed: ["This source changed", "Its identity or source links no longer match. Reload after the source has been reviewed."],
    error: ["This source couldn’t load", "Nothing changed. Try again when the source is available."],
  }[status] || ["This source couldn’t load", "Nothing changed. Try again when the source is available."];
  return `
    <section class="es-state-page" aria-labelledby="page-title">
      <div class="es-state-icon">${icon(status === "denied" ? "lock" : "warning")}</div>
      <p class="es-eyebrow">Evidence</p>
      <h1 id="page-title" tabindex="-1">${escapeHtml(copy[0])}</h1>
      <p>${escapeHtml(copy[1])}</p>
      <a class="es-button is-primary" data-route-link href="${buildShellHref("brief", caseId)}">Return to Brief</a>
    </section>`;
}

function highlightPhrase(value, phrase, tone) {
  const index = value.indexOf(phrase);
  if (index < 0) return escapeHtml(value);
  return `${escapeHtml(value.slice(0, index))}<mark data-tone="${tone}">${escapeHtml(phrase)}</mark>${escapeHtml(value.slice(index + phrase.length))}`;
}

function previewMarkup(record) {
  return record.preview.body.map((paragraph) => {
    let content = highlightPhrase(paragraph, record.preview.receipt, "confirmed");
    if (content === escapeHtml(paragraph)) content = highlightPhrase(paragraph, record.preview.concern, "contrary");
    return `<p>${content}</p>`;
  }).join("");
}

export function renderPage({ caseId, evidenceId, from, viewState, evidenceResult }) {
  if (viewState !== "ready") {
    return statePage({
      title: "Evidence",
      state: viewState,
      primaryHref: buildShellHref("brief", caseId),
      primaryLabel: "Return to Brief",
    });
  }
  if (evidenceResult?.status !== "ready") {
    return sourceStatePage({ caseId, status: evidenceResult?.status });
  }

  const record = evidenceResult.record;
  const briefHref = buildShellHref("brief", caseId);
  const contextHref = buildShellHref("evidence", caseId, {
    evidenceId: record.evidenceId,
    contextId: record.evidenceId,
    from: from || "brief",
  });
  const primaryStatement = record.statements.find(({ id }) => id === "A1");
  const contraryStatement = record.statements.find(({ tone }) => tone === "contrary");
  const reviewControls = record.origin === "synthetic" && primaryStatement
    ? `<div class="es-button-row"><button class="es-button is-primary" type="button" id="confirm-a1">${icon("check")} Confirm A1</button><button class="es-button" type="button" id="correct-a1">Correct</button></div>
       <form class="es-correction-form" id="correction-form" hidden><label for="correction-text">Corrected wording</label><textarea id="correction-text" rows="3">${escapeHtml(primaryStatement.quote)}</textarea><div class="es-button-row"><button class="es-button is-primary" type="submit">Save draft</button><button class="es-button" type="button" id="cancel-correction">Cancel</button></div></form>`
    : `<p class="es-library-note">${icon("lock")} Read-only source. Review decisions are not connected in this slice.</p>`;

  return `
    <section class="es-product-page es-evidence-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><p class="es-eyebrow">Source library</p><div class="es-title-line"><h1 id="page-title" tabindex="-1">Evidence</h1><span>6 sources · 2 need review</span></div></div>
        <div class="es-header-actions">${from ? `<a class="es-button" data-route-link href="${briefHref}">${icon("arrow-left")} Back to Brief</a>` : ""}${pill(record.origin === "synthetic" ? "Synthetic preview" : "Read-only source", record.origin === "synthetic" ? "ai" : "confirmed")}<a class="es-button" data-route-link href="${buildShellHref("research", caseId)}">Web research</a><button class="es-button is-primary" type="button" data-preview-action="add-evidence">${icon("plus")} Add evidence</button></div>
      </header>

      <div class="es-evidence-layout">
        <aside class="es-source-library" aria-label="Evidence sources">
          <label class="es-search-field">${icon("search")}<span class="es-sr-only">Search evidence</span><input type="search" placeholder="Search evidence"></label>
          <div class="es-filter-tabs is-compact" aria-label="Evidence filters"><button type="button" aria-pressed="true">All 6</button><button type="button" aria-pressed="false">Review 2</button><button type="button" aria-pressed="false">Originals</button></div>
          <p class="es-list-group">Needs review · 2</p>
          <ul>${evidenceFixture.slice(0, 2).map((item) => evidenceItem(item, item.id === evidenceId)).join("")}</ul>
          <p class="es-list-group is-confirmed">Confirmed · 4</p>
          <ul>${evidenceFixture.slice(2).map((item) => evidenceItem(item, false)).join("")}</ul>
          <p class="es-library-note">${icon("shield")} Research stays in its own lens.</p>
        </aside>

        <article class="es-source-viewer" aria-labelledby="source-title">
          <header><div class="es-source-heading"><span class="es-file-icon">${icon("file")}</span><div><h2 id="source-title">${escapeHtml(record.filename)}</h2><p>${escapeHtml(record.evidenceId)} · ${escapeHtml(record.kind)} · ${escapeHtml(record.sizeLabel)}</p></div>${pill(contraryStatement ? "Contrary" : "Source", contraryStatement ? "contrary" : "neutral")}</div><div class="es-view-controls"><button type="button" aria-label="Zoom out">−</button><span>100%</span><button type="button" aria-label="Zoom in">+</button></div></header>
          <div class="es-document-stage">
            ${primaryStatement ? `<div class="es-document-note is-confirmed">${escapeHtml(primaryStatement.id)} · ${escapeHtml(primaryStatement.state)}<br><strong>${escapeHtml(primaryStatement.label)}</strong></div>` : ""}
            ${contraryStatement ? `<div class="es-document-note is-contrary">${escapeHtml(contraryStatement.id)} · ${escapeHtml(contraryStatement.state)}<br><strong>${escapeHtml(contraryStatement.label)}</strong></div>` : ""}
            <section class="es-email-document" aria-label="Email preview">
              <div class="es-email-brand"><div><h3>Harbor Studio</h3><p>${escapeHtml(record.kind)}</p></div>${pill("Original source", "confirmed")}</div>
              <dl><div><dt>From</dt><dd>${escapeHtml(record.preview.from)}</dd></div><div><dt>To</dt><dd>${escapeHtml(record.preview.to)}</dd></div><div><dt>Date</dt><dd>${escapeHtml(record.preview.date)}</dd></div><div><dt>Subject</dt><dd>${escapeHtml(record.preview.subject)}</dd></div></dl>
              <div class="es-email-body">${previewMarkup(record)}<p>${escapeHtml(record.preview.closing).replaceAll("\n", "<br>")}</p></div>
              <footer><span>${escapeHtml(record.preview.footerLeft)}</span><span>${escapeHtml(record.preview.footerRight)}</span></footer>
            </section>
          </div>
          <footer class="es-viewer-footer">${pill("Original unchanged", "confirmed")}<span>Annotations are overlays and never modify the source.</span><a data-route-link href="${contextHref}">${icon("comment")} 2 comments</a></footer>
        </article>

        <aside class="es-record-panel" aria-labelledby="record-title">
          <header><div><p class="es-eyebrow">Source record · ${escapeHtml(record.evidenceId)}</p><h2 id="record-title">Review and connections</h2></div>${pill("Needs review", "uncertain")}</header>
          <div class="es-integrity-note">${icon("shield")}<div><strong>Original and provenance recorded</strong><p>Working copies stay linked to this source.</p></div></div>
          <section><p class="es-record-label">Provenance</p><dl class="es-record-list"><div><dt>Added by</dt><dd>${escapeHtml(record.addedBy)}</dd></div><div><dt>Imported</dt><dd>${escapeHtml(record.imported)}</dd></div><div><dt>Format</dt><dd>${escapeHtml(record.kind)}</dd></div><div><dt>Integrity</dt><dd>${escapeHtml(record.integrity)}</dd></div></dl></section>
          <section><div class="es-section-heading"><div><p class="es-record-label">Extracted statements</p><span>Review source-linked wording</span></div>${pill(`${record.statements.length} detected`, "ai")}</div>
            <div class="es-statement-list">${record.statements.map((statement) => `<article data-statement="${escapeHtml(statement.id)}" data-tone="${escapeHtml(statement.tone)}"><div><span>${escapeHtml(statement.id)} · ${escapeHtml(statement.label)}</span>${pill(statement.state, statement.tone)}</div><q>${escapeHtml(statement.quote)}</q></article>`).join("")}</div>
            ${reviewControls}
          </section>
          <section><p class="es-record-label">Connected to · ${record.backlinks}</p><ul class="es-connected-list"><li><span data-tone="action"></span><a data-route-link href="${briefHref}"><strong>Current understanding</strong><small>Acceptance timing</small></a></li><li><span data-tone="contrary"></span><a data-route-link href="${buildShellHref("space", caseId)}"><strong>Space relation</strong><small>Contradicts F-03</small></a></li><li><span data-tone="ai"></span><a data-route-link href="${buildShellHref("work", caseId)}"><strong>Review task</strong><small>Due 30 August</small></a></li></ul></section>
          <footer><span>0 derivatives · ${record.backlinks} backlinks</span><a data-route-link href="${contextHref}">Open Context Lens</a></footer>
        </aside>
      </div>
    </section>`;
}

export function mountPage({ root, announce, toast }) {
  const confirm = root.querySelector("#confirm-a1");
  const statement = root.querySelector('[data-statement="A1"]');
  const correct = root.querySelector("#correct-a1");
  const form = root.querySelector("#correction-form");
  const textarea = root.querySelector("#correction-text");
  const cancel = root.querySelector("#cancel-correction");

  confirm?.addEventListener("click", () => {
    const confirmed = confirm.dataset.confirmed === "true";
    confirm.dataset.confirmed = String(!confirmed);
    confirm.innerHTML = confirmed ? `${icon("check")} Confirm A1` : `${icon("check")} A1 confirmed`;
    statement.dataset.reviewed = String(!confirmed);
    announce(confirmed ? "A1 returned to ready for review." : "A1 marked confirmed in this preview.");
    toast(confirmed ? "Review reopened" : "A1 confirmed", "This synthetic preview changed only in this browser session.");
  });

  correct?.addEventListener("click", () => {
    form.hidden = false;
    textarea.focus();
  });
  cancel?.addEventListener("click", () => {
    form.hidden = true;
    correct.focus();
  });
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    form.hidden = true;
    announce("Correction draft prepared in this preview.");
    toast("Correction drafted", "Nothing was saved to a case or shared.");
    correct.focus();
  });
  for (const button of root.querySelectorAll("[data-preview-action]")) {
    button.addEventListener("click", () => toast("Preview only", "Upload is not connected in this product slice."));
  }
  return undefined;
}
