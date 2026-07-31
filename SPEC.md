# Beez Agent Harness Specification

Current target contract: v0.3

## Problem

Beez Agent Harness installs concise, evidence-driven Agent Skills and a safe
project adapter, but the project adapter currently describes workflow
expectations without recording whether a task moved through those stages or
whether project verification actually passed.

The v0.3 contract adds a small local evidence layer without turning the package
into an autonomous agent runtime.

## Outcome

An initialized project can:

- inspect harness health in human-readable or machine-readable form;
- preview initialization and managed-file updates before writing;
- record a local run from start to a terminal state;
- execute only explicitly selected project verification commands;
- preserve verification status, duration, and repository identity as evidence;
- prevent a successful finish while required verification is missing or failed.

## Goals

- Provide a reusable lifecycle: route, specify, plan, implement, verify, review.
- Install only thin project guidance instead of copying the full skill set.
- Support new and existing repositories with the same initialization command.
- Make generated files identifiable, reviewable, and safe to update.
- Remain portable to other agents that support the `SKILL.md` convention.
- Keep the CLI runtime dependency-free.
- Make workflow completion claims inspectable without storing model transcripts.
- Keep all execution local and explicitly initiated by the operator.

## Non-goals

- Creating a general-purpose autonomous or multi-agent runtime.
- Calling model-provider APIs or routing between models.
- Replacing framework-specific project generators.
- Silently updating project policy.
- Providing containers, remote sandboxes, telemetry services, or a web UI.
- Automatically committing, pushing, publishing, or opening pull requests.
- Capturing raw command output in run state by default.

## Architecture

### Global plugin

The repository is a Codex plugin whose `skills/` directory contains reusable
workflows:

- `using-beez-harness`
- `beez-spec`
- `beez-plan`
- `beez-implement`
- `beez-verify`
- `beez-review`

### Project adapter

`beez-harness init` writes:

- `.harness/manifest.json`: applied harness version, preset, and managed files.
- `.harness/project.json`: project-owned commands, verification, and boundaries.
- `.harness/generated/AGENTS.md`: generated guidance for the selected preset.
- `AGENTS.md`: a small root entry point when one does not already exist.

Existing root guidance is never overwritten. When `AGENTS.md` already exists,
the CLI reports the include text that the user may add.

### Operational state

Run state is written under `.harness/runs/<run-id>/`. Operational state is
harness-generated but is not managed by `beez-harness update`; update continues
to manage only files declared in `.harness/manifest.json`.

Each run contains:

- `manifest.json`: state, repository identity, configuration digest, timestamps,
  and verification summaries;
- `events.jsonl`: append-only lifecycle events without raw model transcripts or
  raw command output.

Writes that replace structured state use a temporary file followed by an atomic
rename. A run has one of these states:

```text
active -> completed
       -> failed
       -> cancelled
```

Terminal runs are immutable. An interrupted process leaves the run active so it
can be inspected and resumed explicitly.

### Presets

v0.3 includes:

- `base`: language-agnostic defaults.
- `nextjs`: Node.js/Next.js commands and frontend verification guidance.

Projects may keep a v0.2 `project.json` without a `verification` block.
Verification settings are an optional, backward-compatible schema addition.

### CLI

The zero-dependency Node.js CLI provides:

- `beez-harness init [--preset base|nextjs] [--dry-run]`
- `beez-harness doctor [--json]`
- `beez-harness update [--check] [--diff]`
- `beez-harness run start|status|list|finish`
- `beez-harness verify --command <name>`
- `beez-harness verify --required`
- `beez-harness version`

`update --check` and preview flags never write. `update` refreshes only files
listed as managed in the manifest and preserves `project.json`.

## Configuration contract

`.harness/project.json` remains project-owned:

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test"
  },
  "verification": {
    "required": ["test"],
    "timeoutMs": 300000
  },
  "boundaries": [
    "Preserve unrelated user changes."
  ]
}
```

`verification` is optional. When omitted, no command is implicitly required.
Every referenced verification command must exist in `commands`. A command runs
only after the operator selects it by name or asks to run the configured
required set.

## Verification evidence

The CLI streams child-process output to the current terminal but does not copy
that output into the run manifest or event log. Evidence records only:

- project command name;
- a digest of the configured command, not the command text;
- start and finish timestamps;
- duration;
- exit status and termination signal;
- pass, fail, timeout, or interrupted outcome.

Environment values are not serialized. A completed transition is rejected when
any configured required command has no passing result for the run's current
configuration digest.

## Workflow contract

The meta-skill routes work by risk and intent:

- Small change: implement → verify.
- Feature: spec → plan → implement → verify → review.
- Bug: reproduce → localize → fix → regression test → review.
- High-risk change: spec → plan → implement → verify → review, with explicit
  evidence and rollback notes.

Each workflow must leave evidence. Claims such as "done", "fixed", or "safe"
require the relevant test, build, lint, runtime, or inspection result.

## Ownership rules

- Harness-owned: `.harness/manifest.json`, `.harness/generated/**`.
- Project-owned: `.harness/project.json`, existing `AGENTS.md`, source code.
- Operational: `.harness/runs/**`, created by run commands and never rewritten
  by harness package updates.
- Shared: a root `AGENTS.md` created by the harness remains user-editable and is
  never overwritten after creation.

## Compatibility and versioning

The project follows semantic versioning.

- Patch: wording or behavior fixes without changing the project contract.
- Minor: new skills, presets, commands, or backward-compatible schema fields.
- Major: incompatible manifest, CLI, ownership, or policy changes.

Projects pin the applied harness version in `.harness/manifest.json`. Updates are
explicit and reviewable. v0.3 accepts valid v0.2 manifests and project
configuration without requiring migration.

## Security boundaries

- Preview and check operations perform no project writes.
- Verification commands are never inferred from repository contents.
- Verification runs only project-owned commands selected by the operator.
- Run evidence excludes raw command output, environment variables, and model
  transcripts.
- Run identifiers and paths are validated before filesystem access.
- Managed update paths remain confined to `.harness/generated/`.
- The CLI does not perform network, Git mutation, or release operations.

## Acceptance criteria

- Plugin and every Agent Skill pass repository validation.
- Existing initialization, no-overwrite, drift, and managed update behavior
  remains covered by tests.
- Existing v0.2 project configuration passes `doctor`.
- `doctor --json` reports the same health result and exit status as text mode.
- `init --dry-run`, `update --check`, and `update --diff` perform no writes.
- Run state transitions are atomic, validated, and recoverable after
  interruption.
- Verification executes only configured commands and records bounded evidence.
- A run cannot become completed with missing or failed required verification.
- Node.js 20, 22, and 24 remain supported with no runtime dependencies.
- Korean and English documentation describe every public command and field.

## Verification

Every implementation slice runs:

```bash
npm test
npm run check
npm run validate
```

The release candidate additionally runs:

```bash
npm pack --dry-run
```

CI verifies the supported Node.js versions and Windows path/process behavior.

## Risks and rollback

- Command execution is the highest-risk addition. It stays opt-in, is limited to
  project-owned configuration, and stores no raw output.
- Persistent run state can become incomplete after process termination. Atomic
  manifest replacement and append-only events preserve inspectable state.
- Optional schema fields avoid forced migration. Removing the v0.3 run commands
  does not alter project source or managed guidance.
- Operational run directories can be archived or removed independently without
  affecting harness initialization or updates.
