import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storageSource = readFileSync("web/storage.js", "utf8");
const timelineSource = readFileSync("web/timeline-ui.js", "utf8");
const timelineStyles = readFileSync("web/timeline.css", "utf8");

test("storage exposes a dedicated structured event transition boundary", () => {
  for (const code of ["stale_event", "source_missing", "source_changed", "case_missing", "write_failed"]) {
    assert.match(storageSource, new RegExp(`${code}:`));
  }
  assert.match(storageSource, /export class EventTransitionError extends Error/);
  assert.match(storageSource, /export function validEventSnapshot/);
  assert.match(storageSource, /export function eventValuesMatch/);
  assert.match(storageSource, /export function validEventReplacement/);
  assert.match(storageSource, /export async function commitEventTransition/);
});

test("event creation, replacement, and removal use atomic purpose-built writes", () => {
  assert.match(storageSource, /kind === "remove" \? \["events", "cases"\] : \["events", "files", "cases"\]/);
  assert.match(storageSource, /eventRequest = events\.add\(event\)/);
  assert.match(storageSource, /eventRequest = events\.put\(event\)/);
  assert.match(storageSource, /eventRequest = events\.delete\(event\.id\)/);
  assert.match(storageSource, /eventValuesMatch\(currentRequest\.result, expected\)/);
  assert.match(storageSource, /sourceMatches\(fileRequest\.result, identity\)/);
  assert.match(storageSource, /replacement\.revision === expected\.revision \+ 1/);
  assert.match(storageSource, /export const saveEvent = createEvent/);
});

test("timeline actions use immutable rendered snapshots and exact-current APIs", () => {
  assert.match(timelineSource, /const renderedEventSnapshots = new Map\(\)/);
  assert.match(timelineSource, /renderedEventSnapshots\.set\(event\.id, immutableSnapshot\(event\)\)/);
  assert.match(timelineSource, /function requireRenderedEvent\(eventId\)/);
  assert.match(timelineSource, /expected = requireRenderedEvent\(eventId\)/);
  assert.match(timelineSource, /await deleteEvent\(expected\)/);
  assert.match(timelineSource, /await saveEventIfCurrent\(current, result\.value\)/);
  assert.match(timelineSource, /await createEvent\(result\.value\)/);
  assert.doesNotMatch(timelineSource, /deleteEvent\(item\.id\)/);
});

test("timeline UI suppresses duplicates and exposes accessible busy states", () => {
  assert.match(timelineSource, /if \(activeRemovals\.has\(eventId\)\) return/);
  assert.match(timelineSource, /if \(editorOpening \|\| saving \|\| dialog\.open\) return/);
  assert.match(timelineSource, /if \(saving\) return/);
  assert.match(timelineSource, /card\.setAttribute\("aria-busy", "true"\)/);
  assert.match(timelineSource, /dialog\.setAttribute\("aria-busy", "true"\)/);
  assert.match(timelineSource, /control\.disabled = busy/);
  assert.match(timelineSource, /if \(saving\) \{ event\.preventDefault\(\); return; \}/);
  assert.match(timelineStyles, /\.timeline-event\[aria-busy="true"\]/);
  assert.match(timelineStyles, /\.timeline-dialog\[aria-busy="true"\]/);
});

test("timeline recovery copy is specific and preserves drafts", () => {
  assert.match(timelineSource, /This event changed in another tab[^\n]+Your draft is still open/);
  assert.match(timelineSource, /selected source record was removed in another tab[^\n]+Your draft is still open/);
  assert.match(timelineSource, /selected source record changed in another tab[^\n]+Your draft is still open/);
  assert.match(timelineSource, /This case was removed in another tab[^\n]+Your draft is still open/);
  assert.match(timelineSource, /local records needed to edit this event could not be loaded/);
  assert.match(timelineSource, /const token = \+\+editorOpenToken/);
  assert.match(timelineSource, /if \(token !== editorOpenToken\) return/);
});

test("malformed stored events are filtered before sorting and rendering", () => {
  assert.match(timelineSource, /const validStoredEvents = storedEvents\.filter\(isValidEvent\)/);
  assert.match(timelineSource, /let events = sortTimelineEvents\(validStoredEvents\)/);
  assert.ok(
    timelineSource.indexOf("storedEvents.filter(isValidEvent)")
      < timelineSource.indexOf("sortTimelineEvents(validStoredEvents)"),
  );
  assert.match(timelineSource, /malformedEventCount/);
  assert.match(timelineSource, /class="timeline-integrity" role="status"/);
  assert.match(timelineSource, /stored event or provenance is malformed/);
});

test("missing or changed source provenance disables editing but preserves removal", () => {
  assert.match(timelineSource, /const editUnavailable = !sourceState\.ok/);
  assert.match(timelineSource, /disabled aria-disabled="true"/);
  assert.match(timelineSource, /<button class="timeline-remove" type="button">Remove<\/button>/);
  assert.match(timelineSource, /function markEditUnavailable\(card, sourceState\)/);
  assert.match(timelineSource, /editButton\.disabled = true/);
  assert.match(timelineSource, /You can still remove the event/);
});

test("asynchronous editor opening revalidates provenance and restores intentional disabled states", () => {
  assert.match(timelineSource, /const rowDisabledStates = new WeakMap\(\)/);
  assert.match(timelineSource, /new Map\(buttons\.map\(\(button\) => \[button, button\.disabled\]\)\)/);
  assert.match(timelineSource, /disabledStates\.forEach\(\(disabled, button\) => \{ button\.disabled = disabled; \}\)/);
  assert.match(timelineSource, /const sourceState = timelineSourceStatus\(snapshot, currentFiles\)/);
  assert.match(timelineSource, /if \(!sourceState\.ok\)/);
  assert.match(timelineSource, /if \(unavailableSourceState\) markEditUnavailable\(card, unavailableSourceState\)/);
});

test("timeline accessibility keeps errors local, targets large, text readable, and motion optional", () => {
  assert.doesNotMatch(timelineSource, /setStatus\(removalFailureText\(failure\), "error"\)/);
  assert.match(timelineSource, /class="timeline-event-status" role="alert" aria-live="assertive"/);
  assert.match(timelineStyles, /\.timeline-event-actions button,[\s\S]+min-height: 44px/);
  assert.match(timelineStyles, /font-size: 14px/);
  assert.match(timelineStyles, /:focus-visible/);
  assert.match(timelineStyles, /@media \(max-width: 600px\)/);
  assert.match(timelineStyles, /overflow-wrap: anywhere/);
  assert.match(timelineStyles, /@media \(prefers-reduced-motion: reduce\)/);
});
