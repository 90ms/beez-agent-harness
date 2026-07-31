import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import {
  doctorProject,
  initProject,
  updateProject,
} from "../lib/harness.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPath = path.join(packageRoot, "bin/beez-harness.js");
const temporaryProjects = new Set();

async function temporaryProject() {
  const project = await mkdtemp(path.join(os.tmpdir(), "beez-harness-test-"));
  temporaryProjects.add(project);
  return project;
}

function runCli(cwd, args) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [cliPath, ...args],
      { cwd },
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

after(async () => {
  await Promise.all(
    [...temporaryProjects].map((project) =>
      rm(project, { recursive: true, force: true }),
    ),
  );
});

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

test("doctor rejects managed paths outside the generated directory", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const manifestFile = path.join(cwd, ".harness/manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.managedFiles["../../outside.txt"] = "a".repeat(64);
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const health = await doctorProject({ cwd, packageRoot });

  assert.equal(health.ok, false);
  assert.ok(
    health.errors.some((error) =>
      error.includes("must stay inside .harness/generated"),
    ),
  );
});

test("doctor rejects malformed managed-file hashes", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const manifestFile = path.join(cwd, ".harness/manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.managedFiles[".harness/generated/AGENTS.md"] = "not-a-sha256";
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const health = await doctorProject({ cwd, packageRoot });

  assert.equal(health.ok, false);
  assert.ok(
    health.errors.some((error) =>
      error.includes("Managed file hash must be SHA-256"),
    ),
  );
});

test("doctor detects coordinated drift in guidance and its manifest hash", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const guidanceFile = path.join(cwd, ".harness/generated/AGENTS.md");
  const manifestFile = path.join(cwd, ".harness/manifest.json");
  const changedGuidance = `${await readFile(guidanceFile, "utf8")}\nlocal policy\n`;
  await writeFile(guidanceFile, changedGuidance);

  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.managedFiles[".harness/generated/AGENTS.md"] = createHash("sha256")
    .update(changedGuidance)
    .digest("hex");
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const health = await doctorProject({ cwd, packageRoot });

  assert.equal(health.ok, false);
  assert.ok(
    health.errors.some((error) =>
      error.includes("differs from generated guidance"),
    ),
  );
});

test("doctor rejects non-string project commands", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: { test: ["npm", "test"] },
      boundaries: ["Keep user changes."],
    })}\n`,
  );

  const health = await doctorProject({ cwd, packageRoot });

  assert.equal(health.ok, false);
  assert.ok(
    health.errors.some((error) =>
      error.includes("Project command must be a string"),
    ),
  );
});

test("doctor rejects non-string project boundaries", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: { test: "npm test" },
      boundaries: ["Keep user changes.", 42],
    })}\n`,
  );

  const health = await doctorProject({ cwd, packageRoot });

  assert.equal(health.ok, false);
  assert.ok(
    health.errors.some((error) =>
      error.includes("Project boundaries must contain only strings"),
    ),
  );
});

test("CLI update --check exits non-zero when managed guidance has drifted", async () => {
  const cwd = await temporaryProject();
  const initialization = await runCli(cwd, ["init", "--preset", "base"]);
  assert.equal(initialization.code, 0);

  await writeFile(
    path.join(cwd, ".harness/generated/AGENTS.md"),
    "local drift\n",
  );

  const check = await runCli(cwd, ["update", "--check"]);

  assert.equal(check.code, 1);
  assert.match(check.stdout, /managed-file drift detected/);
  assert.equal(check.stderr, "");
});

test("CLI doctor reports a missing managed file on stderr", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  await rm(path.join(cwd, ".harness/generated/AGENTS.md"));

  const result = await runCli(cwd, ["doctor"]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Managed file is missing/);
  assert.equal(result.stdout, "");
});

test("CLI rejects initialization when the harness is already initialized", async () => {
  const cwd = await temporaryProject();
  const first = await runCli(cwd, ["init"]);
  assert.equal(first.code, 0);

  const second = await runCli(cwd, ["init"]);

  assert.equal(second.code, 1);
  assert.match(second.stderr, /Harness is already initialized/);
});
