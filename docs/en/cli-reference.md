# CLI reference

[한국어](../ko/cli-reference.md) | [English](cli-reference.md)

## Usage

```text
beez-harness init [--preset base|nextjs]
beez-harness doctor
beez-harness update [--check]
beez-harness version
beez-harness help [command]
```

The same commands and options work after `npx beez-agent-harness`. Unsupported
options and positional arguments are treated as errors.

## `init`

Install the project adapter in the current directory.

```bash
npx beez-agent-harness init
npx beez-agent-harness init --preset nextjs
npx beez-agent-harness init --preset=nextjs
```

Options:

- `--preset <name>`: `base` or `nextjs`. The default is `base`.
- `-h`, `--help`: Print command help.

If `.harness/manifest.json` already exists, the command exits with code `1`
without changing the existing state.

## `doctor`

Inspect the configuration and managed-file state without writing.

```bash
npx beez-agent-harness doctor
```

Checks include:

- manifest and project configuration shape;
- managed paths and SHA-256 hashes;
- missing or drifted managed files;
- generated guidance compared with the current templates;
- the root `AGENTS.md` connection;
- the applied Harness version compared with the current CLI.

The command exits with code `0` when there are no errors and `1` when it finds
one or more errors. A missing root `AGENTS.md` or version difference is a
warning, so the command remains successful when no other error exists.

## `update`

Refresh Harness-managed files using the preset recorded in the manifest.

```bash
npx beez-agent-harness update
```

The command never overwrites `.harness/project.json` or an existing root
`AGENTS.md`.

### `update --check`

Check for a newer Harness version or drift without writing files.

```bash
npx beez-agent-harness update --check
```

- Exit code `0`: no changes are needed.
- Exit code `1`: an update or drift was detected.

CI can use exit code `1` as an update-needed signal.

## `version`

Print the current CLI package version.

```bash
npx beez-agent-harness version
npx beez-agent-harness --version
```

## `help`

Print global or command-specific help.

```bash
npx beez-agent-harness help
npx beez-agent-harness help init
npx beez-agent-harness update --help
```

