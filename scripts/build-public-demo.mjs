import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = resolve(scriptDirectory, "..");

export const PUBLIC_DEMO_SOURCE_FILES = Object.freeze([
  ["web/evidencespace-shell.js", "evidencespace-shell.js"],
  ["web/evidencespace-shell-model.js", "evidencespace-shell-model.js"],
  ["web/evidencespace-shell.css", "evidencespace-shell.css"],
  ["web/evidencespace-tokens.css", "evidencespace-tokens.css"],
  ["web/evidencespace-pages/brief.js", "evidencespace-pages/brief.js"],
  ["web/evidencespace-pages/cases.js", "evidencespace-pages/cases.js"],
  ["web/evidencespace-pages/evidence-record-adapter.js", "evidencespace-pages/evidence-record-adapter.js"],
  ["web/evidencespace-pages/evidence.js", "evidencespace-pages/evidence.js"],
  ["web/evidencespace-pages/fixtures.js", "evidencespace-pages/fixtures.js"],
  ["web/evidencespace-pages/foundation.js", "evidencespace-pages/foundation.js"],
  ["web/evidencespace-pages/home.js", "evidencespace-pages/home.js"],
  ["web/evidencespace-pages/page-utils.js", "evidencespace-pages/page-utils.js"],
]);

const sourceDescription =
  '    <meta name="description" content="EvidenceSpace connected case workspace preview.">\n';
const noIndexMetadata =
  '    <meta name="robots" content="noindex, nofollow, noarchive">\n';

function publicLandingHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <meta name="description" content="Public EvidenceSpace product preview using fictional data.">
    <title>EvidenceSpace public preview</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; color: #172033; background: #edf2fa; }
      main { width: min(620px, 100%); padding: clamp(28px, 6vw, 52px); border: 1px solid #d7deea; border-radius: 24px; background: #fff; box-shadow: 0 20px 60px rgba(35, 48, 75, .12); }
      .eyebrow { margin: 0; color: #2948b9; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      h1 { margin: 8px 0 10px; font-size: clamp(32px, 7vw, 48px); letter-spacing: -.04em; line-height: 1; }
      .lede { max-width: 46ch; margin: 0; color: #58657a; font-size: 17px; line-height: 1.6; }
      .notice { margin: 26px 0; padding: 16px; border-left: 4px solid #3659d9; border-radius: 10px; background: #f4f6fb; line-height: 1.55; }
      .notice strong { display: block; margin-bottom: 3px; }
      a { min-height: 46px; padding: 0 18px; display: inline-flex; align-items: center; border-radius: 11px; color: #fff; background: #3659d9; font-weight: 750; text-decoration: none; }
      a:focus-visible { outline: 3px solid #153fb3; outline-offset: 3px; }
      .small { margin: 16px 0 0; color: #58657a; font-size: 13px; }
      @media (prefers-color-scheme: dark) { body { color: #f2f4f7; background: #0d1117; } main { border-color: #293445; background: #121821; } .eyebrow { color: #bec8ff; } .lede, .small { color: #afb8c7; } .notice { background: #18202b; } a { color: #10151d; background: #9cacff; } }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Public preview</p>
      <h1>EvidenceSpace</h1>
      <p class="lede">Explore the connected case workspace and its current page flow.</p>
      <div class="notice"><strong>Demo only</strong>Everything shown is fictional. Do not enter real case information. Accounts, secure storage, payments, and AI actions are not connected.</div>
      <a href="app.html?route=home">Open the demo</a>
      <p class="small">Changes in this preview are temporary and reset when the page reloads.</p>
    </main>
  </body>
</html>
`;
}

function publicAppHtml(sourceHtml) {
  if (!sourceHtml.includes(sourceDescription)) {
    throw new Error("Public demo build stopped: shell metadata boundary changed.");
  }
  return sourceHtml.replace(sourceDescription, `${sourceDescription}${noIndexMetadata}`);
}

export async function buildPublicDemo({
  repositoryRoot = defaultRepositoryRoot,
  outputDirectory = resolve(repositoryRoot, ".public-demo"),
} = {}) {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  for (const [source, destination] of PUBLIC_DEMO_SOURCE_FILES) {
    const sourcePath = resolve(repositoryRoot, source);
    const destinationPath = resolve(outputDirectory, destination);
    await mkdir(dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
  }

  const shellHtml = await readFile(
    resolve(repositoryRoot, "web/evidencespace-shell.html"),
    "utf8",
  );
  await Promise.all([
    writeFile(resolve(outputDirectory, "app.html"), publicAppHtml(shellHtml), "utf8"),
    writeFile(resolve(outputDirectory, "index.html"), publicLandingHtml(), "utf8"),
    writeFile(resolve(outputDirectory, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8"),
    writeFile(resolve(outputDirectory, ".nojekyll"), "", "utf8"),
  ]);

  return {
    outputDirectory,
    fileCount: PUBLIC_DEMO_SOURCE_FILES.length + 4,
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await buildPublicDemo();
  console.log(
    JSON.stringify({ output: ".public-demo", files: result.fileCount }),
  );
}
