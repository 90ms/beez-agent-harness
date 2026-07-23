# Beez Agent Harness v0.1 Specification

## Purpose

Beez Agent Harness is a public, Codex-first development harness that packages
reusable Agent Skills and installs a thin, versioned project adapter into new or
existing repositories.

The harness reduces repeated setup while keeping project-specific commands and
boundaries inside each project.

## Goals

- Provide a reusable lifecycle: route, specify, plan, implement, verify, review.
- Install only thin project guidance instead of copying the full skill set.
- Support new and existing repositories with the same initialization command.
- Make generated files identifiable, reviewable, and safe to update.
- Remain portable to other agents that support the `SKILL.md` convention.
- Avoid runtime dependencies for the v0.1 CLI.

## Non-goals

- Creating a general-purpose autonomous agent runtime.
- Replacing framework-specific project generators.
- Silently updating project policy.
- Supporting every coding agent in v0.1.
- Installing MCP servers or external services.

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
- `.harness/project.json`: project-owned commands and boundaries.
- `.harness/generated/AGENTS.md`: generated guidance for the selected preset.
- `AGENTS.md`: a small root entry point when one does not already exist.

Existing root guidance is never overwritten. When `AGENTS.md` already exists,
the CLI reports the include text that the user may add.

### Presets

v0.1 includes:

- `base`: language-agnostic defaults.
- `nextjs`: Node.js/Next.js commands and frontend verification guidance.

### CLI

The zero-dependency Node.js CLI provides:

- `beez-harness init [--preset base|nextjs]`
- `beez-harness doctor`
- `beez-harness update [--check]`
- `beez-harness version`

`update --check` reports drift without writing. `update` refreshes only files
listed as managed in the manifest and preserves `project.json`.

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
- Shared: a root `AGENTS.md` created by the harness remains user-editable and is
  never overwritten after creation.

## Versioning

The project follows semantic versioning.

- Patch: wording or behavior fixes without changing the project contract.
- Minor: new skills, presets, or backward-compatible generated guidance.
- Major: incompatible manifest, CLI, or policy changes.

Projects pin the applied harness version in `.harness/manifest.json`. Updates are
explicit and reviewable.

## Acceptance criteria

- Plugin manifest passes the Codex plugin validator.
- Every skill passes the Agent Skill validator.
- CLI tests cover initialization, no-overwrite behavior, drift detection, and
  managed-file updates.
- `doctor` exits non-zero for missing or invalid managed state.
- README documents project and global installation paths.
- The repository contains an MIT license and public contribution guidance.
