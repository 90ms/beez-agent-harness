# GitHub governance

Repository files standardize collaboration, while GitHub rulesets enforce remote
state. Committing this document, CODEOWNERS, or templates does not create or
change a ruleset. A repository administrator or a role with permission to edit
repository rules must review and apply the settings.

## Recommended `main` branch ruleset

Target the default branch and use active enforcement:

- require a pull request before merging;
- require one approving review and CODEOWNER review for owned paths;
- dismiss stale approvals after reviewable changes and require conversation
  resolution;
- require the current CI jobs: `validate (20)`, `validate (22)`,
  `validate (24)`, and `windows`;
- require the branch to be up to date after confirming the check names are
  stable;
- block force pushes and branch deletion;
- limit bypass to named emergency maintainers or an audited release app;
- allow repository-supported merge methods, while following the merge guidance
  in `CONTRIBUTING.md`.

Required check names are job names and must be updated when workflow job names
change. Start a new or changed ruleset in evaluate mode when available, observe
legitimate traffic, then activate it.

## Recommended release tag ruleset

Target `v*` tags:

- block updates, force pushes, and deletion;
- restrict creation to authorized release maintainers or the release workflow;
- require the tag to identify the version synchronized in repository metadata;
- do not use a bypass to move a published tag—recover with a new version.

Tag protection does not replace protected npm environments, trusted publishing,
artifact inspection, or the `beez-release` gates.

## Ownership

`.github/CODEOWNERS` assigns a default owner and calls out policy, workflows,
skills, schemas, evaluation contracts, CLI/run code, tests, and release checks.
GitHub only requests and enforces CODEOWNER review when the listed owner has
write access and branch or ruleset settings require that review.

## Issue and pull request intake

Issue forms collect evidence for bugs, features, performance regressions, and
migrations. Blank public issues are disabled; maintainers retain their GitHub
override. Vulnerability reports are routed to private vulnerability reporting.

The pull request template records purpose, change type, risk, side effects,
compatibility, verification, security/performance impact, rollback, and external
actions. Templates improve evidence but do not replace review or CI.

## Emergency changes

Document the incident, exact bypass actor, reason, changed commit, checks run,
and follow-up review. Prefer a pull request even during urgent work. Re-enable
normal enforcement immediately and create a follow-up issue for any deferred
test, review, migration, or rollback evidence.

See GitHub's documentation for [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners),
[issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema),
and [ruleset rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
