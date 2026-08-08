import {
  createEvent,
  deleteEvent,
  EventTransitionError,
  getEventsForCase,
  getFilesForCase,
  saveEventIfCurrent,
  validEventSnapshot,
} from "./storage.js";
import {
  createTimelineEvent,
  sortTimelineEvents,
  timelineLocatorLabel,
  timelineSourceStatus,
  updateTimelineEvent,
} from "./timeline-model.js";

const caseId = new URLSearchParams(location.search).get("id");
const checklist = document.querySelector("#checklist");

if (caseId && checklist) {
  const section = document.createElement("section");
  section.className = "workspace-card";
  section.id = "timeline";
  section.innerHTML = '<div class="card-heading"><div><span class="section-label">SOURCE-LINKED TIMELINE</span><h3>Events you entered from original records</h3><p>Dates are not inferred or authenticated. Every event stays linked to the exact record hash and optional location you choose.</p><p class="timeline-status" role="status" aria-live="polite"></p></div><button class="button-secondary" id="add-timeline-event" type="button">Add event</button></div><div class="timeline-list" id="timeline-list"></div>';
  checklist.before(section);

  const nav = document.querySelector(".workspace-nav");
  if (nav) {
    const link = document.createElement("a");
    link.href = "#timeline";
    link.innerHTML = '<span>◇</span> Timeline <b id="nav-event-count">0</b>';
    nav.querySelector('a[href="#checklist"]')?.before(link);
  }

  const dialog = document.createElement("dialog");
  dialog.className = "timeline-dialog";
  dialog.setAttribute("aria-labelledby", "timeline-dialog-title");
  dialog.innerHTML = '<form id="timeline-form"><div class="dialog-header"><div><span class="section-label">MANUAL TIMELINE EVENT</span><h2 id="timeline-dialog-title">Add a source-linked event</h2></div><button class="dialog-close" type="button" aria-label="Close">×</button></div><p class="timeline-intro">Enter only what the selected original record supports. CaseFind does not verify that an event occurred.</p><label>Event date<input id="timeline-date" type="date" required></label><label>Event title<input id="timeline-title" maxlength="120" required placeholder="e.g. Final files delivered"></label><label>What does the record show? <span>optional</span><textarea id="timeline-description" maxlength="1000" rows="3"></textarea></label><div class="timeline-source-fields"><label>Supporting original record<select id="timeline-source" required></select></label><label>PDF page <span>optional</span><input id="timeline-page" type="number" min="1" max="10000" step="1" inputmode="numeric"></label></div><label>Supporting excerpt <span>optional, enter exactly as shown</span><textarea id="timeline-quote" maxlength="500" rows="3"></textarea></label><p class="timeline-help">A page number is accepted only for PDF sources. The saved SHA-256 hash identifies the exact local record version.</p><p class="timeline-error" role="alert" aria-live="assertive"></p><div class="timeline-actions"><button class="button-secondary timeline-cancel" type="button">Cancel</button><button class="button" type="submit">Save event</button></div></form>';
  document.body.append(dialog);

  const root = section.querySelector("#timeline-list");
  const status = section.querySelector(".timeline-status");
  const addButton = section.querySelector("#add-timeline-event");
  const form = dialog.querySelector("form");
  const date = dialog.querySelector("#timeline-date");
  const title = dialog.querySelector("#timeline-title");
  const description = dialog.querySelector("#timeline-description");
  const source = dialog.querySelector("#timeline-source");
  const page = dialog.querySelector("#timeline-page");
  const quote = dialog.querySelector("#timeline-quote");
  const error = dialog.querySelector(".timeline-error");
  const submit = dialog.querySelector('button[type="submit"]');
  const dialogTitle = dialog.querySelector("#timeline-dialog-title");
  let events = sortTimelineEvents(await getEventsForCase(caseId));
  let files = await getFilesForCase(caseId);
  let editing = null;
  let editorOpening = false;
  let editorOpenToken = 0;
  let saving = false;
  const renderedEventSnapshots = new Map();
  const activeRemovals = new Set();
  const removalTimers = new Map();

  function escape(value = "") {
    const node = document.createElement("span");
    node.textContent = value;
    return node.innerHTML;
  }

  function dateLabel(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function setStatus(message = "", kind = "") {
    status.textContent = message;
    status.className = `timeline-status${kind ? ` ${kind}` : ""}`;
  }

  function immutableSnapshot(value) {
    const snapshot = structuredClone(value);
    const freeze = (entry) => {
      if (!entry || typeof entry !== "object" || Object.isFrozen(entry)) return entry;
      Object.values(entry).forEach(freeze);
      return Object.freeze(entry);
    };
    return freeze(snapshot);
  }

  function syncRenderedEventSnapshots(currentEvents = []) {
    renderedEventSnapshots.clear();
    for (const event of currentEvents) {
      if (!validEventSnapshot(event)) continue;
      try { renderedEventSnapshots.set(event.id, immutableSnapshot(event)); }
      catch { /* A malformed event must never become actionable. */ }
    }
  }

  function requireRenderedEvent(eventId) {
    const event = renderedEventSnapshots.get(eventId);
    if (!event || !validEventSnapshot(event)) throw new EventTransitionError("stale_event");
    return immutableSnapshot(event);
  }

  function setRowBusy(card, busy) {
    if (!card) return;
    if (busy) card.setAttribute("aria-busy", "true");
    else card.removeAttribute("aria-busy");
    card.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
  }

  function setDialogBusy(busy) {
    saving = busy;
    if (busy) dialog.setAttribute("aria-busy", "true");
    else dialog.removeAttribute("aria-busy");
    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = busy;
    });
    if (!busy) submit.disabled = files.length === 0;
  }

  function eventStatus(card, message = "") {
    const target = card?.querySelector(".timeline-event-status");
    if (target) target.textContent = message;
  }

  function saveFailureText(failure) {
    if (failure?.code === "stale_event") {
      return "This event changed in another tab. Nothing was saved. Your draft is still open. Reload to review the latest event before applying your changes again.";
    }
    if (failure?.code === "source_missing") {
      return "The selected source record was removed in another tab. Nothing was saved. Your draft is still open. Choose another source or cancel and reload.";
    }
    if (failure?.code === "source_changed") {
      return "The selected source record changed in another tab. Nothing was saved. Your draft is still open. Cancel and reload before choosing the current record.";
    }
    if (failure?.code === "case_missing") {
      return "This case was removed in another tab. Nothing was saved. Your draft is still open. Copy any notes you need, then return to your local cases.";
    }
    return "The timeline event could not be saved in this browser. Nothing was changed. Your draft is still open. Try again.";
  }

  function removalFailureText(failure) {
    if (failure?.code === "stale_event") {
      return "This event changed in another tab. Nothing was removed. Reload and review the latest version.";
    }
    if (failure?.code === "case_missing") {
      return "This case was removed in another tab. Nothing was removed. Return to your local cases or reload.";
    }
    return "The timeline event could not be removed. Nothing was changed. Try again.";
  }

  function openSource(item, sourceState) {
    const preview = [...document.querySelectorAll(".preview-file")]
      .find((button) => button.dataset.id === sourceState.file.id);
    if (!preview) return;
    preview.click();
    const locator = item.sourceReference?.locator || {};
    const embed = document.querySelector("#record-preview embed");
    if (embed && locator.kind === "pdf_page" && Number.isInteger(locator.page)) {
      const base = embed.getAttribute("src").split("#")[0];
      embed.setAttribute("src", `${base}#page=${locator.page}`);
    }
    const excerpt = document.querySelector("#source-excerpt");
    const sourceQuote = document.querySelector("#source-quote");
    if (excerpt && sourceQuote && locator.quote) {
      sourceQuote.textContent = locator.quote;
      excerpt.hidden = false;
    }
  }

  function render() {
    syncRenderedEventSnapshots(events);
    document.querySelector("#nav-event-count")?.replaceChildren(String(events.length));
    if (!events.length) {
      root.innerHTML = '<div class="timeline-empty">No timeline events yet. Add events manually from records you have reviewed.</div>';
      return;
    }
    root.innerHTML = events.map((event) => {
      const sourceState = timelineSourceStatus(event, files);
      const locator = timelineLocatorLabel(event.sourceReference?.locator);
      const sourceName = sourceState.file?.name || "Missing record";
      const sourceClass = sourceState.ok ? "" : " invalid";
      const excerpt = event.sourceReference?.locator?.quote;
      return `<article class="timeline-event" data-id="${escape(event.id)}"><time class="timeline-date" datetime="${escape(event.eventDate)}">${escape(dateLabel(event.eventDate))}</time><span class="timeline-marker"></span><div class="timeline-copy"><strong>${escape(event.title)}</strong>${event.description ? `<p>${escape(event.description)}</p>` : ""}<small>User-entered · Source: ${escape(sourceName)} · ${escape(locator)} <span class="timeline-source-state${sourceClass}">${escape(sourceState.label)}</span></small>${excerpt ? `<blockquote class="source-quote">${escape(excerpt)}</blockquote>` : ""}<details class="timeline-provenance"><summary>Source provenance</summary><p>${escape(sourceName)} · ${escape(locator)}</p><code>SHA-256 ${escape(event.sourceReference?.sha256 || "Unavailable")}</code></details><div class="timeline-event-actions">${sourceState.ok ? '<button class="timeline-open" type="button">Open source</button>' : ""}<button class="timeline-edit" type="button">Edit</button><button class="timeline-remove" type="button">Remove</button></div><p class="timeline-event-status" role="alert" aria-live="assertive"></p></div></article>`;
    }).join("");

    root.querySelectorAll(".timeline-event").forEach((card) => {
      const rendered = renderedEventSnapshots.get(card.dataset.id);
      const sourceState = timelineSourceStatus(rendered, files);
      card.querySelector(".timeline-open")?.addEventListener("click", () => openSource(rendered, sourceState));
      card.querySelector(".timeline-edit").addEventListener("click", () => {
        void openEditor(card.dataset.id, card);
      });
      const removeButton = card.querySelector(".timeline-remove");
      removeButton.addEventListener("click", () => {
        void removeRenderedEvent(card.dataset.id, card, removeButton);
      });
    });
  }

  async function removeRenderedEvent(eventId, card, removeButton) {
    if (activeRemovals.has(eventId)) return;
    if (!removeButton.classList.contains("armed")) {
      removeButton.classList.add("armed");
      removeButton.textContent = "Confirm remove";
      const existingTimer = removalTimers.get(eventId);
      if (existingTimer) clearTimeout(existingTimer);
      removalTimers.set(eventId, setTimeout(() => {
        removeButton.classList.remove("armed");
        removeButton.textContent = "Remove";
        removalTimers.delete(eventId);
      }, 5000));
      return;
    }

    const timer = removalTimers.get(eventId);
    if (timer) clearTimeout(timer);
    removalTimers.delete(eventId);
    let expected;
    try {
      expected = requireRenderedEvent(eventId);
    } catch (failure) {
      removeButton.classList.remove("armed");
      removeButton.textContent = "Remove";
      eventStatus(card, removalFailureText(failure));
      return;
    }

    activeRemovals.add(eventId);
    eventStatus(card);
    setRowBusy(card, true);
    removeButton.textContent = "Removing locally…";
    try {
      await deleteEvent(expected);
      events = events.filter((event) => event.id !== eventId);
      setStatus("Timeline event removed locally.");
      render();
    } catch (failure) {
      eventStatus(card, removalFailureText(failure));
      setStatus(removalFailureText(failure), "error");
      removeButton.classList.remove("armed");
      removeButton.textContent = "Remove";
      setRowBusy(card, false);
    } finally {
      activeRemovals.delete(eventId);
    }
  }

  async function openEditor(eventId = null, card = null) {
    if (editorOpening || saving || dialog.open) return;
    let snapshot = null;
    try {
      if (eventId) snapshot = requireRenderedEvent(eventId);
    } catch (failure) {
      eventStatus(card, removalFailureText(failure).replace("removed", "edited"));
      return;
    }

    editorOpening = true;
    const token = ++editorOpenToken;
    addButton.disabled = true;
    setRowBusy(card, true);
    eventStatus(card);
    try {
      const currentFiles = await getFilesForCase(caseId);
      if (token !== editorOpenToken) return;
      files = currentFiles;
      editing = snapshot;
      form.reset();
      error.textContent = "";
      source.innerHTML = files.length
        ? files.map((file) => `<option value="${escape(file.id)}">${escape(file.name)}</option>`).join("")
        : '<option value="">Add an original record first</option>';
      submit.disabled = files.length === 0;
      date.max = "9999-12-31";
      dialogTitle.textContent = snapshot ? "Edit source-linked event" : "Add a source-linked event";
      submit.textContent = snapshot ? "Save changes" : "Save event";
      if (snapshot) {
        date.value = snapshot.eventDate;
        title.value = snapshot.title;
        description.value = snapshot.description || "";
        source.value = snapshot.sourceFileId;
        page.value = snapshot.sourceReference?.locator?.kind === "pdf_page"
          ? snapshot.sourceReference.locator.page
          : "";
        quote.value = snapshot.sourceReference?.locator?.quote || "";
      }
      dialog.showModal();
      date.focus();
    } catch {
      const text = snapshot
        ? "The local records needed to edit this event could not be loaded. Nothing was changed. Try again."
        : "The local records needed to add an event could not be loaded. Nothing was changed. Try again.";
      if (card) eventStatus(card, text);
      else setStatus(text, "error");
    } finally {
      if (token === editorOpenToken) editorOpening = false;
      addButton.disabled = false;
      setRowBusy(card, false);
    }
  }

  function closeEditor(force = false) {
    if (saving && !force) return;
    editorOpenToken += 1;
    editorOpening = false;
    if (dialog.open) dialog.close();
    form.reset();
    error.textContent = "";
    editing = null;
  }

  addButton.addEventListener("click", () => { void openEditor(); });
  dialog.querySelector(".dialog-close").addEventListener("click", () => closeEditor());
  dialog.querySelector(".timeline-cancel").addEventListener("click", () => closeEditor());
  dialog.addEventListener("cancel", (event) => {
    if (saving) { event.preventDefault(); return; }
    closeEditor();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeEditor();
  });
  window.addEventListener("pagehide", () => { editorOpenToken += 1; });

  form.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    if (saving) return;
    const current = editing ? immutableSnapshot(editing) : null;
    const file = files.find((item) => item.id === source.value);
    const input = {
      eventDate: date.value,
      title: title.value,
      description: description.value,
      sourceFileId: source.value,
      sourcePage: page.value,
      sourceQuote: quote.value,
    };
    const result = current
      ? updateTimelineEvent(current, input, file)
      : createTimelineEvent(caseId, input, file);
    if (!result.ok) {
      error.textContent = result.error;
      return;
    }

    error.textContent = "";
    setDialogBusy(true);
    submit.textContent = current ? "Saving changes locally…" : "Saving locally…";
    try {
      if (current) await saveEventIfCurrent(current, result.value);
      else await createEvent(result.value);
      events = sortTimelineEvents(current
        ? events.map((item) => item.id === result.value.id ? result.value : item)
        : [...events, result.value]);
      setDialogBusy(false);
      closeEditor(true);
      setStatus(current ? "Timeline event updated locally." : "Timeline event saved locally.");
      render();
    } catch (failure) {
      error.textContent = saveFailureText(failure);
    } finally {
      if (saving) setDialogBusy(false);
      submit.textContent = current ? "Save changes" : "Save event";
    }
  });

  document.querySelector("#file-list")?.addEventListener("click", (clickEvent) => {
    const button = clickEvent.target.closest(".delete-file");
    if (!button || !events.some((item) => item.sourceFileId === button.dataset.id)) return;
    clickEvent.preventDefault();
    clickEvent.stopImmediatePropagation();
    const message = document.querySelector("#upload-message");
    if (!message) return;
    message.className = "upload-message error";
    message.textContent = "Remove or move timeline events linked to this source record before deleting it.";
  }, true);

  render();
}
