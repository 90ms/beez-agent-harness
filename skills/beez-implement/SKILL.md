---
name: beez-implement
description: Implement software changes in small, behavior-focused slices while preserving unrelated work and collecting evidence after each slice. Use when building a planned feature, fixing a bug, changing behavior, or performing a scoped refactor.
---

# Implement Incrementally

Make the smallest change that satisfies the current acceptance criterion.

## Prepare

1. Read applicable guidance and the current task or plan.
2. Inspect repository status and the exact files involved.
3. Preserve unrelated user changes; do not clean or rewrite them.
4. Reproduce bugs before fixing them when reproduction is safe and possible.
5. Add a failing or characterization test first when behavior can be tested.

## Build one slice

For each task:

1. State the behavior being changed.
2. Implement the smallest coherent slice.
3. Run the narrowest relevant check.
4. Fix failures before starting another slice.
5. Update the plan or specification when repository evidence invalidates it.

Follow existing architecture and naming unless the specification intentionally
changes them. Validate data at boundaries. Keep public interface changes
explicit and update their consumers together.

Avoid:

- speculative abstractions;
- unrelated cleanup;
- broad formatting churn;
- silent fallback behavior;
- test changes that merely hide a regression.

## Commit checkpoints

Commit only when authorized. Each commit should represent one verified outcome
and exclude unrelated changes. Never bypass hooks or verification to produce a
commit.

## Handoff

Before declaring implementation complete:

- map changed behavior back to acceptance criteria;
- list tests or checks already run;
- pass the complete change to `$beez-verify`;
- request `$beez-review` for non-trivial or risky work.
