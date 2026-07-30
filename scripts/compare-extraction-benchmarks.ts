import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { compareExtractionBenchmarkReports } from "../src/ai/benchmark-comparison.js";
import { parseComparableExtractionBenchmarkReport } from "../src/ai/benchmark-report-input.js";

const MAX_REPORT_BYTES = 10 * 1024 * 1024;
const MAX_REPORTS = 25;

async function loadReport(path: string): Promise<ReturnType<typeof parseComparableExtractionBenchmarkReport>> {
  const fileStat = await stat(path);
  if (!fileStat.isFile()) throw new Error(`Benchmark report is not a file: ${path}`);
  if (fileStat.size > MAX_REPORT_BYTES) throw new Error(`Benchmark report exceeds 10 MiB: ${path}`);
  let json: unknown;
  try {
    json = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Benchmark report is not valid JSON: ${path}`, { cause: error });
  }
  return parseComparableExtractionBenchmarkReport(json);
}

async function main(): Promise<void> {
  const [outputArgument, ...reportArguments] = process.argv.slice(2);
  if (!outputArgument || reportArguments.length < 2 || reportArguments.length > MAX_REPORTS) {
    throw new Error("Usage: npm run benchmark:compare -- <comparison.json> <report-a.json> <report-b.json> [more reports]");
  }
  const outputPath = resolve(outputArgument);
  const reportPaths = reportArguments.map(resolve);
  const uniquePaths = new Set([outputPath, ...reportPaths]);
  if (uniquePaths.size !== reportPaths.length + 1) throw new Error("Output and input report paths must all be different.");

  const reports = await Promise.all(reportPaths.map(loadReport));
  const comparison = compareExtractionBenchmarkReports({ reports });
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(comparison, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
  console.log(`Compared ${reports.length} benchmark reports at ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Benchmark comparison failed.");
  process.exitCode = 1;
});
