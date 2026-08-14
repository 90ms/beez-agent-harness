import assert from "node:assert/strict";

const FORM_FIELDS = new Set(["name", "description", "title", "labels", "body"]);
const INPUT_TYPES = new Set([
  "markdown",
  "textarea",
  "input",
  "dropdown",
  "checkboxes",
  "upload",
]);
const INPUT_ID = /^[A-Za-z0-9_-]+$/;

export function validateIssueFormSource(source, file) {
  const normalized = source.replaceAll("\r\n", "\n");
  assert.doesNotMatch(normalized, /\t/, `${file} must not contain tabs`);
  const topLevel = [...normalized.matchAll(/^([a-z_]+):/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(
    new Set(topLevel),
    FORM_FIELDS,
    `${file} must contain exactly the supported issue-form fields`,
  );
  assert.match(normalized, /^name: .{4,}$/m, `${file} needs a useful name`);
  assert.match(
    normalized,
    /^description: .{10,}$/m,
    `${file} needs a useful description`,
  );
  assert.match(normalized, /^body:\n/m, `${file} needs a body`);

  const blocks = normalized.split(/\n  - type: /).slice(1);
  assert.ok(blocks.length > 0, `${file} needs form inputs`);
  const ids = new Set();
  const labels = new Set();
  let interactive = 0;
  for (const block of blocks) {
    const type = block.split("\n", 1)[0].trim();
    assert.ok(INPUT_TYPES.has(type), `${file} has unsupported input type: ${type}`);
    if (type === "markdown") continue;
    interactive += 1;
    const id = block.match(/^    id: (.+)$/m)?.[1].trim();
    const label = block.match(/^      label: (.+)$/m)?.[1].trim();
    assert.ok(id && INPUT_ID.test(id), `${file} input needs a valid id`);
    assert.ok(!ids.has(id), `${file} contains duplicate input id: ${id}`);
    ids.add(id);
    assert.ok(label, `${file} input ${id} needs a label`);
    assert.ok(!labels.has(label), `${file} contains duplicate label: ${label}`);
    labels.add(label);
  }
  assert.ok(interactive > 0, `${file} needs at least one interactive input`);
}
