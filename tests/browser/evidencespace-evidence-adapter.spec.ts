import { expect, test, type Page } from "playwright/test";

import { selectedEvidenceSourceFixture } from "../../web/evidencespace-pages/fixtures.js";

async function openEvidence(page: Page) {
  await page.goto("/evidencespace-shell.html?route=evidence&case=C-03&evidence=E-04&from=brief");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
}

test("renders a matching provider snapshot as a read-only source", async ({ page }) => {
  const snapshot = structuredClone(selectedEvidenceSourceFixture);
  snapshot.file.name = "provider-source.eml";
  snapshot.file.original.name = "provider-source.eml";
  snapshot.record.filename = "provider-source.eml";
  snapshot.record.title = "Provider source";
  snapshot.record.preview.subject = "Provider-backed subject";

  await page.addInitScript((source) => {
    (window as typeof window & { __evidenceSpaceEvidenceProvider?: unknown }).__evidenceSpaceEvidenceProvider = {
      readEvidenceRecord: async () => ({ status: "ready", snapshot: source }),
    };
  }, snapshot);
  await openEvidence(page);

  await expect(page.getByRole("heading", { name: "provider-source.eml" })).toBeVisible();
  await expect(page.getByText("Provider-backed subject", { exact: true })).toBeVisible();
  await expect(page.getByText("Read-only source", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm A1" })).toHaveCount(0);
  await expect(page.getByText(/Review decisions are not connected/)).toBeVisible();
});

test("does not substitute the synthetic source after provider denial", async ({ page }) => {
  await page.addInitScript(() => {
    (window as typeof window & { __evidenceSpaceEvidenceProvider?: unknown }).__evidenceSpaceEvidenceProvider = {
      readEvidenceRecord: async () => ({ status: "denied" }),
    };
  });
  await openEvidence(page);

  await expect(page.locator("#page-title")).toHaveText("You don’t have access");
  await expect(page.locator("#page-content")).not.toContainText("2-August-email.eml");
  await expect(page.locator("#page-content")).not.toContainText("Quality concern email");
  await expect(page.locator("#page-content")).toContainText("Nothing private was shown");
});

test("keeps Context Lens source content closed when provider identity is stale", async ({ page }) => {
  await page.addInitScript(() => {
    (window as typeof window & { __evidenceSpaceEvidenceProvider?: unknown }).__evidenceSpaceEvidenceProvider = {
      readEvidenceRecord: async () => ({ status: "stale" }),
    };
  });
  await page.goto("/evidencespace-shell.html?route=brief&case=C-03&context=E-04");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");

  await expect(page.locator("#context-lens")).toBeVisible();
  await expect(page.locator("#context-title")).toHaveText("Source needs checking");
  await expect(page.locator("#context-lens")).not.toContainText("Quality concern email");
  await expect(page.locator("#context-lens")).not.toContainText("Source-backed assessment");
  await expect(page.locator("[data-context-close]")).toBeVisible();
});
