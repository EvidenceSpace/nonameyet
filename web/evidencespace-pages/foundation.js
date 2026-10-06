import { buildShellHref } from "../evidencespace-shell-model.js";
import { escapeHtml, icon } from "./page-utils.js";

const NOTES = Object.freeze({
  "new-case": "You’ll describe what happened in your own words, and EvidenceSpace sorts it into dates, people and documents.",
  lawyers: "A short list of lawyers who handle this kind of case, with what they charge for a first call.",
  notifications: "Comments, due dates and anything shared with you, in one place.",
  support: "How your data is stored, who can see it, and how to get help.",
  settings: "Profile, appearance, notifications and privacy.",
  account: "Your sign-in details and devices.",
  research: "Official guidance saved for this case, kept apart from your own evidence.",
  work: "Tasks and drafts for this case, each linked to the source that prompted it.",
  room: "Conversations with the people on this case, attached to the exact thing being discussed.",
  reports: "A chronology or summary you can check line by line before you share it.",
});

export function renderPage({ route, caseId }) {
  const destination = route.kind === "case" ? buildShellHref("brief", caseId) : buildShellHref("home", caseId);
  const destinationLabel = route.kind === "case" ? "Back to Brief" : "Back to Home";
  return `
    <section class="es-coming-page" aria-labelledby="page-title">
      <div class="es-coming-card">
        <span class="es-coming-icon">${icon("layers")}</span>
        <div>
          <h1 id="page-title" tabindex="-1">${escapeHtml(route.title)}</h1>
          <p>${escapeHtml(NOTES[route.id] || "This part of EvidenceSpace is being designed.")}</p>
          <p class="es-muted">It isn’t in this preview yet.</p>
          <a class="es-button is-primary" data-route-link href="${destination}">${destinationLabel}</a>
        </div>
      </div>
    </section>`;
}
