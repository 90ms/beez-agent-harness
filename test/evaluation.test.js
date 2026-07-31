import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  scoreEvaluation,
  validateEvaluationResult,
} from "../lib/evaluation.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const script = path.join(packageRoot, "scripts/evaluate.mjs");

async function fixture(name) {
  return JSON.parse(
    await readFile(path.join(packageRoot, "evals/fixtures", name), "utf8"),
  );
}

function runEvaluator(files) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [script, ...files],
      { cwd: packageRoot },
      (error, stdout, stderr) => {
        resolve({
          code: error ? Number(error.code) || 1 : 0,
          stdout,
          stderr,
        });
      },
    );
  });
}

test("scores a complete evidence-backed result", async () => {
  const report = scoreEvaluation(await fixture("passing-result.json"));

  assert.equal(report.score, 100);
  assert.equal(report.passed, true);
  assert.equal(report.criteria.length, 5);
});

test("requires passing tests even when the weighted score is high", () => {
  const result = {
    schemaVersion: 1,
    caseId: "quality-gate",
    assertions: {
      requirementsMet: true,
      testsPassed: false,
      scopePreserved: true,
      verificationRun: true,
      evidenceBacked: true,
    },
  };

  const report = scoreEvaluation(result);

  assert.equal(report.score, 75);
  assert.equal(report.passed, false);
});

test("rejects incomplete or non-boolean assertions", () => {
  assert.throws(
    () =>
      validateEvaluationResult({
        schemaVersion: 1,
        caseId: "invalid",
        assertions: { requirementsMet: "yes" },
      }),
    /must contain exactly/,
  );
});

test("CLI exits successfully for passing evaluation results", async () => {
  const result = await runEvaluator(["evals/fixtures/passing-result.json"]);
  const output = JSON.parse(result.stdout);

  assert.equal(result.code, 0);
  assert.equal(result.stderr, "");
  assert.equal(output.reports[0].score, 100);
});

test("CLI exits non-zero when any evaluation result fails", async () => {
  const result = await runEvaluator([
    "evals/fixtures/passing-result.json",
    "evals/fixtures/failing-result.json",
  ]);
  const output = JSON.parse(result.stdout);

  assert.equal(result.code, 1);
  assert.equal(output.reports.length, 2);
  assert.equal(output.reports[1].passed, false);
});
