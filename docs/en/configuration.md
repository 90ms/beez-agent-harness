# Project configuration guide

[한국어](../ko/configuration.md) | [English](configuration.md)

Beez Agent Harness stores repository-specific commands and boundaries in
`.harness/project.json`. The project owns this file, and neither `init` nor
`update` overwrites it.

## Basic structure

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

### `schemaVersion`

The version of the configuration format. The only currently supported value is
`1`.

### `commands`

Declare real project verification commands as strings. The Harness runs one
only when the operator invokes `verify` and selects it. Do not invent
unsupported commands; record only commands confirmed in files such as
`package.json` or existing development documentation.

```json
{
  "commands": {
    "install": "pnpm install",
    "test": "pnpm test",
    "lint": "pnpm lint",
    "build": "pnpm build"
  }
}
```

### `verification`

This field is optional. Existing v0.2 configuration without it remains valid
and has no implicitly required commands.

- `required`: Names from `commands` that must pass before a run can become
  `completed`. Duplicates and unknown names are rejected.
- `timeoutMs`: Per-command timeout from 1,000 through 3,600,000 milliseconds.
  The default is 300,000 when omitted.

```json
{
  "verification": {
    "required": ["test", "lint"],
    "timeoutMs": 300000
  }
}
```

`verify --required` executes commands in array order. Run records do not
persist command text, environment values, or raw stdout/stderr.

### `boundaries`

Define the project rules agents must follow while making changes. Keep each
entry short and actionable.

Good examples:

- `Do not expose server secrets through NEXT_PUBLIC_ variables.`
- `Do not modify generated database migrations.`
- `Preserve unrelated user changes.`

Avoid:

- ambiguous rules;
- conflicting rules;
- commands or paths that cannot be confirmed in the repository.

## Presets

### `base`

Provides minimal language- and framework-independent boundaries. Add the
project's actual commands after initialization.

```bash
npx beez-agent-harness init --preset base
```

### `nextjs`

Provides Next.js boundaries and `install`, `test`, `lint`, and `build` commands.
The package manager is detected in this lock-file priority order, falling back
to `npm` when no matching file exists:

1. `pnpm-lock.yaml`
2. `yarn.lock`
3. `bun.lock` or `bun.lockb`
4. `npm`

```bash
npx beez-agent-harness init --preset nextjs
```

## File ownership

| File | Owner | Edit directly |
| --- | --- | --- |
| `.harness/project.json` | Project | Yes |
| `.harness/manifest.json` | Harness | No |
| `.harness/generated/AGENTS.md` | Harness | No |
| `.harness/runs/**` | Operational state | Manage through the CLI |
| Root `AGENTS.md` | Project | Yes |

Put project-specific policy in `.harness/project.json` or the root `AGENTS.md`.
Editing generated guidance directly causes `doctor` to report drift.

## Check the configuration

```bash
npx beez-agent-harness doctor
```

`doctor` checks required fields, command, verification, and boundary types,
verification references, managed paths and hashes, generated guidance, and the
Harness version.
