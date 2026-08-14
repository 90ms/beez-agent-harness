# GitHub workflow evidence

Apply repository policy first. These are minimum evidence prompts, not a reason
to override project conventions.

## Issue intake and triage

- Confirm repository, duplicates, current behavior, expected outcome, affected
  version or environment, reproduction or motivating use case, risk, and owner.
- Separate bug, feature, migration, security, performance, release, and policy
  work so specialized evidence is visible.
- Do not assign, label, close, transfer, or edit without authorization.

## Pull request publication

- Branch originates from the intended base and contains only scoped commits.
- Diff and staged content were reviewed; local secrets and unrelated work are
  absent.
- Required verification is fresh and failures are disclosed.
- PR title and body match actual behavior, risks, migration, rollback, and issue
  closing semantics.

## Review follow-up

- Read unresolved thread context and current patch before deciding action.
- Do not accept suggestions blindly when they conflict with requirements,
  introduce regressions, or are already obsolete.
- Reverify changed behavior and respond with evidence; resolution status is a
  distinct remote mutation.

## CI diagnostics

- Identify provider, workflow, run, job, step, head commit, and failure excerpt.
- Separate a code failure from infrastructure, permission, cancellation, or
  external-provider failure.
- A green rerun without an explained flaky cause is not a completed fix.

## Governance

- Document required status checks, review count, CODEOWNERS expectations,
  conversation resolution, signed or linear history policy, force-push and
  deletion rules, bypass actors, release environment, and emergency procedure.
- Repository settings are external state. Draft policy locally when mutation
  authority or administrative access is absent.

## Merge, tag, and release

- Verify immutable head, base, approvals, checks, merge method, and exact target.
- After merge, confirm resulting commit and issue state before deleting branches.
- Tags, releases, package publication, and deployment require the release
  workflow and separately named targets.
