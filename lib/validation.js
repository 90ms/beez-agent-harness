import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MARKDOWN_LINK = /\[[^\]]*\]\(([^)]+)\)/g;

export function parseSkillFrontmatter(source, file) {
  const normalized = source.replaceAll("\r\n", "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, `${file} must begin with YAML frontmatter`);
  const entries = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const separator = line.indexOf(":");
      assert.notEqual(separator, -1, `Invalid frontmatter line in ${file}`);
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
  assert.deepEqual(
    Object.keys(entries).sort(),
    ["description", "name"],
    `${file} frontmatter may contain only name and description`,
  );
  return { metadata: entries, body: normalized.slice(match[0].length) };
}

function quotedInterfaceValue(source, key, file) {
  const match = source.match(new RegExp(`^  ${key}: "([^"\\n]+)"$`, "m"));
  assert.ok(match, `${file} must define a quoted interface.${key}`);
  return match[1];
}

async function validateLocalReferences({ skillDirectory, source, file }) {
  for (const match of source.matchAll(MARKDOWN_LINK)) {
    const target = match[1].trim().replace(/^<|>$/g, "").split("#", 1)[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    const resolved = path.resolve(skillDirectory, target);
    assert.ok(
      resolved.startsWith(`${skillDirectory}${path.sep}`),
      `${file} reference must stay inside its skill directory: ${target}`,
    );
    await assert.doesNotReject(
      access(resolved),
      `${file} references a missing file: ${target}`,
    );
  }
}

export async function validateSkillRoot({
  skillRoot,
  requiredSkills = [],
  maximumLines = 500,
}) {
  const skillFolders = (await readdir(skillRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.ok(skillFolders.length > 0, "skills/ must contain at least one skill");
  for (const requiredSkill of requiredSkills) {
    assert.ok(
      skillFolders.includes(requiredSkill),
      `Required core skill is missing: ${requiredSkill}`,
    );
  }

  const names = new Set();
  for (const folder of skillFolders) {
    assert.match(folder, SKILL_NAME, `Invalid skill folder name: ${folder}`);
    const skillDirectory = path.join(skillRoot, folder);
    const relativeSkill = `skills/${folder}/SKILL.md`;
    const source = await readFile(path.join(skillDirectory, "SKILL.md"), "utf8");
    const { metadata, body } = parseSkillFrontmatter(source, relativeSkill);

    assert.equal(metadata.name, folder, `${relativeSkill} name must match its folder`);
    assert.match(metadata.name, SKILL_NAME, `${relativeSkill} has an invalid name`);
    assert.ok(!names.has(metadata.name), `Duplicate skill name: ${metadata.name}`);
    names.add(metadata.name);
    assert.ok(
      metadata.description.length >= 40 && metadata.description.length <= 1024,
      `${relativeSkill} description must contain 40 to 1024 characters`,
    );
    assert.match(
      metadata.description,
      /\bUse (?:when|before|for)\b/,
      `${relativeSkill} description must explain when the skill should be used`,
    );
    assert.match(body, /^#\s+\S/m, `${relativeSkill} needs a title`);
    assert.ok(
      source.replaceAll("\r\n", "\n").split("\n").length <= maximumLines,
      `${relativeSkill} exceeds the ${maximumLines}-line skill budget`,
    );
    assert.doesNotMatch(source, /\[TODO|TODO:/, `${relativeSkill} contains a TODO`);
    await validateLocalReferences({ skillDirectory, source, file: relativeSkill });

    const interfaceFile = `skills/${folder}/agents/openai.yaml`;
    const interfaceSource = await readFile(
      path.join(skillDirectory, "agents", "openai.yaml"),
      "utf8",
    );
    assert.match(interfaceSource, /^interface:\n/, `${interfaceFile} needs interface metadata`);
    const displayName = quotedInterfaceValue(interfaceSource, "display_name", interfaceFile);
    const shortDescription = quotedInterfaceValue(
      interfaceSource,
      "short_description",
      interfaceFile,
    );
    const defaultPrompt = quotedInterfaceValue(
      interfaceSource,
      "default_prompt",
      interfaceFile,
    );
    assert.ok(displayName.length <= 64, `${interfaceFile} display_name is too long`);
    assert.ok(
      shortDescription.length >= 25 && shortDescription.length <= 64,
      `${interfaceFile} short_description must contain 25 to 64 characters`,
    );
    assert.ok(
      defaultPrompt.includes(`$${folder}`),
      `${interfaceFile} default prompt must mention $${folder}`,
    );
  }

  return skillFolders;
}
