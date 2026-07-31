import { readFile } from "node:fs/promises";
import process from "node:process";
import { scoreEvaluation } from "../lib/evaluation.js";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/evaluate.mjs <result.json> [...]");
  process.exitCode = 2;
} else {
  const reports = [];
  for (const file of files) {
    let result;
    try {
      result = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      throw new Error(`Cannot read evaluation result ${file}: ${error.message}`);
    }
    reports.push(scoreEvaluation(result));
  }
  console.log(JSON.stringify({ schemaVersion: 1, reports }, null, 2));
  if (reports.some((report) => !report.passed)) process.exitCode = 1;
}
