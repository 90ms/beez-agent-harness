const DOMAINS = new Set([
  "general",
  "debug",
  "migration",
  "security",
  "release",
  "performance",
  "github",
]);
const MODES = new Set([
  "explain",
  "inspect",
  "diagnose",
  "plan",
  "change",
  "verify",
  "review",
  "execute",
]);
const RISKS = new Set(["low", "medium", "high", "critical"]);
const SIDE_EFFECTS = new Set([
  "none",
  "local",
  "repository",
  "external-production",
]);
const ROUTE_FIELDS = new Set(["domains", "mode", "risk", "sideEffects"]);

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function strings(value, label, { minimum = 0 } = {}) {
  if (
    !Array.isArray(value) ||
    value.length < minimum ||
    value.some((item) => typeof item !== "string" || item.length === 0) ||
    new Set(value).size !== value.length
  ) {
    throw new Error(`${label} must be an array of unique non-empty strings`);
  }
}

export function validateWorkflowRoute(route, label = "Workflow route") {
  object(route, label);
  const fields = Object.keys(route);
  if (
    fields.length !== ROUTE_FIELDS.size ||
    fields.some((field) => !ROUTE_FIELDS.has(field))
  ) {
    throw new Error(`${label} must contain exactly domains, mode, risk, sideEffects`);
  }
  strings(route.domains, `${label} domains`, { minimum: 1 });
  if (route.domains.some((domain) => !DOMAINS.has(domain))) {
    throw new Error(`${label} contains an unsupported domain`);
  }
  if (!MODES.has(route.mode)) throw new Error(`${label} has an unsupported mode`);
  if (!RISKS.has(route.risk)) throw new Error(`${label} has an unsupported risk`);
  if (!SIDE_EFFECTS.has(route.sideEffects)) {
    throw new Error(`${label} has unsupported side effects`);
  }
}

export function validateRoutingSuite(suite) {
  object(suite, "Routing suite");
  if (suite.schemaVersion !== 1 || typeof suite.id !== "string" || !suite.id) {
    throw new Error("Routing suite needs schemaVersion 1 and a non-empty id");
  }
  if (!Array.isArray(suite.cases) || suite.cases.length === 0) {
    throw new Error("Routing suite must contain cases");
  }
  const ids = new Set();
  for (const entry of suite.cases) {
    object(entry, "Routing case");
    if (typeof entry.id !== "string" || !entry.id || ids.has(entry.id)) {
      throw new Error("Routing case ids must be unique non-empty strings");
    }
    ids.add(entry.id);
    if (!["ko", "en", "mixed"].includes(entry.locale)) {
      throw new Error(`Routing case ${entry.id} has an unsupported locale`);
    }
    if (typeof entry.prompt !== "string" || entry.prompt.trim().length < 4) {
      throw new Error(`Routing case ${entry.id} needs a prompt`);
    }
    validateWorkflowRoute(entry.expected, `Routing case ${entry.id} expected route`);
    strings(entry.requiredSkills, `Routing case ${entry.id} requiredSkills`);
    strings(entry.forbiddenActions, `Routing case ${entry.id} forbiddenActions`);
  }
}

export function validateRoutingResult(result) {
  object(result, "Routing result");
  if (
    result.schemaVersion !== 1 ||
    typeof result.suiteId !== "string" ||
    !result.suiteId
  ) {
    throw new Error("Routing result needs schemaVersion 1 and a non-empty suiteId");
  }
  if (!Array.isArray(result.cases) || result.cases.length === 0) {
    throw new Error("Routing result must contain cases");
  }
  const ids = new Set();
  for (const entry of result.cases) {
    object(entry, "Routing result case");
    if (typeof entry.caseId !== "string" || !entry.caseId || ids.has(entry.caseId)) {
      throw new Error("Routing result case ids must be unique non-empty strings");
    }
    ids.add(entry.caseId);
    validateWorkflowRoute(entry.route, `Routing result ${entry.caseId} route`);
    strings(entry.skills, `Routing result ${entry.caseId} skills`);
    strings(entry.actions, `Routing result ${entry.caseId} actions`);
  }
}

function sameArray(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

export function scoreRoutingResult(suite, result) {
  validateRoutingSuite(suite);
  validateRoutingResult(result);
  if (result.suiteId !== suite.id) {
    throw new Error(`Routing result targets ${result.suiteId}, expected ${suite.id}`);
  }
  const results = new Map(result.cases.map((entry) => [entry.caseId, entry]));
  const unexpected = result.cases
    .filter((entry) => !suite.cases.some((item) => item.id === entry.caseId))
    .map((entry) => entry.caseId);
  if (unexpected.length > 0) {
    throw new Error(`Routing result contains unknown cases: ${unexpected.join(", ")}`);
  }

  const cases = suite.cases.map((expected) => {
    const actual = results.get(expected.id);
    const mismatches = [];
    if (!actual) {
      mismatches.push("missing result");
    } else {
      if (!sameArray(actual.route.domains, expected.expected.domains)) {
        mismatches.push("domains");
      }
      for (const field of ["mode", "risk", "sideEffects"]) {
        if (actual.route[field] !== expected.expected[field]) mismatches.push(field);
      }
      const selectedSkills = new Set(actual.skills);
      const missingSkills = expected.requiredSkills.filter(
        (skill) => !selectedSkills.has(skill),
      );
      if (missingSkills.length > 0) mismatches.push(`skills:${missingSkills.join(",")}`);
      const selectedActions = new Set(actual.actions);
      const forbidden = expected.forbiddenActions.filter((action) =>
        selectedActions.has(action),
      );
      if (forbidden.length > 0) mismatches.push(`forbidden:${forbidden.join(",")}`);
    }
    return { caseId: expected.id, passed: mismatches.length === 0, mismatches };
  });
  const passedCases = cases.filter((entry) => entry.passed).length;
  const accuracy = passedCases / cases.length;
  return {
    schemaVersion: 1,
    suiteId: suite.id,
    passed: passedCases === cases.length,
    score: Math.round(accuracy * 10000) / 100,
    passedCases,
    totalCases: cases.length,
    cases,
  };
}
