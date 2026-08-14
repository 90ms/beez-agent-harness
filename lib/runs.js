import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import {
  digest,
  readHarnessVersion,
  readJson,
  readProjectConfig,
  rejectSymlinkedPath,
  writeJsonAtomic,
} from "./harness.js";

const RUNS_PATH = ".harness/runs";
const RUN_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TERMINAL_STATES = new Set(["completed", "failed", "cancelled"]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const VERIFICATION_STATES = new Set([
  "passed",
  "failed",
  "timed_out",
  "interrupted",
]);
const RUN_FIELDS = new Set([
  "schemaVersion",
  "id",
  "harnessVersion",
  "state",
  "configDigest",
  "repository",
  "workflow",
  "verification",
  "checkpoints",
  "createdAt",
  "updatedAt",
  "finishedAt",
]);
const REPOSITORY_FIELDS = new Set(["gitSha", "dirty"]);
const VERIFICATION_FIELDS = new Set(["profile", "required", "results"]);
const WORKFLOW_FIELDS = new Set(["domains", "mode", "risk", "sideEffects"]);
const CHECKPOINT_FIELDS = new Set(["phase", "state", "timestamp", "artifact"]);
const ARTIFACT_FIELDS = new Set(["path", "digest"]);
const WORKFLOW_DOMAINS = new Set([
  "general",
  "debug",
  "migration",
  "security",
  "release",
  "performance",
  "github",
]);
const WORKFLOW_MODES = new Set([
  "explain",
  "inspect",
  "diagnose",
  "plan",
  "change",
  "verify",
  "review",
  "execute",
]);
const WORKFLOW_RISKS = new Set(["low", "medium", "high", "critical"]);
const SIDE_EFFECTS = new Set([
  "none",
  "local",
  "repository",
  "external-production",
]);
const CHECKPOINT_STATES = new Set(["started", "completed", "blocked"]);
const CHECKPOINT_PHASE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const PROFILE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_CHECKPOINTS = 100;
const MAX_EVENTS = 500;
const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024;
const RESULT_FIELDS = new Set([
  "command",
  "commandDigest",
  "status",
  "startedAt",
  "finishedAt",
  "durationMs",
  "exitCode",
  "signal",
]);

function runDirectory(cwd, runId) {
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(`Invalid run id: ${runId}`);
  }
  return path.join(cwd, RUNS_PATH, runId);
}

function manifestPath(cwd, runId) {
  return path.join(runDirectory(cwd, runId), "manifest.json");
}

function eventsPath(cwd, runId) {
  return path.join(runDirectory(cwd, runId), "events.jsonl");
}

function isDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validateFields(value, allowed, label) {
  const unexpected = Object.keys(value).filter((field) => !allowed.has(field));
  if (unexpected.length > 0) {
    throw new Error(
      `${label} contains unsupported field${unexpected.length === 1 ? "" : "s"}: ${unexpected.join(", ")}`,
    );
  }
}

function validateVerificationResult(command, result) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result) ||
    result.command !== command
  ) {
    throw new Error(`Invalid verification result: ${command}`);
  }
  validateFields(result, RESULT_FIELDS, `Verification result ${command}`);
  if (!SHA256_PATTERN.test(result.commandDigest)) {
    throw new Error(`Verification commandDigest must be SHA-256: ${command}`);
  }
  if (!VERIFICATION_STATES.has(result.status)) {
    throw new Error(`Invalid verification status: ${command}`);
  }
  if (
    !isDateTime(result.startedAt) ||
    !isDateTime(result.finishedAt) ||
    !Number.isInteger(result.durationMs) ||
    result.durationMs < 0
  ) {
    throw new Error(`Invalid verification timing: ${command}`);
  }
  if (result.exitCode !== null && !Number.isInteger(result.exitCode)) {
    throw new Error(`Invalid verification exitCode: ${command}`);
  }
  if (result.signal !== null && typeof result.signal !== "string") {
    throw new Error(`Invalid verification signal: ${command}`);
  }
}

function validateWorkflow(workflow) {
  if (workflow === null) return;
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
    throw new Error("Run workflow must be an object or null");
  }
  validateFields(workflow, WORKFLOW_FIELDS, "Run workflow");
  if (
    !Array.isArray(workflow.domains) ||
    workflow.domains.length === 0 ||
    workflow.domains.some((domain) => !WORKFLOW_DOMAINS.has(domain)) ||
    new Set(workflow.domains).size !== workflow.domains.length
  ) {
    throw new Error("Run workflow domains must be unique supported domains");
  }
  if (!WORKFLOW_MODES.has(workflow.mode)) {
    throw new Error(`Invalid run workflow mode: ${workflow.mode}`);
  }
  if (!WORKFLOW_RISKS.has(workflow.risk)) {
    throw new Error(`Invalid run workflow risk: ${workflow.risk}`);
  }
  if (!SIDE_EFFECTS.has(workflow.sideEffects)) {
    throw new Error(`Invalid run workflow side effects: ${workflow.sideEffects}`);
  }
}

function validateCheckpoint(checkpoint) {
  if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint)) {
    throw new Error("Run checkpoint must be an object");
  }
  validateFields(checkpoint, CHECKPOINT_FIELDS, "Run checkpoint");
  if (
    typeof checkpoint.phase !== "string" ||
    checkpoint.phase.length > 64 ||
    !CHECKPOINT_PHASE_PATTERN.test(checkpoint.phase)
  ) {
    throw new Error(`Invalid run checkpoint phase: ${checkpoint.phase}`);
  }
  if (!CHECKPOINT_STATES.has(checkpoint.state)) {
    throw new Error(`Invalid run checkpoint state: ${checkpoint.state}`);
  }
  if (!isDateTime(checkpoint.timestamp)) {
    throw new Error("Run checkpoint timestamp must be a valid date-time");
  }
  if (checkpoint.artifact !== undefined) {
    if (
      !checkpoint.artifact ||
      typeof checkpoint.artifact !== "object" ||
      Array.isArray(checkpoint.artifact)
    ) {
      throw new Error("Run checkpoint artifact must be an object");
    }
    validateFields(checkpoint.artifact, ARTIFACT_FIELDS, "Run checkpoint artifact");
    if (
      typeof checkpoint.artifact.path !== "string" ||
      checkpoint.artifact.path.length === 0 ||
      checkpoint.artifact.path.length > 256
    ) {
      throw new Error("Run checkpoint artifact path must contain 1 to 256 characters");
    }
    if (!SHA256_PATTERN.test(checkpoint.artifact.digest)) {
      throw new Error("Run checkpoint artifact digest must be SHA-256");
    }
  }
}

export function validateRunManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Run manifest must be an object");
  }
  validateFields(manifest, RUN_FIELDS, "Run manifest");
  if (manifest.schemaVersion !== 1) {
    throw new Error("Unsupported or missing run manifest schemaVersion");
  }
  if (!RUN_ID_PATTERN.test(manifest.id)) {
    throw new Error(`Invalid run id: ${manifest.id}`);
  }
  if (
    typeof manifest.harnessVersion !== "string" ||
    manifest.harnessVersion.length === 0
  ) {
    throw new Error("Run harnessVersion must be a non-empty string");
  }
  if (manifest.state !== "active" && !TERMINAL_STATES.has(manifest.state)) {
    throw new Error(`Invalid run state: ${manifest.state}`);
  }
  if (!SHA256_PATTERN.test(manifest.configDigest)) {
    throw new Error("Run configDigest must be SHA-256");
  }
  if (
    !manifest.repository ||
    typeof manifest.repository !== "object" ||
    Array.isArray(manifest.repository)
  ) {
    throw new Error("Run repository must be an object");
  }
  validateFields(manifest.repository, REPOSITORY_FIELDS, "Run repository");
  if (
    manifest.repository.gitSha !== null &&
    (typeof manifest.repository.gitSha !== "string" ||
      !/^[a-f0-9]{40,64}$/.test(manifest.repository.gitSha))
  ) {
    throw new Error("Run repository gitSha must be a Git object id or null");
  }
  if (
    manifest.repository.dirty !== null &&
    typeof manifest.repository.dirty !== "boolean"
  ) {
    throw new Error("Run repository dirty must be a boolean or null");
  }
  if (manifest.workflow !== undefined) validateWorkflow(manifest.workflow);
  if (
    !manifest.verification ||
    !Array.isArray(manifest.verification.required) ||
    !manifest.verification.results ||
    typeof manifest.verification.results !== "object" ||
    Array.isArray(manifest.verification.results)
  ) {
    throw new Error("Run verification must contain required and results");
  }
  validateFields(
    manifest.verification,
    VERIFICATION_FIELDS,
    "Run verification",
  );
  if (
    manifest.verification.profile !== undefined &&
    manifest.verification.profile !== null &&
    (typeof manifest.verification.profile !== "string" ||
      manifest.verification.profile.length > 64 ||
      !PROFILE_NAME_PATTERN.test(manifest.verification.profile))
  ) {
    throw new Error("Run verification profile must be a valid profile name or null");
  }
  if (
    manifest.verification.required.some(
      (command) => typeof command !== "string" || command.length === 0,
    ) ||
    new Set(manifest.verification.required).size !==
      manifest.verification.required.length
  ) {
    throw new Error(
      "Run required verification must contain unique non-empty strings",
    );
  }
  for (const [command, result] of Object.entries(
    manifest.verification.results,
  )) {
    validateVerificationResult(command, result);
  }
  if (manifest.checkpoints !== undefined) {
    if (
      !Array.isArray(manifest.checkpoints) ||
      manifest.checkpoints.length > MAX_CHECKPOINTS
    ) {
      throw new Error(`Run checkpoints must contain at most ${MAX_CHECKPOINTS} entries`);
    }
    for (const checkpoint of manifest.checkpoints) validateCheckpoint(checkpoint);
  }
  if (
    !isDateTime(manifest.createdAt) ||
    !isDateTime(manifest.updatedAt) ||
    (manifest.finishedAt !== null && !isDateTime(manifest.finishedAt))
  ) {
    throw new Error("Run timestamps must be valid date-times or null");
  }
  if (manifest.state === "active" && manifest.finishedAt !== null) {
    throw new Error("Active run must not have finishedAt");
  }
  if (TERMINAL_STATES.has(manifest.state) && manifest.finishedAt === null) {
    throw new Error("Terminal run must have finishedAt");
  }
}

async function gitOutput(cwd, args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8" }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function repositoryIdentity(cwd) {
  try {
    const gitSha = await gitOutput(cwd, ["rev-parse", "HEAD"]);
    const status = await gitOutput(cwd, ["status", "--porcelain"]);
    return { gitSha, dirty: status.length > 0 };
  } catch {
    return { gitSha: null, dirty: null };
  }
}

async function appendRunEvent(cwd, manifest, type, data = {}) {
  const eventFile = eventsPath(cwd, manifest.id);
  await rejectSymlinkedPath(cwd, eventFile, "Run event path");
  let sequence = 1;
  try {
    const events = await readFile(eventFile, "utf8");
    sequence =
      events.split("\n").filter((line) => line.trim().length > 0).length + 1;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (sequence > MAX_EVENTS) {
    throw new Error(`Run event limit exceeded (${MAX_EVENTS})`);
  }
  const event = {
    schemaVersion: 1,
    runId: manifest.id,
    sequence,
    type,
    timestamp: new Date().toISOString(),
    data,
  };
  await appendFile(eventFile, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

export async function startVerificationEvent({
  cwd,
  runId,
  command,
  commandDigest,
}) {
  const manifest = await readRun(cwd, runId);
  if (manifest.state !== "active") {
    throw new Error(`Run ${manifest.id} is already ${manifest.state}.`);
  }
  await appendRunEvent(cwd, manifest, "verification.started", {
    command,
    commandDigest,
  });
}

export async function recordVerificationResult({ cwd, runId, result }) {
  const manifest = await readRun(cwd, runId);
  if (manifest.state !== "active") {
    throw new Error(`Run ${manifest.id} is already ${manifest.state}.`);
  }
  validateVerificationResult(result.command, result);
  const updated = {
    ...manifest,
    verification: {
      ...manifest.verification,
      results: {
        ...manifest.verification.results,
        [result.command]: result,
      },
    },
    updatedAt: new Date().toISOString(),
  };
  validateRunManifest(updated);
  await writeJsonAtomic(manifestPath(cwd, runId), updated);
  await appendRunEvent(cwd, updated, "verification.finished", {
    command: result.command,
    commandDigest: result.commandDigest,
    status: result.status,
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    signal: result.signal,
  });
  return updated;
}

export async function readRun(cwd, runId) {
  const file = manifestPath(cwd, runId);
  await rejectSymlinkedPath(cwd, file, "Run manifest path");
  const manifest = await readJson(file, `run manifest ${runId}`);
  validateRunManifest(manifest);
  if (manifest.id !== runId) {
    throw new Error(`Run manifest id does not match its directory: ${runId}`);
  }
  return manifest;
}

export async function listRuns(cwd) {
  const root = path.join(cwd, RUNS_PATH);
  await rejectSymlinkedPath(cwd, root, "Run state path");
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const manifests = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !RUN_ID_PATTERN.test(entry.name)) continue;
    manifests.push(await readRun(cwd, entry.name));
  }
  return manifests.sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) ||
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.id.localeCompare(left.id),
  );
}

async function activeRun(cwd) {
  const active = (await listRuns(cwd)).filter((run) => run.state === "active");
  if (active.length === 0) {
    throw new Error("No active run. Start one with `beez-harness run start`.");
  }
  if (active.length > 1) {
    throw new Error("Multiple active runs found; select one with --run <id>.");
  }
  return active[0];
}

export async function resolveRun(cwd, runId) {
  return runId ? readRun(cwd, runId) : activeRun(cwd);
}

export async function startRun({ cwd, packageRoot, workflow = null, profile = null }) {
  const existing = (await listRuns(cwd)).find((run) => run.state === "active");
  if (existing) {
    throw new Error(
      `Run ${existing.id} is already active; finish it before starting another.`,
    );
  }

  const projectFile = path.join(cwd, ".harness/project.json");
  await rejectSymlinkedPath(cwd, projectFile, "Project configuration path");
  const projectSource = await readFile(projectFile, "utf8");
  const project = await readProjectConfig(cwd);
  validateWorkflow(workflow);
  if (profile !== null) {
    if (!PROFILE_NAME_PATTERN.test(profile) || profile.length > 64) {
      throw new Error(`Invalid verification profile: ${profile}`);
    }
    if (!Object.hasOwn(project.verification?.profiles ?? {}, profile)) {
      throw new Error(`Unknown verification profile: ${profile}`);
    }
  }
  const required =
    profile === null
      ? project.verification?.required ?? []
      : project.verification.profiles[profile];
  const id = randomUUID();
  const now = new Date().toISOString();
  const manifest = {
    schemaVersion: 1,
    id,
    harnessVersion: await readHarnessVersion(packageRoot),
    state: "active",
    configDigest: digest(projectSource),
    repository: await repositoryIdentity(cwd),
    workflow,
    verification: {
      profile,
      required: [...required],
      results: {},
    },
    checkpoints: [],
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
  };
  validateRunManifest(manifest);

  const directory = runDirectory(cwd, id);
  await rejectSymlinkedPath(cwd, directory, "Run state path");
  await mkdir(path.join(cwd, RUNS_PATH), { recursive: true });
  await mkdir(directory, { recursive: false });
  try {
    await writeJsonAtomic(manifestPath(cwd, id), manifest);
    await appendRunEvent(cwd, manifest, "run.started");
  } catch (error) {
    await rm(directory, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
  return manifest;
}

async function artifactEvidence(cwd, artifact) {
  if (
    typeof artifact !== "string" ||
    artifact.length === 0 ||
    artifact.length > 256 ||
    path.isAbsolute(artifact)
  ) {
    throw new Error("Checkpoint artifact must be a project-relative path");
  }
  const resolved = path.resolve(cwd, artifact);
  const relative = path.relative(cwd, resolved);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    relative.length === 0
  ) {
    throw new Error("Checkpoint artifact must stay inside the project");
  }
  await rejectSymlinkedPath(cwd, resolved, "Checkpoint artifact path");
  const metadata = await stat(resolved);
  if (!metadata.isFile()) throw new Error("Checkpoint artifact must be a file");
  if (metadata.size > MAX_ARTIFACT_BYTES) {
    throw new Error(`Checkpoint artifact exceeds ${MAX_ARTIFACT_BYTES} bytes`);
  }
  return {
    path: relative.split(path.sep).join("/"),
    digest: digest(await readFile(resolved)),
  };
}

export async function checkpointRun({
  cwd,
  runId,
  phase,
  state,
  artifact,
}) {
  const manifest = await resolveRun(cwd, runId);
  if (manifest.state !== "active") {
    throw new Error(`Run ${manifest.id} is already ${manifest.state}.`);
  }
  if ((manifest.checkpoints ?? []).length >= MAX_CHECKPOINTS) {
    throw new Error(`Run checkpoint limit exceeded (${MAX_CHECKPOINTS})`);
  }
  const checkpoint = {
    phase,
    state,
    timestamp: new Date().toISOString(),
    ...(artifact ? { artifact: await artifactEvidence(cwd, artifact) } : {}),
  };
  validateCheckpoint(checkpoint);
  const updated = {
    ...manifest,
    checkpoints: [...(manifest.checkpoints ?? []), checkpoint],
    updatedAt: checkpoint.timestamp,
  };
  validateRunManifest(updated);
  await writeJsonAtomic(manifestPath(cwd, manifest.id), updated);
  await appendRunEvent(cwd, updated, "checkpoint.recorded", checkpoint);
  return updated;
}

export async function finishRun({ cwd, runId, state = "completed" }) {
  if (!TERMINAL_STATES.has(state)) {
    throw new Error(`Invalid terminal run state: ${state}`);
  }
  const manifest = await resolveRun(cwd, runId);
  if (manifest.state !== "active") {
    throw new Error(`Run ${manifest.id} is already ${manifest.state}.`);
  }
  if (state === "completed") {
    const projectFile = path.join(cwd, ".harness/project.json");
    await rejectSymlinkedPath(cwd, projectFile, "Project configuration path");
    const projectSource = await readFile(projectFile, "utf8");
    const project = await readProjectConfig(cwd);
    if (manifest.configDigest !== digest(projectSource)) {
      throw new Error(
        "Run cannot complete because project configuration changed after the run started.",
      );
    }
    const missing = manifest.verification.required.filter(
      (command) =>
        !Object.hasOwn(project.commands, command) ||
        manifest.verification.results[command]?.status !== "passed" ||
        manifest.verification.results[command]?.commandDigest !==
          digest(project.commands[command]),
    );
    if (missing.length > 0) {
      throw new Error(
        `Run cannot complete; required verification has not passed: ${missing.join(", ")}`,
      );
    }
  }

  const now = new Date().toISOString();
  const finished = {
    ...manifest,
    state,
    updatedAt: now,
    finishedAt: now,
  };
  validateRunManifest(finished);
  await writeJsonAtomic(manifestPath(cwd, manifest.id), finished);
  await appendRunEvent(cwd, finished, `run.${state}`);
  return finished;
}

export async function resumeRun({ cwd, runId }) {
  const manifest = await resolveRun(cwd, runId);
  if (manifest.state !== "active") {
    throw new Error(`Run ${manifest.id} is already ${manifest.state}.`);
  }
  const resumed = {
    ...manifest,
    updatedAt: new Date().toISOString(),
  };
  validateRunManifest(resumed);
  await writeJsonAtomic(manifestPath(cwd, manifest.id), resumed);
  await appendRunEvent(cwd, resumed, "run.resumed");
  return resumed;
}

export async function gcRuns({ cwd, keep = 20 }) {
  if (!Number.isInteger(keep) || keep < 0) {
    throw new Error("Run retention count must be a non-negative integer");
  }
  const terminal = (await listRuns(cwd)).filter((run) =>
    TERMINAL_STATES.has(run.state),
  );
  const removed = terminal.slice(keep);
  for (const run of removed) {
    const directory = runDirectory(cwd, run.id);
    await rejectSymlinkedPath(cwd, directory, "Run state path");
    await rm(directory, { recursive: true });
  }
  return {
    kept: terminal.length - removed.length,
    removed: removed.map((run) => run.id),
  };
}
