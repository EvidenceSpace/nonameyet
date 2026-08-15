import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync(
  new URL("../web/index.html", import.meta.url),
  "utf8",
);
const intake = readFileSync(
  new URL("../web/cases-new.html", import.meta.url),
  "utf8",
);
const firstRunCss = readFileSync(
  new URL("../web/first-run.css", import.meta.url),
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

test("loads the focused visual foundation after existing page styles", () => {
  assertStylesheetAfter(home, "first-run.css", "styles.css");
  assertStylesheetAfter(intake, "first-run.css", "intake-draft-lifecycle.css");
});

test("keeps first-run privacy and pricing language precise", () => {
  assert.match(home, />Create a private case <span>/);
  assert.doesNotMatch(home, /Create a free case/);
  assert.match(home, /Original files stay on this device\./);
  assert.match(intake, />Private on this device</);
});

test("uses a local, responsive, reduced-motion-safe design layer", () => {
  assert.match(
    firstRunCss,
    /-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI"/,
  );
  assert.match(firstRunCss, /@media \(max-width:\s*860px\)/);
  assert.match(
    firstRunCss,
    /\.intake-shell\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(firstRunCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(
    firstRunCss,
    /@import|https?:\/\/|linear-gradient|transition:\s*all/i,
  );
});

test("decorative brand marks do not duplicate the accessible brand name", () => {
  for (const page of [home, intake]) {
    const visibleBrandMarks =
      page.match(/class="brand-mark"(?![^>]*aria-hidden="true")/g) ?? [];
    assert.deepEqual(visibleBrandMarks, []);
  }
});
