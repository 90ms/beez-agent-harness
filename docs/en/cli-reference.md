# CLI reference

[한국어](../ko/cli-reference.md) | [English](cli-reference.md)

## Usage

```text
beez-harness init [--preset base|nextjs] [--dry-run]
beez-harness doctor [--json]
beez-harness update [--check] [--diff]
beez-harness run start|status|list|resume|finish|gc
beez-harness verify --command <name>|--required
beez-harness version
beez-harness help [command]
```

The same commands work after `npx beez-agent-harness`. Unsupported options and
positional arguments are errors.

## `init`

Install the project adapter in the current directory.

```bash
npx beez-agent-harness init
npx beez-agent-harness init --preset nextjs
npx beez-agent-harness init --preset=nextjs
npx beez-agent-harness init --preset nextjs --dry-run
```

Options:

- `--preset <name>`: `base` or `nextjs`; defaults to `base`.
- `--dry-run`: Report files that would be created or preserved without writing.
- `-h`, `--help`: Print command help.

If `.harness/manifest.json` already exists, the command exits with code `1`
without changing state.

## `doctor`

Inspect project configuration and managed files without writing.

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

Checks cover the manifest and project configuration, SHA-256 values, missing or
drifted files, generated guidance, root `AGENTS.md`, and version differences.
The exit code is `0` when healthy and `1` for errors. `--json` returns the same
decision with `schemaVersion`, `ok`, harness version, errors, and warnings.

## `update`

Refresh only Harness-managed files using the manifest preset.

```bash
npx beez-agent-harness update
npx beez-agent-harness update --check
npx beez-agent-harness update --diff
npx beez-agent-harness update --check --diff
```

- `--check`: Do not write; exit `1` when an update or drift is present.
- `--diff`: Do not write; print the current and proposed managed-file content.

The command never overwrites `.harness/project.json` or an existing root
`AGENTS.md`.

## `run`

Record local task state and verification summaries under
`.harness/runs/<run-id>/`.

```bash
npx beez-agent-harness run start
npx beez-agent-harness run status
npx beez-agent-harness run status --run <id>
npx beez-agent-harness run list
npx beez-agent-harness run resume
npx beez-agent-harness run finish
npx beez-agent-harness run finish --state failed
npx beez-agent-harness run gc --keep 20
```

- `start`: Start a run when no other run is active.
- `status`: Show the active run or a run selected with `--run`.
- `list`: Show all runs newest first.
- `resume`: Select an active run again and append a `run.resumed` event.
- `finish`: End as `completed` by default, or as `failed` or `cancelled`.
- `gc`: Keep the newest N terminal runs and delete older terminal history.
  Active runs are never deleted.

Terminal runs are immutable. Completion is rejected when required verification
is missing or failed, or when project configuration changed after start.

## `verify`

Explicitly execute a command registered in `project.json`.

```bash
npx beez-agent-harness verify --command test
npx beez-agent-harness verify --required
npx beez-agent-harness verify --required --run <id>
```

- `--command <name>`: Run one configured command.
- `--required`: Run every command in `verification.required` in order.
- `--run <id>`: Select a specific active run instead of the default.

Output is streamed to the terminal but not persisted in run files. Evidence
contains only the command name and digest, status, timing, exit code, and
signal. The CLI exits `1` when any selected command does not pass.

## `version` and `help`

```bash
npx beez-agent-harness version
npx beez-agent-harness --version
npx beez-agent-harness help
npx beez-agent-harness help verify
npx beez-agent-harness run --help
```
