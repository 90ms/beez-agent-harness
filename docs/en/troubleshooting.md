# Troubleshooting

[한국어](../ko/troubleshooting.md) | [English](troubleshooting.md)

Start from the target repository root and inspect health:

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

## Natural-language requests do not select a Beez Skill

The adapter and Skills are separate installation layers. `.harness/` provides
project context but does not install Skills into the agent environment.

1. Confirm the plugin or selected Skills are installed and restart the agent
   host after first installation.
2. Confirm the root `AGENTS.md` directs the agent to read
   `.harness/generated/AGENTS.md` and `.harness/project.json`.
3. Try an explicit invocation such as `$using-beez-harness` or `$beez-debug` to
   distinguish discovery from routing behavior.

Different hosts may discover `SKILL.md` differently. The workflows remain
usable standalone, but automatic routing depends on the host exposing their
descriptions to the agent.

## Harness is already initialized

```text
Harness is already initialized; use `beez-harness update`
```

Use the update flow rather than deleting or editing the manifest:

```bash
npx beez-agent-harness update --check
npx beez-agent-harness update --diff
npx beez-agent-harness update
```

The CLI does not migrate an initialized project to another preset. Update the
project-owned commands and boundaries explicitly when requirements change.

## Manifest or project configuration cannot be read

```text
Cannot read harness manifest
Invalid JSON in project configuration
```

Restore a damaged `.harness/manifest.json` from version control or a known
package update. Correct JSON syntax and field types in project-owned
`.harness/project.json`, then rerun `doctor`. Do not delete unknown fields until
you confirm the installed CLI version supports the intended contract.

## Managed guidance is missing or drifted

```text
Managed file is missing: .harness/generated/AGENTS.md
Managed file has drifted: .harness/generated/AGENTS.md
Managed file differs from generated guidance: .harness/generated/AGENTS.md
```

Move project-specific prose from the generated file to `.harness/project.json`
or root `AGENTS.md`, then regenerate:

```bash
npx beez-agent-harness update
npx beez-agent-harness doctor
```

## Root `AGENTS.md` warning

```text
warning: AGENTS.md is missing
warning: AGENTS.md does not reference .harness/generated/AGENTS.md
```

Add this project-owned direction:

```markdown
Before starting software work, read `.harness/generated/AGENTS.md` and
`.harness/project.json`.
```

A warning alone does not make `doctor` exit non-zero.

## Applied Harness version differs

```text
warning: Project uses harness X; CLI provides Y
```

Preview and apply the adapter update with the intended CLI version:

```bash
npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update --diff
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor
```

This preserves project configuration and existing root guidance.

## Unknown or mismatched verification profile

```text
Unknown verification profile: security
Run ... selected verification profile release, not security.
```

Declare the profile and every referenced command in `.harness/project.json`
before starting the run. A run snapshots one profile; use that same name with
`verify --profile`, or finish the run and start another with the intended
profile. Use `verify --command <name>` only for an additional registered check;
it does not replace a missing selected-profile result.

## Run cannot complete or configuration changed

```text
Run cannot complete; required verification has not passed
Project configuration changed after the run started
```

Inspect the run and execute its selected gate:

```bash
npx beez-agent-harness run status
npx beez-agent-harness verify --required
# or: npx beez-agent-harness verify --profile <selected-profile>
npx beez-agent-harness run finish
```

When `project.json` changed after start, old evidence is intentionally stale.
Finish the run as `failed` or `cancelled`, then start a new run.

## An active run remains after interruption

Interruption does not silently claim failure or success:

```bash
npx beez-agent-harness run resume
npx beez-agent-harness run status
npx beez-agent-harness run finish --state cancelled
```

Only one run may be active. `run gc` never removes it. Review `run list` before
using `gc`, because pruned terminal evidence is not recoverable through the CLI.

## Checkpoint artifact is rejected

Artifacts must resolve inside the project, be a regular non-symlink file, be at
most 10 MiB, and have a path no longer than 256 characters. Record a smaller
summary file rather than a raw log, secret, directory, absolute path, or file
outside the repository. Only path and digest are evidence; content remains in
the project.

## `dependency-review` says the repository is unsupported

Enable Dependency graph (or Dependabot alerts, which provisions the graph where
GitHub supports it) in repository security settings, then rerun the failed job.
The workflow cannot enable this administrative setting. Forks and new
repositories need their own setting.

## Release ancestry check fails

```text
Release commit ... must be reachable from origin/main
```

Fetch `origin/main` and confirm the exact tag/commit is merged into the default
branch. Do not bypass the check with a side-branch tag. Merge the reviewed
release commit first, then create a new authorized tag.

## `update --check` fails in CI

This command intentionally exits `1` for an available version update or managed
drift. Run `update --diff`, apply `update` locally, review the generated change,
and commit it.

## Unsupported option

```text
Unknown option or argument for doctor: --unknown
```

Use command-specific help:

```bash
npx beez-agent-harness help doctor
npx beez-agent-harness help run
npx beez-agent-harness verify --help
```
