const CRITERIA = [
  ["requirementsMet", 35],
  ["testsPassed", 25],
  ["scopePreserved", 15],
  ["verificationRun", 15],
  ["evidenceBacked", 10],
];

const ASSERTION_FIELDS = new Set(CRITERIA.map(([name]) => name));
const RESULT_FIELDS = new Set([
  "schemaVersion",
  "caseId",
  "assertions",
  "metrics",
]);

export function validateEvaluationResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Evaluation result must be an object");
  }
  if (result.schemaVersion !== 1) {
    throw new Error("Unsupported or missing evaluation result schemaVersion");
  }
  const unexpectedResultFields = Object.keys(result).filter(
    (field) => !RESULT_FIELDS.has(field),
  );
  if (unexpectedResultFields.length > 0) {
    throw new Error(
      `Evaluation result contains unsupported fields: ${unexpectedResultFields.join(", ")}`,
    );
  }
  if (typeof result.caseId !== "string" || result.caseId.length === 0) {
    throw new Error("Evaluation caseId must be a non-empty string");
  }
  if (
    !result.assertions ||
    typeof result.assertions !== "object" ||
    Array.isArray(result.assertions)
  ) {
    throw new Error("Evaluation assertions must be an object");
  }
  const fields = Object.keys(result.assertions);
  const missing = [...ASSERTION_FIELDS].filter(
    (field) => !(field in result.assertions),
  );
  const unexpected = fields.filter((field) => !ASSERTION_FIELDS.has(field));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      `Evaluation assertions must contain exactly: ${[...ASSERTION_FIELDS].join(", ")}`,
    );
  }
  for (const [field, value] of Object.entries(result.assertions)) {
    if (typeof value !== "boolean") {
      throw new Error(`Evaluation assertion must be boolean: ${field}`);
    }
  }
  if (result.metrics !== undefined) {
    if (
      !result.metrics ||
      typeof result.metrics !== "object" ||
      Array.isArray(result.metrics)
    ) {
      throw new Error("Evaluation metrics must be an object");
    }
    for (const [name, value] of Object.entries(result.metrics)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error(
          `Evaluation metric must be a non-negative finite number: ${name}`,
        );
      }
    }
  }
}

export function scoreEvaluation(result) {
  validateEvaluationResult(result);
  const criteria = CRITERIA.map(([name, weight]) => ({
    name,
    weight,
    passed: result.assertions[name],
    points: result.assertions[name] ? weight : 0,
  }));
  const score = criteria.reduce((total, item) => total + item.points, 0);
  return {
    schemaVersion: 1,
    caseId: result.caseId,
    score,
    passed:
      score >= 85 &&
      result.assertions.requirementsMet &&
      result.assertions.testsPassed,
    criteria,
    metrics: result.metrics ?? {},
  };
}
