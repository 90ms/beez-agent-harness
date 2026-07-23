import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  doctorProject,
  initProject,
  updateProject,
} from "../lib/harness.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

async function temporaryProject() {
  return mkdtemp(path.join(os.tmpdir(), "beez-harness-test-"));
}

test("initializes the base preset and passes doctor", async () => {
  const cwd = await temporaryProject();
  const result = await initProject({ cwd, packageRoot, preset: "base" });

  assert.match(result.messages[0], /Initialized Beez Agent Harness 0\.1\.0/);
  const manifest = JSON.parse(
    await readFile(path.join(cwd, ".harness/manifest.json"), "utf8"),
  );
  assert.equal(manifest.preset, "base");
  assert.ok(manifest.managedFiles[".harness/generated/AGENTS.md"]);
  assert.equal((await doctorProject({ cwd, packageRoot })).ok, true);
});

test("preserves an existing AGENTS.md", async () => {
  const cwd = await temporaryProject();
  const customGuidance = "# Existing project rules\n";
  await writeFile(path.join(cwd, "AGENTS.md"), customGuidance);

  const result = await initProject({ cwd, packageRoot, preset: "base" });

  assert.equal(await readFile(path.join(cwd, "AGENTS.md"), "utf8"), customGuidance);
  assert.ok(result.messages.some((message) => message.includes("preserved")));
  const health = await doctorProject({ cwd, packageRoot });
  assert.equal(health.ok, true);
  assert.ok(health.warnings.some((warning) => warning.includes("does not reference")));
});

test("preserves an existing project configuration during initialization", async () => {
  const cwd = await temporaryProject();
  const harnessDirectory = path.join(cwd, ".harness");
  const projectFile = path.join(harnessDirectory, "project.json");
  const customProject = `${JSON.stringify(
    {
      schemaVersion: 1,
      commands: { test: "project-owned-test" },
      boundaries: ["Project-owned boundary."],
    },
    null,
    2,
  )}\n`;
  await mkdir(harnessDirectory, { recursive: true });
  await writeFile(projectFile, customProject);

  const result = await initProject({ cwd, packageRoot, preset: "nextjs" });

  assert.equal(await readFile(projectFile, "utf8"), customProject);
  assert.ok(result.messages.some((message) => message.includes("project.json was preserved")));
});

test("detects drift and updates only managed files", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const projectFile = path.join(cwd, ".harness/project.json");
  const customProject = `${JSON.stringify(
    {
      schemaVersion: 1,
      commands: { test: "custom-test" },
      boundaries: ["Keep this value."],
    },
    null,
    2,
  )}\n`;
  await writeFile(projectFile, customProject);
  await writeFile(
    path.join(cwd, ".harness/generated/AGENTS.md"),
    "local drift\n",
  );

  const check = await updateProject({ cwd, packageRoot, check: true });
  assert.equal(check.changed, true);

  const update = await updateProject({ cwd, packageRoot });
  assert.equal(update.changed, true);
  assert.equal(await readFile(projectFile, "utf8"), customProject);
  assert.equal((await doctorProject({ cwd, packageRoot })).ok, true);
});

test("detects pnpm for the nextjs preset", async () => {
  const cwd = await temporaryProject();
  await writeFile(path.join(cwd, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

  await initProject({ cwd, packageRoot, preset: "nextjs" });

  const project = JSON.parse(
    await readFile(path.join(cwd, ".harness/project.json"), "utf8"),
  );
  assert.equal(project.commands.install, "pnpm install");
  assert.equal(project.commands.build, "pnpm run build");
});

test("doctor reports invalid manifests without throwing", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  await writeFile(
    path.join(cwd, ".harness/manifest.json"),
    `${JSON.stringify({ schemaVersion: 99 })}\n`,
  );

  const health = await doctorProject({ cwd, packageRoot });

  assert.equal(health.ok, false);
  assert.ok(health.errors.some((error) => error.includes("schemaVersion")));
});
