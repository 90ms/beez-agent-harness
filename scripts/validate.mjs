import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function frontmatter(source, file) {
  const normalized = source.replaceAll("\r\n", "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, `${file} must begin with YAML frontmatter`);
  const entries = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const separator = line.indexOf(":");
      assert.notEqual(separator, -1, `Invalid frontmatter line in ${file}`);
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
  assert.deepEqual(
    Object.keys(entries).sort(),
    ["description", "name"],
    `${file} frontmatter may contain only name and description`,
  );
  return entries;
}

assert.deepEqual(
  frontmatter(
    "---\r\nname: crlf-example\r\ndescription: Windows line ending fixture\r\n---\r\n",
    "CRLF fixture",
  ),
  {
    name: "crlf-example",
    description: "Windows line ending fixture",
  },
);

const packageJson = await json("package.json");
const plugin = await json(".codex-plugin/plugin.json");
const marketplace = await json(".agents/plugins/marketplace.json");
const releaseWorkflow = await readFile(
  path.join(root, ".github/workflows/release.yml"),
  "utf8",
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
const skillFolders = (await readdir(skillRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

assert.deepEqual(skillFolders, [
  "beez-implement",
  "beez-plan",
  "beez-review",
  "beez-spec",
  "beez-verify",
  "using-beez-harness",
]);

for (const folder of skillFolders) {
  const relativeSkill = `skills/${folder}/SKILL.md`;
  const source = await readFile(path.join(root, relativeSkill), "utf8");
  const metadata = frontmatter(source, relativeSkill);
  assert.equal(metadata.name, folder, `${relativeSkill} name must match its folder`);
  assert.ok(metadata.description.length >= 40, `${relativeSkill} needs a useful description`);
  assert.doesNotMatch(source, /\[TODO|TODO:/, `${relativeSkill} contains a TODO`);

  const interfaceFile = `skills/${folder}/agents/openai.yaml`;
  const interfaceSource = await readFile(path.join(root, interfaceFile), "utf8");
  assert.ok(
    interfaceSource.includes(`$${folder}`),
    `${interfaceFile} default prompt must mention $${folder}`,
  );
}

for (const preset of ["base", "nextjs"]) {
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

console.log(
  `Validated ${plugin.name} ${plugin.version}: ${skillFolders.length} skills and 2 presets.`,
);

process.exitCode = 0;
