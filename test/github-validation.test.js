import assert from "node:assert/strict";
import test from "node:test";
import { validateIssueFormSource } from "../lib/github-validation.js";

const valid = `name: Test form
description: Collect an actionable test report.
title: "[Test]: "
labels: []
body:
  - type: input
    id: version
    attributes:
      label: Version
    validations:
      required: true
`;

test("validates the supported GitHub issue-form structure", () => {
  assert.doesNotThrow(() => validateIssueFormSource(valid, "test.yml"));
});

test("rejects duplicate ids and labels in GitHub issue forms", () => {
  const duplicate = `${valid}  - type: input
    id: version
    attributes:
      label: Version
`;
  assert.throws(
    () => validateIssueFormSource(duplicate, "duplicate.yml"),
    /duplicate input id/,
  );
});
