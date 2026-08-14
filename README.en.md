# Beez Agent Harness

[한국어](README.md) | [English](README.en.md)

Beez Agent Harness is a **Codex-first collection of 12 Agent Skills and a thin
project adapter** that routes natural-language software requests into
consistent workflows. It composes debugging, migration, security, release,
performance, and GitHub work with specification, planning, implementation,
verification, and review while keeping project commands, boundaries, and local
evidence inside each repository.

This package is not a runtime library imported by application code. Applying it
to another project has two layers:

1. Install the plugin or selected Skills in the agent environment.
2. Initialize the `.harness/` project adapter in the target repository.

After that, ordinary requests such as "find and fix this flaky test", "plan the
database migration but do not execute it", or "prepare the release and only
open a PR" can select the matching workflow through installed Skill
descriptions and project guidance. Skill names are optional; explicit
invocations such as `$beez-debug` also work.

## Quick start

### 1. Install the agent Skills

Install the complete Codex plugin:

```bash
codex plugin marketplace add 90ms/beez-agent-harness
```

Restart Codex after the first installation. All 12 Skills become available. To
install only selected Skills:

```bash
npx skills add 90ms/beez-agent-harness --list
npx skills add 90ms/beez-agent-harness \
  --skill using-beez-harness \
  --skill beez-debug \
  --skill beez-verify \
  --agent codex
```

Add `--global` to use them across projects.

### 2. Apply the adapter to a project

Run this from the target repository root:

```bash
npx beez-agent-harness init --preset base
npx beez-agent-harness doctor
```

For Next.js, use the `nextjs` preset with package-manager detection:

```bash
npx beez-agent-harness init --preset nextjs
```

The CLI never overwrites an existing root `AGENTS.md`. If one exists, direct
the agent to read `.harness/generated/AGENTS.md` and
`.harness/project.json`.

### 3. Configure commands and verification profiles

The target project owns `.harness/project.json`:

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build",
    "audit": "npm audit"
  },
  "verification": {
    "required": ["test", "lint"],
    "profiles": {
      "default": ["test", "lint"],
      "security": ["test", "lint", "audit"],
      "release": ["test", "lint", "build"]
    },
    "timeoutMs": 600000
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

`required` is the default completion gate. `profiles` groups commands by task
risk. The Harness never guesses or implicitly runs an unregistered command.

### 4. Ask in natural language

Use normal requests:

```text
Reproduce the login API 500, find the root cause, and fix it.
Plan the Prisma 7 upgrade and rollback; do not change code yet.
Review the auth change for security and fix only high-severity findings.
Measure a baseline, improve p95 latency, and keep comparable evidence.
Prepare 0.4.0 and open a PR, but do not publish or merge it.
```

Negative constraints such as "do not edit", "do not commit", and "do not
deploy" survive workflow composition. Inspection, diagnosis, planning, and
review do not imply change authority. Commit, merge, publish, and deploy are
also separate authorities.

### 5. Record run evidence

Software changes can record classification and a verification profile:

```bash
npx beez-agent-harness run start \
  --domain security \
  --domain github \
  --mode change \
  --risk high \
  --side-effects repository \
  --profile security

npx beez-agent-harness run checkpoint \
  --phase threat-model \
  --state completed \
  --artifact docs/threat-model.md

npx beez-agent-harness verify --profile security
npx beez-agent-harness run finish
```

Run state keeps command names and digests, outcomes and timing, the selected
workflow/profile, checkpoints, and optional artifact paths plus SHA-256. It
does not keep command text, stdout/stderr, environment values, or model
transcripts.

## Included capabilities

### Core Skills

| Skill | Purpose |
| --- | --- |
| `using-beez-harness` | Classify natural-language work by domain, mode, risk, and side effect |
| `beez-spec` | Turn a request into a bounded, testable contract |
| `beez-plan` | Decompose accepted behavior into ordered, verifiable work |
| `beez-implement` | Implement small behavior-focused slices while preserving unrelated work |
| `beez-verify` | Gather fresh, claim-specific test and inspection evidence |
| `beez-review` | Review correctness, regressions, security, data safety, and test gaps |

### Specialized Skills

| Skill | Scope |
| --- | --- |
| `beez-debug` | Reproduction, competing hypotheses, root cause, regression protection |
| `beez-migrate` | Compatibility windows, cutover, data integrity, rollback |
| `beez-security` | Threat modeling, severity and exploitability, safe remediation |
| `beez-release` | Version and artifact alignment, gates, publication authority, recovery |
| `beez-performance` | Representative baselines, profiling, comparable benchmarks, budgets |
| `beez-github` | Issues, branches, commits, PRs, reviews, Actions, merges, tags, rulesets |

Specialized Skills refine rather than replace the core lifecycle. For example,
"fix the performance issue and open a release PR" sequences measurement,
implementation, and verification before release preparation and GitHub work.

## Routing contract

The Harness classifies meaning on four axes instead of routing from one
keyword:

| Axis | Values |
| --- | --- |
| domain | `general`, `debug`, `migration`, `security`, `release`, `performance`, `github` |
| mode | `explain`, `inspect`, `diagnose`, `plan`, `change`, `verify`, `review`, `execute` |
| risk | `low`, `medium`, `high`, `critical` |
| side effect | `none`, `local`, `repository`, `external-production` |

A provider-neutral scorer checks a 56-case Korean, English, and mixed-language
corpus covering specialized domains, negative constraints, and composed
requests. Beez itself does not invoke a model.

## Project adapter and ownership

```text
AGENTS.md                         project entry guidance
.harness/
├── manifest.json                applied version and managed hashes
├── project.json                 project commands, profiles, boundaries
├── generated/AGENTS.md          Harness-generated guidance
└── runs/<run-id>/
    ├── manifest.json            state, route, verification, checkpoints
    └── events.jsonl             append-only events
```

| File | Ownership |
| --- | --- |
| `.harness/manifest.json`, `.harness/generated/**` | Harness-managed |
| `.harness/project.json`, existing `AGENTS.md`, source | Project-managed |
| `.harness/runs/**` | CLI operational state; never package-update managed |
| `.github/**`, `CONTRIBUTING.md` | Repository governance |

This adds policy and evidence to a project; it does not become an application
build or runtime dependency.

## Main CLI

```text
beez-harness init [--preset base|nextjs] [--dry-run]
beez-harness doctor [--json]
beez-harness update [--check] [--diff]
beez-harness run start|status|list|resume|checkpoint|finish|gc
beez-harness verify --command <name>|--required|--profile <name>
beez-harness version
beez-harness help [command]
```

A run moves from `active` to `completed`, `failed`, or `cancelled`. Completion
is blocked when selected verification is missing or failed, or when
`project.json` changed after start. See the [CLI reference](docs/en/cli-reference.md)
for every option.

## Updates and diagnostics

Update installed Skills and each project adapter independently:

```bash
codex plugin marketplace upgrade
# or npx skills update

npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update --diff
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor --json
```

`update` refreshes only Harness-managed files and preserves
`.harness/project.json` plus an existing `AGENTS.md`.

## Development and documentation

Node.js 20 or newer is required, with no runtime dependencies.

```bash
npm run check
npm run validate
npm run evaluate
npm test
npm pack --dry-run
```

- [Project configuration](docs/en/configuration.md)
- [CLI reference](docs/en/cli-reference.md)
- [Architecture](docs/en/architecture.md)
- [GitHub governance](docs/en/github-governance.md)
- [Behavior and routing evaluation](evals/README.en.md)
- [Troubleshooting](docs/en/troubleshooting.md)
- [Releasing](docs/en/releasing.md)
- [v0.4 specification](SPEC.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
