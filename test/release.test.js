import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertReleaseAncestry } from "../lib/release.js";

function git(cwd, args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout.trim());
    });
  });
}

test("accepts main history and rejects a release from a side branch", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "beez-release-test-"));
  try {
    await git(cwd, ["init", "-b", "main"]);
    await git(cwd, ["config", "user.name", "Beez Test"]);
    await git(cwd, ["config", "user.email", "test@example.com"]);
    await writeFile(path.join(cwd, "state.txt"), "base\n");
    await git(cwd, ["add", "state.txt"]);
    await git(cwd, ["commit", "-m", "base"]);
    const base = await git(cwd, ["rev-parse", "HEAD"]);
    await writeFile(path.join(cwd, "state.txt"), "main\n");
    await git(cwd, ["commit", "-am", "main"]);
    const main = await git(cwd, ["rev-parse", "HEAD"]);

    await assert.doesNotReject(
      assertReleaseAncestry({ cwd, releaseRef: main, mainRef: "main" }),
    );

    await git(cwd, ["switch", "-c", "side", base]);
    await writeFile(path.join(cwd, "side.txt"), "side\n");
    await git(cwd, ["add", "side.txt"]);
    await git(cwd, ["commit", "-m", "side"]);
    const side = await git(cwd, ["rev-parse", "HEAD"]);
    await assert.rejects(
      assertReleaseAncestry({ cwd, releaseRef: side, mainRef: "main" }),
      /must belong to the history of main/,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("rejects unsafe release references", async () => {
  await assert.rejects(
    assertReleaseAncestry({
      cwd: process.cwd(),
      releaseRef: "--help",
      mainRef: "main",
    }),
    /Invalid release reference/,
  );
});
