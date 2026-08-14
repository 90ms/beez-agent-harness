# CLI reference

[한국어](../ko/cli-reference.md) | [English](cli-reference.md)

The dependency-free CLI requires Node.js 20 or newer. Commands below work as
`beez-harness ...` after installation or `npx beez-agent-harness ...`.
Unsupported options and positional arguments are errors.

## Command summary

```text
beez-harness init [--preset base|nextjs] [--dry-run]
beez-harness doctor [--json]
beez-harness update [--check] [--diff]
beez-harness run start [workflow options] [--profile <name>]
beez-harness run status [--run <id>]
beez-harness run list
beez-harness run resume [--run <id>]
beez-harness run checkpoint [--run <id>] --phase <name> --state started|completed|blocked [--artifact <path>]
beez-harness run finish [--run <id>] [--state completed|failed|cancelled]
beez-harness run gc [--keep <count>]
beez-harness verify --command <name> [--run <id>]
beez-harness verify --required [--run <id>]
beez-harness verify --profile <name> [--run <id>]
beez-harness version
beez-harness help [command]
```

## `init`

Install the adapter in the current directory.

```bash
npx beez-agent-harness init
npx beez-agent-harness init --preset nextjs
npx beez-agent-harness init --preset=nextjs --dry-run
```

- `--preset <name>`: `base` or `nextjs`; default `base`.
- `--dry-run`: report creates and preserves without writing.
- `-h`, `--help`: print command help.

If `.harness/manifest.json` already exists, `init` exits `1` without changing
state. It preserves an existing root `AGENTS.md`.

## `doctor`

Read-only validation of configuration and managed files.

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

Checks cover schemas and references, managed path confinement and SHA-256,
missing or drifted guidance, root integration, and version alignment. Exit code
is `0` when healthy and `1` for errors. Warnings do not make the health result
fail. `--json` emits the same decision with schema version, versions, errors,
and warnings.

## `update`

Refresh Harness-managed files using the manifest preset.

```bash
npx beez-agent-harness update
npx beez-agent-harness update --check
npx beez-agent-harness update --diff
npx beez-agent-harness update --check --diff
```

- `--check`: do not write; exit `1` when an update or drift exists.
- `--diff`: do not write; show current and proposed managed content.

`update` never overwrites `.harness/project.json`, an existing root
`AGENTS.md`, source code, or `.harness/runs/`.

## `run start`

Start one active run and snapshot repository/configuration identity plus the
selected verification list.

```bash
npx beez-agent-harness run start
npx beez-agent-harness run start --profile migration
npx beez-agent-harness run start \
  --domain migration \
  --domain security \
  --mode change \
  --risk high \
  --side-effects local \
  --profile migration
```

Workflow fields are optional as a group. If any is supplied, all four kinds
must be supplied:

- `--domain <name>`: repeatable unique domain; `general`, `debug`, `migration`,
  `security`, `release`, `performance`, or `github`.
- `--mode <name>`: `explain`, `inspect`, `diagnose`, `plan`, `change`, `verify`,
  `review`, or `execute`.
- `--risk <name>`: `low`, `medium`, `high`, or `critical`.
- `--side-effects <name>`: `none`, `local`, `repository`, or
  `external-production`.
- `--profile <name>`: select an existing `verification.profiles` entry.

Without `--profile`, the run snapshots `verification.required`. Only one run
may be active at a time.

## `run status`, `list`, and `resume`

```bash
npx beez-agent-harness run status
npx beez-agent-harness run status --run <uuid>
npx beez-agent-harness run list
npx beez-agent-harness run resume
npx beez-agent-harness run resume --run <uuid>
```

`status` prints state, timestamps, route, selected profile, required commands,
results, and checkpoint count. `list` sorts all runs newest first. `resume`
requires an active run and appends `run.resumed`; it does not reopen a terminal
run.

## `run checkpoint`

Record a bounded lifecycle phase without storing raw artifact content.

```bash
npx beez-agent-harness run checkpoint \
  --phase compatibility \
  --state completed

npx beez-agent-harness run checkpoint \
  --phase benchmark.after \
  --state completed \
  --artifact reports/benchmark.json
```

- `--phase <name>`: 1-64 characters; lowercase alphanumeric segments separated
  by `.`, `_`, or `-`.
- `--state <name>`: `started`, `completed`, or `blocked`.
- `--artifact <path>`: optional project-relative regular file, at most 10 MiB.
- `--run <id>`: select an active run instead of the default active run.

Absolute paths, traversal, symlinks, directories, missing files, and oversized
artifacts are rejected. Evidence stores only a path up to 256 characters and a
SHA-256 digest. A run is limited to 100 checkpoints and 500 total events.

## `run finish` and `gc`

```bash
npx beez-agent-harness run finish
npx beez-agent-harness run finish --state failed
npx beez-agent-harness run finish --state cancelled --run <uuid>
npx beez-agent-harness run gc --keep 20
```

`finish` defaults to `completed`. Completion is rejected when selected
verification is missing/failed or `project.json` changed since start. `failed`
and `cancelled` do not claim successful verification. Terminal runs are
immutable.

`gc` keeps the newest N terminal runs (default 20) and permanently removes
older terminal evidence. Active runs are never deleted. Review `run list`
before lowering retention.

## `verify`

Execute configured commands against one active run.

```bash
npx beez-agent-harness verify --command test
npx beez-agent-harness verify --required
npx beez-agent-harness verify --profile security
npx beez-agent-harness verify --required --run <uuid>
```

Choose exactly one selector:

- `--command <name>`: one command from `commands`;
- `--required`: the run's snapshotted required list; or
- `--profile <name>`: the run's snapshotted list, only when the same profile was
  selected at `run start`.

Commands run in order with the configured per-command timeout. Output streams
to the current terminal. Run evidence stores name, command digest, outcome,
timing, exit code, and signal only. Every selected command is attempted; the CLI
exits `1` when any result fails, times out, or is interrupted.

## `version` and `help`

```bash
npx beez-agent-harness version
npx beez-agent-harness --version
npx beez-agent-harness help
npx beez-agent-harness help run
npx beez-agent-harness run --help
```
