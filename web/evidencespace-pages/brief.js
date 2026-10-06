import { buildShellHref } from "../evidencespace-shell-model.js";
import { briefAttentionFixture, caseFixture, peopleFixture } from "./fixtures.js";
import { escapeHtml, icon, miniCaseMap, previewLimitPage, statePage } from "./page-utils.js";

function pointList(items, caseId, tone) {
  return `<ul class="es-point-list" data-tone="${tone}">${items.map((item) => {
    const ref = item.ref
      ? `<a class="es-ref" data-route-link data-vt="${escapeHtml(item.ref)}" href="${buildShellHref("evidence", caseId, { evidenceId: item.ref, from: "brief" })}">${escapeHtml(item.ref)}</a>`
      : "";
    return `<li>${ref}<span>${escapeHtml(item.text)}</span></li>`;
  }).join("")}</ul>`;
}

const STEPS = [
  { label: "Gather", note: "6 sources added", state: "done" },
  { label: "Check facts", note: "2 sources to read", state: "current" },
  { label: "Look up the rules", note: "1 guide saved", state: "todo" },
  { label: "Act", note: "Payment request", state: "todo" },
];

export function renderPage({ caseId, viewState }) {
  if (viewState !== "ready") {
    return statePage({
      title: "Brief",
      state: viewState,
      primaryHref: buildShellHref("cases", caseId),
      primaryLabel: "Return to cases",
    });
  }

  if (caseId !== caseFixture.id) return previewLimitPage({ caseId, title: "Current situation" });

  const evidenceHref = buildShellHref("evidence", caseId, { evidenceId: "E-04", from: "brief" });
  const support = caseFixture.supports.length;
  const against = caseFixture.against.length;
  const unknown = caseFixture.unknowns.length;
  return `
    <section class="es-product-page es-brief-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><h1 id="page-title" tabindex="-1">Current situation</h1><p>Updated 12 minutes ago by ${escapeHtml(peopleFixture.riley.firstName)}</p></div>
        <ol class="es-steps" aria-label="Progress">
          ${STEPS.map((step, index) => `<li data-state="${step.state}" ${step.state === "current" ? 'aria-current="step"' : ""}><span class="es-step-mark">${step.state === "done" ? icon("check") : index + 1}</span><span><strong>${escapeHtml(step.label)}</strong><small>${escapeHtml(step.note)}</small></span></li>`).join("")}
        </ol>
      </header>

      <div class="es-brief-layout">
        <div class="es-brief-main">
          <article class="es-summary-card" aria-labelledby="summary-title">
            <div class="es-summary-copy">
              <h2 id="summary-title" class="es-section-title">In short</h2>
              <p class="es-summary-text">${escapeHtml(caseFixture.summary)}</p>
              <p class="es-tally"><span data-tone="confirmed">${support} support</span><span data-tone="contrary">${against} contradict</span><span data-tone="uncertain">${unknown} unknown</span></p>
              <p class="es-fine-print">${icon("info")} This summarises what your sources say. It can’t tell you how a court would decide.</p>
            </div>
            <div class="es-summary-map">${miniCaseMap({ caseId, origin: "brief", contextRoute: "brief" })}</div>
          </article>

          <div class="es-evidence-columns">
            <section class="es-column-card" data-tone="confirmed" aria-labelledby="supports-title">
              <h2 id="supports-title">${icon("check")} What supports you</h2>
              ${pointList(caseFixture.supports, caseId, "confirmed")}
            </section>
            <section class="es-column-card" data-tone="contrary" aria-labelledby="against-title">
              <h2 id="against-title">${icon("warning")} What cuts against you</h2>
              ${pointList(caseFixture.against, caseId, "contrary")}
            </section>
            <section class="es-column-card" data-tone="uncertain" aria-labelledby="unknown-title">
              <h2 id="unknown-title">${icon("question")} Still unknown</h2>
              ${pointList(caseFixture.unknowns, caseId, "uncertain")}
            </section>
          </div>
        </div>

        <aside class="es-brief-side" aria-label="Next step and activity">
          <section class="es-next-step-card" aria-labelledby="next-step-title">
            <p class="es-quiet-line">Next step</p>
            <h2 id="next-step-title">${escapeHtml(caseFixture.nextStep)}</h2>
            <p>It’s the only source that might change the story. Everything else points the same way.</p>
            <div class="es-button-row">
              <a class="es-button is-primary" data-route-link data-vt="E-04" href="${evidenceHref}">${icon("mail")} Review source</a>
              <button class="es-button is-quiet" type="button" id="toggle-reasoning" aria-expanded="false" aria-controls="reasoning-note">Why this step</button>
            </div>
            <div class="es-reasoning" id="reasoning-note" hidden>
              <p>E-01 and E-03 show delivery and the payment term. E-04 is the first written concern, sent two days later. If anything was said before 31 July, the picture changes.</p>
            </div>
          </section>

          <section class="es-side-card" aria-labelledby="queue-title">
            <div class="es-section-heading"><h2 id="queue-title">On your list</h2><span>${briefAttentionFixture.length}</span></div>
            <ul class="es-attention-list">${briefAttentionFixture.map((item) => `
              <li data-tone="${escapeHtml(item.tone)}">
                <span class="es-list-icon" data-tone="${escapeHtml(item.tone)}">${icon(item.tone === "ai" ? "spark" : item.tone === "uncertain" ? "calendar" : "comment")}</span>
                <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>
              </li>`).join("")}</ul>
          </section>

          <section class="es-side-card" aria-labelledby="activity-title">
            <div class="es-section-heading"><h2 id="activity-title">While you were away</h2></div>
            <ul class="es-activity-list">
              <li><time>12:41</time><p><strong>${escapeHtml(peopleFixture.riley.firstName)} added a screenshot</strong><span>mobile-layout-note.png</span></p></li>
              <li><time>12:47</time><p><strong>${escapeHtml(peopleFixture.riley.firstName)} asked a question</strong><span>“Did Mia mention the layouts on the call?”</span></p></li>
            </ul>
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
    });
  }
  return undefined;
}
