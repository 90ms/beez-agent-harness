---
name: using-beez-harness
description: Route software work through the Beez Agent Harness lifecycle and apply the smallest appropriate workflow. Use when starting a coding task, feature, bug fix, refactor, verification, or review in a project that uses Beez Agent Harness, or when the user explicitly asks to use the Beez workflow.
---

# Use Beez Agent Harness

Route the request before changing files. Keep the workflow proportional to risk.

## Load project context

1. Read applicable `AGENTS.md` files.
2. Read `.harness/project.json` when present.
3. Use the project's declared commands and boundaries.
4. Inspect repository status before editing. Preserve unrelated user changes.

Continue without the adapter when it is absent; the skills must also work
standalone.

## Route the task

Use the following smallest sufficient route:

| Request | Route |
| --- | --- |
| Explanation or status | Inspect and answer |
| Small mechanical change | Implement → Verify |
| Feature or behavior change | Spec → Plan → Implement → Verify → Review |
| Bug fix | Reproduce → Implement → Verify regression → Review |
| Refactor | Specify preserved behavior → Plan → Implement → Verify → Review |
| Verification request | Verify |
| Review request | Review |
| Release or high-risk change | Full lifecycle plus rollback evidence |

Apply the corresponding installed Beez skills:

- `$beez-spec`
- `$beez-plan`
- `$beez-implement`
- `$beez-verify`
- `$beez-review`

If a referenced skill is unavailable, follow the route directly and state the
missing capability only when it materially affects the result.

## Enforce gates

- Do not broaden the user's requested scope.
- Do not implement while material requirements remain ambiguous.
- Do not claim completion without fresh verification evidence.
- Do not hide failing checks or unrelated pre-existing failures.
- Do not overwrite project-owned files with generated policy.
- Commit only when the user or project guidance authorizes commits.

For an end-to-end build request, move through the route without asking for
approval between routine phases. Pause only for a material product decision,
new authority, destructive action, or external side effect.

## Report

Lead with the outcome. Include:

- what changed or was learned;
- verification commands and results;
- remaining risks, failures, or decisions.
