import { getCase } from "./storage.js";
import { recoverOrphanedProcessingRuns } from "./processing-orphan-recovery.js";
import { renderStorageRecovery } from "./storage-recovery-ui.js";
import { loadWorkspaceModules } from "./workspace-modules.js";

const caseId = new URLSearchParams(location.search).get("id");
const workspace = document.querySelector("#workspace");
const errorView = document.querySelector("#workspace-error");
const deleteButton = document.querySelector("#delete-case");
const skipLink = document.querySelector(".skip-link");

function prepareErrorView() {
  workspace.hidden = true;
  errorView.hidden = false;
  deleteButton.hidden = true;
  skipLink.href = "#workspace-error";
}

function showMissingCase() {
  prepareErrorView();
  delete errorView.dataset.storageRecovery;
  errorView.dataset.state = "missing";
  errorView.innerHTML = '<section class="workspace-missing" role="status"><div class="workspace-missing-icon" aria-hidden="true">◇</div><span class="section-label">CASE NOT FOUND ON THIS DEVICE</span><h1>We couldn’t find this local case.</h1><p>It may have been deleted, created in another browser, or removed when this browser’s site data was cleared. CaseFind did not create or change any records.</p><div class="workspace-missing-actions"><a class="button" href="cases.html">Back to local cases</a><a class="button-secondary" href="cases-new.html">Create a new case</a></div></section>';
}

function showStorageRecovery(error) {
  prepareErrorView();
  delete errorView.dataset.state;
  renderStorageRecovery(errorView, error, {
    scope: "workspace",
    retry: () => location.reload(),
    backHref: "cases.html",
    backLabel: "Back to local cases",
  });
}

function waitForBaseWorkspace() {
  if (!workspace.hidden) return Promise.resolve("ready");
  if (!errorView.hidden) return Promise.resolve("error");
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!workspace.hidden || !errorView.hidden) {
        observer.disconnect();
        resolve(workspace.hidden ? "error" : "ready");
      }
    });
    observer.observe(workspace, { attributes: true, attributeFilter: ["hidden"] });
    observer.observe(errorView, { attributes: true, attributeFilter: ["hidden"] });
  });
}

async function boot() {
  if (!caseId) { showMissingCase(); return; }
  try {
    const record = await getCase(caseId);
    if (!record) { showMissingCase(); return; }
    const state = await waitForBaseWorkspace();
    if (state === "ready") {
      await recoverOrphanedProcessingRuns(caseId);
      await loadWorkspaceModules();
    } else showStorageRecovery(new Error("Workspace storage became unavailable."));
  } catch (error) {
    showStorageRecovery(error);
  }
}

boot();
