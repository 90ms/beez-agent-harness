import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { initProject } from "../lib/harness.js";
import {
  checkpointRun,
  finishRun,
  gcRuns,
  listRuns,
  readRun,
  resumeRun,
  startRun,
} from "../lib/runs.js";
import { verifyProject } from "../lib/verify.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPath = path.join(packageRoot, "bin/beez-harness.js");
const temporaryProjects = new Set();

async function temporaryProject() {
  const project = await mkdtemp(path.join(os.tmpdir(), "beez-runs-test-"));
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

test("starts a run with repository and configuration evidence", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });

  const run = await startRun({ cwd, packageRoot });
  const stored = await readRun(cwd, run.id);
  const events = await readFile(
    path.join(cwd, ".harness/runs", run.id, "events.jsonl"),
    "utf8",
  );

  assert.equal(stored.state, "active");
  assert.match(stored.id, /^[0-9a-f-]{36}$/);
  assert.match(stored.configDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(stored.repository, { gitSha: null, dirty: null });
  assert.equal(stored.workflow, null);
  assert.deepEqual(stored.verification, {
    profile: null,
    required: [],
    results: {},
  });
  assert.deepEqual(stored.checkpoints, []);
  assert.equal(JSON.parse(events).type, "run.started");
});

test("records workflow metadata and a selected verification profile", async () => {
  const cwd = await temporaryProject();
  await mkdir(path.join(cwd, ".harness"), { recursive: true });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: {
        test: 'node -e "process.exit(0)"',
        security: 'node -e "process.exit(0)"',
      },
      verification: {
        required: ["test"],
        profiles: {
          default: ["test"],
          migration: ["test"],
          security: ["test", "security"],
          release: ["test"],
          performance: ["test"],
        },
        timeoutMs: 10_000,
      },
      boundaries: [],
    })}\n`,
  );
  await initProject({ cwd, packageRoot, preset: "base" });
  const workflow = {
    domains: ["security", "migration"],
    mode: "change",
    risk: "high",
    sideEffects: "local",
  };

  const run = await startRun({
    cwd,
    packageRoot,
    workflow,
    profile: "security",
  });

  assert.deepEqual(run.workflow, workflow);
  assert.equal(run.verification.profile, "security");
  assert.deepEqual(run.verification.required, ["test", "security"]);
  await verifyProject({ cwd, runId: run.id, commandNames: ["test"] });
  await assert.rejects(
    finishRun({ cwd, runId: run.id }),
    /required verification has not passed: security/,
  );
});

test("reads v0.3 run manifests without workflow evidence fields", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const run = await startRun({ cwd, packageRoot });
  const manifestFile = path.join(cwd, ".harness/runs", run.id, "manifest.json");
  const legacy = JSON.parse(await readFile(manifestFile, "utf8"));
  delete legacy.workflow;
  delete legacy.checkpoints;
  delete legacy.verification.profile;
  await writeFile(manifestFile, `${JSON.stringify(legacy)}\n`);

  const stored = await readRun(cwd, run.id);
  assert.equal(stored.workflow, undefined);
  assert.equal(stored.verification.profile, undefined);
  assert.equal(stored.checkpoints, undefined);
});

test("records bounded checkpoint and artifact digest evidence", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  await writeFile(path.join(cwd, "plan.md"), "sensitive plan content\n");
  const run = await startRun({ cwd, packageRoot });

  const updated = await checkpointRun({
    cwd,
    runId: run.id,
    phase: "plan",
    state: "completed",
    artifact: "plan.md",
  });
  const stored = await Promise.all([
    readFile(path.join(cwd, ".harness/runs", run.id, "manifest.json"), "utf8"),
    readFile(path.join(cwd, ".harness/runs", run.id, "events.jsonl"), "utf8"),
  ]);

  assert.equal(updated.checkpoints.length, 1);
  assert.equal(updated.checkpoints[0].artifact.path, "plan.md");
  assert.match(updated.checkpoints[0].artifact.digest, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(stored.join("\n"), /sensitive plan content/);
  assert.match(stored.join("\n"), /checkpoint\.recorded/);
  await assert.rejects(
    checkpointRun({
      cwd,
      runId: run.id,
      phase: "verify",
      state: "started",
      artifact: "../outside.md",
    }),
    /project-relative|stay inside/,
  );
});

test("allows only one active run", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });

  await assert.rejects(
    startRun({ cwd, packageRoot }),
    new RegExp(`Run ${active.id} is already active`),
  );
});

test("finishes a run and keeps terminal state immutable", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });

  const finished = await finishRun({
    cwd,
    runId: active.id,
    state: "completed",
  });

  assert.equal(finished.state, "completed");
  assert.ok(finished.finishedAt);
  await assert.rejects(
    finishRun({ cwd, runId: active.id, state: "failed" }),
    /already completed/,
  );
});

test("blocks completion when required verification is missing", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "nextjs" });
  const active = await startRun({ cwd, packageRoot });

  await assert.rejects(
    finishRun({ cwd, runId: active.id, state: "completed" }),
    /required verification has not passed: test, lint, build/,
  );
  const failed = await finishRun({
    cwd,
    runId: active.id,
    state: "failed",
  });
  assert.equal(failed.state, "failed");
});

test("lists runs newest first", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const first = await startRun({ cwd, packageRoot });
  await finishRun({ cwd, runId: first.id, state: "cancelled" });
  const second = await startRun({ cwd, packageRoot });

  const runs = await listRuns(cwd);

  assert.deepEqual(
    runs.map((run) => run.id),
    [second.id, first.id],
  );
});

test("CLI supports the run lifecycle", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });

  const start = await runCli(cwd, ["run", "start"]);
  const runId = start.stdout.match(/Run: ([0-9a-f-]{36})/)?.[1];
  const status = await runCli(cwd, ["run", "status"]);
  const list = await runCli(cwd, ["run", "list"]);
  const finish = await runCli(cwd, [
    "run",
    "finish",
    "--run",
    runId,
    "--state",
    "completed",
  ]);

  assert.equal(start.code, 0);
  assert.ok(runId);
  assert.match(status.stdout, new RegExp(`Run: ${runId}`));
  assert.match(list.stdout, new RegExp(`${runId}\\tactive`));
  assert.match(finish.stdout, /State: completed/);
});

test("rejects invalid run identifiers before filesystem access", async () => {
  const cwd = await temporaryProject();

  const result = await runCli(cwd, [
    "run",
    "status",
    "--run",
    "../../outside",
  ]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Invalid run id/);
});

test("records passing verification without persisting command output", async () => {
  const cwd = await temporaryProject();
  await mkdir(path.join(cwd, ".harness"), { recursive: true });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: {
        test: 'node -e "console.log(\'TOP_SECRET\')"',
      },
      verification: { required: ["test"], timeoutMs: 10_000 },
      boundaries: [],
    })}\n`,
  );
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });

  const verification = await verifyProject({
    cwd,
    runId: active.id,
    commandNames: ["test"],
  });
  const storedFiles = await Promise.all([
    readFile(
      path.join(cwd, ".harness/runs", active.id, "manifest.json"),
      "utf8",
    ),
    readFile(
      path.join(cwd, ".harness/runs", active.id, "events.jsonl"),
      "utf8",
    ),
  ]);

  assert.equal(verification.results[0].status, "passed");
  assert.equal(verification.run.verification.results.test.status, "passed");
  assert.doesNotMatch(storedFiles.join("\n"), /TOP_SECRET|console\.log/);
  assert.match(storedFiles.join("\n"), /"command":"test"/);
});

test("records failed verification and blocks successful completion", async () => {
  const cwd = await temporaryProject();
  await mkdir(path.join(cwd, ".harness"), { recursive: true });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: { test: 'node -e "process.exit(7)"' },
      verification: { required: ["test"], timeoutMs: 10_000 },
      boundaries: [],
    })}\n`,
  );
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });

  const verification = await verifyProject({
    cwd,
    runId: active.id,
    commandNames: ["test"],
  });

  assert.equal(verification.results[0].status, "failed");
  assert.equal(verification.results[0].exitCode, 7);
  await assert.rejects(
    finishRun({ cwd, runId: active.id, state: "completed" }),
    /required verification has not passed: test/,
  );
});

test("records commands that exceed the configured timeout", async () => {
  const cwd = await temporaryProject();
  await mkdir(path.join(cwd, ".harness"), { recursive: true });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: { slow: 'node -e "setTimeout(() => {}, 10000)"' },
      verification: { required: ["slow"], timeoutMs: 1_000 },
      boundaries: [],
    })}\n`,
  );
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });

  const verification = await verifyProject({
    cwd,
    runId: active.id,
    commandNames: ["slow"],
  });

  assert.equal(verification.results[0].status, "timed_out");
  assert.ok(verification.results[0].durationMs >= 900);
  assert.ok(verification.results[0].durationMs < 5_000);
});

test("rejects verification after project configuration changes", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: { changed: 'node -e "process.exit(0)"' },
      verification: { required: [], timeoutMs: 10_000 },
      boundaries: [],
    })}\n`,
  );

  await assert.rejects(
    verifyProject({
      cwd,
      runId: active.id,
      commandNames: ["changed"],
    }),
    /Project configuration changed after the run started/,
  );
});

test("blocks completion when configuration changes after verification", async () => {
  const cwd = await temporaryProject();
  await mkdir(path.join(cwd, ".harness"), { recursive: true });
  const projectFile = path.join(cwd, ".harness/project.json");
  const project = {
    schemaVersion: 1,
    commands: { test: 'node -e "process.exit(0)"' },
    verification: { required: ["test"], timeoutMs: 10_000 },
    boundaries: [],
  };
  await writeFile(projectFile, `${JSON.stringify(project)}\n`);
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });
  await verifyProject({
    cwd,
    runId: active.id,
    commandNames: ["test"],
  });
  project.boundaries.push("Changed after verification.");
  await writeFile(projectFile, `${JSON.stringify(project)}\n`);

  await assert.rejects(
    finishRun({ cwd, runId: active.id, state: "completed" }),
    /configuration changed after the run started/,
  );
});

test("resumes an interrupted active run without changing its state", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });

  const resumed = await resumeRun({ cwd, runId: active.id });
  const events = (
    await readFile(
      path.join(cwd, ".harness/runs", active.id, "events.jsonl"),
      "utf8",
    )
  )
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  assert.equal(resumed.state, "active");
  assert.ok(resumed.updatedAt >= active.updatedAt);
  assert.deepEqual(
    events.map((event) => event.type),
    ["run.started", "run.resumed"],
  );
  assert.deepEqual(
    events.map((event) => event.sequence),
    [1, 2],
  );
});

test("rejects run manifest fields outside the published schema", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const active = await startRun({ cwd, packageRoot });
  const manifestFile = path.join(
    cwd,
    ".harness/runs",
    active.id,
    "manifest.json",
  );
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.unexpected = true;
  await writeFile(manifestFile, `${JSON.stringify(manifest)}\n`);

  await assert.rejects(
    readRun(cwd, active.id),
    /Run manifest contains unsupported field: unexpected/,
  );
});

test("garbage collection removes only old terminal runs", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const first = await startRun({ cwd, packageRoot });
  await finishRun({ cwd, runId: first.id, state: "cancelled" });
  const second = await startRun({ cwd, packageRoot });
  await finishRun({ cwd, runId: second.id, state: "failed" });
  const active = await startRun({ cwd, packageRoot });

  const result = await gcRuns({ cwd, keep: 1 });
  const remaining = await listRuns(cwd);

  assert.equal(result.removed.length, 1);
  assert.equal(result.removed[0], first.id);
  assert.deepEqual(
    new Set(remaining.map((run) => run.id)),
    new Set([second.id, active.id]),
  );
});

test("CLI runs required verification and then completes the run", async () => {
  const cwd = await temporaryProject();
  await mkdir(path.join(cwd, ".harness"), { recursive: true });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: { test: 'node -e "process.exit(0)"' },
      verification: { required: ["test"], timeoutMs: 10_000 },
      boundaries: [],
    })}\n`,
  );
  await initProject({ cwd, packageRoot, preset: "base" });

  assert.equal((await runCli(cwd, ["run", "start"])).code, 0);
  const verification = await runCli(cwd, ["verify", "--required"]);
  const finish = await runCli(cwd, ["run", "finish"]);

  assert.equal(verification.code, 0);
  assert.match(verification.stdout, /test: passed/);
  assert.equal(finish.code, 0);
  assert.match(finish.stdout, /State: completed/);
});

test("CLI records workflow metadata, profile verification, and checkpoints", async () => {
  const cwd = await temporaryProject();
  await mkdir(path.join(cwd, ".harness"), { recursive: true });
  await writeFile(
    path.join(cwd, ".harness/project.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      commands: { test: 'node -e "process.exit(0)"' },
      verification: {
        required: ["test"],
        profiles: { security: ["test"] },
        timeoutMs: 10_000,
      },
      boundaries: [],
    })}\n`,
  );
  await initProject({ cwd, packageRoot, preset: "base" });

  const start = await runCli(cwd, [
    "run",
    "start",
    "--domain",
    "security",
    "--mode",
    "change",
    "--risk",
    "high",
    "--side-effects",
    "local",
    "--profile",
    "security",
  ]);
  const checkpoint = await runCli(cwd, [
    "run",
    "checkpoint",
    "--phase",
    "implement",
    "--state",
    "completed",
  ]);
  const verification = await runCli(cwd, [
    "verify",
    "--profile",
    "security",
  ]);

  assert.equal(start.code, 0);
  assert.match(start.stdout, /Workflow: security\/change\/high\/local/);
  assert.match(start.stdout, /Verification profile: security/);
  assert.equal(checkpoint.code, 0);
  assert.match(checkpoint.stdout, /Checkpoints: 1/);
  assert.equal(verification.code, 0);
  assert.match(verification.stdout, /test: passed/);
});

test("CLI resumes active runs and prunes terminal history", async () => {
  const cwd = await temporaryProject();
  await initProject({ cwd, packageRoot, preset: "base" });
  const firstStart = await runCli(cwd, ["run", "start"]);
  const firstId = firstStart.stdout.match(/Run: ([0-9a-f-]{36})/)?.[1];
  await runCli(cwd, ["run", "finish", "--state", "cancelled"]);
  await runCli(cwd, ["run", "start"]);

  const resume = await runCli(cwd, ["run", "resume"]);
  const gc = await runCli(cwd, ["run", "gc", "--keep", "0"]);
  const runs = await listRuns(cwd);

  assert.equal(resume.code, 0);
  assert.match(resume.stdout, /State: active/);
  assert.equal(gc.code, 0);
  assert.match(gc.stdout, /Removed 1 terminal run/);
  assert.equal(runs.some((run) => run.id === firstId), false);
  assert.equal(runs.filter((run) => run.state === "active").length, 1);
});
