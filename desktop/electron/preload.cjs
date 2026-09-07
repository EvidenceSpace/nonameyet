"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const CHANNEL = "evidencespace:desktop:v1";
let requestSequence = 0;

function nextRequestId() {
  requestSequence = (requestSequence + 1) % 1_000_000;
  return `request_${Date.now().toString(36)}_${requestSequence.toString(36)}`;
}

function ownDataValue(input, key) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, "value") ? descriptor.value : undefined;
}

function invoke(command, payload) {
  return ipcRenderer.invoke(CHANNEL, {
    protocolVersion: 1,
    requestId: nextRequestId(),
    command,
    payload,
  });
}

const evidenceSpaceDesktop = Object.freeze({
  getCapabilities() {
    return invoke("desktop:get-capabilities", {});
  },
  selectEvidenceFiles(input) {
    const kinds = ownDataValue(input, "kinds");
    const payload = Object.freeze({
      caseId: ownDataValue(input, "caseId"),
      kinds: Array.isArray(kinds) ? Array.from(kinds) : kinds,
      multiple: ownDataValue(input, "multiple"),
    });
    return invoke("desktop:select-evidence-files", payload);
  },
});

contextBridge.exposeInMainWorld("evidenceSpaceDesktop", evidenceSpaceDesktop);
