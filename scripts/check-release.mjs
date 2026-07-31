import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const releaseTag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

assert.ok(releaseTag, "Release tag is required (for example: vX.Y.Z)");

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

const packageJson = await json("package.json");
const plugin = await json(".codex-plugin/plugin.json");
const harnessManifest = await json(".harness/manifest.json");
const generatedGuidance = await readFile(
  path.join(root, ".harness/generated/AGENTS.md"),
  "utf8",
);
const changelog = await readFile(path.join(root, "CHANGELOG.md"), "utf8");
const expectedTag = `v${packageJson.version}`;

assert.equal(
  releaseTag,
  expectedTag,
  `Release tag ${releaseTag} must match package version ${packageJson.version}`,
);
assert.equal(
  plugin.version,
  packageJson.version,
  "Plugin version must match package version",
);
assert.equal(
  harnessManifest.harnessVersion,
  packageJson.version,
  "Applied harness version must match package version",
);
assert.match(
  generatedGuidance,
  new RegExp(`Beez Agent Harness ${packageJson.version.replaceAll(".", "\\.")}`),
  "Generated project guidance must contain the package version",
);
assert.ok(
  changelog.includes(`## [${packageJson.version}] - `),
  `CHANGELOG.md must contain a dated ${packageJson.version} release section`,
);

console.log(`Release ${releaseTag} is internally consistent.`);
