import assert from "node:assert/strict";
import test from "node:test";

import {
  CASE_ROUTE_IDS,
  DESKTOP_PROTOCOL_VERSION,
  DESKTOP_SECURITY_BASELINE,
  GLOBAL_ROUTE_IDS,
  parseDesktopDeepLink,
  validateDesktopBridgeRequest,
} from "../src/desktop/boundary.js";
import { CASE_LENSES, GLOBAL_DESTINATIONS } from "../web/evidencespace-shell-model.js";

test("desktop routes stay identical to the approved shell model", () => {
  assert.deepEqual(GLOBAL_ROUTE_IDS, GLOBAL_DESTINATIONS.map(({ id }) => id));
  assert.deepEqual(CASE_ROUTE_IDS, CASE_LENSES.map(({ id }) => id));
});

test("canonical case deep links preserve safe route, case, and object context", () => {
  const result = parseDesktopDeepLink("evidencespace://open?route=evidence&case=C-03&object=E-04");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    kind: "case",
    route: "evidence",
    caseId: "C-03",
    objectId: "E-04",
    href: "/evidencespace-shell.html?route=evidence&case=C-03&object=E-04",
  });
});

test("global deep links cannot smuggle case or object context", () => {
  const valid = parseDesktopDeepLink("evidencespace://open?route=home");
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.kind, "global");
    assert.equal(valid.value.caseId, null);
  }

  const scoped = parseDesktopDeepLink("evidencespace://open?route=home&case=C-03");
  assert.equal(scoped.ok, false);
  if (!scoped.ok) assert.equal(scoped.error.code, "scope_mismatch");
});

test("deep links reject foreign origins, authority tricks, fragments, paths, and scope errors", () => {
  const attempts = [
    "https://attacker.example/?route=home",
    "evidencespace://user:pass@open?route=home",
    "evidencespace://open:443?route=home",
    "evidencespace://open/?route=home",
    "evidencespace://open/path?route=home",
    "evidencespace://open?route=home#fragment",
    "evidencespace://open?route=home&route=cases",
    "evidencespace://open?route=home&token=secret",
    "evidencespace://open?route=evidence",
    "evidencespace://open?route=evidence&case=C-03.exe",
    "evidencespace://open?route=evidence&case=C-03&object=../../source",
    `evidencespace://open?route=home&ignored=${"a".repeat(2_048)}`,
  ];

  for (const attempt of attempts) assert.equal(parseDesktopDeepLink(attempt).ok, false);
});

test("rejected link results never echo hostile input", () => {
  const hostile = "evidencespace://open?route=javascript%3Aalert(1)&case=%3Cscript%3Esecret%3C%2Fscript%3E";
  const result = parseDesktopDeepLink(hostile);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes("secret"), false);
  assert.equal(JSON.stringify(result).includes("script"), false);
});

test("the bridge accepts only versioned capabilities and native picker commands", () => {
  const capabilities = validateDesktopBridgeRequest({
    protocolVersion: DESKTOP_PROTOCOL_VERSION,
    requestId: "request_1",
    command: "desktop:get-capabilities",
    payload: {},
  });
  assert.equal(capabilities.ok, true);

  const picker = validateDesktopBridgeRequest({
    protocolVersion: DESKTOP_PROTOCOL_VERSION,
    requestId: "request_2",
    command: "desktop:select-evidence-files",
    payload: { caseId: "C-03", kinds: ["pdf", "image"], multiple: true },
  });
  assert.equal(picker.ok, true);
  if (picker.ok && picker.value.command === "desktop:select-evidence-files") {
    assert.deepEqual(picker.value.payload.kinds, ["pdf", "image"]);
  }
});

test("the bridge rejects paths, duplicate kinds, unknown fields, accessors, and protocol drift", () => {
  const accessorEnvelope = {
    protocolVersion: 1,
    requestId: "request_5",
    command: "desktop:get-capabilities",
    get payload() {
      return {};
    },
  };

  const attempts = [
    {
      protocolVersion: 1,
      requestId: "request_1",
      command: "desktop:select-evidence-files",
      payload: { caseId: "C-03", kinds: ["pdf"], multiple: false, path: "/private/source.pdf" },
    },
    {
      protocolVersion: 1,
      requestId: "request_2",
      command: "desktop:select-evidence-files",
      payload: { caseId: "C-03", kinds: ["pdf", "pdf"], multiple: true },
    },
    { protocolVersion: 1, requestId: "request_3", command: "desktop:run-shell", payload: {} },
    { protocolVersion: 2, requestId: "request_4", command: "desktop:get-capabilities", payload: {} },
    { protocolVersion: 1, requestId: "request_6", command: "desktop:get-capabilities", payload: {}, extra: true },
    {
      protocolVersion: 1,
      requestId: "x".repeat(65),
      command: "desktop:get-capabilities",
      payload: {},
    },
    accessorEnvelope,
  ];

  for (const attempt of attempts) assert.equal(validateDesktopBridgeRequest(attempt).ok, false);
});

test("the host-neutral security baseline is fail closed", () => {
  assert.deepEqual(DESKTOP_SECURITY_BASELINE, {
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
  });
});
