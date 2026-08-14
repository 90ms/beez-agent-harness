import { execFile } from "node:child_process";

function git(cwd, args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
      if (!error) {
        resolve(stdout.trim());
        return;
      }
      if (error.code === 1) {
        resolve(null);
        return;
      }
      reject(
        new Error(
          `Cannot inspect release ancestry: ${stderr.trim() || error.message}`,
        ),
      );
    });
  });
}

export async function assertReleaseAncestry({ cwd, releaseRef, mainRef }) {
  for (const [label, ref] of [
    ["release", releaseRef],
    ["main", mainRef],
  ]) {
    if (typeof ref !== "string" || !ref || ref.startsWith("-")) {
      throw new Error(`Invalid ${label} reference: ${ref}`);
    }
    const exists = await git(cwd, ["rev-parse", "--verify", `${ref}^{commit}`]);
    if (exists === null) throw new Error(`Unknown ${label} reference: ${ref}`);
  }
  const ancestor = await git(cwd, [
    "merge-base",
    "--is-ancestor",
    `${releaseRef}^{commit}`,
    `${mainRef}^{commit}`,
  ]);
  if (ancestor === null) {
    throw new Error(
      `Release reference ${releaseRef} must belong to the history of ${mainRef}`,
    );
  }
}
