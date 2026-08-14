import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { afterEach } from "node:test";
import {
  parseSkillFrontmatter,
  validateSkillRoot,
} from "../lib/validation.js";

const temporaryRoots = new Set();

async function temporarySkillRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "beez-skills-test-"));
  temporaryRoots.add(root);
  return root;
}

async function writeSkill(root, name, link = "") {
  const directory = path.join(root, name);
  await mkdir(path.join(directory, "agents"), { recursive: true });
  await writeFile(
    path.join(directory, "SKILL.md"),
    `---\nname: ${name}\ndescription: A sufficiently detailed skill description. Use when testing extensible skill discovery behavior.\n---\n\n# Test Skill\n\n${link}\n`,
  );
  await writeFile(
    path.join(directory, "agents", "openai.yaml"),
    `interface:\n  display_name: "Test Skill"\n  short_description: "Validate an extensible test skill"\n  default_prompt: "Use $${name} to validate this test skill."\n`,
  );
  return directory;
}

afterEach(async () => {
  await Promise.all(
    [...temporaryRoots].map((root) => rm(root, { recursive: true, force: true })),
  );
  temporaryRoots.clear();
});

test("parses skill frontmatter with CRLF line endings", () => {
  const parsed = parseSkillFrontmatter(
    "---\r\nname: test-skill\r\ndescription: Detailed fixture. Use when parsing Windows files.\r\n---\r\n# Test\r\n",
    "fixture",
  );
  assert.equal(parsed.metadata.name, "test-skill");
  assert.match(parsed.body, /^# Test/);
});

test("discovers additional valid skills without a hardcoded folder list", async () => {
  const root = await temporarySkillRoot();
  await writeSkill(root, "core-skill");
  await writeSkill(root, "new-workflow");

  assert.deepEqual(
    await validateSkillRoot({ skillRoot: root, requiredSkills: ["core-skill"] }),
    ["core-skill", "new-workflow"],
  );
});

test("rejects missing and escaping skill references", async () => {
  const missingRoot = await temporarySkillRoot();
  await writeSkill(missingRoot, "missing-reference", "[missing](references/nope.md)");
  await assert.rejects(
    validateSkillRoot({ skillRoot: missingRoot }),
    /references a missing file/,
  );

  const escapingRoot = await temporarySkillRoot();
  await writeSkill(escapingRoot, "escaping-reference", "[escape](../outside.md)");
  await assert.rejects(
    validateSkillRoot({ skillRoot: escapingRoot }),
    /must stay inside its skill directory/,
  );
});
