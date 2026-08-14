# Release gates and recovery

Adapt these gates to project policy. Missing relevance is different from a
skipped required gate.

## Preparation gates

- Working scope and source commit are known; unrelated changes are excluded.
- Target version follows project policy and is unused at every intended registry.
- Version-bearing files, lockfiles, generated manifests, and documentation agree.
- Changelog and release notes cover compatibility, migration, deprecation,
  security, and known limitations where applicable.
- The exact package or artifact file list has been inspected.
- Tests, lint, type checks, builds, evaluations, smoke tests, and release checks
  required by the project pass with fresh evidence.

## External actions

Treat each as separately authorized: commit, push, merge, create or push tag,
publish each package or artifact, create hosted release, upload assets, deploy
each environment, and announce. Record target names before acting.

## Ordering

Use project release policy where it exists. Otherwise identify which system is
the source of truth and which actions are reversible. Avoid creating a public
promise before the artifact it references can be verified. Do not delete or
move successful shared artifacts to conceal a later failure.

## Partial-release recovery

Inventory actual state before retrying:

- tag exists but artifact is not published: verify tag source and gates, then
  continue only if the tag is correct; never move it silently;
- package published but hosted release missing: confirm digest and version,
  create only the missing metadata, and do not republish the version;
- one package in a set failed: identify dependency impact and use a new version
  when the registry forbids or makes overwrite unsafe;
- deployment failed after publication: preserve published artifacts, apply the
  deployment rollback or roll forward, and communicate status through the
  authorized channel;
- state is ambiguous: stop and obtain authoritative registry, repository, or
  deployment evidence before taking another mutation.
