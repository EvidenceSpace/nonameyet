import { buildShellHref } from "../evidencespace-shell-model.js";
import { evidenceFixture, selectedEvidenceFixture } from "./fixtures.js";
import { escapeHtml, icon, pill, statePage } from "./page-utils.js";

function evidenceItem(item, selected) {
  return `
    <li class="es-source-item ${selected ? "is-selected" : ""}" data-tone="${escapeHtml(item.tone)}" ${selected ? 'aria-current="true"' : ""}>
      <div><span>${escapeHtml(item.id)} · ${escapeHtml(item.kind)}</span>${pill(item.state, item.tone)}</div>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.owner)} · ${escapeHtml(item.date)} · ${escapeHtml(item.size)}</p>
    </li>`;
}

export function renderPage({ caseId, evidenceId, from, viewState }) {
  if (viewState !== "ready") {
    return statePage({
      title: "Evidence",
      state: viewState,
      primaryHref: buildShellHref("brief", caseId),
      primaryLabel: "Return to Brief",
    });
  }

  const briefHref = buildShellHref("brief", caseId);
  const contextHref = buildShellHref("evidence", caseId, { evidenceId: "E-04", contextId: "E-04", from: from || "brief" });
  return `
    <section class="es-product-page es-evidence-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><p class="es-eyebrow">Source library</p><div class="es-title-line"><h1 id="page-title" tabindex="-1">Evidence</h1><span>6 sources · 2 need review</span></div></div>
        <div class="es-header-actions">${from ? `<a class="es-button" data-route-link href="${briefHref}">${icon("arrow-left")} Back to Brief</a>` : ""}${pill("Originals protected", "confirmed")}<a class="es-button" data-route-link href="${buildShellHref("research", caseId)}">Web research</a><button class="es-button is-primary" type="button" data-preview-action="add-evidence">${icon("plus")} Add evidence</button></div>
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
          <header><div class="es-source-heading"><span class="es-file-icon">${icon("file")}</span><div><h2 id="source-title">${escapeHtml(selectedEvidenceFixture.filename)}</h2><p>E-04 · Original message · 24 KB</p></div>${pill("Contrary", "contrary")}</div><div class="es-view-controls"><button type="button" aria-label="Zoom out">−</button><span>100%</span><button type="button" aria-label="Zoom in">+</button></div></header>
          <div class="es-document-stage">
            <div class="es-document-note is-confirmed">A1 · Captured<br><strong>Receipt of final work</strong></div>
            <div class="es-document-note is-contrary">A2 · Contrary<br><strong>Quality concern raised</strong></div>
            <section class="es-email-document" aria-label="Email preview">
              <div class="es-email-brand"><div><h3>Harbor Studio</h3><p>Original email message</p></div>${pill("Original locked", "confirmed")}</div>
              <dl><div><dt>From</dt><dd>Mia Collins &lt;mia@harborstudio.co.uk&gt;</dd></div><div><dt>To</dt><dd>Alex Morgan &lt;alex@alder.design&gt;</dd></div><div><dt>Date</dt><dd>2 August 2026 · 10:14</dd></div><div><dt>Subject</dt><dd>Re: final delivery and invoice</dd></div></dl>
              <div class="es-email-body"><p>Hi Alex,</p><p><mark data-tone="confirmed">We received the final package on Friday</mark> and have started preparing the launch materials. We will send payment once the launch is complete.</p><p><mark data-tone="contrary">I do have concerns about some of the mobile layouts</mark>, and the team may send a list of changes next week.</p><p>Thanks,<br>Mia</p></div>
              <footer><span>Message ID preserved</span><span>Page 1 of 1</span></footer>
            </section>
          </div>
          <footer class="es-viewer-footer">${pill("Original unchanged", "confirmed")}<span>Annotations are overlays and never modify the source.</span><a data-route-link href="${contextHref}">${icon("comment")} 2 comments</a></footer>
        </article>

        <aside class="es-record-panel" aria-labelledby="record-title">
          <header><div><p class="es-eyebrow">Source record · E-04</p><h2 id="record-title">Review and connections</h2></div>${pill("Needs review", "uncertain")}</header>
          <div class="es-integrity-note">${icon("shield")}<div><strong>Original and provenance recorded</strong><p>Working copies stay linked to this source.</p></div></div>
          <section><p class="es-record-label">Provenance</p><dl class="es-record-list"><div><dt>Added by</dt><dd>${escapeHtml(selectedEvidenceFixture.addedBy)}</dd></div><div><dt>Imported</dt><dd>${escapeHtml(selectedEvidenceFixture.imported)}</dd></div><div><dt>Format</dt><dd>${escapeHtml(selectedEvidenceFixture.kind)}</dd></div><div><dt>Integrity</dt><dd>${escapeHtml(selectedEvidenceFixture.integrity)}</dd></div></dl></section>
          <section><div class="es-section-heading"><div><p class="es-record-label">Extracted statements</p><span>Review source-linked wording</span></div>${pill("2 detected", "ai")}</div>
            <div class="es-statement-list">${selectedEvidenceFixture.statements.map((statement) => `<article data-statement="${statement.id}" data-tone="${statement.tone}"><div><span>${statement.id} · ${statement.label}</span>${pill(statement.state, statement.tone)}</div><q>${escapeHtml(statement.quote)}</q></article>`).join("")}</div>
            <div class="es-button-row"><button class="es-button is-primary" type="button" id="confirm-a1">${icon("check")} Confirm A1</button><button class="es-button" type="button" id="correct-a1">Correct</button></div>
            <form class="es-correction-form" id="correction-form" hidden><label for="correction-text">Corrected wording</label><textarea id="correction-text" rows="3">We received the final package on Friday.</textarea><div class="es-button-row"><button class="es-button is-primary" type="submit">Save draft</button><button class="es-button" type="button" id="cancel-correction">Cancel</button></div></form>
          </section>
          <section><p class="es-record-label">Connected to · 3</p><ul class="es-connected-list"><li><span data-tone="action"></span><a data-route-link href="${briefHref}"><strong>Current understanding</strong><small>Acceptance timing</small></a></li><li><span data-tone="contrary"></span><a data-route-link href="${buildShellHref("space", caseId)}"><strong>Space relation</strong><small>Contradicts F-03</small></a></li><li><span data-tone="ai"></span><a data-route-link href="${buildShellHref("work", caseId)}"><strong>Review task</strong><small>Due 30 August</small></a></li></ul></section>
          <footer><span>0 derivatives · 2 backlinks</span><a data-route-link href="${contextHref}">Open Context Lens</a></footer>
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
