---
name: beez-github
description: Coordinate GitHub issue, branch, commit, pull request, review, CI, policy, merge, tag, and release workflows with explicit repository targets and mutation authority. Use when requests mention GitHub, issues, pull requests, review comments, Actions, checks, branches, commits, labels, merges, CODEOWNERS, rulesets, 깃허브, 이슈, 풀 리퀘스트, 리뷰, 병합, or 브랜치.
---

# Govern GitHub Work Explicitly

Keep local git state, the selected remote repository, and the requested GitHub
object aligned. Reading repository state never grants mutation authority.

## Select mode and target

Classify the request as:

- inspect or triage: read metadata, patches, discussions, checks, or policy and
  report; make no external change;
- propose: draft issue text, labels, review responses, policy, commit grouping,
  or a PR description without publishing it;
- change locally: create a branch or commit only when locally authorized;
- execute on GitHub: create or edit an issue or PR, push, label, review, resolve,
  close, merge, tag, or release only when that exact action is authorized.

Resolve owner, repository, default branch, remote, current branch, object number
or URL, and requested target state before mutation. Restate the exact target for
high-impact or ambiguous actions. Never infer push from commit, PR creation from
push, merge from PR work, or release from merge.

## Prefer the narrow specialist workflow

When connected GitHub capabilities are available, use the narrowest matching
one for repository orientation, unresolved review comments, failing Actions
checks, or branch/commit/push/draft-PR publication. Use local git for checkout,
diff, staging, and commits. Use authenticated GitHub tooling for remote state and
mutation.

Fallback to local git and `gh` when a connector is unavailable, but verify
authentication and repository context. Do not claim inline thread resolution,
review state, or CI log evidence when the available interface exposed only flat
comments or check metadata.

Read [GitHub workflow evidence](references/github-workflows.md) for issue, PR,
review, CI, merge, release, and governance-specific expectations.

## Prepare scoped changes

1. Inspect applicable project guidance, worktree status, remotes, branch, and
   upstream.
2. Preserve unrelated work and stage explicit paths after reviewing the diff.
3. Group commits by behavior or issue, using the repository's message and branch
   convention.
4. Verify with project commands and retain evidence for the PR.
5. Do not include `.env`, credentials, run output, local caches, or unrelated
   generated artifacts.

Use `$beez-debug` for CI root causes, `$beez-security` for permissions and
sensitive changes, `$beez-migrate` for compatibility transitions,
`$beez-performance` for measured performance work, and `$beez-release` for tags,
hosted releases, package publication, or deployment.

## Create useful issues and pull requests

Issues should state observed or desired behavior, scope, risk, acceptance
criteria, dependencies, and evidence needed to close. Avoid duplicate or vague
tracking items.

Pull requests should state why and what changed, linked issues, compatibility or
migration impact, security and performance impact, verification commands and
results, screenshots or artifacts when relevant, rollback, known limitations,
and intentionally excluded scope. Use a draft while required work or checks are
incomplete unless repository policy says otherwise.

## Follow review and CI evidence

Classify review feedback as actionable, question, preference, obsolete, or
conflicting. Inspect the current code and thread context before changing it.
Implement selected fixes, verify them, reply accurately, and resolve a thread
only when the concern is addressed and resolution is authorized.

For failing Actions, inspect the failing check and log before proposing a fix.
Summarize the root cause and focused plan; distinguish external checks or missing
logs. Do not rerun, cancel, edit workflows, or suppress a failure without scope
and authority.

## Merge and release gates

Before merge, confirm exact PR, head commit, review state, unresolved threads,
required checks, merge method, base branch, and compatibility or rollback risk.
Before tags or releases, invoke `$beez-release`. Never bypass protection,
force-push shared history, delete shared branches, or move tags unless explicitly
authorized and the recovery impact is understood.

## Report

Report local branch and commit, remote repository, affected issue or PR URLs,
verification and CI evidence, each mutation performed, and remaining review,
policy, merge, or release action. Distinguish drafted content from published
GitHub state.
