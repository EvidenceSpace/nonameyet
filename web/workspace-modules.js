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
}
