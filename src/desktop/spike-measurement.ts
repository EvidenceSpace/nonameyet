import { validateDesktopBridgeRequest } from "./boundary.js";
import { BOARD_FRAME_P95_LIMIT_MS } from "./spike-evidence.js";
import {
  BOARD_OBJECT_KINDS,
  BOARD_RELATION_TYPES,
  DESKTOP_SPIKE_CASE_ID,
  DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT,
  DESKTOP_SPIKE_FIXTURE_VERSION,
  DESKTOP_SPIKE_OBJECT_COUNT,
  type BoardObjectKind,
  type BoardRelationType,
  type DesktopSpikeBoardConnection,
  type DesktopSpikeBoardObject,
  type DesktopSpikeOutlineEntry,
  type DesktopSpikeOutlineRelation,
} from "./spike-fixture.js";

export const DESKTOP_SPIKE_FRAME_WARMUP_COUNT = 20 as const;
export const DESKTOP_SPIKE_FRAME_SAMPLE_COUNT = 120 as const;
export const DESKTOP_SPIKE_FRAME_TIMEOUT_MS = 15_000 as const;

export type DesktopSpikeBoardMeasurementModel = Readonly<{
  fixtureVersion: typeof DESKTOP_SPIKE_FIXTURE_VERSION;
  caseId: typeof DESKTOP_SPIKE_CASE_ID;
  boardWidth: number;
  boardHeight: number;
  objects: readonly DesktopSpikeBoardObject[];
  connections: readonly DesktopSpikeBoardConnection[];
  outlineEntries: readonly DesktopSpikeOutlineEntry[];
  outlineRelations: readonly DesktopSpikeOutlineRelation[];
}>;

export type DesktopSpikeFixtureValidation =
  | Readonly<{ ok: true; value: DesktopSpikeBoardMeasurementModel }>
  | Readonly<{ ok: false; error: "invalid_fixture" }>;

export type DesktopSpikeFrameSummary = Readonly<{
  sampleCount: typeof DESKTOP_SPIKE_FRAME_SAMPLE_COUNT;
  p95Ms: number;
  minMs: number;
  maxMs: number;
  limitMs: number;
  passed: boolean;
}>;

export type DesktopSpikeFrameSummaryResult =
  | Readonly<{ ok: true; value: DesktopSpikeFrameSummary }>
  | Readonly<{ ok: false; error: "invalid_frame_samples" }>;

const FIXTURE_KEYS = [
  "version",
  "caseId",
  "board",
  "outline",
  "validDeepLink",
  "invalidDeepLinks",
  "pickerRequest",
  "draftJournal",
] as const;
const BOARD_KEYS = ["objects", "connections"] as const;
const OUTLINE_KEYS = ["entries", "relations"] as const;
const OBJECT_KEYS = [
  "id",
  "kind",
  "column",
  "row",
  "x",
  "y",
  "width",
  "height",
] as const;
const CONNECTION_KEYS = ["id", "fromId", "toId", "type"] as const;
const OUTLINE_ENTRY_KEYS = [
  "objectId",
  "kind",
  "position",
  "incomingRelationCount",
  "outgoingRelationCount",
] as const;
const OUTLINE_RELATION_KEYS = [
  "connectionId",
  "fromObjectId",
  "toObjectId",
  "type",
] as const;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const MAX_BOARD_COORDINATE = 1_000_000;
const MAX_FRAME_SAMPLE_MS = 1_000;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
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

function ownArrayValues(
  input: unknown,
  minimumLength: number,
  maximumLength = minimumLength,
): readonly unknown[] | null {
  if (
    !Array.isArray(input) ||
    !Number.isSafeInteger(input.length) ||
    input.length < minimumLength ||
    input.length > maximumLength
  ) {
    return null;
  }

  const ownKeys = Reflect.ownKeys(input).filter((key) => key !== "length");
  if (
    ownKeys.length !== input.length ||
    ownKeys.some((key) => typeof key !== "string" || !/^\d+$/.test(key))
  ) {
    return null;
  }

  const values: unknown[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
    if (!descriptor || !("value" in descriptor)) return null;
    values.push(descriptor.value);
  }
  return values;
}

function isSafeIntegerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isBoardObjectKind(value: unknown): value is BoardObjectKind {
  return (
    typeof value === "string" &&
    (BOARD_OBJECT_KINDS as readonly string[]).includes(value)
  );
}

function isBoardRelationType(value: unknown): value is BoardRelationType {
  return (
    typeof value === "string" &&
    (BOARD_RELATION_TYPES as readonly string[]).includes(value)
  );
}

function fixtureFailure(): DesktopSpikeFixtureValidation {
  return Object.freeze({ ok: false, error: "invalid_fixture" });
}

function frameFailure(): DesktopSpikeFrameSummaryResult {
  return Object.freeze({ ok: false, error: "invalid_frame_samples" });
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

export function validateDesktopSpikeMeasurementFixture(
  input: unknown,
): DesktopSpikeFixtureValidation {
  if (!isPlainRecord(input) || !hasExactDataKeys(input, FIXTURE_KEYS)) {
    return fixtureFailure();
  }
  if (
    input.version !== DESKTOP_SPIKE_FIXTURE_VERSION ||
    input.caseId !== DESKTOP_SPIKE_CASE_ID ||
    input.validDeepLink !==
      "evidencespace://open?route=evidence&case=C-03&object=E-04"
  ) {
    return fixtureFailure();
  }

  const invalidDeepLinks = ownArrayValues(input.invalidDeepLinks, 5, 16);
  const draftJournal = ownArrayValues(input.draftJournal, 3);
  if (
    !invalidDeepLinks ||
    invalidDeepLinks.some(
      (value) =>
        typeof value !== "string" || value.length === 0 || value.length > 2_048,
    ) ||
    !draftJournal
  ) {
    return fixtureFailure();
  }

  const picker = validateDesktopBridgeRequest(input.pickerRequest);
  if (
    !picker.ok ||
    picker.value.command !== "desktop:select-evidence-files" ||
    picker.value.payload.caseId !== DESKTOP_SPIKE_CASE_ID ||
    picker.value.payload.multiple !== true ||
    picker.value.payload.kinds.length !== 2 ||
    picker.value.payload.kinds[0] !== "pdf" ||
    picker.value.payload.kinds[1] !== "image"
  ) {
    return fixtureFailure();
  }

  if (
    !isPlainRecord(input.board) ||
    !hasExactDataKeys(input.board, BOARD_KEYS) ||
    !isPlainRecord(input.outline) ||
    !hasExactDataKeys(input.outline, OUTLINE_KEYS)
  ) {
    return fixtureFailure();
  }

  const rawObjects = ownArrayValues(
    input.board.objects,
    DESKTOP_SPIKE_OBJECT_COUNT,
  );
  const rawConnections = ownArrayValues(
    input.board.connections,
    DESKTOP_SPIKE_OBJECT_COUNT * DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT,
  );
  const rawOutlineEntries = ownArrayValues(
    input.outline.entries,
    DESKTOP_SPIKE_OBJECT_COUNT,
  );
  const rawOutlineRelations = ownArrayValues(
    input.outline.relations,
    DESKTOP_SPIKE_OBJECT_COUNT * DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT,
  );
  if (
    !rawObjects ||
    !rawConnections ||
    !rawOutlineEntries ||
    !rawOutlineRelations
  ) {
    return fixtureFailure();
  }

  const objects: DesktopSpikeBoardObject[] = [];
  const objectIds = new Set<string>();
  let boardWidth = 0;
  let boardHeight = 0;
  for (const rawObject of rawObjects) {
    if (
      !isPlainRecord(rawObject) ||
      !hasExactDataKeys(rawObject, OBJECT_KEYS) ||
      typeof rawObject.id !== "string" ||
      !SAFE_ID.test(rawObject.id) ||
      objectIds.has(rawObject.id) ||
      !isBoardObjectKind(rawObject.kind) ||
      !isSafeIntegerBetween(rawObject.column, 0, DESKTOP_SPIKE_OBJECT_COUNT) ||
      !isSafeIntegerBetween(rawObject.row, 0, DESKTOP_SPIKE_OBJECT_COUNT) ||
      !isSafeIntegerBetween(rawObject.x, 0, MAX_BOARD_COORDINATE) ||
      !isSafeIntegerBetween(rawObject.y, 0, MAX_BOARD_COORDINATE) ||
      !isSafeIntegerBetween(rawObject.width, 1, 4_096) ||
      !isSafeIntegerBetween(rawObject.height, 1, 4_096)
    ) {
      return fixtureFailure();
    }

    const right = rawObject.x + rawObject.width;
    const bottom = rawObject.y + rawObject.height;
    if (right > MAX_BOARD_COORDINATE || bottom > MAX_BOARD_COORDINATE) {
      return fixtureFailure();
    }
    boardWidth = Math.max(boardWidth, right);
    boardHeight = Math.max(boardHeight, bottom);
    objectIds.add(rawObject.id);
    objects.push(
      Object.freeze({
        id: rawObject.id,
        kind: rawObject.kind,
        column: rawObject.column,
        row: rawObject.row,
        x: rawObject.x,
        y: rawObject.y,
        width: rawObject.width,
        height: rawObject.height,
      }),
    );
  }

  const connections: DesktopSpikeBoardConnection[] = [];
  const connectionIds = new Set<string>();
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const rawConnection of rawConnections) {
    if (
      !isPlainRecord(rawConnection) ||
      !hasExactDataKeys(rawConnection, CONNECTION_KEYS) ||
      typeof rawConnection.id !== "string" ||
      !SAFE_ID.test(rawConnection.id) ||
      connectionIds.has(rawConnection.id) ||
      typeof rawConnection.fromId !== "string" ||
      !objectIds.has(rawConnection.fromId) ||
      typeof rawConnection.toId !== "string" ||
      !objectIds.has(rawConnection.toId) ||
      rawConnection.fromId === rawConnection.toId ||
      !isBoardRelationType(rawConnection.type)
    ) {
      return fixtureFailure();
    }

    connectionIds.add(rawConnection.id);
    incoming.set(
      rawConnection.toId,
      (incoming.get(rawConnection.toId) ?? 0) + 1,
    );
    outgoing.set(
      rawConnection.fromId,
      (outgoing.get(rawConnection.fromId) ?? 0) + 1,
    );
    connections.push(
      Object.freeze({
        id: rawConnection.id,
        fromId: rawConnection.fromId,
        toId: rawConnection.toId,
        type: rawConnection.type,
      }),
    );
  }

  const outlineEntries: DesktopSpikeOutlineEntry[] = [];
  for (let index = 0; index < rawOutlineEntries.length; index += 1) {
    const rawEntry = rawOutlineEntries[index];
    const object = objects[index];
    if (
      !object ||
      !isPlainRecord(rawEntry) ||
      !hasExactDataKeys(rawEntry, OUTLINE_ENTRY_KEYS) ||
      rawEntry.objectId !== object.id ||
      rawEntry.kind !== object.kind ||
      rawEntry.position !== index + 1 ||
      rawEntry.incomingRelationCount !== (incoming.get(object.id) ?? 0) ||
      rawEntry.outgoingRelationCount !== (outgoing.get(object.id) ?? 0) ||
      rawEntry.incomingRelationCount !== DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT ||
      rawEntry.outgoingRelationCount !== DESKTOP_SPIKE_CONNECTIONS_PER_OBJECT
    ) {
      return fixtureFailure();
    }

    outlineEntries.push(
      Object.freeze({
        objectId: object.id,
        kind: object.kind,
        position: index + 1,
        incomingRelationCount: rawEntry.incomingRelationCount,
        outgoingRelationCount: rawEntry.outgoingRelationCount,
      }),
    );
  }

  const outlineRelations: DesktopSpikeOutlineRelation[] = [];
  for (let index = 0; index < rawOutlineRelations.length; index += 1) {
    const rawRelation = rawOutlineRelations[index];
    const connection = connections[index];
    if (
      !connection ||
      !isPlainRecord(rawRelation) ||
      !hasExactDataKeys(rawRelation, OUTLINE_RELATION_KEYS) ||
      rawRelation.connectionId !== connection.id ||
      rawRelation.fromObjectId !== connection.fromId ||
      rawRelation.toObjectId !== connection.toId ||
      rawRelation.type !== connection.type
    ) {
      return fixtureFailure();
    }

    outlineRelations.push(
      Object.freeze({
        connectionId: connection.id,
        fromObjectId: connection.fromId,
        toObjectId: connection.toId,
        type: connection.type,
      }),
    );
  }

  return Object.freeze({
    ok: true,
    value: Object.freeze({
      fixtureVersion: DESKTOP_SPIKE_FIXTURE_VERSION,
      caseId: DESKTOP_SPIKE_CASE_ID,
      boardWidth,
      boardHeight,
      objects: Object.freeze(objects),
      connections: Object.freeze(connections),
      outlineEntries: Object.freeze(outlineEntries),
      outlineRelations: Object.freeze(outlineRelations),
    }),
  });
}

export function summarizeDesktopSpikeFrameSamples(
  input: unknown,
): DesktopSpikeFrameSummaryResult {
  const values = ownArrayValues(input, DESKTOP_SPIKE_FRAME_SAMPLE_COUNT);
  if (!values) return frameFailure();

  const samples: number[] = [];
  for (const value of values) {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > MAX_FRAME_SAMPLE_MS
    ) {
      return frameFailure();
    }
    samples.push(value);
  }

  samples.sort((left, right) => left - right);
  const p95Index = Math.ceil(samples.length * 0.95) - 1;
  const p95 = samples[p95Index];
  const minimum = samples[0];
  const maximum = samples[samples.length - 1];
  if (p95 === undefined || minimum === undefined || maximum === undefined) {
    return frameFailure();
  }

  return Object.freeze({
    ok: true,
    value: Object.freeze({
      sampleCount: DESKTOP_SPIKE_FRAME_SAMPLE_COUNT,
      p95Ms: roundMetric(p95),
      minMs: roundMetric(minimum),
      maxMs: roundMetric(maximum),
      limitMs: BOARD_FRAME_P95_LIMIT_MS,
      passed: p95 <= BOARD_FRAME_P95_LIMIT_MS,
    }),
  });
}
