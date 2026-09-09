import { buildShellHref } from "../evidencespace-shell-model.js";
import { briefAttentionFixture, caseFixture } from "./fixtures.js";
import { escapeHtml, icon, miniCaseMap, pill, statePage } from "./page-utils.js";

export function renderPage({ caseId, viewState }) {
  if (viewState !== "ready") {
    return statePage({
      title: "Brief",
      state: viewState,
      primaryHref: buildShellHref("cases", caseId),
      primaryLabel: "Return to cases",
    });
  }

  const evidenceHref = buildShellHref("evidence", caseId, { evidenceId: "E-04", from: "brief" });
  return `
    <section class="es-product-page es-brief-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><p class="es-eyebrow">Case brief</p><h1 id="page-title" tabindex="-1">Current situation</h1></div>
        <div class="es-header-status">${pill("Sources synchronized", "confirmed")}<span>${icon("clock")} Updated 12m ago</span></div>
      </header>

      <div class="es-brief-layout">
        <div class="es-brief-main">
          <article class="es-summary-card">
            <div class="es-summary-copy">
              <div class="es-inline-meta">${pill("Reviewed understanding", "action")}${pill("Version 6", "neutral")}</div>
              <h2>${escapeHtml(caseFixture.summary)}</h2>
              <div class="es-summary-counts">${pill("4 confirmed facts", "confirmed")}${pill("3 original sources", "action")}${pill("1 contrary item", "contrary")}${pill("3 unknowns", "uncertain")}</div>
              <p class="es-trust-note">${icon("shield")} <strong>No outcome score.</strong> This reflects organization and source support—not legal certainty.</p>
            </div>
            <div class="es-summary-map"><span class="es-object-count">${icon("link")} 7 linked objects</span>${miniCaseMap({ caseId })}</div>
          </article>

          <div class="es-brief-lower">
            <section class="es-path-card" id="case-path" aria-labelledby="case-path-title">
              <div class="es-section-heading"><div><p class="es-eyebrow">Case path</p><h2 id="case-path-title">Where the work stands</h2></div>${pill("Descriptive, not predictive")}</div>
              <ol class="es-case-path">
                <li class="is-done"><span>✓</span><div><strong>Organize</strong><p>Core account structured</p></div></li>
                <li><span>2</span><div><strong>Verify</strong><p>4 facts confirmed; 2 gaps</p></div></li>
                <li><span>3</span><div><strong>Research</strong><p>2 current official sources</p></div></li>
                <li class="is-next"><span>4</span><div><strong>Act</strong><p>Review contrary email</p></div></li>
              </ol>
              <div class="es-path-note">${icon("pulse")}<div><strong>Organized enough to continue</strong><p>Reviewing the contrary source is more useful than adding documents now.</p></div><a data-route-link href="${evidenceHref}">Open source</a></div>
            </section>

            <section class="es-questions-card" aria-labelledby="questions-title">
              <p class="es-eyebrow">Unresolved</p><h2 id="questions-title">Three questions</h2>
              <ol><li>Exact acceptance wording</li><li>Contract payment date</li><li>First quality objection date</li></ol>
            </section>
          </div>
        </div>

        <aside class="es-brief-side" aria-label="Recommended action and attention">
          <section class="es-next-step-card">
            <div class="es-next-icon">${icon("spark")}</div>
            <div class="es-inline-meta"><span>Recommended next step</span>${pill("Source-linked", "ai")}</div>
            <h2>Review the 2 August email before drafting a payment request.</h2>
            <p>It is the only current source that may contradict the recorded timing.</p>
            <dl><div><dt>Source</dt><dd>E-04 · Email · Original</dd></div><div><dt>Impact</dt><dd>May change the summary</dd></div><div><dt>Recovery</dt><dd>No change until you confirm</dd></div></dl>
            <div class="es-button-row"><a class="es-button is-primary" data-route-link href="${evidenceHref}">${icon("file")} Review source</a><button class="es-button" type="button" id="toggle-reasoning" aria-expanded="false" aria-controls="reasoning-note">See why</button></div>
            <p class="es-reasoning" id="reasoning-note" hidden>E-02 and E-03 support acceptance. E-04 contains the first located quality concern, so its timing needs human review.</p>
          </section>

          <section class="es-side-card">
            <div class="es-section-heading"><div><p class="es-eyebrow is-contrary">Needs attention</p><h2>Three items</h2></div>${pill("3", "contrary")}</div>
            <ul class="es-attention-list">${briefAttentionFixture.map((item) => `<li><span class="es-list-icon" data-tone="${item.tone}">${icon(item.tone === "ai" ? "spark" : item.tone === "uncertain" ? "clock" : "comment")}</span><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>${pill(item.status, item.tone)}</li>`).join("")}</ul>
          </section>

          <section class="es-side-card">
            <div class="es-section-heading"><div><p class="es-eyebrow is-confirmed">Since you were away</p><h2>Quiet continuity</h2></div>${pill("No status changes", "confirmed")}</div>
            <ul class="es-activity-list"><li><time>12:41</time><span></span><p><strong>One source added</strong>Invoice.pdf by Riley</p></li><li><time>12:47</time><span></span><p><strong>One comment added</strong>On acceptance timing</p></li></ul>
          </section>
        </aside>
      </div>
    </section>`;
}

export function mountPage({ root }) {
  const button = root.querySelector("#toggle-reasoning");
  const note = root.querySelector("#reasoning-note");
  if (button && note) {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      note.hidden = open;
      button.textContent = open ? "See why" : "Hide reason";
    });
  }
  return undefined;
}
