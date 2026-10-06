import { ROUTES, buildShellHref } from "../evidencespace-shell-model.js";
import { caseFixture, evidenceDocumentsFixture, evidenceFixture, evidenceRecordsFixture, peopleFixture } from "./fixtures.js";
import { escapeHtml, icon, pill, previewLimitPage, statePage } from "./page-utils.js";

const KIND_ICON = { Email: "mail", PDF: "file", Image: "image", Note: "note" };

function sourceItem(item, selectedId, caseId, from) {
  const selected = item.id === selectedId;
  const href = buildShellHref("evidence", caseId, { evidenceId: item.id, from: from || undefined });
  return `
    <li class="es-source-item ${selected ? "is-selected" : ""}" data-tone="${escapeHtml(item.tone)}" data-review="${item.needsReview ? "needs" : "done"}" data-search="${escapeHtml(`${item.id} ${item.title} ${item.label} ${item.kind}`.toLowerCase())}" ${selected ? 'aria-current="true"' : ""}>
      <a data-route-link data-route-replace href="${href}" ${selected ? 'aria-current="page"' : ""}>
        <span class="es-source-icon" data-tone="${escapeHtml(item.tone)}">${icon(KIND_ICON[item.kind] || "file")}</span>
        <span class="es-source-copy">
          <span class="es-source-meta"><span>${escapeHtml(item.id)}</span><span>${escapeHtml(item.date)}</span></span>
          <strong>${escapeHtml(item.label)}</strong>
          <small>${escapeHtml(item.title)}</small>
        </span>
        ${item.needsReview ? `<span class="es-dot" data-tone="${escapeHtml(item.tone)}" title="${escapeHtml(item.state)}"></span>` : ""}
      </a>
    </li>`;
}

function inline(paragraph) {
  if (paragraph.text) return escapeHtml(paragraph.text).replace(/\n/g, "<br>");
  return paragraph.parts.map((part) => part.mark
    ? `<mark data-tone="${escapeHtml(part.tone)}" data-mark="${escapeHtml(part.mark)}" id="mark-${escapeHtml(part.mark)}">${escapeHtml(part.text)}<sup>${escapeHtml(part.mark)}</sup></mark>`
    : escapeHtml(part.text)).join("");
}

function documentMarkup(id, item) {
  const doc = evidenceDocumentsFixture[id];
  if (!doc) return `<div class="es-doc-empty"><p>No preview for this file.</p></div>`;
  if (doc.type === "email") {
    return `
      <section class="es-doc es-doc-email" aria-label="Email preview">
        <div class="es-doc-email-head">
          <h3>${escapeHtml(doc.heading)}</h3>
          <dl>
            <div><dt>From</dt><dd>${escapeHtml(doc.from)}</dd></div>
            <div><dt>To</dt><dd>${escapeHtml(doc.to)}</dd></div>
            <div><dt>Sent</dt><dd>${escapeHtml(doc.sent)}</dd></div>
          </dl>
        </div>
        <div class="es-doc-body">${doc.paragraphs.map((p) => `<p>${inline(p)}</p>`).join("")}</div>
      </section>`;
  }
  if (doc.type === "document") {
    return `
      <section class="es-doc es-doc-paper" aria-label="Document preview">
        <h3>${escapeHtml(doc.heading)}</h3>
        <p class="es-doc-meta">${escapeHtml(doc.meta)}</p>
        <div class="es-doc-body">${doc.paragraphs.map((p) => `<p>${inline(p)}</p>`).join("")}</div>
        <p class="es-doc-page">Page 2 of 4</p>
      </section>`;
  }
  if (doc.type === "invoice") {
    return `
      <section class="es-doc es-doc-paper es-doc-invoice" aria-label="Invoice preview">
        <div class="es-invoice-head"><div><strong>Alder Design</strong><span>${escapeHtml(peopleFixture.user.email)}</span></div><h3>${escapeHtml(doc.heading)}</h3></div>
        <p class="es-doc-meta">${escapeHtml(doc.meta)}</p>
        <p class="es-doc-meta">Billed to Harbor Studio</p>
        <table><tbody>${doc.rows.map(([label, value], index) => `<tr class="${index === doc.rows.length - 1 ? "is-total" : ""}"><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>
      </section>`;
  }
  if (doc.type === "image") {
    return `
      <figure class="es-doc es-doc-image" aria-label="Screenshot preview">
        <div class="es-phone" aria-hidden="true">
          <div class="es-phone-bar"></div>
          <div class="es-phone-hero"></div>
          <div class="es-phone-line"></div><div class="es-phone-line is-short"></div>
          <div class="es-phone-note is-one">1</div>
          <div class="es-phone-foot"></div>
          <div class="es-phone-note is-two">2</div>
        </div>
        <figcaption><strong>${escapeHtml(doc.heading)}</strong><span>${escapeHtml(doc.meta)}. ${escapeHtml(doc.caption)}</span></figcaption>
      </figure>`;
  }
  return `
    <section class="es-doc es-doc-note" aria-label="Note">
      <h3>${escapeHtml(doc.heading)}</h3>
      <p class="es-doc-meta">${escapeHtml(doc.meta)}</p>
      <div class="es-doc-body">${doc.paragraphs.map((p) => `<p>${inline(p)}</p>`).join("")}</div>
    </section>`;
}

function recordFor(id, item) {
  const record = evidenceRecordsFixture[id];
  if (record) return record;
  const doc = evidenceDocumentsFixture[id];
  const statements = [];
  for (const paragraph of doc?.paragraphs || []) {
    for (const part of paragraph.parts || []) {
      if (part.mark) statements.push({ id: part.mark, label: "Marked passage", quote: part.text, tone: part.tone, state: part.tone === "contrary" ? "Contradicts" : "Supports" });
    }
  }
  return {
    title: item.label,
    addedBy: item.owner === "You" ? peopleFixture.user.name : peopleFixture.riley.name,
    added: item.date,
    format: `${item.kind}${item.size === "Note" ? "" : ` · ${item.size}`}`,
    integrity: item.kind === "Note" ? "Written in EvidenceSpace" : "Matches the original",
    statements,
    links: [{ label: "Brief", detail: "Was the work accepted?", route: "brief", tone: "action" }],
  };
}

function statementMarkup(statement) {
  return `
    <article class="es-statement" data-statement="${escapeHtml(statement.id)}" data-tone="${escapeHtml(statement.tone)}">
      <div class="es-statement-top"><a class="es-mark-link" href="#mark-${escapeHtml(statement.id)}" data-mark-jump="${escapeHtml(statement.id)}">${escapeHtml(statement.id)}</a><span>${escapeHtml(statement.label)}</span>${pill(statement.state, statement.tone)}</div>
      <q>${escapeHtml(statement.quote)}</q>
      <div class="es-statement-actions">
        <button class="es-button is-small" type="button" data-confirm="${escapeHtml(statement.id)}" id="confirm-${escapeHtml(statement.id.toLowerCase())}" aria-pressed="false">${icon("check")} Mark as checked</button>
        <button class="es-inline-button" type="button" data-correct="${escapeHtml(statement.id)}" id="correct-${escapeHtml(statement.id.toLowerCase())}">Correct wording</button>
      </div>
      <form class="es-correction-form" data-correction="${escapeHtml(statement.id)}" hidden>
        <label for="correction-${escapeHtml(statement.id)}">What does it actually say?</label>
        <textarea id="correction-${escapeHtml(statement.id)}" rows="3">${escapeHtml(statement.quote)}</textarea>
        <div class="es-button-row"><button class="es-button is-primary is-small" type="submit">Save correction</button><button class="es-button is-small is-quiet" type="button" data-cancel="${escapeHtml(statement.id)}">Cancel</button></div>
      </form>
    </article>`;
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

  if (caseId !== caseFixture.id) return previewLimitPage({ caseId, title: "Evidence", intro: "No sources in this preview case yet." });

  const item = evidenceFixture.find((candidate) => candidate.id === evidenceId) || evidenceFixture[0];
  const id = item.id;
  const record = recordFor(id, item);
  const needs = evidenceFixture.filter((candidate) => candidate.needsReview);
  const done = evidenceFixture.filter((candidate) => !candidate.needsReview);
  const backRoute = from && from !== "evidence" ? ROUTES[from] : null;
  const backHref = backRoute ? buildShellHref(backRoute.id, caseId) : "";
  const contextHref = buildShellHref("evidence", caseId, { evidenceId: id, contextId: id, from: from || undefined });
  return `
    <section class="es-product-page es-evidence-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><h1 id="page-title" tabindex="-1">Evidence</h1><p>${evidenceFixture.length} sources · ${needs.length} still to read</p></div>
        <div class="es-header-actions">
          ${backRoute ? `<a class="es-button is-quiet" data-route-link href="${backHref}">${icon("arrow-left")} Back to ${escapeHtml(backRoute.title)}</a>` : ""}
          <button class="es-button is-primary" type="button" data-preview-action="add-evidence">${icon("plus")} Add evidence</button>
        </div>
      </header>

      <div class="es-evidence-layout">
        <aside class="es-source-library" aria-label="Sources in this case">
          <label class="es-search-field is-compact">${icon("search")}<span class="es-sr-only">Search sources</span><input id="source-search" type="search" placeholder="Search sources" autocomplete="off"></label>
          <div class="es-segmented is-compact" role="group" aria-label="Show">
            <button type="button" data-source-filter="all" aria-pressed="true">All <span>${evidenceFixture.length}</span></button>
            <button type="button" data-source-filter="needs" aria-pressed="false">To read <span>${needs.length}</span></button>
          </div>
          <div class="es-source-group" data-group="needs"><p class="es-list-group">To read</p><ul>${needs.map((candidate) => sourceItem(candidate, id, caseId, from)).join("")}</ul></div>
          <div class="es-source-group" data-group="done"><p class="es-list-group">Read</p><ul>${done.map((candidate) => sourceItem(candidate, id, caseId, from)).join("")}</ul></div>
          <p class="es-no-results is-compact" id="source-no-results" hidden>Nothing matches.</p>
        </aside>

        <article class="es-source-viewer" aria-labelledby="source-title" data-vt-target="${escapeHtml(id)}">
          <header class="es-viewer-head">
            <span class="es-source-icon" data-tone="${escapeHtml(item.tone)}">${icon(KIND_ICON[item.kind] || "file")}</span>
            <div><h2 id="source-title">${escapeHtml(item.title)}</h2><p>${escapeHtml(id)} · ${escapeHtml(item.kind)} · ${escapeHtml(item.size)}</p></div>
            ${pill(item.state, item.tone)}
            <div class="es-zoom" role="group" aria-label="Zoom">
              <button type="button" data-zoom="-1" aria-label="Zoom out">−</button><output id="zoom-value">100%</output><button type="button" data-zoom="1" aria-label="Zoom in">+</button>
            </div>
          </header>
          <div class="es-document-stage"><div class="es-document-scale" id="document-scale">${documentMarkup(id, item)}</div></div>
          <footer class="es-viewer-footer">${icon("lock")}<span>Highlights sit on top. The original file never changes.</span><a class="es-text-link" data-route-link href="${contextHref}">${icon("comment")} 2 comments</a></footer>
        </article>

        <aside class="es-record-panel" aria-labelledby="record-title">
          <header><h2 id="record-title">${escapeHtml(record.title)}</h2><p>${icon("shield")} ${escapeHtml(record.integrity)}</p></header>
          <dl class="es-record-list">
            <div><dt>Added by</dt><dd>${escapeHtml(record.addedBy)}</dd></div>
            <div><dt>Added</dt><dd>${escapeHtml(record.added)}</dd></div>
            <div><dt>Format</dt><dd>${escapeHtml(record.format)}</dd></div>
          </dl>
          <section class="es-record-section" aria-labelledby="statements-title">
            <h3 id="statements-title">Marked passages <span>${record.statements.length}</span></h3>
            ${record.statements.length
              ? `<div class="es-statement-list">${record.statements.map(statementMarkup).join("")}</div>`
              : `<p class="es-muted">Nothing marked in this file yet.</p>`}
          </section>
          <section class="es-record-section" aria-labelledby="links-title">
            <h3 id="links-title">Used in <span>${record.links.length}</span></h3>
            <ul class="es-connected-list">${record.links.map((link) => `<li><span class="es-dot" data-tone="${escapeHtml(link.tone)}" aria-hidden="true"></span><a data-route-link href="${buildShellHref(link.route, caseId)}"><strong>${escapeHtml(link.label)}</strong><small>${escapeHtml(link.detail)}</small></a></li>`).join("")}</ul>
          </section>
          <footer><a class="es-button is-quiet is-small" data-route-link href="${contextHref}">Show details</a></footer>
        </aside>
      </div>
    </section>`;
}

export function mountPage({ root, announce, toast }) {
  const cleanups = [];
  const on = (target, type, handler) => {
    target?.addEventListener(type, handler);
    cleanups.push(() => target?.removeEventListener(type, handler));
  };

  for (const button of root.querySelectorAll("[data-confirm]")) {
    on(button, "click", () => {
      const statementId = button.dataset.confirm;
      const article = root.querySelector(`[data-statement="${statementId}"]`);
      const checked = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!checked));
      button.innerHTML = checked ? `${icon("check")} Mark as checked` : `${icon("check")} Checked`;
      article.dataset.reviewed = String(!checked);
      announce(checked ? `${statementId} unmarked.` : `${statementId} marked as checked.`);
      if (!checked) {
        toast(`${statementId} checked`, "Saved in this preview only.", {
          actionLabel: "Undo",
          onAction: () => button.click(),
        });
      }
    });
  }

  for (const button of root.querySelectorAll("[data-correct]")) {
    const statementId = button.dataset.correct;
    const form = root.querySelector(`[data-correction="${statementId}"]`);
    on(button, "click", () => {
      form.hidden = false;
      form.querySelector("textarea").focus();
    });
    on(form.querySelector("[data-cancel]"), "click", () => {
      form.hidden = true;
      button.focus();
    });
    on(form, "submit", (event) => {
      event.preventDefault();
      form.hidden = true;
      announce(`Correction to ${statementId} saved in this preview.`);
      toast("Correction saved", "The original stays as it was. Your wording sits beside it.");
      button.focus();
    });
  }

  for (const link of root.querySelectorAll("[data-mark-jump]")) {
    on(link, "click", (event) => {
      event.preventDefault();
      const mark = root.querySelector(`#mark-${link.dataset.markJump}`);
      if (!mark) return;
      mark.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      mark.classList.remove("is-pulsing");
      void mark.offsetWidth;
      mark.classList.add("is-pulsing");
    });
  }

  let zoom = 100;
  const scale = root.querySelector("#document-scale");
  const zoomValue = root.querySelector("#zoom-value");
  for (const button of root.querySelectorAll("[data-zoom]")) {
    on(button, "click", () => {
      zoom = Math.min(140, Math.max(80, zoom + Number(button.dataset.zoom) * 10));
      scale.style.setProperty("--zoom", String(zoom / 100));
      zoomValue.textContent = `${zoom}%`;
    });
  }

  const search = root.querySelector("#source-search");
  const filters = [...root.querySelectorAll("[data-source-filter]")];
  const items = [...root.querySelectorAll(".es-source-item")];
  const groups = [...root.querySelectorAll(".es-source-group")];
  const empty = root.querySelector("#source-no-results");
  let filter = "all";
  const apply = () => {
    const query = (search?.value || "").trim().toLowerCase();
    for (const item of items) {
      item.hidden = !((filter === "all" || item.dataset.review === filter) && (!query || item.dataset.search.includes(query)));
    }
    for (const group of groups) group.hidden = !group.querySelector(".es-source-item:not([hidden])");
    empty.hidden = items.some((item) => !item.hidden);
  };
  on(search, "input", apply);
  for (const button of filters) {
    on(button, "click", () => {
      filter = button.dataset.sourceFilter;
      for (const candidate of filters) candidate.setAttribute("aria-pressed", String(candidate === button));
      apply();
    });
  }

  for (const button of root.querySelectorAll("[data-preview-action]")) {
    on(button, "click", () => toast("Not in the preview yet", "Adding files will come with the storage work. Nothing was uploaded."));
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
