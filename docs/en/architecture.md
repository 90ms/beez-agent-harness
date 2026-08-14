# Architecture

[한국어](../ko/architecture.md) | [English](architecture.md)

Beez Agent Harness is not an agent runtime or an application library. It is a
thin control layer connecting installed Agent Skills, repository-owned policy,
and local evidence.

## Deployment model

```text
Agent environment
└── plugin or selected skills/       reusable natural-language workflows

Target repository
├── AGENTS.md                         entry point for the agent
└── .harness/
    ├── manifest.json                 applied version and managed hashes
    ├── project.json                  commands, profiles, boundaries
    ├── generated/AGENTS.md           generated routing/evidence guidance
    └── runs/<run-id>/                local operational evidence
```

The project does not import the Harness into application source. Skill
installation makes workflows discoverable to the agent; `init` connects those
workflows to a repository's real commands and boundaries.

## Workflow layers

`using-beez-harness` is the routing layer. It classifies each request by:

- one or more domains: general, debug, migration, security, release,
  performance, or GitHub;
- mode: explain, inspect, diagnose, plan, change, verify, review, or execute;
- risk: low, medium, high, or critical; and
- furthest side effect: none, local, repository, or external production.

The router selects core lifecycle Skills (`beez-spec`, `beez-plan`,
`beez-implement`, `beez-verify`, and `beez-review`) and composes specialized
Skills (`beez-debug`, `beez-migrate`, `beez-security`, `beez-release`,
`beez-performance`, and `beez-github`) when their domain is material.

Specialized Skills refine the same lifecycle. They do not override explicit
prohibitions or convert inspection into change authority. Mixed requests become
ordered subroutes whose permissions stay separate.

## v0.4 run evidence

Every run starts as `active` and ends as `completed`, `failed`, or `cancelled`:

```text
active -> completed
       -> failed
       -> cancelled
```

At start, the CLI snapshots:

- the current project configuration digest and Git baseline;
- optional domain, mode, risk, and side-effect metadata; and
- either `verification.required` or a selected profile's ordered command list.

The run manifest stores verification summaries and up to 100 bounded phase
checkpoints. A checkpoint may include a project-relative regular file no larger
than 10 MiB; only its path and SHA-256 digest are kept. Event history is bounded
to 500 entries.

Raw command text, stdout/stderr, environment values, secrets, and model
transcripts are not persisted. Completion is allowed only after all snapshotted
verification passes against the unchanged configuration digest.

`run resume` appends a resume event without changing state. `run gc` removes
only old terminal runs and never deletes an active run. Package updates never
manage `.harness/runs/`.

## Ownership and update flow

| Surface | Owner | Update behavior |
| --- | --- | --- |
| Installed plugin or Skills | Agent environment | Updated through the plugin/Skill manager |
| `.harness/manifest.json` | Harness | Rewritten by `init`/`update` |
| `.harness/generated/**` | Harness | Regenerated and hash-checked |
| `.harness/project.json` | Project | Preserved by `init`/`update` |
| Root `AGENTS.md` | Project/shared | Created only when absent; never overwritten |
| `.harness/runs/**` | Operational state | Changed only by run/verify commands |
| `.github/**` | Repository | Reviewed through normal GitHub governance |

## Repository quality layer

The Harness repository itself validates all Skill resources and schemas,
provider-neutral behavior and routing cases, backward compatibility, package
contents, GitHub templates, CODEOWNERS, immutable Action pins, dependency
review, supported Node.js versions, Windows behavior, and release ancestry.

These repository gates validate the distributed Harness. They do not replace a
target project's own commands, reviewers, rulesets, deployment controls, or
publication authority.

## Safety boundaries

- Preview and check commands do not write files.
- Verification runs only project-registered, explicitly selected commands.
- Managed updates stay inside `.harness/generated/`.
- Structured state replacement uses a temporary file and atomic rename.
- Paths, regular-file type, artifact size, hashes, route values, and profile
  references are validated before recording.
- The CLI does not call model APIs, send telemetry, mutate Git/GitHub, publish,
  or deploy.

See [`SPEC.md`](../../SPEC.md) for the normative contract.
