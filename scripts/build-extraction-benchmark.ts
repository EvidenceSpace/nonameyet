import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { EXTRACTION_EVALUATION_CORPUS } from "../evals/corpus.js";
import { createExtractionBenchmarkReport } from "../src/ai/benchmark.js";
import { parseExtractionBenchmarkInput } from "../src/ai/benchmark-input.js";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;

async function main(): Promise<void> {
  const [inputArgument, outputArgument, ...extra] = process.argv.slice(2);
  if (!inputArgument || !outputArgument || extra.length > 0) {
    throw new Error("Usage: npm run benchmark:extraction -- <captured-output.json> <report.json>");
  }

  const inputPath = resolve(inputArgument);
  const outputPath = resolve(outputArgument);
  if (inputPath === outputPath) throw new Error("Input and report paths must be different.");

  const inputStat = await stat(inputPath);
  if (!inputStat.isFile()) throw new Error("Benchmark input must be a file.");
  if (inputStat.size > MAX_INPUT_BYTES) throw new Error("Benchmark input exceeds the 10 MiB safety limit.");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(await readFile(inputPath, "utf8"));
  } catch (error) {
    throw new Error("Benchmark input is not valid JSON.", { cause: error });
  }

  const input = parseExtractionBenchmarkInput(parsedJson);
  const report = createExtractionBenchmarkReport({
    metadata: input.metadata,
    corpus: EXTRACTION_EVALUATION_CORPUS,
    outputs: input.outputs,
  });

  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }

  console.log(`Wrote ${report.fixtureCount}-fixture benchmark report to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Benchmark report generation failed.");
  process.exitCode = 1;
});
