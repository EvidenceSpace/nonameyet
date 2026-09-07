import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  BOARD_RELATION_TYPES,
  DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT,
  DESKTOP_SPIKE_OBJECT_COUNT,
  createDesktopSpikeFixture,
  recoverDesktopSpikeDraftJournal,
  serializeDesktopSpikeFixture,
} from "../src/desktop/spike-fixture.js";

test("the fixture creates 1,000 deterministic objects and dense typed connections", async () => {
  const fixture = await createDesktopSpikeFixture();
  assert.equal(fixture.board.objects.length, DESKTOP_SPIKE_OBJECT_COUNT);
  assert.equal(
    fixture.board.connections.length,
    DESKTOP_SPIKE_OBJECT_COUNT * DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT,
  );

  const objectIds = new Set(fixture.board.objects.map(({ id }) => id));
  assert.equal(objectIds.size, DESKTOP_SPIKE_OBJECT_COUNT);
  for (const requiredId of [
    "E-04",
    "F-03",
    "R-02",
    "W-01",
    "RP-01",
    "THREAD-15",
  ]) {
    assert.equal(objectIds.has(requiredId), true);
  }

  const relationTypes = new Set(
    fixture.board.connections.map(({ type }) => type),
  );
  assert.deepEqual([...relationTypes], [...BOARD_RELATION_TYPES]);
  for (const connection of fixture.board.connections) {
    assert.equal(objectIds.has(connection.fromId), true);
    assert.equal(objectIds.has(connection.toId), true);
    assert.notEqual(connection.fromId, connection.toId);
  }
});

test("the structured outline contains the same objects and relations as the board", async () => {
  const fixture = await createDesktopSpikeFixture();
  assert.deepEqual(
    fixture.outline.entries.map(({ objectId }) => objectId),
    fixture.board.objects.map(({ id }) => id),
  );
  assert.deepEqual(
    fixture.outline.relations.map(({ connectionId }) => connectionId),
    fixture.board.connections.map(({ id }) => id),
  );
  assert.equal(
    fixture.outline.entries.every(
      (entry) =>
        entry.incomingRelationCount === DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT &&
        entry.outgoingRelationCount === DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT,
    ),
    true,
  );
});

test("deep-link and picker fixtures stay bounded to synthetic Case C-03", async () => {
  const fixture = await createDesktopSpikeFixture();
  assert.equal(
    fixture.validDeepLink,
    "evidencespace://open?route=evidence&case=C-03&object=E-04",
  );
  assert.equal(fixture.invalidDeepLinks.length >= 5, true);
  assert.deepEqual(fixture.pickerRequest, {
    protocolVersion: 1,
    requestId: "spike_picker_1",
    command: "desktop:select-evidence-files",
    payload: { caseId: "C-03", kinds: ["pdf", "image"], multiple: true },
  });
});

test("draft recovery distinguishes before, during, and after commit", async () => {
  const fixture = await createDesktopSpikeFixture();
  assert.deepEqual(await recoverDesktopSpikeDraftJournal([]), {
    state: "empty",
    payload: null,
  });
  assert.deepEqual(
    await recoverDesktopSpikeDraftJournal(fixture.draftJournal.slice(0, 1)),
    { state: "intent-only", payload: null },
  );
  assert.equal(
    (await recoverDesktopSpikeDraftJournal(fixture.draftJournal.slice(0, 2)))
      .state,
    "recoverable",
  );
  assert.equal(
    (await recoverDesktopSpikeDraftJournal(fixture.draftJournal)).state,
    "committed",
  );
});

test("tampered journals fail closed without echoing synthetic input", async () => {
  const fixture = await createDesktopSpikeFixture();
  const write = fixture.draftJournal[1]!;
  const tampered = [
    fixture.draftJournal[0]!,
    { ...write, payload: { ...write.payload!, operation: "private-value" } },
  ];
  const recovery = await recoverDesktopSpikeDraftJournal(tampered);
  assert.deepEqual(recovery, {
    state: "invalid",
    payload: null,
    error: "invalid_journal",
  });
  assert.equal(JSON.stringify(recovery).includes("private-value"), false);
});

test("serialized fixture output is deterministic and contains no local paths or secrets", async () => {
  const left = serializeDesktopSpikeFixture(await createDesktopSpikeFixture());
  const right = serializeDesktopSpikeFixture(await createDesktopSpikeFixture());
  assert.equal(left, right);
  assert.equal(createHash("sha256").update(left).digest("hex").length, 64);
  for (const forbidden of [
    "C:\\\\",
    "/Users/",
    "/home/",
    "deviceId",
    "productId",
    "token",
    "secret",
  ]) {
    assert.equal(left.includes(forbidden), false);
  }
});
