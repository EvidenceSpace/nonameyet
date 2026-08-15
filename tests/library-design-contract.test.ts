import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const library = readFileSync(
  new URL("../web/cases.html", import.meta.url),
  "utf8",
);
const libraryCss = readFileSync(
  new URL("../web/library-foundation.css", import.meta.url),
  "utf8",
);

function assertStylesheetAfter(
  html: string,
  stylesheet: string,
  dependency: string,
) {
  const stylesheetIndex = html.indexOf(`href="${stylesheet}"`);
  const dependencyIndex = html.indexOf(`href="${dependency}"`);
  assert.ok(stylesheetIndex >= 0, `${stylesheet} must be linked`);
  assert.ok(dependencyIndex >= 0, `${dependency} must be linked`);
  assert.ok(
    stylesheetIndex > dependencyIndex,
    `${stylesheet} must load after ${dependency}`,
  );
}

test("loads the library foundation after existing behavioral styles", () => {
  assertStylesheetAfter(library, "library-foundation.css", "case-history.css");
  for (const script of [
    "case-history-ui.js",
    "case-library.js",
    "case-hub-actions.js",
    "account-ui.js",
  ]) {
    assert.match(library, new RegExp(`src="${script.replace(".", "\\.")}"`));
  }
});

test("uses precise local-storage language without implying synchronization", () => {
  assert.match(library, />\s*Stored on this device</);
  assert.match(library, /<strong>Local browser storage<\/strong>/);
  assert.match(
    library,
    /Signing in does not synchronize or upload these cases\./,
  );
  assert.match(library, /create an encrypted backup before changing devices/);
  assert.doesNotMatch(library, />\s*This device only\s*</);
});

test("keeps decorative library marks out of the accessibility tree", () => {
  assert.match(library, /class="brand-mark" aria-hidden="true"/);
  assert.match(library, /class="library-boundary"><span aria-hidden="true">/);
  assert.match(library, /class="empty-mark" aria-hidden="true"/);
  assert.match(
    library,
    /id="case-grid" aria-label="Local cases" aria-live="polite"/,
  );
});

test("uses a local, responsive, reduced-motion-safe library layer", () => {
  assert.match(libraryCss, /-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI"/);
  assert.match(libraryCss, /@media \(max-width:\s*760px\)/);
  assert.match(libraryCss, /@media \(max-width:\s*520px\)/);
  assert.match(
    libraryCss,
    /\.case-grid\s*\{\s*grid-template-columns:\s*1fr(?:;|\})/,
  );
  assert.match(libraryCss, /\.library-controls input[\s\S]*font-size:\s*16px;/);
  assert.match(libraryCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(
    libraryCss,
    /@import|https?:\/\/|linear-gradient|transition:\s*all/i,
  );
});
