function processingRowsReady() {
  const rows = [...document.querySelectorAll("#file-list .file-row")];
  return rows.every((row) => row.querySelector(".processing-status"));
}

function waitForProcessingRows() {
  if (processingRowsReady()) return Promise.resolve();
  const root = document.querySelector("#file-list");
  if (!root) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = () => {
      clearTimeout(timeout);
      observer.disconnect();
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (processingRowsReady()) finish();
    });
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Workspace processing controls did not become ready."));
    }, 30_000);
    observer.observe(root, { childList: true, subtree: true });
    if (processingRowsReady()) finish();
  });
}

export async function loadWorkspaceModules() {
  await Promise.all([
    import("./processing-ui.js"),
    import("./report-ui.js"),
    import("./backup-ui.js"),
    import("./library-link.js"),
    import("./case-details-ui.js"),
    import("./workspace-delete-ui.js"),
    import("./timeline-ui.js"),
    import("./consistency-ui.js"),
    import("./readiness-ui.js"),
  ]);
  await waitForProcessingRows();
}
