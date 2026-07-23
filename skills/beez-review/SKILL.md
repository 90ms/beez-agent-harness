---
name: beez-review
description: Review a software change for correctness, regressions, security, data safety, test gaps, and maintainability, with prioritized actionable findings. Use before merge, for pull-request or diff reviews, after non-trivial implementation, or when the user explicitly asks for code review.
---

# Review the Change

Review the actual diff and its surrounding behavior. Do not implement fixes
unless the user also asks for them.

## Establish the review surface

1. Read applicable project guidance.
2. Inspect repository status and identify the intended base.
3. Read the complete diff plus relevant callers, tests, and contracts.
4. Separate change-introduced problems from pre-existing issues.

If the base or scope cannot be determined, state the limitation before drawing
conclusions.

## Review by risk

Check:

1. **Correctness** — state transitions, errors, edge cases, concurrency.
2. **Regression risk** — callers, compatibility, migrations, default behavior.
3. **Security and privacy** — trust boundaries, authorization, input, secrets.
4. **Data safety** — destructive operations, consistency, retry behavior.
5. **Verification** — missing tests, assertions that do not prove behavior.
6. **Maintainability** — unnecessary coupling or complexity that increases risk.

Prioritize issues that could change observable behavior. Do not inflate style
preferences into defects.

## Write findings first

For each finding include:

- severity: Critical, High, Medium, or Low;
- precise file and line;
- concrete failure scenario;
- why existing checks do not prevent it;
- smallest viable remediation.

Keep line ranges narrow. Combine findings with the same root cause.

If no findings remain, say so explicitly and mention residual verification or
coverage limitations. A clean review is not proof that runtime behavior passed;
use `$beez-verify` for that evidence.
