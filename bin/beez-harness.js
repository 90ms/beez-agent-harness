#!/usr/bin/env node

import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  doctorProject,
  initProject,
  readHarnessVersion,
  updateProject,
} from "../lib/harness.js";
import {
  finishRun,
  listRuns,
  resolveRun,
  startRun,
} from "../lib/runs.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

const HELP_FLAGS = new Set(["--help", "-h"]);

function usage(command) {
  const commands = {
    init: `Usage:
  beez-harness init [--preset base|nextjs] [--dry-run]

Options:
  --preset <name>  Project preset (default: base)
  --dry-run        Preview initialization without writing
  -h, --help       Show this help`,
    doctor: `Usage:
  beez-harness doctor [--json]

Options:
  --json     Print a machine-readable health report
  -h, --help  Show this help`,
    update: `Usage:
  beez-harness update [--check] [--diff]

Options:
  --check     Report available updates or drift without writing
  --diff      Preview managed-file changes without writing
  -h, --help  Show this help`,
    run: `Usage:
  beez-harness run start
  beez-harness run status [--run <id>]
  beez-harness run list
  beez-harness run finish [--run <id>] [--state completed|failed|cancelled]

Options:
  --run <id>     Select a run (status and finish)
  --state <name> Terminal state (default: completed)
  -h, --help     Show this help`,
    version: `Usage:
  beez-harness version`,
  };
  if (command && commands[command]) return commands[command];

  return `Beez Agent Harness

Usage:
  beez-harness init [--preset base|nextjs]
  beez-harness doctor
  beez-harness update [--check]
  beez-harness run start|status|list|finish
  beez-harness version
  beez-harness help`;
}

function argumentError(command, argument) {
  throw new Error(
    `Unknown option or argument for ${command}: ${argument}\n\n${usage(command)}`,
  );
}

function parseInitArgs(args) {
  let preset = "base";
  let presetProvided = false;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (HELP_FLAGS.has(argument)) {
      if (args.length !== 1) argumentError("init", argument);
      return { dryRun, help: true, preset };
    }

    let value;
    if (argument === "--preset") {
      value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`--preset requires a value\n\n${usage("init")}`);
      }
      index += 1;
    } else if (argument.startsWith("--preset=")) {
      value = argument.slice("--preset=".length);
      if (!value) {
        throw new Error(`--preset requires a value\n\n${usage("init")}`);
      }
    } else if (argument === "--dry-run") {
      if (dryRun) {
        throw new Error(
          `--dry-run may only be specified once\n\n${usage("init")}`,
        );
      }
      dryRun = true;
      continue;
    } else {
      argumentError("init", argument);
    }

    if (presetProvided) {
      throw new Error(`--preset may only be specified once\n\n${usage("init")}`);
    }
    presetProvided = true;
    preset = value;
  }

  return { dryRun, help: false, preset };
}

function parseUpdateArgs(args) {
  let check = false;
  let diff = false;
  for (const argument of args) {
    if (HELP_FLAGS.has(argument)) {
      if (args.length !== 1) argumentError("update", argument);
      return { check, diff, help: true };
    }
    if (argument === "--check") {
      if (check) {
        throw new Error(
          `--check may only be specified once\n\n${usage("update")}`,
        );
      }
      check = true;
    } else if (argument === "--diff") {
      if (diff) {
        throw new Error(
          `--diff may only be specified once\n\n${usage("update")}`,
        );
      }
      diff = true;
    } else {
      argumentError("update", argument);
    }
  }
  return { check, diff, help: false };
}

function parseDoctorArgs(args) {
  let json = false;
  for (const argument of args) {
    if (HELP_FLAGS.has(argument)) {
      if (args.length !== 1) argumentError("doctor", argument);
      return { help: true, json };
    }
    if (argument !== "--json") argumentError("doctor", argument);
    if (json) {
      throw new Error(`--json may only be specified once\n\n${usage("doctor")}`);
    }
    json = true;
  }
  return { help: false, json };
}

function parseFlaglessArgs(command, args) {
  if (args.length === 0) return { help: false };
  if (args.length === 1 && HELP_FLAGS.has(args[0])) return { help: true };
  argumentError(command, args[0]);
}

function parseHelpArgs(args) {
  if (args.length === 0) return undefined;
  if (
    args.length === 1 &&
    ["init", "doctor", "update", "run", "version"].includes(args[0])
  ) {
    return args[0];
  }
  argumentError("help", args[0]);
}

function optionValue(args, index, option, command) {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${option} requires a value\n\n${usage(command)}`);
  }
  return value;
}

function parseRunArgs(args) {
  const [subcommand, ...options] = args;
  if (!subcommand || HELP_FLAGS.has(subcommand)) {
    if (args.length > 1) argumentError("run", args[1]);
    return { help: true };
  }
  if (!["start", "status", "list", "finish"].includes(subcommand)) {
    argumentError("run", subcommand);
  }

  let runId;
  let state = "completed";
  let stateProvided = false;
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (HELP_FLAGS.has(option)) {
      if (options.length !== 1) argumentError("run", option);
      return { help: true };
    }
    if (option === "--run") {
      if (runId) {
        throw new Error(`--run may only be specified once\n\n${usage("run")}`);
      }
      runId = optionValue(options, index, "--run", "run");
      index += 1;
    } else if (option === "--state") {
      if (stateProvided) {
        throw new Error(`--state may only be specified once\n\n${usage("run")}`);
      }
      state = optionValue(options, index, "--state", "run");
      stateProvided = true;
      index += 1;
    } else {
      argumentError("run", option);
    }
  }

  if ((subcommand === "start" || subcommand === "list") && options.length > 0) {
    argumentError("run", options[0]);
  }
  if (subcommand !== "finish" && stateProvided) {
    argumentError("run", "--state");
  }
  return { help: false, runId, state, subcommand };
}

function printRun(run) {
  console.log(
    [
      `Run: ${run.id}`,
      `State: ${run.state}`,
      `Created: ${run.createdAt}`,
      `Updated: ${run.updatedAt}`,
      `Required verification: ${run.verification.required.join(", ") || "none"}`,
    ].join("\n"),
  );
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  const cwd = process.cwd();

  switch (command) {
    case "init": {
      const { dryRun, help, preset } = parseInitArgs(args);
      if (help) {
        console.log(usage("init"));
        break;
      }
      const result = await initProject({
        cwd,
        packageRoot,
        preset,
        dryRun,
      });
      for (const message of result.messages) console.log(message);
      break;
    }
    case "doctor": {
      const { help, json } = parseDoctorArgs(args);
      if (help) {
        console.log(usage("doctor"));
        break;
      }
      const result = await doctorProject({ cwd, packageRoot });
      if (json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        for (const warning of result.warnings) console.warn(`warning: ${warning}`);
        for (const error of result.errors) console.error(`error: ${error}`);
        if (result.ok) {
          console.log("Beez Agent Harness project state is healthy.");
        }
      }
      if (!result.ok) process.exitCode = 1;
      break;
    }
    case "update": {
      const { check, diff, help } = parseUpdateArgs(args);
      if (help) {
        console.log(usage("update"));
        break;
      }
      const result = await updateProject({ cwd, packageRoot, check, diff });
      console.log(result.message);
      if (result.diff) console.log(result.diff);
      if (check && result.changed) process.exitCode = 1;
      break;
    }
    case "run": {
      const { help, runId, state, subcommand } = parseRunArgs(args);
      if (help) {
        console.log(usage("run"));
        break;
      }
      if (subcommand === "start") {
        printRun(await startRun({ cwd, packageRoot }));
      } else if (subcommand === "status") {
        printRun(await resolveRun(cwd, runId));
      } else if (subcommand === "list") {
        const runs = await listRuns(cwd);
        if (runs.length === 0) {
          console.log("No harness runs found.");
        } else {
          for (const run of runs) {
            console.log(`${run.id}\t${run.state}\t${run.createdAt}`);
          }
        }
      } else {
        printRun(await finishRun({ cwd, runId, state }));
      }
      break;
    }
    case "version": {
      const { help } = parseFlaglessArgs("version", args);
      if (help) {
        console.log(usage("version"));
      } else {
        console.log(await readHarnessVersion(packageRoot));
      }
      break;
    }
    case "--version":
    case "-v":
      if (args.length > 0) argumentError("version", args[0]);
      console.log(await readHarnessVersion(packageRoot));
      break;
    case "help": {
      const helpCommand = parseHelpArgs(args);
      console.log(usage(helpCommand));
      break;
    }
    case "--help":
    case "-h":
      if (args.length > 0) argumentError("help", args[0]);
      console.log(usage());
      break;
    default:
      throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
});
