import { readFile } from "node:fs/promises";
import process from "node:process";
import { scoreRoutingResult } from "../lib/routing-evaluation.js";

const [suiteFile, resultFile, ...extra] = process.argv.slice(2);
if (!suiteFile || !resultFile || extra.length > 0) {
  console.error("Usage: node scripts/evaluate-routing.mjs <suite.json> <result.json>");
  process.exitCode = 2;
} else {
  const readJson = async (file, label) => {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      throw new Error(`Cannot read ${label} ${file}: ${error.message}`);
    }
  };
  const report = scoreRoutingResult(
    await readJson(suiteFile, "routing suite"),
    await readJson(resultFile, "routing result"),
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
