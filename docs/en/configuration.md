# Project configuration guide

[한국어](../ko/configuration.md) | [English](configuration.md)

Beez Agent Harness stores repository-specific commands, verification profiles,
and boundaries in `.harness/project.json`. The project owns this file; neither
`init` nor `update` overwrites it.

## Complete structure

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build",
    "audit": "npm audit"
  },
  "verification": {
    "required": ["test", "lint"],
    "profiles": {
      "default": ["test", "lint"],
      "migration": ["test", "lint", "build"],
      "security": ["test", "lint", "audit"],
      "release": ["test", "lint", "build"],
      "performance": ["test", "build"]
    },
    "timeoutMs": 600000
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

## Fields

### `schemaVersion`

The project configuration format. The only supported value is `1`.

### `commands`

An object mapping stable names to real project command strings. The CLI runs a
command only after the operator selects it through `verify`. Declare only
commands confirmed by repository configuration or documentation; the Harness
does not discover or infer them.

Command names may then be referenced by `required` and any profile. A command
may have normal local side effects, so review install, migration, audit, or
benchmark commands before registering them.

### `verification`

This object is optional for backward compatibility. Without it, no command is
implicitly required.

- `required`: ordered command names used when a run starts without `--profile`.
- `profiles`: optional named ordered command lists. At most 32 profiles are
  accepted. Names use lowercase letters, numbers, and single hyphen-separated
  segments, with a maximum length of 64.
- `timeoutMs`: per-command timeout from 1,000 through 3,600,000 milliseconds;
  defaults to 300,000.

All referenced commands must exist in `commands`. Duplicate command names,
duplicate profiles, unknown commands, malformed names, and extra fields are
rejected.

At `run start`, the selected list is copied into the run. Later edits to
`project.json` change its digest and block successful completion of that run;
finish it as failed/cancelled and start a new one.

```bash
npx beez-agent-harness run start --profile security
npx beez-agent-harness verify --profile security
```

`verify --required` runs the run's snapshotted required list, not an untracked
new command list. Output remains in the terminal and is not copied to evidence.

### `boundaries`

An array of short, actionable repository rules that agents must follow. Keep
authority and safety boundaries explicit.

Good examples:

- `Do not expose server secrets through NEXT_PUBLIC_ variables.`
- `Do not modify generated database migrations.`
- `Do not publish packages or deploy without explicit authority.`
- `Preserve unrelated user changes.`

Avoid ambiguous or conflicting rules and paths or commands that cannot be
confirmed in the repository.

## Presets

### `base`

Language-independent boundaries plus empty `default`, `migration`, `security`,
`release`, and `performance` profiles. Add real project commands before relying
on those profiles.

```bash
npx beez-agent-harness init --preset base
```

### `nextjs`

Provides `install`, `test`, `lint`, and `build` commands plus the same named
profiles populated with test, lint, and build. Package-manager detection uses:

1. `pnpm-lock.yaml`
2. `yarn.lock`
3. `bun.lock` or `bun.lockb`
4. `npm` fallback

```bash
npx beez-agent-harness init --preset nextjs
```

Adjust commands when the project does not define every generated package
script. `doctor` correctly rejects profile references to removed commands.

## File ownership

| File | Owner | Edit directly |
| --- | --- | --- |
| `.harness/project.json` | Project | Yes |
| `.harness/manifest.json` | Harness | No |
| `.harness/generated/AGENTS.md` | Harness | No |
| `.harness/runs/**` | Operational state | Use the CLI |
| Root `AGENTS.md` | Project/shared | Yes |

Put repository-specific prose in `boundaries` or root `AGENTS.md`. Direct edits
to generated guidance are reported as drift.

## Validate configuration

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

`doctor` checks field types and extra fields, profile and required references,
timeouts, managed paths and hashes, generated guidance, root integration, and
the applied Harness version. JSON mode reports the same health decision.
