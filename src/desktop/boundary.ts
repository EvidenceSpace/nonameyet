export const DESKTOP_PROTOCOL_VERSION = 1 as const;

export const GLOBAL_ROUTE_IDS = [
  "home",
  "cases",
  "new-case",
  "lawyers",
  "notifications",
  "support",
  "settings",
  "account",
] as const;

export const CASE_ROUTE_IDS = [
  "brief",
  "space",
  "evidence",
  "research",
  "work",
  "room",
  "reports",
] as const;

export const DESKTOP_ROUTE_IDS = [...GLOBAL_ROUTE_IDS, ...CASE_ROUTE_IDS] as const;
export const EVIDENCE_FILE_KINDS = ["pdf", "image"] as const;

export type GlobalRouteId = (typeof GLOBAL_ROUTE_IDS)[number];
export type CaseRouteId = (typeof CASE_ROUTE_IDS)[number];
export type DesktopRouteId = (typeof DESKTOP_ROUTE_IDS)[number];
export type EvidenceFileKind = (typeof EVIDENCE_FILE_KINDS)[number];

export const DESKTOP_SECURITY_BASELINE = Object.freeze({
  rendererContent: "packaged-local-only",
  rendererSystemAccess: "none",
  permissionDefault: "deny",
  navigationDefault: "deny",
  newWindowDefault: "deny",
  bridgeExposure: "command-specific",
  rawBridgeExposed: false,
  senderValidationRequired: true,
  deepLinkReauthorizationRequired: true,
  allowCaseContentInDiagnostics: false,
  allowAbsolutePathsInRenderer: false,
} as const);

export type DesktopDeepLinkTarget = Readonly<{
  kind: "global" | "case";
  route: DesktopRouteId;
  caseId: string | null;
  objectId: string | null;
  href: string;
}>;

export type DesktopDeepLinkErrorCode =
  | "invalid_input"
  | "invalid_origin"
  | "invalid_shape"
  | "unexpected_parameter"
  | "duplicate_parameter"
  | "unsupported_route"
  | "invalid_case_id"
  | "invalid_object_id"
  | "scope_mismatch";

export type DesktopDeepLinkResult =
  | Readonly<{ ok: true; value: DesktopDeepLinkTarget }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: DesktopDeepLinkErrorCode; message: string }>;
    }>;

const SAFE_CASE_ID = /^[a-z0-9][a-z0-9-]{0,39}$/i;
const SAFE_OBJECT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const SAFE_REQUEST_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const ALLOWED_DEEP_LINK_KEYS = ["route", "case", "object"] as const;

function deepLinkFailure(code: DesktopDeepLinkErrorCode, message: string): DesktopDeepLinkResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function isRouteId(value: string): value is DesktopRouteId {
  return (DESKTOP_ROUTE_IDS as readonly string[]).includes(value);
}

function isCaseRouteId(value: DesktopRouteId): value is CaseRouteId {
  return (CASE_ROUTE_IDS as readonly string[]).includes(value);
}

function isEvidenceFileKind(value: unknown): value is EvidenceFileKind {
  return typeof value === "string" && (EVIDENCE_FILE_KINDS as readonly string[]).includes(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(record);
  return keys.length === expected.length
    && keys.every((key) => typeof key === "string" && expected.includes(key));
}

export function parseDesktopDeepLink(input: unknown): DesktopDeepLinkResult {
  if (typeof input !== "string" || input.length === 0 || input.length > 2_048) {
    return deepLinkFailure("invalid_input", "The link is missing or too large to process safely.");
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return deepLinkFailure("invalid_input", "The link is not a valid URL.");
  }

  if (url.protocol !== "evidencespace:" || url.hostname !== "open") {
    return deepLinkFailure("invalid_origin", "The link does not belong to EvidenceSpace.");
  }

  if (url.username || url.password || url.port || url.hash || (url.pathname !== "" && url.pathname !== "/")) {
    return deepLinkFailure("invalid_shape", "The link contains unsupported authority or path data.");
  }

  for (const key of new Set(url.searchParams.keys())) {
    if (!(ALLOWED_DEEP_LINK_KEYS as readonly string[]).includes(key)) {
      return deepLinkFailure("unexpected_parameter", "The link contains an unsupported parameter.");
    }
    if (url.searchParams.getAll(key).length !== 1) {
      return deepLinkFailure("duplicate_parameter", "The link repeats a protected parameter.");
    }
  }

  const routeValue = url.searchParams.get("route");
  if (!routeValue || !isRouteId(routeValue)) {
    return deepLinkFailure("unsupported_route", "The requested destination is not available.");
  }

  const caseValue = url.searchParams.get("case");
  const objectValue = url.searchParams.get("object");
  const isCaseRoute = isCaseRouteId(routeValue);

  if (!isCaseRoute && (caseValue !== null || objectValue !== null)) {
    return deepLinkFailure("scope_mismatch", "Global destinations cannot carry case object context.");
  }

  if (isCaseRoute && (caseValue === null || !SAFE_CASE_ID.test(caseValue))) {
    return deepLinkFailure("invalid_case_id", "The link does not contain a safe case identifier.");
  }

  if (objectValue !== null && !SAFE_OBJECT_ID.test(objectValue)) {
    return deepLinkFailure("invalid_object_id", "The link does not contain a safe object identifier.");
  }

  const params = new URLSearchParams({ route: routeValue });
  if (caseValue !== null) params.set("case", caseValue);
  if (objectValue !== null) params.set("object", objectValue);

  return Object.freeze({
    ok: true,
    value: Object.freeze({
      kind: isCaseRoute ? "case" : "global",
      route: routeValue,
      caseId: caseValue,
      objectId: objectValue,
      href: `/evidencespace-shell.html?${params.toString()}`,
    }),
  });
}

export type DesktopGetCapabilitiesRequest = Readonly<{
  protocolVersion: typeof DESKTOP_PROTOCOL_VERSION;
  requestId: string;
  command: "desktop:get-capabilities";
  payload: Readonly<Record<string, never>>;
}>;

export type DesktopSelectEvidenceFilesRequest = Readonly<{
  protocolVersion: typeof DESKTOP_PROTOCOL_VERSION;
  requestId: string;
  command: "desktop:select-evidence-files";
  payload: Readonly<{
    caseId: string;
    kinds: readonly EvidenceFileKind[];
    multiple: boolean;
  }>;
}>;

export type DesktopBridgeRequest = DesktopGetCapabilitiesRequest | DesktopSelectEvidenceFilesRequest;

export type DesktopBridgeErrorCode =
  | "invalid_envelope"
  | "unsupported_protocol"
  | "invalid_request_id"
  | "unsupported_command"
  | "invalid_payload";

export type DesktopBridgeValidation =
  | Readonly<{ ok: true; value: DesktopBridgeRequest }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: DesktopBridgeErrorCode; message: string }>;
    }>;

function bridgeFailure(code: DesktopBridgeErrorCode, message: string): DesktopBridgeValidation {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

export function validateDesktopBridgeRequest(input: unknown): DesktopBridgeValidation {
  if (!isPlainRecord(input) || !hasExactKeys(input, ["protocolVersion", "requestId", "command", "payload"])) {
    return bridgeFailure("invalid_envelope", "The desktop request envelope is invalid.");
  }

  if (input.protocolVersion !== DESKTOP_PROTOCOL_VERSION) {
    return bridgeFailure("unsupported_protocol", "The desktop request protocol is not supported.");
  }

  if (typeof input.requestId !== "string" || !SAFE_REQUEST_ID.test(input.requestId)) {
    return bridgeFailure("invalid_request_id", "The desktop request identifier is invalid.");
  }

  if (input.command === "desktop:get-capabilities") {
    if (!isPlainRecord(input.payload) || !hasExactKeys(input.payload, [])) {
      return bridgeFailure("invalid_payload", "The capabilities request payload must be empty.");
    }

    return Object.freeze({
      ok: true,
      value: Object.freeze({
        protocolVersion: DESKTOP_PROTOCOL_VERSION,
        requestId: input.requestId,
        command: "desktop:get-capabilities",
        payload: Object.freeze({}),
      }),
    });
  }

  if (input.command === "desktop:select-evidence-files") {
    if (!isPlainRecord(input.payload)
      || !hasExactKeys(input.payload, ["caseId", "kinds", "multiple"])
      || typeof input.payload.caseId !== "string"
      || !SAFE_CASE_ID.test(input.payload.caseId)
      || !Array.isArray(input.payload.kinds)
      || input.payload.kinds.length === 0
      || input.payload.kinds.length > EVIDENCE_FILE_KINDS.length
      || typeof input.payload.multiple !== "boolean") {
      return bridgeFailure("invalid_payload", "The evidence picker request payload is invalid.");
    }

    const kinds: EvidenceFileKind[] = [];
    for (const kind of input.payload.kinds) {
      if (!isEvidenceFileKind(kind) || kinds.includes(kind)) {
        return bridgeFailure("invalid_payload", "The evidence picker request contains an invalid file kind.");
      }
      kinds.push(kind);
    }

    return Object.freeze({
      ok: true,
      value: Object.freeze({
        protocolVersion: DESKTOP_PROTOCOL_VERSION,
        requestId: input.requestId,
        command: "desktop:select-evidence-files",
        payload: Object.freeze({
          caseId: input.payload.caseId,
          kinds: Object.freeze(kinds),
          multiple: input.payload.multiple,
        }),
      }),
    });
  }

  return bridgeFailure("unsupported_command", "The desktop request command is not allowlisted.");
}
