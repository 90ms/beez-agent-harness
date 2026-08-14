# Natural-language routing contract

Use this contract to turn a natural-language request into a bounded workflow.
Classify meaning, not keywords. A request may use any language or omit the name
of a workflow.

## Classification axes

### Domain

Choose every material domain, keeping `general` only when no specialized domain
applies.

| Domain | Signals and examples | Specialized skill |
| --- | --- | --- |
| `general` | feature, refactor, test, documentation, explanation | lifecycle skills |
| `debug` | failure, regression, crash, flaky behavior, root cause | `$beez-debug` |
| `migration` | upgrade, data/schema move, framework replacement, compatibility | `$beez-migrate` |
| `security` | vulnerability, secret, permissions, threat, dependency exposure | `$beez-security` |
| `release` | version, changelog, tag, publish, deploy, rollback | `$beez-release` |
| `performance` | latency, throughput, memory, bundle size, benchmark | `$beez-performance` |
| `github` | issue, pull request, review, branch policy, Actions, labels | `$beez-github` |

When domains overlap, order them by dependency and risk. For example, diagnose a
performance regression before optimizing it, and finish a migration plus its
security checks before preparing a release.

### Mode

Choose the strongest action the user actually authorized.

| Mode | Allowed outcome |
| --- | --- |
| `explain` | Answer from available evidence; no task mutation |
| `inspect` | Read and report; no implementation |
| `diagnose` | Reproduce and identify causes; no fix unless requested |
| `plan` | Produce a plan or specification; no implementation |
| `change` | Modify the scoped project and verify it |
| `verify` | Run checks and report evidence; repair only when requested |
| `review` | Assess and report findings; change only when requested |
| `execute` | Perform an explicitly requested repository or external operation |

Words such as "봐줘", "check", or "handle this" are ambiguous. Resolve them
from the requested outcome and surrounding context. If the outcome can be met by
inspection, do not silently upgrade it to `change`.

### Risk

- `low`: reversible, local, narrow, and covered by routine checks.
- `medium`: behavior or shared interfaces change, or rollback needs coordination.
- `high`: credentials, authorization, data integrity, public APIs, releases, or
  repository governance may be affected.
- `critical`: production data, destructive migration, secret exposure, incident
  response, or irreversible publication is involved.

Use the highest applicable risk. Higher risk increases evidence, review, and
rollback requirements; it never grants more authority.

### Side effects

- `none`: read-only reasoning, inspection, diagnosis, verification, or review.
- `local`: files or local runtime state within the scoped workspace.
- `repository`: commits, branches, issues, pull requests, labels, merges, tags,
  releases, or repository settings.
- `external-production`: deployment, publication, production data, live
  credentials, customer communication, or other operational systems.

Classify the furthest side effect required. Ask for direction when that effect
was not authorized and cannot be avoided.

## Constraint precedence

Apply instructions in this order:

1. system, safety, project boundaries, and applicable `AGENTS.md` rules;
2. explicit user prohibitions and scope limits;
3. explicit requested outcomes;
4. inferred routine implementation steps;
5. workflow defaults.

Negative constraints survive composition. "Fix the release notes but do not
publish" routes to `release/change` with `local` side effects, not
`release/execute`. "Find the bug; don't change anything" routes to
`debug/diagnose` with `none` side effects.

## Mixed requests

Split a mixed request into ordered subroutes. Reuse evidence between them, but
keep their permissions distinct. Examples:

- "Find the regression, fix it, then open a PR": `debug/diagnose` →
  `debug/change` → `github/execute`, ending at `repository` side effects.
- "Plan the database migration and review its security": `migration/plan` →
  `security/review`, with no implementation.
- "Optimize startup and release it, but don't deploy":
  `performance/change` → `release/change`; publication and deployment remain
  prohibited.

Do not let a later authorized action retroactively expand an earlier one. A
request to open a pull request authorizes the scoped repository operation after
the change; it does not authorize unrelated issue edits or merging.

## Ambiguity rule

Proceed with a stated, reversible assumption when it stays within scope and can
be verified. Pause only when alternatives materially change product behavior,
authority, destructive impact, cost, or external state. Record the assumption
in the plan or final report.
