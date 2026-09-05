import { expect, test } from "playwright/test";
import { waitForWorkspace } from "./workspace-file-fixture";

async function createCase(page: any, title: string) {
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(title);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying source uploads stay attached to a live case.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await waitForWorkspace(page);
  return page.evaluate(() => new URLSearchParams(location.search).get("id"));
}

test("an upload cannot recreate an already deleted case", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });

  const caseId = await createCase(page, "Deleted upload parent");
  const result = await page.evaluate(async (id) => {
    const storage = await import("/storage.js");
    const original = new File([new Uint8Array([1, 2, 3, 4])], "late.png", {
      type: "image/png",
      lastModified: 1_786_078_800_000,
    });
    const file = {
      id: "late-file",
      caseId: id,
      name: original.name,
      type: original.type,
      size: original.size,
      sha256: await storage.sha256(original),
      createdAt: "2026-08-07T05:00:00.000Z",
      original,
    };

    await storage.deleteCase(id);
    let error;
    try { await storage.saveFile(file); }
    catch (cause: any) { error = { name: cause?.name, code: cause?.code }; }

    return {
      error,
      caseRecord: await storage.getCase(id),
      files: await storage.getFilesForCase(id),
    };
  }, caseId);

  expect(result.error).toEqual({ name: "FileWriteError", code: "case_missing" });
  expect(result.caseRecord).toBeUndefined();
  expect(result.files).toEqual([]);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("concurrent case deletion and upload cannot leave an orphaned original", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const caseId = await createCase(page, "Concurrent upload parent");
  const result = await page.evaluate(async (id) => {
    const storage = await import("/storage.js");
    const original = new File([new Uint8Array([5, 6, 7, 8])], "racing.png", {
      type: "image/png",
      lastModified: 1_786_078_800_000,
    });
    const file = {
      id: "racing-file",
      caseId: id,
      name: original.name,
      type: original.type,
      size: original.size,
      sha256: await storage.sha256(original),
      createdAt: "2026-08-07T05:05:00.000Z",
      original,
    };

    const [upload, deletion] = await Promise.allSettled([
      storage.saveFile(file),
      storage.deleteCase(id),
    ]);
    return {
      upload: upload.status === "fulfilled"
        ? { status: upload.status }
        : { status: upload.status, name: upload.reason?.name, code: upload.reason?.code },
      deletion: deletion.status,
      caseRecord: await storage.getCase(id),
      files: await storage.getFilesForCase(id),
    };
  }, caseId);

  expect(result.deletion).toBe("fulfilled");
  expect(["fulfilled", "rejected"]).toContain(result.upload.status);
  if (result.upload.status === "rejected") {
    expect(result.upload).toEqual({ status: "rejected", name: "FileWriteError", code: "case_missing" });
  }
  expect(result.caseRecord).toBeUndefined();
  expect(result.files).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("the upload workflow explains when another tab removed the case", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });

  const caseId = await createCase(page, "Upload race guidance");
  await page.evaluate(() => {
    const browserWindow = window as any;
    const nativeDigest = crypto.subtle.digest.bind(crypto.subtle);
    let releaseDigest: (() => void) | undefined;
    const digestGate = new Promise<void>((resolve) => { releaseDigest = resolve; });
    browserWindow.__uploadDigestStarted = false;
    browserWindow.__releaseUploadDigest = releaseDigest;
    Object.defineProperty(crypto.subtle, "digest", {
      configurable: true,
      value: async (...args: Parameters<SubtleCrypto["digest"]>) => {
        browserWindow.__uploadDigestStarted = true;
        await digestGate;
        return nativeDigest(...args);
      },
    });
  });

  await page.locator("#file-input").setInputFiles({
    name: "late-ui.png",
    mimeType: "image/png",
    buffer: Buffer.from([9, 10, 11, 12]),
  });
  await page.waitForFunction(() => (window as any).__uploadDigestStarted === true);
  await page.evaluate(async (id) => {
    const storage = await import("/storage.js");
    await storage.deleteCase(id);
    (window as any).__releaseUploadDigest();
  }, caseId);

  await expect(page.locator("#upload-message")).toHaveText(
    "late-ui.png was not stored because this case was removed in another tab. Return to Case Hub to continue.",
  );
  const stored = await page.evaluate(async (id) => {
    const storage = await import("/storage.js");
    return { caseRecord: await storage.getCase(id), files: await storage.getFilesForCase(id) };
  }, caseId);
  expect(stored.caseRecord).toBeUndefined();
  expect(stored.files).toEqual([]);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
