import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateIssueFormSource } from "../lib/github-validation.js";
import { validateRoutingSuite } from "../lib/routing-evaluation.js";
import { validateSkillRoot } from "../lib/validation.js";

const root = fileURLToPath(new URL("..", import.meta.url));

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

const packageJson = await json("package.json");
const plugin = await json(".codex-plugin/plugin.json");
const marketplace = await json(".agents/plugins/marketplace.json");
const releaseWorkflow = await readFile(
  path.join(root, ".github/workflows/release.yml"),
  "utf8",
);
const ciWorkflow = await readFile(
  path.join(root, ".github/workflows/ci.yml"),
  "utf8",
);
for (const [file, workflow] of [
  ["ci.yml", ciWorkflow],
  ["release.yml", releaseWorkflow],
]) {
  assert.doesNotMatch(
    workflow,
    /pull_request_target:/,
    `${file} must not run untrusted code through pull_request_target`,
  );
  assert.doesNotMatch(
    workflow,
    /^\s*- uses: [^\n]+@(?![a-f0-9]{40}(?:\s|$))[^\n]+$/m,
    `${file} actions must use immutable full commit SHAs`,
  );
  assert.match(workflow, /timeout-minutes:/, `${file} jobs need timeouts`);
}
assert.match(ciWorkflow, /cancel-in-progress: true/);
assert.match(ciWorkflow, /dependency-review-action@[a-f0-9]{40} # v5\.0\.0/);
assert.match(releaseWorkflow, /fetch-depth: 0/);
assert.match(releaseWorkflow, /check-release-ancestry\.mjs HEAD origin\/main/);
assert.match(releaseWorkflow, /npm run evaluate/);
const dependabot = await readFile(
  path.join(root, ".github/dependabot.yml"),
  "utf8",
);
assert.match(dependabot, /^version: 2$/m);
assert.match(dependabot, /package-ecosystem: github-actions/);
const codeowners = await readFile(path.join(root, ".github/CODEOWNERS"), "utf8");
const pullRequestTemplate = await readFile(
  path.join(root, ".github/pull_request_template.md"),
  "utf8",
);
for (const ownedPath of [
  "/.github/",
  "/skills/",
  "/schemas/",
  "/bin/",
  "/lib/",
  "/scripts/check-release.mjs",
]) {
  assert.match(
    codeowners,
    new RegExp(`^${ownedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+@90ms$`, "m"),
    `CODEOWNERS must cover ${ownedPath}`,
  );
}
for (const heading of [
  "Purpose",
  "Scope and risk",
  "Compatibility and migration",
  "Verification",
  "Security and performance",
  "Rollback and recovery",
]) {
  assert.match(
    pullRequestTemplate,
    new RegExp(`^## ${heading}$`, "m"),
    `Pull request template needs ${heading}`,
  );
}
const issueTemplateRoot = path.join(root, ".github/ISSUE_TEMPLATE");
for (const form of ["bug.yml", "feature.yml", "performance.yml", "migration.yml"]) {
  const source = await readFile(path.join(issueTemplateRoot, form), "utf8");
  validateIssueFormSource(source, `.github/ISSUE_TEMPLATE/${form}`);
}
const issueConfig = await readFile(path.join(issueTemplateRoot, "config.yml"), "utf8");
assert.match(issueConfig, /^blank_issues_enabled: false$/m);
assert.match(
  issueConfig,
  /https:\/\/github\.com\/90ms\/beez-agent-harness\/security\/advisories\/new/,
  "Issue chooser must route vulnerabilities to private reporting",
);

assert.equal(plugin.name, packageJson.name, "Plugin and package names must match");
assert.equal(
  plugin.version,
  packageJson.version,
  "Plugin and package versions must match",
);
assert.equal(plugin.skills, "./skills/", "Plugin must expose root skills/");
assert.equal(marketplace.plugins.length, 1, "Marketplace must expose one plugin");
assert.equal(marketplace.plugins[0].name, plugin.name);
assert.equal(marketplace.plugins[0].source.path, "./");
assert.equal(marketplace.plugins[0].policy.installation, "AVAILABLE");
assert.equal(marketplace.plugins[0].policy.authentication, "ON_INSTALL");
assert.match(
  releaseWorkflow,
  /environment: npm/,
  "Release workflow must use the protected npm environment",
);
assert.match(
  releaseWorkflow,
  /id-token: write/,
  "Release workflow must request OIDC only for publishing",
);
assert.match(
  releaseWorkflow,
  /npm publish --access public/,
  "Release workflow must publish the public npm package",
);

const skillRoot = path.join(root, "skills");
const skillFolders = await validateSkillRoot({
  skillRoot,
  requiredSkills: [
  "beez-implement",
  "beez-plan",
  "beez-review",
  "beez-spec",
  "beez-verify",
  "using-beez-harness",
  ],
});

const presetRoot = path.join(root, "presets");
const presets = (await readdir(presetRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
for (const requiredPreset of ["base", "nextjs"]) {
  assert.ok(presets.includes(requiredPreset), `Required preset is missing: ${requiredPreset}`);
}
for (const preset of presets) {
  await readFile(path.join(root, "presets", preset, "AGENTS.md"), "utf8");
  const project = await json(`presets/${preset}/project.json`);
  assert.equal(project.schemaVersion, 1);
  assert.ok(project.commands && !Array.isArray(project.commands));
  assert.ok(project.verification && !Array.isArray(project.verification));
  assert.ok(Array.isArray(project.verification.required));
  assert.ok(
    project.verification.required.every((command) => command in project.commands),
  );
  assert.ok(Number.isInteger(project.verification.timeoutMs));
  assert.ok(Array.isArray(project.boundaries));
}

const projectSchema = await json("schemas/project.schema.json");
const runManifestSchema = await json("schemas/run-manifest.schema.json");
const runEventSchema = await json("schemas/run-event.schema.json");
const evaluationSchema = await json("schemas/evaluation-result.schema.json");
const schemaFiles = (await readdir(path.join(root, "schemas")))
  .filter((file) => file.endsWith(".schema.json"))
  .sort();
for (const schemaFile of schemaFiles) {
  const schema = await json(`schemas/${schemaFile}`);
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.match(schema.$id, /^https:\/\/beez\.dev\/schemas\//);
  assert.ok(schema.title, `${schemaFile} needs a title`);
  assert.ok(schema.type, `${schemaFile} needs a root type`);
}
assert.equal(projectSchema.properties.schemaVersion.const, 1);
assert.equal(runManifestSchema.properties.schemaVersion.const, 1);
assert.equal(runEventSchema.properties.schemaVersion.const, 1);
assert.equal(evaluationSchema.properties.schemaVersion.const, 1);
assert.deepEqual(runManifestSchema.properties.state.enum, [
  "active",
  "completed",
  "failed",
  "cancelled",
]);
const evaluationCase = await json("evals/cases/scoped-bug-fix.json");
assert.equal(evaluationCase.schemaVersion, 1);
assert.ok(evaluationCase.requiredOutcomes.length > 0);
assert.ok(evaluationCase.forbiddenOutcomes.length > 0);
const routingSuite = await json("evals/routing-cases.json");
validateRoutingSuite(routingSuite);
assert.ok(routingSuite.cases.length >= 50, "Routing corpus must contain at least 50 cases");
assert.deepEqual(
  [...new Set(routingSuite.cases.map((entry) => entry.locale))].sort(),
  ["en", "ko", "mixed"],
  "Routing corpus must cover English, Korean, and mixed-language requests",
);

console.log(
  `Validated ${plugin.name} ${plugin.version}: ${skillFolders.length} skills, ${presets.length} presets, and ${schemaFiles.length} schemas.`,
);

process.exitCode = 0;
