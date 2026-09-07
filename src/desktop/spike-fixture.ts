import {
  DESKTOP_PROTOCOL_VERSION,
  type DesktopSelectEvidenceFilesRequest,
} from "./boundary.js";

export const DESKTOP_SPIKE_FIXTURE_VERSION =
  "desktop-spike-fixture.v1" as const;
export const DESKTOP_SPIKE_CASE_ID = "C-03" as const;
export const DESKTOP_SPIKE_OBJECT_COUNT = 1_000 as const;
export const DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT = 4 as const;

export const BOARD_OBJECT_KINDS = [
  "evidence",
  "fact",
  "event",
  "research",
  "task",
  "note",
  "report",
  "thread",
] as const;
export const BOARD_RELATION_TYPES = [
  "supports",
  "contradicts",
  "sequence",
  "depends-on",
] as const;

export type BoardObjectKind = (typeof BOARD_OBJECT_KINDS)[number];
export type BoardRelationType = (typeof BOARD_RELATION_TYPES)[number];

export type DesktopSpikeBoardObject = Readonly<{
  id: string;
  kind: BoardObjectKind;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type DesktopSpikeBoardConnection = Readonly<{
  id: string;
  fromId: string;
  toId: string;
  type: BoardRelationType;
}>;

export type DesktopSpikeOutlineEntry = Readonly<{
  objectId: string;
  kind: BoardObjectKind;
  position: number;
  incomingRelationCount: number;
  outgoingRelationCount: number;
}>;

export type DesktopSpikeOutlineRelation = Readonly<{
  connectionId: string;
  fromObjectId: string;
  toObjectId: string;
  type: BoardRelationType;
}>;

export type DesktopSpikeDraftPayload = Readonly<{
  caseId: typeof DESKTOP_SPIKE_CASE_ID;
  revision: number;
  operation: "move-selection";
  objectIds: readonly string[];
}>;

export type DesktopSpikeDraftJournalEntry = Readonly<{
  version: 1;
  draftId: "DRAFT-01";
  sequence: number;
  phase: "intent" | "write" | "commit";
  payload: DesktopSpikeDraftPayload | null;
  payloadSha256: string;
}>;

export type DesktopSpikeDraftRecovery =
  | Readonly<{ state: "empty" | "intent-only"; payload: null }>
  | Readonly<{
      state: "recoverable" | "committed";
      payload: DesktopSpikeDraftPayload;
    }>
  | Readonly<{
      state: "invalid";
      payload: null;
      error: "invalid_journal" | "hash_unavailable";
    }>;

export type DesktopSpikeFixture = Readonly<{
  version: typeof DESKTOP_SPIKE_FIXTURE_VERSION;
  caseId: typeof DESKTOP_SPIKE_CASE_ID;
  board: Readonly<{
    objects: readonly DesktopSpikeBoardObject[];
    connections: readonly DesktopSpikeBoardConnection[];
  }>;
  outline: Readonly<{
    entries: readonly DesktopSpikeOutlineEntry[];
    relations: readonly DesktopSpikeOutlineRelation[];
  }>;
  validDeepLink: string;
  invalidDeepLinks: readonly string[];
  pickerRequest: DesktopSelectEvidenceFilesRequest;
  draftJournal: readonly DesktopSpikeDraftJournalEntry[];
}>;

const CANONICAL_OBJECTS: readonly Readonly<{
  id: string;
  kind: BoardObjectKind;
}>[] = Object.freeze([
  Object.freeze({ id: "E-04", kind: "evidence" }),
  Object.freeze({ id: "F-03", kind: "fact" }),
  Object.freeze({ id: "EV-01", kind: "event" }),
  Object.freeze({ id: "R-02", kind: "research" }),
  Object.freeze({ id: "W-01", kind: "task" }),
  Object.freeze({ id: "RP-01", kind: "report" }),
  Object.freeze({ id: "THREAD-15", kind: "thread" }),
]);
const CONNECTION_OFFSETS = [1, 7, 31, 127] as const;
const JOURNAL_ENTRY_KEYS = [
  "version",
  "draftId",
  "sequence",
  "phase",
  "payload",
  "payloadSha256",
] as const;
const DRAFT_PAYLOAD_KEYS = [
  "caseId",
  "revision",
  "operation",
  "objectIds",
] as const;
const SAFE_OBJECT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const SHA_256 = /^[a-f0-9]{64}$/;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactDataKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Reflect.ownKeys(record);
  if (keys.length !== expected.length) return false;

  return keys.every((key) => {
    if (typeof key !== "string" || !expected.includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor !== undefined && "value" in descriptor;
  });
}

function createBoardObjects(): readonly DesktopSpikeBoardObject[] {
  const objects: DesktopSpikeBoardObject[] = [];
  const columns = 40;

  for (let index = 0; index < DESKTOP_SPIKE_OBJECT_COUNT; index += 1) {
    const canonical = CANONICAL_OBJECTS[index];
    const kind =
      canonical?.kind ?? BOARD_OBJECT_KINDS[index % BOARD_OBJECT_KINDS.length]!;
    const id = canonical?.id ?? `O-${String(index + 1).padStart(4, "0")}`;
    const column = index % columns;
    const row = Math.floor(index / columns);
    objects.push(
      Object.freeze({
        id,
        kind,
        column,
        row,
        x: column * 184,
        y: row * 112,
        width: 152,
        height: 72,
      }),
    );
  }

  return Object.freeze(objects);
}

function createBoardConnections(
  objects: readonly DesktopSpikeBoardObject[],
): readonly DesktopSpikeBoardConnection[] {
  const connections: DesktopSpikeBoardConnection[] = [];

  for (let index = 0; index < objects.length; index += 1) {
    const from = objects[index]!;
    for (
      let relationIndex = 0;
      relationIndex < CONNECTION_OFFSETS.length;
      relationIndex += 1
    ) {
      const to =
        objects[(index + CONNECTION_OFFSETS[relationIndex]!) % objects.length]!;
      const type = BOARD_RELATION_TYPES[relationIndex]!;
      connections.push(
        Object.freeze({
          id: `L-${String(index + 1).padStart(4, "0")}-${relationIndex + 1}`,
          fromId: from.id,
          toId: to.id,
          type,
        }),
      );
    }
  }

  return Object.freeze(connections);
}

function createStructuredOutline(
  objects: readonly DesktopSpikeBoardObject[],
  connections: readonly DesktopSpikeBoardConnection[],
): DesktopSpikeFixture["outline"] {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const connection of connections) {
    incoming.set(connection.toId, (incoming.get(connection.toId) ?? 0) + 1);
    outgoing.set(connection.fromId, (outgoing.get(connection.fromId) ?? 0) + 1);
  }

  const entries = objects.map((object, index) =>
    Object.freeze({
      objectId: object.id,
      kind: object.kind,
      position: index + 1,
      incomingRelationCount: incoming.get(object.id) ?? 0,
      outgoingRelationCount: outgoing.get(object.id) ?? 0,
    }),
  );
  const relations = connections.map((connection) =>
    Object.freeze({
      connectionId: connection.id,
      fromObjectId: connection.fromId,
      toObjectId: connection.toId,
      type: connection.type,
    }),
  );

  return Object.freeze({
    entries: Object.freeze(entries),
    relations: Object.freeze(relations),
  });
}

function canonicalDraftPayload(): DesktopSpikeDraftPayload {
  return Object.freeze({
    caseId: DESKTOP_SPIKE_CASE_ID,
    revision: 1,
    operation: "move-selection",
    objectIds: Object.freeze(["E-04", "F-03", "R-02"]),
  });
}

function parseDraftPayload(value: unknown): DesktopSpikeDraftPayload | null {
  if (
    !isPlainRecord(value) ||
    !hasExactDataKeys(value, DRAFT_PAYLOAD_KEYS) ||
    value.caseId !== DESKTOP_SPIKE_CASE_ID ||
    value.revision !== 1 ||
    value.operation !== "move-selection" ||
    !Array.isArray(value.objectIds) ||
    value.objectIds.length === 0 ||
    value.objectIds.length > 16 ||
    !value.objectIds.every(
      (id) => typeof id === "string" && SAFE_OBJECT_ID.test(id),
    )
  ) {
    return null;
  }

  return Object.freeze({
    caseId: DESKTOP_SPIKE_CASE_ID,
    revision: 1,
    operation: "move-selection",
    objectIds: Object.freeze([...value.objectIds] as string[]),
  });
}

async function sha256(value: string): Promise<string | null> {
  if (!globalThis.crypto?.subtle?.digest) return null;
  try {
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

async function createDraftJournal(): Promise<
  readonly DesktopSpikeDraftJournalEntry[]
> {
  const payload = canonicalDraftPayload();
  const payloadSha256 = await sha256(JSON.stringify(payload));
  if (!payloadSha256) throw new Error("hash_unavailable");

  return Object.freeze([
    Object.freeze({
      version: 1,
      draftId: "DRAFT-01",
      sequence: 1,
      phase: "intent",
      payload: null,
      payloadSha256,
    }),
    Object.freeze({
      version: 1,
      draftId: "DRAFT-01",
      sequence: 2,
      phase: "write",
      payload,
      payloadSha256,
    }),
    Object.freeze({
      version: 1,
      draftId: "DRAFT-01",
      sequence: 3,
      phase: "commit",
      payload: null,
      payloadSha256,
    }),
  ]);
}

function invalidRecovery(
  error: "invalid_journal" | "hash_unavailable",
): DesktopSpikeDraftRecovery {
  return Object.freeze({ state: "invalid", payload: null, error });
}

export async function recoverDesktopSpikeDraftJournal(
  input: unknown,
): Promise<DesktopSpikeDraftRecovery> {
  if (!Array.isArray(input) || input.length > 3)
    return invalidRecovery("invalid_journal");
  if (input.length === 0)
    return Object.freeze({ state: "empty", payload: null });

  const expectedPhases = ["intent", "write", "commit"] as const;
  let sharedHash: string | null = null;
  let payload: DesktopSpikeDraftPayload | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const entry = input[index];
    if (
      !isPlainRecord(entry) ||
      !hasExactDataKeys(entry, JOURNAL_ENTRY_KEYS) ||
      entry.version !== 1 ||
      entry.draftId !== "DRAFT-01" ||
      entry.sequence !== index + 1 ||
      entry.phase !== expectedPhases[index] ||
      typeof entry.payloadSha256 !== "string" ||
      !SHA_256.test(entry.payloadSha256) ||
      (sharedHash !== null && entry.payloadSha256 !== sharedHash)
    ) {
      return invalidRecovery("invalid_journal");
    }
    sharedHash = entry.payloadSha256;

    if (entry.phase === "write") {
      payload = parseDraftPayload(entry.payload);
      if (!payload) return invalidRecovery("invalid_journal");
    } else if (entry.payload !== null) {
      return invalidRecovery("invalid_journal");
    }
  }

  if (input.length === 1)
    return Object.freeze({ state: "intent-only", payload: null });
  if (!payload || !sharedHash) return invalidRecovery("invalid_journal");

  const computedHash = await sha256(JSON.stringify(payload));
  if (!computedHash) return invalidRecovery("hash_unavailable");
  if (computedHash !== sharedHash) return invalidRecovery("invalid_journal");

  return Object.freeze({
    state: input.length === 2 ? "recoverable" : "committed",
    payload,
  });
}

export async function createDesktopSpikeFixture(): Promise<DesktopSpikeFixture> {
  const objects = createBoardObjects();
  const connections = createBoardConnections(objects);
  const outline = createStructuredOutline(objects, connections);
  const pickerRequest: DesktopSelectEvidenceFilesRequest = Object.freeze({
    protocolVersion: DESKTOP_PROTOCOL_VERSION,
    requestId: "spike_picker_1",
    command: "desktop:select-evidence-files",
    payload: Object.freeze({
      caseId: DESKTOP_SPIKE_CASE_ID,
      kinds: Object.freeze(["pdf", "image"] as const),
      multiple: true,
    }),
  });

  return Object.freeze({
    version: DESKTOP_SPIKE_FIXTURE_VERSION,
    caseId: DESKTOP_SPIKE_CASE_ID,
    board: Object.freeze({ objects, connections }),
    outline,
    validDeepLink: "evidencespace://open?route=evidence&case=C-03&object=E-04",
    invalidDeepLinks: Object.freeze([
      "https://invalid.example/?route=home",
      "evidencespace://open?route=home&case=C-03",
      "evidencespace://open?route=unknown&case=C-03",
      "evidencespace://open?route=evidence&case=C-03&case=C-04",
      "evidencespace://open?route=evidence&case=../private",
      "evidencespace://open?route=evidence&case=C-03&object=../../source",
    ]),
    pickerRequest,
    draftJournal: await createDraftJournal(),
  });
}

export function serializeDesktopSpikeFixture(
  fixture: DesktopSpikeFixture,
): string {
  return `${JSON.stringify(fixture)}\n`;
}
