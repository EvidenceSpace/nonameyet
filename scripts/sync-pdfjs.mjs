import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PINNED_VERSION = "4.10.38";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(root, "node_modules/pdfjs-dist");
const output = resolve(root, "web/vendor/pdfjs");

let metadata;
try {
  metadata = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
} catch {
  console.error(`PDF.js is not installed. Run npm install (expected pdfjs-dist ${PINNED_VERSION}).`);
  process.exit(1);
}
if (metadata.version !== PINNED_VERSION) {
  console.error(`Refusing to bundle pdfjs-dist ${metadata.version}; expected pinned version ${PINNED_VERSION}.`);
  process.exit(1);
}

await mkdir(output, { recursive: true });
await Promise.all([
  copyFile(resolve(packageRoot, "build/pdf.mjs"), resolve(output, "pdf.mjs")),
  copyFile(resolve(packageRoot, "build/pdf.worker.mjs"), resolve(output, "pdf.worker.mjs")),
]);
await writeFile(resolve(output, "manifest.json"), `${JSON.stringify({ package: "pdfjs-dist", version: PINNED_VERSION }, null, 2)}\n`);
console.log(`Bundled local PDF.js ${PINNED_VERSION} into web/vendor/pdfjs.`);
