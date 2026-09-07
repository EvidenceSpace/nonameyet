import assert from "node:assert/strict";
import test from "node:test";

import {
  ELECTRON_APP_ORIGIN,
  PACKAGED_CONTENT_SECURITY_POLICY,
  PACKAGED_WEB_ASSETS,
  authorizeSyntheticSpikeTarget,
  buildPickerFilters,
  buildShellUrlFromHref,
  createOpaqueEvidenceSelection,
  resolvePackagedAsset,
  shellUrlToDesktopDeepLink,
} from "../desktop/electron/runtime-policy.mjs";

test("the Electron content protocol serves only the packaged shell allowlist", () => {
  for (const fileName of PACKAGED_WEB_ASSETS) {
    assert.equal(resolvePackagedAsset(`${ELECTRON_APP_ORIGIN}/${fileName}`)?.fileName, fileName);
  }

  const rejected = [
    "https://app/evidencespace-shell.html?route=home",
    `${ELECTRON_APP_ORIGIN}/../package.json`,
    `${ELECTRON_APP_ORIGIN}/%2e%2e/package.json`,
    `${ELECTRON_APP_ORIGIN}/evidencespace-shell.js?token=secret`,
    `${ELECTRON_APP_ORIGIN}/unknown.js`,
    `${ELECTRON_APP_ORIGIN}/evidencespace-shell.html#fragment`,
    `${ELECTRON_APP_ORIGIN}:443/evidencespace-shell.html`,
  ];
  for (const url of rejected) assert.equal(resolvePackagedAsset(url), null);
});

test("shell URLs map to the existing validated deep-link boundary", () => {
  const shellUrl = buildShellUrlFromHref("/evidencespace-shell.html?route=evidence&case=C-03&object=E-04");
  assert.equal(shellUrl, `${ELECTRON_APP_ORIGIN}/evidencespace-shell.html?route=evidence&case=C-03&object=E-04`);
  assert.equal(shellUrlToDesktopDeepLink(shellUrl!), "evidencespace://open?route=evidence&case=C-03&object=E-04");
  assert.equal(buildShellUrlFromHref("https://attacker.example/"), null);
});

test("the packaged response policy denies network, framing, forms, objects, media, and workers", () => {
  for (const directive of [
    "connect-src 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "media-src 'none'",
    "worker-src 'none'",
  ]) {
    assert.ok(PACKAGED_CONTENT_SECURITY_POLICY.includes(directive));
  }
});

test("picker filters remain limited to the approved evidence kinds", () => {
  assert.deepEqual(buildPickerFilters(["pdf", "image"]), [
    { name: "PDF documents", extensions: ["pdf"] },
    { name: "Images", extensions: ["png", "jpg", "jpeg", "heic", "heif", "webp"] },
  ]);
  assert.deepEqual(buildPickerFilters(["archive"]), []);
});

test("native selections expose opaque handles and keep absolute paths host-side", () => {
  const sourcePaths = ["/private/evidence/source.pdf", "/private/evidence/photo.png", "/private/evidence/script.exe"];
  const selection = createOpaqueEvidenceSelection(
    sourcePaths,
    ["pdf", "image"],
    (index: number) => `evidence_${String(index + 1).padStart(16, "0")}`,
  );

  assert.deepEqual(selection.rendererFiles, [
    { handle: "evidence_0000000000000001", kind: "pdf" },
    { handle: "evidence_0000000000000002", kind: "image" },
  ]);
  assert.equal(JSON.stringify(selection.rendererFiles).includes("/private"), false);
  assert.equal(selection.hostFiles.get("evidence_0000000000000001"), sourcePaths[0]);
  assert.equal(selection.hostFiles.has("evidence_0000000000000003"), false);
});

test("candidate deep-link authorization is explicitly limited to global routes and synthetic Case C-03", () => {
  assert.equal(authorizeSyntheticSpikeTarget({ kind: "global", route: "home" }), true);
  assert.equal(authorizeSyntheticSpikeTarget({ kind: "case", caseId: "C-03", route: "evidence" }), true);
  assert.equal(authorizeSyntheticSpikeTarget({ kind: "case", caseId: "C-04", route: "evidence" }), false);
});
