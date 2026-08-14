---
name: beez-release
description: Prepare, verify, and execute versioned software releases with synchronized metadata, reproducible artifacts, explicit publication authority, and partial-failure recovery. Use when requests mention versions, changelogs, release notes, tags, registries, package publishing, GitHub Releases, deployment, rollback, 릴리스, 배포, 버전, 태그, or 게시.
---

# Release through Explicit Gates

Preparation, readiness verification, repository publication, package
publication, and deployment are separate authorities. Never infer a later
authority from an earlier one.

## Select the mode

- prepare: change local version files, changelog, release notes, or release
  configuration; do not tag, push, publish, create a hosted release, or deploy;
- verify: inspect readiness and run gates without changing repository or
  external state;
- execute: perform only the explicitly named external actions after all gates
  pass;
- recover: reconcile a partially completed release without silently repeating
  or overwriting successful steps.

Honor phrases such as "준비만", "dry run", "do not publish", or "배포는 내가
할게". Use `$using-beez-harness` to retain route and side-effect boundaries.

## Define the release contract

Before changing anything, identify:

1. exact target version and the project's versioning policy;
2. source commit and accepted branch;
3. compatibility and migration implications;
4. version-bearing files that must remain synchronized;
5. expected tag and hosted release name;
6. registry, package or artifact identity, and publication visibility;
7. deployment target when deployment is explicitly in scope;
8. rollback or recovery path for every authorized side effect.

Do not reuse a version that has been published. Do not move or recreate a shared
tag silently. If current registry, tag, platform, or compatibility facts are
material, verify them from the authoritative service or primary documentation.

Read [release gates and recovery](references/release-gates.md) for preparation,
execution ordering, and partial-release states.

## Prepare reproducibly

Use `$beez-spec` and `$beez-plan` for compatibility changes or multi-artifact
releases. Then:

1. establish a clean baseline and review changes since the previous release;
2. choose the version from user or project policy, not guesswork;
3. synchronize package, plugin, manifest, schema, documentation, and generated
   metadata versions as applicable;
4. write release notes that distinguish user-visible change, migration,
   deprecation, security, and known limitations;
5. inspect the package or artifact contents and exclude secrets, local state,
   fixtures, and unintended files;
6. verify build reproducibility, checksums or provenance when supported.

Use `$beez-migrate` for compatibility or persistent-state transitions and
`$beez-security` for release credentials, supply-chain, or security advisories.

## Verify readiness

Use `$beez-verify` to run declared project gates, release-specific checks,
package inspection, installation or smoke tests, documentation links, and
version/tag consistency. Confirm the source commit is immutable or identified
unambiguously. Readiness-only mode stops here and performs no repository or
external writes.

Use `$beez-review` for the final diff, release notes, compatibility, artifact
contents, and rollback readiness. A passing build does not authorize publish.

## Execute authorized actions

Before each mutation, restate its exact target. Order actions to minimize
irreversible partial states, and record successful checkpoints without secrets.
Stop when credentials, protected environments, approval, or target identity are
missing. Never weaken a gate to make a release pass.

After execution, verify the immutable tag or source, hosted metadata, registry
version and artifact digest, and deployment health only for targets in scope.

## Report

Report the target version, source commit, prepared files, gate evidence,
artifact identity, each external action as `not requested`, `pending`,
`completed`, or `failed`, and the exact recovery or rollback needed. Do not call
a prepared release published or a published package deployed.
