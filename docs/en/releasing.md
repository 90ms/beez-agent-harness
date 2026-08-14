# Release guide

[한국어](../ko/releasing.md) | [English](releasing.md)

Release preparation, repository publication, npm publication, GitHub Release,
and deployment are separate authorities. Updating versions and running a dry
run does not authorize a tag or publication.

The tag-triggered workflow verifies an exact commit reachable from
`origin/main`, publishes to npm through OIDC Trusted Publishing, and then
creates a GitHub Release.

## One-time repository setup

### npm Trusted Publisher

Register this publisher in the npm package settings:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `90ms` |
| Repository | `beez-agent-harness` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

Names are case-sensitive. See the [npm Trusted Publishing
documentation](https://docs.npmjs.com/trusted-publishers/).

### GitHub controls

Create the protected `npm` Environment and configure required reviewers for the
maintainer model. Apply the `main` and `v*` rulesets documented in
[GitHub governance](github-governance.md). Enable Dependency graph for pull
request dependency review and keep private vulnerability reporting enabled.

## Prepare a versioned release

1. Confirm the intended semantic version and release scope.
2. Update `package.json` and `.codex-plugin/plugin.json`.
3. Run the new CLI's adapter update so `.harness/manifest.json` and generated
   guidance carry the same version.
4. Move Unreleased entries into a dated `CHANGELOG.md` section.
5. Review package contents and run all gates.

```bash
npm run check
npm run validate
npm run evaluate
npm test
npm pack --dry-run
node scripts/check-release.mjs vX.Y.Z
git fetch origin main
node scripts/check-release-ancestry.mjs HEAD origin/main
```

`check-release.mjs` aligns the requested tag, package, plugin, applied adapter,
generated guidance, and dated changelog. The ancestry check rejects unsafe ref
syntax and any exact release commit not reachable from `origin/main`.

Use a Harness run with the `release` profile when configured. Record a bounded
checkpoint for the release contract or package report when it materially helps
review; do not store registry tokens or raw logs.

## Review and merge preparation

Open a pull request describing compatibility, security/performance impact,
rollback, checks, and any requested external actions. Required CI includes
Node.js 20/22/24, Windows, deterministic evaluation, tests, package dry-run, and
dependency review. Actions are pinned to immutable full commit SHAs and jobs
have timeouts.

Merge the versioned commit to `main` before creating the tag. A side-branch tag
will fail the release ancestry gate.

## Publish only with explicit authority

On the reviewed release commit:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

The workflow performs:

1. exact release ancestry and version alignment;
2. syntax, repository validation, behavior/routing evaluation, tests, and
   package dry-run;
3. approval through the protected `npm` Environment;
4. public npm publication with OIDC and provenance; and
5. idempotent GitHub Release creation for the verified tag.

Do not run these tag commands when the request authorizes only preparation or a
pull request.

## Failure and recovery

- **Before a tag is shared:** fix the release commit, rerun every gate, and tag
  the corrected merged commit.
- **Tag workflow fails before npm publication:** correct the problem under the
  repository's tag policy. Prefer a new version when a protected/shared tag
  cannot be safely replaced.
- **npm succeeds but GitHub Release fails:** do not republish the version. Rerun
  the GitHub Release job; it first checks whether the release already exists.
- **Incorrect package is published:** the version is immutable. Follow npm
  policy to deprecate it and prepare a corrective patch release.
- **Deployment fails:** package/GitHub publication and deployment are distinct;
  follow the target system's rollback without moving the published tag.

Never move a tag already shared or used for publication.
