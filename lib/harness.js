import { createHash } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const MANIFEST_PATH = ".harness/manifest.json";
const PROJECT_PATH = ".harness/project.json";
const GENERATED_GUIDANCE_PATH = ".harness/generated/AGENTS.md";
const ROOT_GUIDANCE_PATH = "AGENTS.md";
const SUPPORTED_PRESETS = new Set(["base", "nextjs"]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MANIFEST_FIELDS = new Set([
  "schemaVersion",
  "harnessVersion",
  "preset",
  "managedFiles",
  "createdAt",
  "updatedAt",
]);
const PROJECT_FIELDS = new Set([
  "schemaVersion",
  "commands",
  "verification",
  "boundaries",
]);
const VERIFICATION_FIELDS = new Set(["required", "timeoutMs"]);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(filePath, label) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${error.message}`);
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}: ${error.message}`);
  }
}

async function writeTextAtomic(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, filePath);
}

export async function writeJsonAtomic(filePath, value) {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function digest(content) {
  return createHash("sha256").update(content).digest("hex");
}

function renderFileDiff(relativePath, before, after) {
  if (before === after) return "";
  const beforeLines = before.endsWith("\n")
    ? before.slice(0, -1).split("\n")
    : before.split("\n");
  const afterLines = after.endsWith("\n")
    ? after.slice(0, -1).split("\n")
    : after.split("\n");
  return [
    `--- a/${relativePath}`,
    `+++ b/${relativePath}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
    ...beforeLines.map((line) => `-${line}`),
    ...afterLines.map((line) => `+${line}`),
  ].join("\n");
}

function replaceTokens(value, tokens) {
  if (typeof value === "string") {
    return value.replace(/\{\{([a-zA-Z]+)\}\}/g, (_, key) => {
      if (!(key in tokens)) throw new Error(`Unknown template token: ${key}`);
      return tokens[key];
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceTokens(item, tokens));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceTokens(item, tokens),
      ]),
    );
  }
  return value;
}

async function detectPackageManager(cwd) {
  const candidates = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
  ];
  for (const [file, manager] of candidates) {
    if (await exists(path.join(cwd, file))) return manager;
  }
  return "npm";
}

async function loadPreset({ cwd, packageRoot, preset }) {
  if (!SUPPORTED_PRESETS.has(preset)) {
    throw new Error(
      `Unsupported preset "${preset}". Choose one of: ${[...SUPPORTED_PRESETS].join(", ")}`,
    );
  }

  const presetRoot = path.join(packageRoot, "presets", preset);
  const packageManager = await detectPackageManager(cwd);
  const projectTemplate = await readJson(
    path.join(presetRoot, "project.json"),
    `${preset} preset project template`,
  );
  const guidance = await readFile(path.join(presetRoot, "AGENTS.md"), "utf8");

  return {
    project: replaceTokens(projectTemplate, { packageManager }),
    guidance,
    packageManager,
  };
}

export async function readHarnessVersion(packageRoot) {
  const packageJson = await readJson(
    path.join(packageRoot, "package.json"),
    "harness package",
  );
  return packageJson.version;
}

async function renderGeneratedGuidance({ cwd, packageRoot, preset }) {
  const version = await readHarnessVersion(packageRoot);
  const presetData = await loadPreset({ cwd, packageRoot, preset });
  const commonTemplate = await readFile(
    path.join(packageRoot, "templates", "generated-AGENTS.md"),
    "utf8",
  );
  return replaceTokens(commonTemplate, {
    harnessVersion: version,
    preset,
    presetGuidance: presetData.guidance.trim(),
  });
}

function createManifest({ version, preset, generatedContent, previous }) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    harnessVersion: version,
    preset,
    managedFiles: {
      [GENERATED_GUIDANCE_PATH]: digest(generatedContent),
    },
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function validateFields(value, allowedFields, label) {
  const unexpected = Object.keys(value).filter(
    (field) => !allowedFields.has(field),
  );
  if (unexpected.length > 0) {
    throw new Error(
      `${label} contains unsupported field${unexpected.length === 1 ? "" : "s"}: ${unexpected.join(", ")}`,
    );
  }
}

function isDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function resolveManagedFile(cwd, relativePath) {
  const managedRoot = path.resolve(cwd, ".harness/generated");
  const resolvedPath = path.resolve(cwd, relativePath);
  if (
    resolvedPath === managedRoot ||
    !resolvedPath.startsWith(`${managedRoot}${path.sep}`)
  ) {
    throw new Error(
      `Managed file must stay inside .harness/generated: ${relativePath}`,
    );
  }
  return resolvedPath;
}

export async function rejectSymlinkedPath(cwd, targetPath, label) {
  const projectRoot = path.resolve(cwd);
  const resolvedTarget = path.resolve(targetPath);
  const relativePath = path.relative(projectRoot, resolvedTarget);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`${label} must stay inside the project: ${targetPath}`);
  }

  let currentPath = projectRoot;
  for (const segment of relativePath.split(path.sep).filter(Boolean)) {
    currentPath = path.join(currentPath, segment);
    try {
      const stats = await lstat(currentPath);
      if (stats.isSymbolicLink()) {
        throw new Error(`${label} must not use symbolic links: ${currentPath}`);
      }
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
  }
}

function validateManifest(manifest) {
  if (!isPlainObject(manifest)) {
    throw new Error("Harness manifest must be an object");
  }
  validateFields(manifest, MANIFEST_FIELDS, "Harness manifest");
  if (manifest?.schemaVersion !== 1) {
    throw new Error("Unsupported or missing harness manifest schemaVersion");
  }
  if (
    typeof manifest.harnessVersion !== "string" ||
    manifest.harnessVersion.length === 0
  ) {
    throw new Error("Manifest harnessVersion must be a non-empty string");
  }
  if (!SUPPORTED_PRESETS.has(manifest.preset)) {
    throw new Error(`Manifest contains unsupported preset: ${manifest.preset}`);
  }
  if (!isPlainObject(manifest.managedFiles)) {
    throw new Error("Manifest managedFiles must be an object");
  }
  for (const [relativePath, expectedHash] of Object.entries(
    manifest.managedFiles,
  )) {
    if (
      path.posix.isAbsolute(relativePath) ||
      path.posix.normalize(relativePath) !== relativePath ||
      !relativePath.startsWith(".harness/generated/")
    ) {
      throw new Error(
        `Managed file must stay inside .harness/generated: ${relativePath}`,
      );
    }
    if (
      typeof expectedHash !== "string" ||
      !SHA256_PATTERN.test(expectedHash)
    ) {
      throw new Error(`Managed file hash must be SHA-256: ${relativePath}`);
    }
  }
  if (!(GENERATED_GUIDANCE_PATH in manifest.managedFiles)) {
    throw new Error(
      `Manifest must manage required file: ${GENERATED_GUIDANCE_PATH}`,
    );
  }
  if (!isDateTime(manifest.createdAt)) {
    throw new Error("Manifest createdAt must be a valid date-time");
  }
  if (!isDateTime(manifest.updatedAt)) {
    throw new Error("Manifest updatedAt must be a valid date-time");
  }
}

export function validateProjectConfig(project) {
  if (!isPlainObject(project)) {
    throw new Error("Project configuration must be an object");
  }
  validateFields(project, PROJECT_FIELDS, "Project configuration");
  if (project?.schemaVersion !== 1) {
    throw new Error("Unsupported or missing project schemaVersion");
  }
  if (!isPlainObject(project.commands)) {
    throw new Error("Project commands must be an object");
  }
  for (const [name, command] of Object.entries(project.commands)) {
    if (typeof command !== "string" || command.length === 0) {
      throw new Error(`Project command must be a string: ${name}`);
    }
  }
  if (project.verification !== undefined) {
    if (!isPlainObject(project.verification)) {
      throw new Error("Project verification must be an object");
    }
    validateFields(
      project.verification,
      VERIFICATION_FIELDS,
      "Project verification",
    );
    if (!Array.isArray(project.verification.required)) {
      throw new Error("Project verification required must be an array");
    }
    const requiredCommands = project.verification.required;
    if (
      requiredCommands.some(
        (command) => typeof command !== "string" || command.length === 0,
      )
    ) {
      throw new Error(
        "Project verification required must contain only non-empty strings",
      );
    }
    if (new Set(requiredCommands).size !== requiredCommands.length) {
      throw new Error("Project verification required must not contain duplicates");
    }
    for (const command of requiredCommands) {
      if (!(command in project.commands)) {
        throw new Error(
          `Project verification references an unknown command: ${command}`,
        );
      }
    }
    if (
      project.verification.timeoutMs !== undefined &&
      (!Number.isInteger(project.verification.timeoutMs) ||
        project.verification.timeoutMs < 1_000 ||
        project.verification.timeoutMs > 3_600_000)
    ) {
      throw new Error(
        "Project verification timeoutMs must be an integer from 1000 to 3600000",
      );
    }
  }
  if (!Array.isArray(project.boundaries)) {
    throw new Error("Project boundaries must be an array");
  }
  if (project.boundaries.some((boundary) => typeof boundary !== "string")) {
    throw new Error("Project boundaries must contain only strings");
  }
}

export async function readProjectConfig(cwd) {
  const project = await readJson(
    path.join(cwd, PROJECT_PATH),
    "project configuration",
  );
  validateProjectConfig(project);
  return project;
}

export async function initProject({
  cwd,
  packageRoot,
  preset = "base",
  dryRun = false,
}) {
  const manifestFile = path.join(cwd, MANIFEST_PATH);
  if (await exists(manifestFile)) {
    throw new Error("Harness is already initialized; use `beez-harness update`");
  }

  const version = await readHarnessVersion(packageRoot);
  const presetData = await loadPreset({ cwd, packageRoot, preset });
  const generatedContent = await renderGeneratedGuidance({
    cwd,
    packageRoot,
    preset,
  });
  const rootTemplate = replaceTokens(
    await readFile(path.join(packageRoot, "templates", "root-AGENTS.md"), "utf8"),
    { harnessVersion: version },
  );

  const projectFile = path.join(cwd, PROJECT_PATH);
  await rejectSymlinkedPath(cwd, projectFile, "Harness path");
  await rejectSymlinkedPath(
    cwd,
    path.join(cwd, GENERATED_GUIDANCE_PATH),
    "Harness path",
  );
  await rejectSymlinkedPath(cwd, manifestFile, "Harness path");
  const projectExists = await exists(projectFile);
  const rootGuidanceFile = path.join(cwd, ROOT_GUIDANCE_PATH);
  const rootGuidanceExists = await exists(rootGuidanceFile);
  const messages = dryRun
    ? [
        `Would initialize Beez Agent Harness ${version} with the ${preset} preset.`,
        `Detected package manager: ${presetData.packageManager}.`,
        projectExists
          ? "Would preserve existing .harness/project.json."
          : "Would create .harness/project.json.",
        "Would create .harness/generated/AGENTS.md.",
        "Would create .harness/manifest.json.",
        rootGuidanceExists
          ? "Would preserve existing AGENTS.md."
          : "Would create AGENTS.md project entry point.",
      ]
    : [
        `Initialized Beez Agent Harness ${version} with the ${preset} preset.`,
        `Detected package manager: ${presetData.packageManager}.`,
      ];

  if (dryRun) {
    return {
      dryRun: true,
      messages,
    };
  }

  if (!projectExists) {
    await writeJsonAtomic(projectFile, presetData.project);
  }
  await writeTextAtomic(path.join(cwd, GENERATED_GUIDANCE_PATH), generatedContent);
  await writeJsonAtomic(
    manifestFile,
    createManifest({ version, preset, generatedContent }),
  );

  if (projectExists) {
    messages.push("Existing .harness/project.json was preserved.");
  }

  if (rootGuidanceExists) {
    messages.push(
      "Existing AGENTS.md was preserved. Ensure it tells agents to read .harness/generated/AGENTS.md.",
    );
  } else {
    await writeTextAtomic(rootGuidanceFile, rootTemplate);
    messages.push("Created AGENTS.md project entry point.");
  }

  return { dryRun: false, messages };
}

export async function updateProject({
  cwd,
  packageRoot,
  check = false,
  diff = false,
}) {
  const manifestFile = path.join(cwd, MANIFEST_PATH);
  const manifest = await readJson(manifestFile, "harness manifest");
  validateManifest(manifest);

  const version = await readHarnessVersion(packageRoot);
  const generatedContent = await renderGeneratedGuidance({
    cwd,
    packageRoot,
    preset: manifest.preset,
  });
  const generatedFile = path.join(cwd, GENERATED_GUIDANCE_PATH);
  await rejectSymlinkedPath(cwd, generatedFile, "Managed file");
  await rejectSymlinkedPath(cwd, manifestFile, "Harness manifest");
  const actualContent = (await exists(generatedFile))
    ? await readFile(generatedFile, "utf8")
    : "";
  const expectedHash = digest(generatedContent);
  const storedHash = manifest.managedFiles[GENERATED_GUIDANCE_PATH];
  const changed =
    manifest.harnessVersion !== version ||
    actualContent !== generatedContent ||
    storedHash !== expectedHash;

  if (check || diff) {
    return {
      changed,
      message: changed
        ? `Harness update or managed-file drift detected (installed ${manifest.harnessVersion}, available ${version}).`
        : `Harness ${version} is current and managed files are clean.`,
      diff: diff
        ? renderFileDiff(
            GENERATED_GUIDANCE_PATH,
            actualContent,
            generatedContent,
          )
        : "",
    };
  }

  if (!changed) {
    return { changed: false, message: `Harness ${version} is already current.` };
  }

  await writeTextAtomic(generatedFile, generatedContent);
  await writeJsonAtomic(
    manifestFile,
    createManifest({
      version,
      preset: manifest.preset,
      generatedContent,
      previous: manifest,
    }),
  );

  return {
    changed: true,
    message: `Updated managed files to Beez Agent Harness ${version}; project.json was preserved.`,
  };
}

export async function doctorProject({ cwd, packageRoot }) {
  const errors = [];
  const warnings = [];
  const availableVersion = await readHarnessVersion(packageRoot);
  let manifest;

  try {
    manifest = await readJson(
      path.join(cwd, MANIFEST_PATH),
      "harness manifest",
    );
    validateManifest(manifest);
  } catch (error) {
    errors.push(error.message);
    manifest = undefined;
  }

  try {
    await readProjectConfig(cwd);
  } catch (error) {
    errors.push(error.message);
  }

  if (manifest) {
    const managedContents = new Map();
    for (const [relativePath, expectedHash] of Object.entries(
      manifest.managedFiles,
    )) {
      const managedFile = resolveManagedFile(cwd, relativePath);
      try {
        await rejectSymlinkedPath(cwd, managedFile, "Managed file");
      } catch (error) {
        errors.push(error.message);
        continue;
      }
      if (!(await exists(managedFile))) {
        errors.push(`Managed file is missing: ${relativePath}`);
        continue;
      }
      const actualContent = await readFile(managedFile, "utf8");
      managedContents.set(relativePath, actualContent);
      const actualHash = digest(actualContent);
      if (actualHash !== expectedHash) {
        errors.push(`Managed file has drifted: ${relativePath}`);
      }
    }

    if (manifest.harnessVersion !== availableVersion) {
      warnings.push(
        `Project uses harness ${manifest.harnessVersion}; CLI provides ${availableVersion}`,
      );
    } else {
      try {
        const generatedContent = await renderGeneratedGuidance({
          cwd,
          packageRoot,
          preset: manifest.preset,
        });
        const actualContent = managedContents.get(GENERATED_GUIDANCE_PATH);
        const storedHash = manifest.managedFiles[GENERATED_GUIDANCE_PATH];
        if (
          actualContent !== undefined &&
          digest(actualContent) === storedHash &&
          actualContent !== generatedContent
        ) {
          errors.push(
            `Managed file differs from generated guidance: ${GENERATED_GUIDANCE_PATH}`,
          );
        }
      } catch (error) {
        errors.push(`Cannot render expected generated guidance: ${error.message}`);
      }
    }
  }

  const rootGuidanceFile = path.join(cwd, ROOT_GUIDANCE_PATH);
  if (!(await exists(rootGuidanceFile))) {
    warnings.push("AGENTS.md is missing");
  } else {
    const rootGuidance = await readFile(rootGuidanceFile, "utf8");
    if (!rootGuidance.includes(GENERATED_GUIDANCE_PATH)) {
      warnings.push(
        "AGENTS.md does not reference .harness/generated/AGENTS.md",
      );
    }
  }

  return {
    schemaVersion: 1,
    ok: errors.length === 0,
    harness: {
      installedVersion: manifest?.harnessVersion ?? null,
      availableVersion,
      preset: manifest?.preset ?? null,
    },
    errors,
    warnings,
  };
}
