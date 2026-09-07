import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDesktopSpikeFixture,
  serializeDesktopSpikeFixture,
} from "../src/desktop/spike-fixture.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(
  repositoryRoot,
  ".desktop-build",
  "fixtures",
  "desktop-spike-fixture.v1.json",
);
const fixture = await createDesktopSpikeFixture();
const serialized = serializeDesktopSpikeFixture(fixture);
const sha256 = createHash("sha256").update(serialized).digest("hex");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialized, { encoding: "utf8", mode: 0o600 });

console.log(
  JSON.stringify({
    version: fixture.version,
    objects: fixture.board.objects.length,
    connections: fixture.board.connections.length,
    outlineEntries: fixture.outline.entries.length,
    bytes: Buffer.byteLength(serialized),
    sha256,
    output: ".desktop-build/fixtures/desktop-spike-fixture.v1.json",
  }),
);
