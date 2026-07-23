# Beez Agent Harness

Beez Agent Harness is a Codex-first collection of reusable Agent Skills and a
thin project adapter for consistent software delivery.

It routes work through specification, planning, incremental implementation,
verification, and review while keeping project-specific commands and boundaries
inside each repository.

## What is included

### Skills

| Skill | Purpose |
| --- | --- |
| `using-beez-harness` | Route work through the smallest appropriate lifecycle |
| `beez-spec` | Turn requests into bounded, testable specifications |
| `beez-plan` | Break specifications into ordered, verifiable tasks |
| `beez-implement` | Implement behavior in small verified slices |
| `beez-verify` | Prove completion with fresh evidence |
| `beez-review` | Review correctness, regression, security, and test risk |

### Project adapter

The zero-dependency Node.js CLI installs a thin adapter into a new or existing
repository:

```text
.harness/
├── manifest.json
├── project.json
└── generated/
    └── AGENTS.md
```

- `manifest.json` records the harness version and managed-file hashes.
- `project.json` belongs to the project and is never changed by updates.
- `generated/AGENTS.md` belongs to the harness and can be refreshed safely.

The `base` and `nextjs` presets are included.

## Install

### Complete Codex plugin

```bash
codex plugin marketplace add 90ms/beez-agent-harness
```

Restart Codex after the first installation. All six skills become available.

### Selected skills

List the available skills:

```bash
npx skills add 90ms/beez-agent-harness --list
```

Install selected skills into the current project:

```bash
npx skills add 90ms/beez-agent-harness \
  --skill using-beez-harness \
  --skill beez-implement \
  --skill beez-verify \
  --agent codex
```

Add `--global` to make them available across projects.

## Initialize a project

```bash
npx beez-agent-harness init --preset base
npx beez-agent-harness doctor
```

For local development:

```bash
node /path/to/beez-agent-harness/bin/beez-harness.js init --preset nextjs
```

If the project already has an `AGENTS.md`, it is preserved. Ensure it tells
agents to read `.harness/generated/AGENTS.md`.

Edit `.harness/project.json` to record the real commands and boundaries:

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build"
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

## Update

There are two independent update layers.

Update the installed skill or plugin source:

```bash
codex plugin marketplace upgrade
# or
npx skills update
```

Then update an individual project's generated adapter:

```bash
npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor
```

`update --check` exits non-zero when a newer harness or managed-file drift is
detected. `update` never overwrites `.harness/project.json` or an existing root
`AGENTS.md`.

## Development

Requires Node.js 20 or newer.

```bash
npm run check
npm run validate
npm test
npm pack --dry-run
```

The repository applies its own project adapter. See [SPEC.md](SPEC.md) for the
v0.1 contract.

## License

MIT
