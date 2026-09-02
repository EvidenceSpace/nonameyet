import { expect, test } from "playwright/test";

const hash = "a".repeat(64);
const saveFailure = "The timeline event could not be saved in this browser. Nothing was changed. Your draft is still open. Try again.";
const removeFailure = "The timeline event could not be removed. Nothing was changed. Try again.";

function observe(page: import("playwright/test").Page) {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (failure) => pageErrors.push(failure.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  return { pageErrors, externalRequests };
}

async function setupTimeline(page: import("playwright/test").Page, seedEvent = false) {
  await page.goto("/index.html?id=case-timeline");
  return page.evaluate(async ({ sourceHash, withEvent }) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("casefind-preview");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database deletion blocked"));
    });
    document.body.innerHTML = '<nav class="workspace-nav"><a href="#checklist">Checklist</a></nav><main><p id="upload-message"></p><div id="file-list"><button class="delete-file" data-id="file-timeline" type="button">Remove file</button></div><div id="record-preview"></div><div id="source-excerpt" hidden><mark id="source-quote"></mark></div><section id="checklist"></section></main>';
    const storage = await import("/storage.js");
    const caseId = "case-timeline";
    await storage.saveCase({ id: caseId, title: "Timeline test", updatedAt: "2026-08-07T00:00:00.000Z" });
    const original = new File([new Uint8Array([1, 2, 3, 4])], "proof.png", { type: "image/png", lastModified: 1_700_000_000_000 });
    const file = { id: "file-timeline", caseId, name: original.name, type: original.type, size: original.size, sha256: sourceHash, createdAt: "2026-08-07T00:01:00.000Z", original };
    await storage.saveFile(file, { now: () => "2026-08-07T00:02:00.000Z" });
    const event = {
      id: "event-timeline", caseId, eventDate: "2026-08-03", title: "Final files delivered",
      description: "Delivery noted in the selected screenshot.", sourceFileId: file.id,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "whole_file", quote: "Final files attached." } },
      origin: "user_entered", revision: 1,
      createdAt: "2026-08-03T00:00:00.000Z", updatedAt: "2026-08-03T00:00:00.000Z",
    };
    if (withEvent) await storage.createEvent(event, { now: () => "2026-08-07T00:03:00.000Z" });
    await import(`/timeline-ui.js?test=${crypto.randomUUID()}`);
    return { event, updatedAt: (await storage.getCase(caseId)).updatedAt };
  }, { sourceHash: hash, withEvent: seedEvent });
}

async function abortNext(page: import("playwright/test").Page, method: "add" | "put" | "delete") {
  await page.evaluate((methodName) => {
    const prototype = IDBObjectStore.prototype as IDBObjectStore & Record<string, (...args: unknown[]) => IDBRequest>;
    const original = prototype[methodName];
    let injected = false;
    prototype[methodName] = function (...args: unknown[]) {
      const request = original.apply(this, args);
      if (!injected && this.name === "events") { injected = true; this.transaction.abort(); }
      return request;
    };
  }, method);
}

test("a failed collision-safe create preserves its complete draft and stored state", async ({ page }) => {
  const observed = observe(page);
  const seeded = await setupTimeline(page);
  await page.locator("#add-timeline-event").click();
  const dialog = page.locator(".timeline-dialog");
  await dialog.locator("#timeline-date").fill("2026-08-03");
  await dialog.locator("#timeline-title").fill("Final files delivered");
  await dialog.locator("#timeline-description").fill("Delivery noted in the selected screenshot.");
  await dialog.locator("#timeline-quote").fill("Final files attached.");
  await abortNext(page, "add");
  await dialog.locator('button[type="submit"]').click();

  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".timeline-error")).toHaveText(saveFailure);
  await expect(dialog.locator("#timeline-title")).toHaveValue("Final files delivered");
  await expect(dialog.locator("#timeline-description")).toHaveValue("Delivery noted in the selected screenshot.");
  await expect(dialog.locator("#timeline-quote")).toHaveValue("Final files attached.");
  await expect(dialog).not.toHaveAttribute("aria-busy", "true");
  await expect(dialog.locator(".timeline-cancel")).toBeEnabled();
  await expect(dialog.locator('button[type="submit"]')).toHaveText("Save event");
  const state = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    return { events: await storage.getEventsForCase("case-timeline"), updatedAt: (await storage.getCase("case-timeline")).updatedAt };
  });
  expect(state.events).toEqual([]);
  expect(state.updatedAt).toBe(seeded.updatedAt);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});

test("a failed exact-current edit preserves the draft, event, revision, and activity", async ({ page }) => {
  const observed = observe(page);
  const seeded = await setupTimeline(page, true);
  const card = page.locator('.timeline-event[data-id="event-timeline"]');
  await card.locator(".timeline-edit").click();
  const dialog = page.locator(".timeline-dialog");
  await dialog.locator("#timeline-title").fill("Delivery confirmed by client");
  await abortNext(page, "put");
  await dialog.locator('button[type="submit"]').click();

  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".timeline-error")).toHaveText(saveFailure);
  await expect(dialog.locator("#timeline-title")).toHaveValue("Delivery confirmed by client");
  await expect(dialog.locator('button[type="submit"]')).toHaveText("Save changes");
  await expect(dialog.locator(".timeline-cancel")).toBeEnabled();
  const state = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    return { event: (await storage.getEventsForCase("case-timeline"))[0], updatedAt: (await storage.getCase("case-timeline")).updatedAt };
  });
  expect(state.event).toEqual(seeded.event);
  expect(state.event.revision).toBe(1);
  expect(state.updatedAt).toBe(seeded.updatedAt);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});

test("a failed exact-current removal resets confirmation and preserves the event", async ({ page }) => {
  const observed = observe(page);
  const seeded = await setupTimeline(page, true);
  const card = page.locator('.timeline-event[data-id="event-timeline"]');
  await abortNext(page, "delete");
  await card.locator(".timeline-remove").click();
  await card.locator(".timeline-remove").click();

  await expect(card).toBeVisible();
  await expect(card.locator(".timeline-event-status")).toHaveText(removeFailure);
  await expect(card.locator(".timeline-remove")).toHaveText("Remove");
  await expect(card.locator(".timeline-remove")).not.toHaveClass(/armed/);
  await expect(card).not.toHaveAttribute("aria-busy", "true");
  await expect(card.locator(".timeline-edit")).toBeEnabled();
  const state = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    return { event: (await storage.getEventsForCase("case-timeline"))[0], updatedAt: (await storage.getCase("case-timeline")).updatedAt };
  });
  expect(state.event).toEqual(seeded.event);
  expect(state.updatedAt).toBe(seeded.updatedAt);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});
