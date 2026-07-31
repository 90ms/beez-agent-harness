import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  digest,
  readProjectConfig,
  rejectSymlinkedPath,
} from "./harness.js";
import {
  recordVerificationResult,
  resolveRun,
  startVerificationEvent,
} from "./runs.js";

const DEFAULT_TIMEOUT_MS = 300_000;

function execute(command, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const startedTime = Date.now();
    let timedOut = false;
    let interruptedSignal = null;
    let forceKillTimer;
    let settled = false;
    let terminationStarted = false;
    let timeout;

    const child = spawn(command, {
      cwd,
      detached: process.platform !== "win32",
      env: process.env,
      shell: true,
      stdio: "inherit",
    });

    const terminate = (signal) => {
      try {
        if (process.platform !== "win32" && child.pid) {
          process.kill(-child.pid, signal);
        } else {
          child.kill(signal);
        }
      } catch {
        try {
          child.kill(signal);
        } catch {
          // The process may already have exited between the two attempts.
        }
      }
    };
    const stop = (signal) => {
      if (settled || terminationStarted) return;
      terminationStarted = true;
      interruptedSignal = signal;
      clearTimeout(timeout);
      terminate("SIGTERM");
      forceKillTimer = setTimeout(() => terminate("SIGKILL"), 1_000);
      forceKillTimer.unref();
    };
    const onSigint = () => stop("SIGINT");
    const onSigterm = () => stop("SIGTERM");
    process.once("SIGINT", onSigint);
    process.once("SIGTERM", onSigterm);

    timeout = setTimeout(() => {
      if (settled || terminationStarted) return;
      terminationStarted = true;
      timedOut = true;
      terminate("SIGTERM");
      forceKillTimer = setTimeout(() => terminate("SIGKILL"), 1_000);
      forceKillTimer.unref();
    }, timeoutMs);
    timeout.unref();

    const finish = (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(forceKillTimer);
      process.removeListener("SIGINT", onSigint);
      process.removeListener("SIGTERM", onSigterm);
      const finishedAt = new Date().toISOString();
      let status;
      if (timedOut) {
        status = "timed_out";
      } else if (interruptedSignal || signal) {
        status = "interrupted";
      } else {
        status = exitCode === 0 ? "passed" : "failed";
      }
      resolve({
        status,
        startedAt,
        finishedAt,
        durationMs: Math.max(0, Date.now() - startedTime),
        exitCode,
        signal: interruptedSignal ?? signal ?? null,
      });
    };

    child.once("error", () => finish(null, null));
    child.once("close", finish);
  });
}

export async function verifyProject({
  cwd,
  runId,
  commandNames,
}) {
  if (!Array.isArray(commandNames)) {
    throw new Error("Verification commands must be an array");
  }
  let run = await resolveRun(cwd, runId);
  if (run.state !== "active") {
    throw new Error(`Run ${run.id} is already ${run.state}.`);
  }
  if (commandNames.length === 0) {
    return { run, results: [] };
  }
  if (new Set(commandNames).size !== commandNames.length) {
    throw new Error("Verification commands must not contain duplicates");
  }

  const projectFile = path.join(cwd, ".harness/project.json");
  await rejectSymlinkedPath(cwd, projectFile, "Project configuration path");
  const projectSource = await readFile(projectFile, "utf8");
  const project = await readProjectConfig(cwd);
  if (run.configDigest !== digest(projectSource)) {
    throw new Error(
      "Project configuration changed after the run started; finish this run and start a new one.",
    );
  }

  for (const commandName of commandNames) {
    if (!Object.hasOwn(project.commands, commandName)) {
      throw new Error(`Unknown project command: ${commandName}`);
    }
  }

  const timeoutMs = project.verification?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const results = [];
  for (const commandName of commandNames) {
    const command = project.commands[commandName];
    const commandDigest = digest(command);
    await startVerificationEvent({
      cwd,
      runId: run.id,
      command: commandName,
      commandDigest,
    });
    const execution = await execute(command, { cwd, timeoutMs });
    const result = {
      command: commandName,
      commandDigest,
      ...execution,
    };
    run = await recordVerificationResult({
      cwd,
      runId: run.id,
      result,
    });
    results.push(result);
  }

  return { run, results };
}
