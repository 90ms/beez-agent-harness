#!/usr/bin/env node

import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  doctorProject,
  initProject,
  readHarnessVersion,
  updateProject,
} from "../lib/harness.js";

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
  beez-harness update [--check]

Options:
  --check     Report available updates or drift without writing
  -h, --help  Show this help`,
    version: `Usage:
  beez-harness version`,
  };
  if (command && commands[command]) return commands[command];

  return `Beez Agent Harness

Usage:
  beez-harness init [--preset base|nextjs]
  beez-harness doctor
  beez-harness update [--check]
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
  for (const argument of args) {
    if (HELP_FLAGS.has(argument)) {
      if (args.length !== 1) argumentError("update", argument);
      return { check, help: true };
    }
    if (argument !== "--check") argumentError("update", argument);
    if (check) {
      throw new Error(`--check may only be specified once\n\n${usage("update")}`);
    }
    check = true;
  }
  return { check, help: false };
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
    ["init", "doctor", "update", "version"].includes(args[0])
  ) {
    return args[0];
  }
  argumentError("help", args[0]);
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
      const { check, help } = parseUpdateArgs(args);
      if (help) {
        console.log(usage("update"));
        break;
      }
      const result = await updateProject({ cwd, packageRoot, check });
      console.log(result.message);
      if (check && result.changed) process.exitCode = 1;
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
