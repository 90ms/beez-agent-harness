# Beez Agent Harness Specification

Current target contract: v0.4

## Problem

Generic development guidance is not enough when a natural-language request
mixes debugging, migration, security, release, performance, or GitHub work.
Words such as "check", "handle this", or "봐줘" do not by themselves identify
whether the user authorized inspection, a local change, a repository mutation,
or an external production action.

The v0.4 contract adds deterministic routing vocabulary, specialized workflow
skills, richer local evidence, and repository governance without turning the
package into an autonomous agent runtime.

## Outcome

After the plugin or selected skills are installed and the project adapter is
initialized, an agent can:

- interpret Korean, English, and mixed-language software requests by intent,
  risk, and authorized side effects rather than keywords alone;
- compose the core lifecycle with debugging, migration, security, release,
  performance, and GitHub workflows;
- preserve explicit prohibitions such as "do not edit", "do not publish", or
  "do not merge" throughout a composed workflow;
- select project-owned verification profiles and record workflow metadata,
  phase checkpoints, and bounded artifact digests;
- prevent a successful finish while selected verification is missing or
  failed; and
- apply reviewable GitHub intake, ownership, CI, dependency, and release gates.

## Goals

- Provide a reusable lifecycle: route, specify, plan, implement, verify, review.
- Route natural-language requests through a stable, multilingual contract.
- Add specialized workflows without duplicating or bypassing the core lifecycle.
- Install only thin project guidance instead of copying the full skill set.
- Support new and existing repositories with the same initialization command.
- Make generated files identifiable, reviewable, and safe to update.
- Keep workflow completion claims locally inspectable without storing model
  transcripts, command output, or secrets.
- Keep the CLI runtime dependency-free and all execution operator-initiated.
- Keep GitHub and release mutations behind explicit authority and CI gates.

## Non-goals

- Creating a general-purpose autonomous or multi-agent runtime.
- Calling model-provider APIs or selecting models.
- Replacing framework-specific project generators.
- Guaranteeing that every agent host discovers or invokes skills identically.
- Inferring project commands, deployment targets, credentials, or publication
  authority from repository contents.
- Silently changing project policy or GitHub administrative settings.
- Providing containers, remote sandboxes, telemetry services, or a web UI.
- Automatically committing, pushing, merging, tagging, publishing, or deploying.
- Capturing raw command output, environment values, secrets, or transcripts in
  run state.

## Architecture

### Plugin and Agent Skills

The repository is a Codex plugin whose `skills/` directory contains 12 reusable
workflows.

Core routing and lifecycle:

- `using-beez-harness`: classify intent and compose the smallest sufficient
  workflow;
- `beez-spec`: produce a bounded, testable change contract;
- `beez-plan`: decompose accepted behavior into ordered, verifiable work;
- `beez-implement`: implement small behavior-focused slices;
- `beez-verify`: gather fresh, claim-specific evidence; and
- `beez-review`: review correctness, regression, security, data safety, and
  test gaps.

Specialized domains:

- `beez-debug`: reproduce symptoms, test hypotheses, isolate root cause, and
  add regression protection when a fix is authorized;
- `beez-migrate`: preserve invariants through compatibility, cutover, data
  integrity, and rollback gates;
- `beez-security`: scope, threat-model, rank, remediate, and regression-test
  security findings without exposing sensitive material;
- `beez-release`: synchronize versions and artifacts, enforce publication
  authority, and define partial-failure recovery;
- `beez-performance`: compare representative baselines and controlled
  measurements before claiming improvement; and
- `beez-github`: separate local Git state from authorized issue, pull request,
  review, CI, merge, tag, release, and repository-policy operations.

Skills also work standalone when the project adapter is absent. Explicit skill
invocation such as `$beez-debug` is supported, but ordinary natural-language
requests should route through skill descriptions and `using-beez-harness`.

### Project adapter

`beez-harness init` writes:

- `.harness/manifest.json`: applied Harness version, preset, and managed hashes;
- `.harness/project.json`: project-owned commands, verification profiles, and
  boundaries;
- `.harness/generated/AGENTS.md`: generated routing and evidence guidance; and
- `AGENTS.md`: a small project entry point only when one does not already exist.

Existing root guidance is never overwritten. When `AGENTS.md` already exists,
the CLI reports the include text that the operator may add.

### Operational evidence

Run state lives under `.harness/runs/<run-id>/` and is not managed by package
updates. Each run contains:

- `manifest.json`: state, repository identity, configuration digest, optional
  workflow route, selected verification profile, checkpoints, and verification
  summaries; and
- `events.jsonl`: append-only lifecycle, verification, and checkpoint events.

Structured state replacement uses a temporary file followed by atomic rename.
A run has one of these states:

```text
active -> completed
       -> failed
       -> cancelled
```

Terminal runs are immutable. Interrupted work remains active for explicit
inspection and resumption.

## Natural-language routing contract

Requests are classified by meaning on four independent axes:

- `domains`: one or more of `general`, `debug`, `migration`, `security`,
  `release`, `performance`, or `github`;
- `mode`: `explain`, `inspect`, `diagnose`, `plan`, `change`, `verify`, `review`,
  or `execute`;
- `risk`: `low`, `medium`, `high`, or `critical`; and
- `sideEffects`: the furthest required effect, one of `none`, `local`,
  `repository`, or `external-production`.

The strongest action explicitly authorized determines the mode. The highest
applicable risk and furthest required side effect determine evidence and
authority gates; they never grant additional permission.

Constraint precedence is:

1. system, safety, project boundaries, and applicable `AGENTS.md` rules;
2. explicit user prohibitions and scope limits;
3. explicit requested outcomes;
4. inferred routine implementation steps; and
5. workflow defaults.

Mixed requests become ordered subroutes. For example, "find the regression,
fix it, then open a PR" composes `debug/diagnose`, `debug/change`, and
`github/execute`. A later repository action does not retroactively authorize an
earlier edit, unrelated issue work, or a merge.

## Workflow contract

The meta-skill selects the smallest sufficient lifecycle:

- explanation or status: inspect -> answer;
- diagnosis only: reproduce or inspect -> diagnose -> report;
- small low-risk change: implement -> verify;
- feature or behavior change: spec -> plan -> implement -> verify -> review;
- bug fix: reproduce -> implement -> regression verify -> review;
- migration: define invariants -> plan -> implement -> verify -> review;
- review or verification only: run only the requested stage; and
- release, security, or other high-risk execution: full lifecycle with rollback
  evidence and explicit authority.

Specialized skills refine these phases but do not override user constraints,
project boundaries, or mutation authority. Diagnosis, planning, review, fixing,
committing, merging, publication, and deployment remain distinct authorities.

## Presets and project configuration

v0.4 includes:

- `base`: language- and framework-independent boundaries with empty named
  verification profiles; and
- `nextjs`: detected package-manager commands, Next.js boundaries, and named
  profiles populated with test, lint, and build checks.

`.harness/project.json` remains project-owned:

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "audit": "npm audit"
  },
  "verification": {
    "required": ["test"],
    "profiles": {
      "default": ["test"],
      "security": ["test", "audit"]
    },
    "timeoutMs": 300000
  },
  "boundaries": [
    "Preserve unrelated user changes."
  ]
}
```

`verification` is optional. `required` is the default completion gate.
`profiles` is an optional map of profile names to ordered command names. Every
referenced name must exist in `commands`; duplicate names and unknown commands
are invalid. `timeoutMs` applies per command and must be from 1,000 through
3,600,000 milliseconds.

## CLI contract

The zero-dependency Node.js CLI provides:

- `beez-harness init [--preset base|nextjs] [--dry-run]`;
- `beez-harness doctor [--json]`;
- `beez-harness update [--check] [--diff]`;
- `beez-harness run start [workflow fields] [--profile <name>]`;
- `beez-harness run status|list|resume`;
- `beez-harness run checkpoint --phase <name> --state <name> [--artifact <path>]`;
- `beez-harness run finish [--state completed|failed|cancelled]`;
- `beez-harness run gc [--keep <count>]`;
- `beez-harness verify --command <name>`;
- `beez-harness verify --required`;
- `beez-harness verify --profile <name>`; and
- `beez-harness version` and command-specific help.

Workflow metadata is optional, but when any workflow field is supplied,
`--domain`, `--mode`, `--risk`, and `--side-effects` are all required. Domains
are repeatable. A profile is selected at run start and its command list is
snapshotted into the run; `verify --profile` must name that selected profile.

Checkpoints accept `started`, `completed`, or `blocked`. An optional artifact
must be a regular project-relative file no larger than 10 MiB. Only its bounded
path and SHA-256 digest are stored. A run accepts at most 100 checkpoints and
500 events.

Preview and check options do not write. `update` refreshes only managed files
listed in the manifest and preserves `project.json`.

## Verification and evaluation evidence

The CLI streams command output to the current terminal but records only:

- project command name and configured-command digest;
- start and finish timestamps and duration;
- exit status and termination signal; and
- pass, fail, timeout, or interrupted outcome.

A completed transition is rejected when the selected required list has no
passing result for the current configuration digest. Changing `project.json`
after run start invalidates completion evidence.

Provider-neutral evaluation covers both delivery behavior and routing. The
routing corpus contains Korean, English, and mixed-language cases, including
negative constraints and multi-domain composition. Beez does not invoke a
model; external runners submit schema-valid results to deterministic scorers.

## GitHub and release governance

Repository-owned governance includes issue forms, a pull request template,
CODEOWNERS, contribution conventions, pinned GitHub Actions, dependency review,
supported Node.js and Windows CI, release ancestry validation, version
alignment, behavior evaluation, package dry-run, and tag-triggered publication.

The repository documents recommended `main` and tag rulesets. Remote rulesets,
environments, reviewers, npm Trusted Publisher configuration, and other
administrative settings remain explicit operator actions.

Release preparation and publication are separate. A version bump, changelog,
dry-run, or release plan does not authorize a tag, npm publication, GitHub
Release, or deployment.

## Ownership rules

- Harness-owned: `.harness/manifest.json`, `.harness/generated/**`.
- Project-owned: `.harness/project.json`, existing `AGENTS.md`, and source code.
- Operational: `.harness/runs/**`, created by run commands and never rewritten
  by package updates.
- Shared: a root `AGENTS.md` created by the Harness remains user-editable and is
  never overwritten after creation.
- Repository-owned: `.github/**`, `CONTRIBUTING.md`, release automation, and
  administrative-policy documentation.

## Compatibility and versioning

The project follows semantic versioning.

- Patch: wording or behavior fixes without changing the project contract.
- Minor: new skills, presets, commands, or backward-compatible schema fields.
- Major: incompatible manifest, CLI, ownership, or policy changes.

Projects pin the applied Harness version in `.harness/manifest.json`. Updates
are explicit and reviewable. v0.4 accepts valid v0.2 and v0.3 manifests, project
configuration, and run manifests without forcing migration. New workflow,
profile, and checkpoint fields are optional.

## Security boundaries

- Preview and check operations perform no project writes.
- Verification commands are never inferred from repository contents.
- Verification runs only project-owned commands selected by the operator.
- Run evidence excludes raw output, environment values, secrets, and model
  transcripts.
- Run identifiers, managed paths, checkpoint paths, artifact types, sizes, and
  digests are validated before use.
- Managed update paths remain confined to `.harness/generated/`.
- GitHub Actions use immutable full-commit pins and bounded timeouts.
- Release tags must point to commits reachable from `origin/main`.
- The CLI itself performs no network, Git mutation, GitHub mutation, or release
  publication.

## Acceptance criteria

- All 12 public skills and their metadata pass repository validation.
- Natural-language routing classification and negative constraints pass the
  Korean, English, and mixed-language evaluation corpus.
- Existing initialization, no-overwrite, drift, and managed-update behavior
  remains covered by tests.
- Valid v0.2 and v0.3 configurations and run manifests remain readable.
- `doctor --json` matches the text health decision and exit status.
- `init --dry-run`, `update --check`, and `update --diff` perform no writes.
- Workflow routes, named profiles, checkpoints, and artifact digests are
  bounded, validated, and recorded without raw content.
- A run cannot complete with missing, stale, or failed selected verification.
- GitHub templates, ownership, workflows, action pins, and release gates pass
  repository validation.
- Node.js 20, 22, and 24 plus Windows remain supported with no runtime
  dependencies.
- Korean and English documentation describe every public skill, command,
  configuration field, and ownership rule.

## Release verification

Every release candidate runs:

```bash
npm run check
npm run validate
npm run evaluate
npm test
npm pack --dry-run
node scripts/check-release.mjs vX.Y.Z
node scripts/check-release-ancestry.mjs HEAD origin/main
```

Publishing additionally requires the approved `npm` GitHub Environment and a
tag whose version matches the package, plugin, generated adapter, and changelog.

## Risks and rollback

- Natural-language intent remains host-agent behavior, so deterministic cases
  validate the contract without claiming provider-independent perfection.
- Specialized workflows can over-expand a task if constraints are ignored;
  routing precedence and separate mutation authorities limit that risk.
- Project verification commands can have local side effects. They remain
  project-owned, explicitly selected, time-bounded, and free of persisted raw
  output.
- Persistent run state can be incomplete after termination. Atomic manifest
  replacement, append-only events, resumption, and bounded checkpoints keep it
  inspectable.
- Operational run directories can be archived or removed independently without
  affecting initialization or managed updates.
- Repository and release policy can be rolled back through normal reviewed
  workflow changes; already-published package versions or releases require the
  recovery rules in the release guide.
