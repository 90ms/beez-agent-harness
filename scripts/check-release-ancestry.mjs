import process from "node:process";
import { assertReleaseAncestry } from "../lib/release.js";

const [releaseRef = "HEAD", mainRef = "origin/main", ...extra] =
  process.argv.slice(2);
if (extra.length > 0) {
  throw new Error(
    "Usage: node scripts/check-release-ancestry.mjs [release-ref] [main-ref]",
  );
}

await assertReleaseAncestry({
  cwd: process.cwd(),
  releaseRef,
  mainRef,
});
console.log(`Release reference ${releaseRef} belongs to ${mainRef}.`);
