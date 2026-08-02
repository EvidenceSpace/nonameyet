import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const saveFailure = "The timeline event could not be saved in this browser. Nothing was changed. Your draft is still open. Try again.";
const removeFailure = "The timeline event could not be removed. Nothing was changed. Try again.";

async function abortNext(page: import("playwright/test").Page, method: "put" | "delete") {
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

test("timeline create, edit, and remove failures preserve records and drafts", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await page.goto("/cases-new.html"); await page.locator("#case-title").fill("Timeline rollback"); await page.locator("#client").fill("Example client"); await page.locator("#amount").fill("5000"); await page.locator("#summary").fill("A synthetic case verifying source-linked timeline actions remain trustworthy when local storage fails."); await page.locator("#continue-button").click(); await page.locator("#continue-button").click(); await page.locator("#local-storage-ack").check(); await page.locator("#continue-button").click(); await page.locator("#open-workspace").click(); await page.locator("#file-input").setInputFiles({ name: "delivery.png", mimeType: "image/png", buffer: imageBytes });
  const caseId = await page.evaluate(() => new URLSearchParams(location.search).get("id") as string);
  const originalUpdatedAt = await page.evaluate(async (id) => (await (await import("/storage.js")).getCase(id)).updatedAt, caseId);
  await page.locator("#add-timeline-event").click(); const dialog = page.locator(".timeline-dialog"); await dialog.locator("#timeline-date").fill("2026-08-03"); await dialog.locator("#timeline-title").fill("Final files delivered"); await dialog.locator("#timeline-description").fill("Delivery noted in the selected screenshot."); await dialog.locator("#timeline-quote").fill("Final files attached."); await abortNext(page, "put"); await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeVisible(); await expect(dialog.locator(".timeline-error")).toHaveText(saveFailure); await expect(dialog.locator("#timeline-title")).toHaveValue("Final files delivered"); await expect(dialog.locator('button[type="submit"]')).toHaveText("Save event"); expect(await page.evaluate(async (id) => (await (await import("/storage.js")).getEventsForCase(id)).length, caseId)).toBe(0); expect(await page.evaluate(async (id) => (await (await import("/storage.js")).getCase(id)).updatedAt, caseId)).toBe(originalUpdatedAt);
  await dialog.locator(".timeline-cancel").click(); const seeded = await page.evaluate(async (id) => { const s = await import("/storage.js"); const [file] = await s.getFilesForCase(id); const event = { id: "event_timeline_rollback", caseId: id, eventDate: "2026-08-03", title: "Final files delivered", description: "Delivery noted in the selected screenshot.", sourceFileId: file.id, sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "whole_file", quote: "Final files attached." } }, origin: "user_entered", revision: 1, createdAt: "2026-08-03T00:00:00.000Z", updatedAt: "2026-08-03T00:00:00.000Z" }; await s.saveEvent(event); return { event, updatedAt: (await s.getCase(id)).updatedAt }; }, caseId);
  await page.reload(); const card = page.locator('.timeline-event[data-id="event_timeline_rollback"]'); await card.locator(".timeline-edit").click(); await dialog.locator("#timeline-title").fill("Delivery confirmed by client"); await abortNext(page, "put"); await dialog.locator('button[type="submit"]').click(); await expect(dialog).toBeVisible(); await expect(dialog.locator(".timeline-error")).toHaveText(saveFailure); await expect(dialog.locator("#timeline-title")).toHaveValue("Delivery confirmed by client"); await expect(dialog.locator('button[type="submit"]')).toHaveText("Save changes"); const afterEdit = await page.evaluate(async (id) => ({ event: (await (await import("/storage.js")).getEventsForCase(id))[0], updatedAt: (await (await import("/storage.js")).getCase(id)).updatedAt }), caseId); expect(afterEdit.event.title).toBe(seeded.event.title); expect(afterEdit.event.revision).toBe(1); expect(afterEdit.updatedAt).toBe(seeded.updatedAt);
  await dialog.locator(".timeline-cancel").click(); await abortNext(page, "delete"); await card.locator(".timeline-remove").click(); await card.locator(".timeline-remove").click(); await expect(card).toBeVisible(); await expect(card.locator(".timeline-event-status")).toHaveText(removeFailure); await expect(card.locator(".timeline-remove")).toHaveText("Remove"); await expect(card.locator(".timeline-remove")).not.toHaveClass(/armed/); expect(await page.evaluate(async (id) => (await (await import("/storage.js")).getEventsForCase(id)).length, caseId)).toBe(1); expect(await page.evaluate(async (id) => (await (await import("/storage.js")).getCase(id)).updatedAt, caseId)).toBe(seeded.updatedAt);
  await page.reload(); await expect(page.locator('.timeline-event[data-id="event_timeline_rollback"]')).toBeVisible(); expect(externalRequests).toEqual([]); expect(pageErrors).toEqual([]);
});
