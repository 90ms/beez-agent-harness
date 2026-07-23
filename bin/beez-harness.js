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

function usage() {
  return `Beez Agent Harness

Usage:
  beez-harness init [--preset base|nextjs]
  beez-harness doctor
  beez-harness update [--check]
  beez-harness version
  beez-harness help`;
}

function optionValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  const cwd = process.cwd();

  switch (command) {
    case "init": {
      const preset = optionValue(args, "--preset", "base");
      const result = await initProject({ cwd, packageRoot, preset });
      for (const message of result.messages) console.log(message);
      break;
    }
    case "doctor": {
      const result = await doctorProject({ cwd, packageRoot });
      for (const warning of result.warnings) console.warn(`warning: ${warning}`);
      for (const error of result.errors) console.error(`error: ${error}`);
      if (result.ok) {
        console.log("Beez Agent Harness project state is healthy.");
      } else {
        process.exitCode = 1;
      }
      break;
    }
    case "update": {
      const check = args.includes("--check");
      const result = await updateProject({ cwd, packageRoot, check });
      console.log(result.message);
      if (check && result.changed) process.exitCode = 1;
      break;
    }
    case "version":
      console.log(await readHarnessVersion(packageRoot));
      break;
    case "help":
    case "--help":
    case "-h":
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
