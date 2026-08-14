# Contributing

Thank you for helping improve Beez Agent Harness. Keep every change bounded,
reviewable, and backed by fresh evidence.

## Before starting

1. Search existing issues and pull requests.
2. Use the matching issue form for bugs, features, migrations, or performance
   regressions. Report vulnerabilities privately through `SECURITY.md`.
3. Agree on scope and acceptance criteria for behavior, compatibility,
   security, data, release, or repository-policy changes.
4. Read `AGENTS.md`, `.harness/generated/AGENTS.md`, and
   `.harness/project.json` before editing.

## Branches and commits

Create a branch from current `main` using `<type>/<short-kebab-description>`.
Allowed types are `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `security`,
`chore`, and `release`. Examples: `feat/beez-debug-skill` and
`fix/root-agents-version-drift`.

Use Conventional Commit-style subjects:

```text
<type>[optional scope]: <imperative summary>
```

Keep commits focused and buildable where practical. Reference the issue in the
pull request body with `Closes #123`; use commit footers only when attribution or
breaking-change metadata is needed. Do not rewrite or force-push shared history
without explicit coordination.

## Development

- Preserve unrelated user changes and stage explicit paths after reviewing the
  diff.
- Keep Agent Skills concise, procedural, and provider-neutral unless the skill
  is intentionally provider-specific.
- Add regression tests for behavior and CLI changes. Add routing and behavior
  evaluation cases when natural-language triggers or workflows change.
- Update schemas and generated guidance with the implementation.
- Do not commit secrets, private repository details, `.harness/runs/`, raw logs,
  or machine-specific paths.

Run the project gates:

```bash
npm run check
npm run validate
npm run evaluate
npm test
npm pack --dry-run
```

Run the official Codex Agent Skill validator for each changed skill when it is
available. `npm run validate` remains the dependency-free structural CI gate.

## Pull requests

Open a draft pull request while required implementation or verification is
incomplete. Use a Conventional Commit-style PR title and complete the repository
template, including purpose, scope, risk, compatibility, verification,
security/performance impact, and rollback.

Each PR should normally close one issue. Split unrelated workflows into separate
PRs and preserve issue dependency order. Mark the PR ready only after the local
gates pass and the diff and package contents have been reviewed.

Address review comments from current code and thread context. Re-run affected
checks after changes and resolve conversations only when the concern is actually
addressed. Do not hide, skip, or weaken a failing gate.

## Merge and release

Merge only after required CI, review, CODEOWNER approval, and conversation
resolution gates pass. Use squash for a small single-purpose PR or a merge commit
when its staged commits are intentionally preserved; keep the resulting subject
conventional. Delete merged topic branches when they are no longer needed.

Use semantic versioning and add user-visible changes to `CHANGELOG.md`. Avoid
breaking existing project or run manifests in minor releases. Tags, hosted
releases, package publication, and deployments require the release workflow and
separate authorization.

Recommended remote rulesets are documented in
[`docs/en/github-governance.md`](docs/en/github-governance.md). Committed policy
does not apply GitHub settings automatically.
