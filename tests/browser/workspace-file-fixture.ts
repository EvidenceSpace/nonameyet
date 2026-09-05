import { expect, type Page } from "playwright/test";

type StoredFileBytes =
  | { buffer: Uint8Array; bytes?: never }
  | { bytes: Uint8Array; buffer?: never };

export type StoredFileFixture = {
  id?: string;
  name: string;
  mimeType: string;
  createdAt?: string;
} & StoredFileBytes;

export async function waitForWorkspace(page: Page) {
  const workspace = page.locator("#workspace");
  await expect(workspace).toBeVisible({ timeout: 30_000 });
  await expect(workspace).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
}

export async function seedWorkspaceFiles(page: Page, fixtures: StoredFileFixture[]) {
  if (!fixtures.length) throw new Error("At least one stored file fixture is required.");
  await waitForWorkspace(page);
  const serialized = fixtures.map((fixture, index) => {
    const bytes = fixture.buffer ?? fixture.bytes;
    if (!bytes) throw new Error(`Stored file fixture ${fixture.name} requires byte content.`);
    const safeName = fixture.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "record";
    return {
      id: fixture.id || `fixture_file_${index}_${safeName}`,
      name: fixture.name,
      mimeType: fixture.mimeType,
      values: Array.from(bytes),
      createdAt: fixture.createdAt || "2026-08-06T18:00:00.000Z",
    };
  });
  await page.evaluate(async (items: Array<{
    id: string;
    name: string;
    mimeType: string;
    values: number[];
    createdAt: string;
  }>) => {
    const caseId = new URLSearchParams(location.search).get("id");
    if (!caseId) throw new Error("Workspace fixture requires a case id.");
    const storage = await import("/storage.js");
    for (const item of items) {
      const original = new File([Uint8Array.from(item.values)], item.name, {
        type: item.mimeType,
        lastModified: 0,
      });
      await storage.saveFile({
        id: item.id,
        caseId,
        name: original.name,
        type: original.type,
        size: original.size,
        sha256: await storage.sha256(original),
        createdAt: item.createdAt,
        original,
      });
    }
  }, serialized);
  await page.reload();
  await waitForWorkspace(page);
  for (const fixture of fixtures) {
    await expect(page.locator(".file-row", { hasText: fixture.name })).toHaveCount(1, { timeout: 30_000 });
  }
}
