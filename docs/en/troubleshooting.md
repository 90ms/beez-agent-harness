# Troubleshooting

[한국어](../ko/troubleshooting.md) | [English](troubleshooting.md)

Start by checking the state from the project root.

```bash
npx beez-agent-harness doctor
```

## Harness is already initialized

```text
Harness is already initialized; use `beez-harness update`
```

`.harness/manifest.json` already exists. Use the update flow instead of running
`init` again.

```bash
npx beez-agent-harness update --check
npx beez-agent-harness update
```

Do not edit the manifest to change presets. The v0.1 CLI does not provide a
preset migration command after initialization.

## Cannot read the manifest or project configuration

```text
Cannot read harness manifest
Invalid JSON in project configuration
```

Check these files:

- `.harness/manifest.json`: Harness-managed.
- `.harness/project.json`: Project-managed.

Correct the JSON syntax and field types in `project.json`, then run `doctor`
again. Restoring a damaged manifest from version control is the safest recovery.

## Managed file is missing or has drifted

```text
Managed file is missing: .harness/generated/AGENTS.md
Managed file has drifted: .harness/generated/AGENTS.md
Managed file differs from generated guidance: .harness/generated/AGENTS.md
```

If project-specific rules were added directly to the generated file, move them
to `.harness/project.json` or the root `AGENTS.md` first. Then restore the
managed file.

```bash
npx beez-agent-harness update
npx beez-agent-harness doctor
```

## Root `AGENTS.md` warning

```text
warning: AGENTS.md is missing
warning: AGENTS.md does not reference .harness/generated/AGENTS.md
```

Add this direction to the existing `AGENTS.md`:

```markdown
Before starting software work, read `.harness/generated/AGENTS.md` and
`.harness/project.json`.
```

When this is the only warning, `doctor` exits with code `0`.

## Harness version differs

```text
warning: Project uses harness X; CLI provides Y
```

Check the update and then refresh the project adapter.

```bash
npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor
```

The update preserves `project.json` and an existing root `AGENTS.md`.

## `update --check` fails in CI

`update --check` intentionally exits with code `1` when it detects an update or
drift. Inspect the log, run `update` locally, and review the generated changes
before committing them.

## Unsupported option

```text
Unknown option or argument for doctor: --unknown
```

Check command-specific help for supported options.

```bash
npx beez-agent-harness help doctor
npx beez-agent-harness init --help
```

