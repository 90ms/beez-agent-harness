# Contributing

Thank you for helping improve Beez Agent Harness.

## Development

1. Create a focused branch.
2. Keep skill instructions concise and procedural.
3. Add or update tests for CLI behavior.
4. Run `npm run check`, `npm run validate`, and `npm test`.
5. Submit a pull request describing the behavior change and evidence.

Do not include secrets, private repository details, or machine-specific paths.

## Changes

- Use semantic versioning.
- Add user-visible changes to `CHANGELOG.md`.
- Avoid breaking project manifests in minor releases.
- Keep generated-file updates deterministic.

## Skill validation

Run the official Codex Agent Skill validator for each changed skill when it is
available in your development environment. The repository's
`npm run validate` command provides a dependency-free structural check for CI.
