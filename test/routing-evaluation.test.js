import assert from "node:assert/strict";
import test from "node:test";
import {
  scoreRoutingResult,
  validateRoutingSuite,
} from "../lib/routing-evaluation.js";

const suite = {
  schemaVersion: 1,
  id: "test-routing",
  cases: [
    {
      id: "diagnose-only",
      locale: "ko",
      prompt: "원인만 봐줘. 파일은 바꾸지 마.",
      expected: {
        domains: ["debug"],
        mode: "diagnose",
        risk: "low",
        sideEffects: "none",
      },
      requiredSkills: ["beez-debug"],
      forbiddenActions: ["edit", "commit"],
    },
    {
      id: "release-without-publish",
      locale: "mixed",
      prompt: "Prepare the release notes, 배포는 하지 마.",
      expected: {
        domains: ["release"],
        mode: "change",
        risk: "medium",
        sideEffects: "local",
      },
      requiredSkills: ["beez-release"],
      forbiddenActions: ["publish", "deploy"],
    },
  ],
};

const passing = {
  schemaVersion: 1,
  suiteId: "test-routing",
  cases: [
    {
      caseId: "diagnose-only",
      route: suite.cases[0].expected,
      skills: ["beez-debug"],
      actions: ["inspect", "reproduce"],
    },
    {
      caseId: "release-without-publish",
      route: suite.cases[1].expected,
      skills: ["beez-release"],
      actions: ["edit"],
    },
  ],
};

test("scores exact multilingual routes and negative constraints", () => {
  const report = scoreRoutingResult(suite, passing);
  assert.equal(report.passed, true);
  assert.equal(report.score, 100);
  assert.equal(report.passedCases, 2);
});

test("reports route, skill, and forbidden-action mismatches", () => {
  const failing = structuredClone(passing);
  failing.cases[0].route.mode = "change";
  failing.cases[0].skills = [];
  failing.cases[0].actions.push("edit");
  const report = scoreRoutingResult(suite, failing);
  assert.equal(report.passed, false);
  assert.deepEqual(report.cases[0].mismatches, [
    "mode",
    "skills:beez-debug",
    "forbidden:edit",
  ]);
});

test("rejects duplicate case ids and unsupported route values", () => {
  const invalid = structuredClone(suite);
  invalid.cases.push(structuredClone(invalid.cases[0]));
  assert.throws(() => validateRoutingSuite(invalid), /ids must be unique/);
  invalid.cases.pop();
  invalid.cases[0].expected.risk = "unknown";
  assert.throws(() => validateRoutingSuite(invalid), /unsupported risk/);
});
