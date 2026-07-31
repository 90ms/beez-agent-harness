# Beez Agent Harness

[한국어](README.md) | [English](README.en.md)

Beez Agent Harness is a **Codex-first collection of reusable Agent Skills and a
thin project adapter** for consistent software delivery.

It routes work through specification, planning, incremental implementation,
verification, and review while keeping project-specific commands, boundaries,
and local run evidence inside each repository.

## Documentation guide

- [Quick start](#quick-start): Install the plugin and initialize a project
- [Core concepts](#core-concepts): Understand Skills and the project adapter
- [Installation](#installation): Install the full plugin or selected Skills
- [Using it in a project](#using-it-in-a-project): Choose a preset and configure
  the project
- [Runs and verification](#runs-and-verification): Record task state and
  verification evidence
- [Updates and diagnostics](#updates-and-diagnostics): Update safely and inspect
  project health
- [Development and contribution](#development-and-contribution): Repository
  commands and related documentation

## Quick start

### 1. Install the Codex plugin

```bash
codex plugin marketplace add 90ms/beez-agent-harness
```

Restart Codex after the first installation. All six Skills become available.

### 2. Initialize a project

Run these commands from the root of the project you want to configure.

```bash
npx beez-agent-harness init --preset base
npx beez-agent-harness doctor
```

For a Next.js project, use the `nextjs` preset.

```bash
npx beez-agent-harness init --preset nextjs
```

### 3. Configure project commands and boundaries

After initialization, edit `.harness/project.json` for the project.

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build"
  },
  "verification": {
    "required": ["test", "lint", "build"],
    "timeoutMs": 600000
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

Agents use the commands and boundaries declared here when working in the
project. Commands under `verification.required` must pass before a run can
complete.

### 4. Record a run and its verification

```bash
npx beez-agent-harness run start
npx beez-agent-harness verify --required
npx beez-agent-harness run finish
```

Command output stays in the current terminal. Run state records only the
command name and digest, exit status, and duration. It does not persist raw
output or environment values.

## Core concepts

Beez Agent Harness is not an autonomous agent runtime or a framework-specific
project generator. It adds Skills, project rules, and local run evidence to an
existing repository.

### Agent Skills

| Skill | Purpose |
| --- | --- |
| `using-beez-harness` | Select the smallest lifecycle appropriate for the task and its risk |
| `beez-spec` | Turn requests into bounded, testable specifications |
| `beez-plan` | Break specifications into ordered, verifiable tasks |
| `beez-implement` | Implement behavior in small slices and collect evidence |
| `beez-verify` | Verify completion through fresh tests and checks |
| `beez-review` | Review correctness, regressions, security, data safety, and test gaps |

Only the stages needed for a given task are used.

| Request | Default lifecycle |
| --- | --- |
| Explanation or status | Inspect → answer |
| Small change | Implement → verify |
| Feature or behavior change | Specify → plan → implement → verify → review |
| Bug fix | Reproduce → fix → regression verification → review |
| High-risk change | Full lifecycle + explicit evidence and rollback guidance |

### Project adapter

The dependency-free Node.js CLI installs this structure into a new or existing
repository:

```text
.harness/
├── manifest.json
├── project.json
├── generated/
│   └── AGENTS.md
└── runs/
    └── <run-id>/
        ├── manifest.json
        └── events.jsonl
```

| File | Ownership and purpose |
| --- | --- |
| `.harness/manifest.json` | Records the Harness version and managed-file hashes |
| `.harness/project.json` | Project-owned commands, required verification, and boundaries |
| `.harness/generated/AGENTS.md` | Harness-managed guidance that can be refreshed safely |
| `.harness/runs/**` | CLI-generated run evidence that package updates never modify |
| `AGENTS.md` | Project entry point that directs agents to the generated guidance |

An existing root `AGENTS.md` is never overwritten. If it already exists, add an
instruction that tells agents to read `.harness/generated/AGENTS.md`.

## Installation

### Complete Codex plugin

```bash
codex plugin marketplace add 90ms/beez-agent-harness
```

This installs all six Skills.

### Selected Skills

List the available Skills:

```bash
npx skills add 90ms/beez-agent-harness --list
```

Install only the Skills needed in the current project:

```bash
npx skills add 90ms/beez-agent-harness \
  --skill using-beez-harness \
  --skill beez-implement \
  --skill beez-verify \
  --agent codex
```

Add `--global` to make them available across projects.

## Using it in a project

### Choose a preset

Two presets are currently included.

| Preset | Purpose |
| --- | --- |
| `base` | Language- and framework-independent defaults |
| `nextjs` | Package manager detection, Next.js commands, and frontend verification guidance |

```bash
npx beez-agent-harness init --preset base
```

For local development of this repository, run the CLI file directly:

```bash
node /path/to/beez-agent-harness/bin/beez-harness.js init --preset nextjs
```

### Initialization behavior

`init` follows these rules:

- Preserve an existing `.harness/project.json`.
- Never overwrite an existing root `AGENTS.md`.
- Record generated files and the applied Harness version in `manifest.json`.
- Detect the package manager from lock files when using the Next.js preset.

Preview initialization before writing:

```bash
npx beez-agent-harness init --preset nextjs --dry-run
```

## Runs and verification

A run starts as `active` and ends as `completed`, `failed`, or `cancelled`.

```bash
npx beez-agent-harness run start
npx beez-agent-harness run status
npx beez-agent-harness verify --command test
npx beez-agent-harness verify --required
npx beez-agent-harness run finish
```

Completion is blocked when required verification is missing or failed, or when
`project.json` changed after the run started. Inspect an interrupted run with
`run resume`, and prune old terminal history explicitly:

```bash
npx beez-agent-harness run resume
npx beez-agent-harness run gc --keep 20
```

## Updates and diagnostics

There are two independent update layers: the installed plugin or Skills, and
the adapter inside each project.

### 1. Update the installed plugin or Skills

```bash
codex plugin marketplace upgrade
# or
npx skills update
```

### 2. Update the project adapter

```bash
npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update --diff
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor
npx beez-agent-harness@latest doctor --json
```

- `update --check` exits non-zero when it detects a newer version or managed-file
  drift.
- `update --diff` previews managed-file changes without writing.
- `update` refreshes only Harness-managed files.
- `.harness/project.json` and an existing root `AGENTS.md` are never overwritten
  during an update.
- `doctor` checks configuration, missing files, and managed-file drift.
- `doctor --json` emits the same health result as machine-readable JSON.

## Development and contribution

Node.js 20 or newer is required.

```bash
npm run check
npm run validate
npm test
npm run evaluate
npm pack --dry-run
```

This repository applies its own project adapter.

Related documentation:

- [Project configuration guide](docs/en/configuration.md)
- [CLI reference](docs/en/cli-reference.md)
- [Architecture](docs/en/architecture.md)
- [Behavior evaluation](evals/README.en.md)
- [Troubleshooting](docs/en/troubleshooting.md)
- [Release guide](docs/en/releasing.md)
- [Project specification](SPEC.md)
- [Contribution guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE)
