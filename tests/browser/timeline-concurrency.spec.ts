import { expect, test } from "playwright/test";

const hash = "a".repeat(64);
const staleSave = "This event changed in another tab. Nothing was saved. Your draft is still open. Reload to review the latest event before applying your changes again.";
const staleRemove = "This event changed in another tab. Nothing was removed. Reload and review the latest version.";
const missingSource = "The selected source record was removed in another tab. Nothing was saved. Your draft is still open. Choose another source or cancel and reload.";
const changedSource = "The selected source record changed in another tab. Nothing was saved. Your draft is still open. Cancel and reload before choosing the current record.";
const missingCase = "This case was removed in another tab. Nothing was saved. Your draft is still open. Copy any notes you need, then return to your local cases.";
const unavailableSource = "Editing is unavailable because this event's source record no longer matches its reviewed SHA-256 snapshot. Nothing was changed. Reload to review the current record. You can still remove the event.";
const removeFailure = "The timeline event could not be removed. Nothing was changed. Try again.";

async function setupTimeline(page: import("playwright/test").Page, seedEvent = false, seedMalformed = false) {
  await page.goto("/index.html?id=case-concurrency");
  return page.evaluate(async ({ sourceHash, withEvent, withMalformed }) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("casefind-preview");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database deletion blocked"));
    });
    document.body.innerHTML = '<nav class="workspace-nav"><a href="#checklist">Checklist</a></nav><main><p id="upload-message"></p><div id="file-list"><button class="delete-file" data-id="file-concurrency" type="button">Remove file</button></div><div id="record-preview"></div><div id="source-excerpt" hidden><mark id="source-quote"></mark></div><section id="checklist"></section></main>';
    const storage = await import("/storage.js");
    const caseId = "case-concurrency";
    await storage.saveCase({ id: caseId, title: "Timeline concurrency", updatedAt: "2026-08-07T00:00:00.000Z" });
    const original = new File([new Uint8Array([1, 2, 3, 4])], "proof.png", { type: "image/png", lastModified: 1_700_000_000_000 });
    const file = { id: "file-concurrency", caseId, name: original.name, type: original.type, size: original.size, sha256: sourceHash, createdAt: "2026-08-07T00:01:00.000Z", original };
    await storage.saveFile(file, { now: () => "2026-08-07T00:02:00.000Z" });
    const event = {
      id: "event-concurrency", caseId, eventDate: "2026-08-03", title: "Final files delivered",
      description: "Delivery noted in the selected screenshot.", sourceFileId: file.id,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "whole_file", quote: "Final files attached." } },
      origin: "user_entered", revision: 1,
      createdAt: "2026-08-03T00:00:00.000Z", updatedAt: "2026-08-03T00:00:00.000Z",
    };
    if (withEvent) await storage.createEvent(event, { now: () => "2026-08-07T00:03:00.000Z" });
    if (withMalformed) {
      const db = await storage.openDatabase();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("events", "readwrite");
          tx.objectStore("events").add({ ...event, id: "event-malformed", eventDate: "not-a-date" });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error || new Error("Malformed seed aborted"));
        });
      } finally { db.close(); }
    }
    await import(`/timeline-ui.js?test=${crypto.randomUUID()}`);
    return { event, file, updatedAt: (await storage.getCase(caseId)).updatedAt };
  }, { sourceHash: hash, withEvent: seedEvent, withMalformed: seedMalformed });
}

async function fillEventDialog(page: import("playwright/test").Page, title = "Final files delivered") {
  const dialog = page.locator(".timeline-dialog");
  await dialog.locator("#timeline-date").fill("2026-08-03");
  await dialog.locator("#timeline-title").fill(title);
  await dialog.locator("#timeline-description").fill("A preserved draft.");
  await dialog.locator("#timeline-quote").fill("Final files attached.");
  return dialog;
}

async function mutateEvent(page: import("playwright/test").Page) {
  return page.evaluate(async () => {
    const storage = await import("/storage.js");
    const current = (await storage.getEventsForCase("case-concurrency"))[0];
    const newer = { ...current, title: "Changed in another tab", revision: current.revision + 1, updatedAt: "2026-08-07T01:00:00.000Z" };
    const db = await storage.openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("events", "readwrite");
        tx.objectStore("events").put(newer);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Mutation aborted"));
      });
    } finally { db.close(); }
    return newer;
  });
}

async function countEventTransitions(page: import("playwright/test").Page) {
  await page.evaluate(() => {
    (window as any).__eventTransitions = 0;
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (storeNames, mode, ...rest) {
      const names = typeof storeNames === "string" ? [storeNames] : Array.from(storeNames);
      if (mode === "readwrite" && names.includes("events")) (window as any).__eventTransitions += 1;
      return original.call(this, storeNames, mode, ...rest as any);
    };
  });
}

test("event creation is collision-safe in real IndexedDB", async ({ page }) => {
  const seeded = await setupTimeline(page);
  const result = await page.evaluate(async (value) => {
    const storage = await import("/storage.js");
    await storage.createEvent(value, { now: () => "2026-08-07T01:00:00.000Z" });
    const afterFirst = (await storage.getCase(value.caseId)).updatedAt;
    let failure;
    try { await storage.createEvent({ ...value, title: "Colliding replacement" }, { now: () => "2026-08-07T02:00:00.000Z" }); }
    catch (error: any) { failure = { name: error?.name, code: error?.code }; }
    return { failure, events: await storage.getEventsForCase(value.caseId), afterFirst, finalUpdatedAt: (await storage.getCase(value.caseId)).updatedAt };
  }, seeded.event);
  expect(result.failure).toEqual({ name: "EventTransitionError", code: "write_failed" });
  expect(result.events).toEqual([seeded.event]);
  expect(result.finalUpdatedAt).toBe(result.afterFirst);
});

test("a stale rendered edit cannot overwrite a newer event or run twice", async ({ page }) => {
  const seeded = await setupTimeline(page, true);
  const newer = await mutateEvent(page);
  await countEventTransitions(page);
  await page.locator('.timeline-event[data-id="event-concurrency"] .timeline-edit').click();
  const dialog = await fillEventDialog(page, "My stale draft");
  await dialog.locator("form").evaluate((form) => {
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  });
  await expect(dialog.locator(".timeline-error")).toHaveText(staleSave);
  await expect(dialog.locator("#timeline-title")).toHaveValue("My stale draft");
  await expect(dialog).not.toHaveAttribute("aria-busy", "true");
  const state = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    return { event: (await storage.getEventsForCase("case-concurrency"))[0], updatedAt: (await storage.getCase("case-concurrency")).updatedAt, transitions: (window as any).__eventTransitions };
  });
  expect(state.event).toEqual(newer);
  expect(state.updatedAt).toBe(seeded.updatedAt);
  expect(state.transitions).toBe(1);
});

test("a stale rendered removal cannot delete a newer event or run twice", async ({ page }) => {
  const seeded = await setupTimeline(page, true);
  const newer = await mutateEvent(page);
  await countEventTransitions(page);
  const card = page.locator('.timeline-event[data-id="event-concurrency"]');
  await card.locator(".timeline-remove").click();
  await card.locator(".timeline-remove").evaluate((button) => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(card.locator(".timeline-event-status")).toHaveText(staleRemove);
  await expect(card).not.toHaveAttribute("aria-busy", "true");
  const state = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    return { event: (await storage.getEventsForCase("case-concurrency"))[0], updatedAt: (await storage.getCase("case-concurrency")).updatedAt, transitions: (window as any).__eventTransitions };
  });
  expect(state.event).toEqual(newer);
  expect(state.updatedAt).toBe(seeded.updatedAt);
  expect(state.transitions).toBe(1);
});

test("source removal after editor opening fails closed and preserves the draft", async ({ page }) => {
  const seeded = await setupTimeline(page);
  await page.locator("#add-timeline-event").click();
  const dialog = await fillEventDialog(page, "Source disappeared");
  await page.evaluate(async () => {
    const storage = await import("/storage.js");
    const db = await storage.openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").delete("file-concurrency");
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog.locator(".timeline-error")).toHaveText(missingSource);
  await expect(dialog.locator("#timeline-title")).toHaveValue("Source disappeared");
  const state = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    return { events: await storage.getEventsForCase("case-concurrency"), updatedAt: (await storage.getCase("case-concurrency")).updatedAt };
  });
  expect(state.events).toEqual([]);
  expect(state.updatedAt).toBe(seeded.updatedAt);
});

test("source changes after editor opening fail closed with specific recovery copy", async ({ page }) => {
  const seeded = await setupTimeline(page, true);
  await page.locator('.timeline-event[data-id="event-concurrency"] .timeline-edit').click();
  const dialog = page.locator(".timeline-dialog");
  await dialog.locator("#timeline-title").fill("Draft against old bytes");
  await page.evaluate(async () => {
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase("case-concurrency");
    const db = await storage.openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put({ ...file, sha256: "b".repeat(64) });
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog.locator(".timeline-error")).toHaveText(changedSource);
  await expect(dialog.locator("#timeline-title")).toHaveValue("Draft against old bytes");
  const current = await page.evaluate(async () => (await (await import("/storage.js")).getEventsForCase("case-concurrency"))[0]);
  expect(current).toEqual(seeded.event);
});

test("case removal after editor opening fails closed with specific recovery copy", async ({ page }) => {
  const seeded = await setupTimeline(page, true);
  await page.locator('.timeline-event[data-id="event-concurrency"] .timeline-edit').click();
  const dialog = page.locator(".timeline-dialog");
  await dialog.locator("#timeline-title").fill("Draft after case removal");
  await page.evaluate(async () => {
    const storage = await import("/storage.js");
    const db = await storage.openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("cases", "readwrite");
        tx.objectStore("cases").delete("case-concurrency");
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog.locator(".timeline-error")).toHaveText(missingCase);
  await expect(dialog.locator("#timeline-title")).toHaveValue("Draft after case removal");
  const current = await page.evaluate(async () => (await (await import("/storage.js")).getEventsForCase("case-concurrency"))[0]);
  expect(current).toEqual(seeded.event);
});

test("duplicate asynchronous editor opens perform one file read and cancel cleanly", async ({ page }) => {
  await setupTimeline(page);
  await page.evaluate(() => {
    (window as any).__fileReads = 0;
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (storeNames, mode, ...rest) {
      const names = typeof storeNames === "string" ? [storeNames] : Array.from(storeNames);
      if (mode === "readonly" && names.length === 1 && names[0] === "files") (window as any).__fileReads += 1;
      return original.call(this, storeNames, mode, ...rest as any);
    };
    const button = document.querySelector("#add-timeline-event") as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(page.locator(".timeline-dialog")).toBeVisible();
  expect(await page.evaluate(() => (window as any).__fileReads)).toBe(1);
  await page.locator(".timeline-cancel").click();
  await expect(page.locator(".timeline-dialog")).not.toBeVisible();
});

test("saving disables the dialog, suppresses duplicate submit, and ignores cancellation", async ({ page }) => {
  await setupTimeline(page);
  await countEventTransitions(page);
  await page.locator("#add-timeline-event").click();
  const dialog = await fillEventDialog(page, "Single committed event");
  const during = await dialog.evaluate((node) => {
    const form = node.querySelector("form")!;
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    const busy = node.getAttribute("aria-busy");
    const controlsDisabled = [...form.querySelectorAll("input, select, textarea, button")]
      .every((control: any) => control.disabled);
    form.querySelector(".timeline-cancel")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    return { busy, controlsDisabled, remainedOpen: (node as HTMLDialogElement).open };
  });
  expect(during).toEqual({ busy: "true", controlsDisabled: true, remainedOpen: true });
  await expect(dialog).not.toBeVisible();
  const state = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    return { events: await storage.getEventsForCase("case-concurrency"), transitions: (window as any).__eventTransitions };
  });
  expect(state.events).toHaveLength(1);
  expect(state.events[0].title).toBe("Single committed event");
  expect(state.transitions).toBe(1);
});

test("malformed events stay hidden and provenance changes disable editing through busy failures", async ({ page }) => {
  await setupTimeline(page, true, true);
  await expect(page.locator(".timeline-event")).toHaveCount(1);
  await expect(page.locator(".timeline-integrity")).toHaveText(
    "1 saved timeline event was not shown because the stored event or provenance is malformed. Nothing was changed.",
  );

  await page.evaluate(async () => {
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase("case-concurrency");
    const db = await storage.openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put({ ...file, sha256: "b".repeat(64) });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Source mutation aborted"));
      });
    } finally { db.close(); }
  });

  const card = page.locator('.timeline-event[data-id="event-concurrency"]');
  await card.locator(".timeline-edit").click();
  await expect(page.locator(".timeline-dialog")).not.toBeVisible();
  await expect(card.locator(".timeline-event-status")).toHaveText(unavailableSource);
  await expect(card.locator(".timeline-edit")).toBeDisabled();
  await expect(card.locator(".timeline-remove")).toBeEnabled();

  await page.evaluate(() => {
    const prototype = IDBObjectStore.prototype as IDBObjectStore & Record<string, (...args: unknown[]) => IDBRequest>;
    const original = prototype.delete;
    let injected = false;
    prototype.delete = function (...args: unknown[]) {
      const request = original.apply(this, args);
      if (!injected && this.name === "events") {
        injected = true;
        this.transaction.abort();
      }
      return request;
    };
  });
  await card.locator(".timeline-remove").click();
  await card.locator(".timeline-remove").click();
  await expect(card.locator(".timeline-event-status")).toHaveText(removeFailure);
  await expect(card).not.toHaveAttribute("aria-busy", "true");
  await expect(card.locator(".timeline-edit")).toBeDisabled();
  await expect(card.locator(".timeline-remove")).toBeEnabled();
  await expect(page.locator(".timeline-status")).toHaveText("");
});
