---
name: beez-plan
description: Decompose an accepted software specification into small, ordered, verifiable implementation tasks. Use when work spans multiple files or components, has dependencies or migration risk, or needs a concrete execution plan with acceptance evidence.
---

# Plan the Work

Produce an execution map, not a restatement of the specification.

## Inspect before planning

1. Read the specification and applicable project guidance.
2. Locate the relevant implementation, tests, interfaces, and configuration.
3. Confirm actual commands and conventions from the repository.
4. Identify dependencies, risky boundaries, and existing user changes.

## Decompose

Create the thinnest independently verifiable slices. Prefer vertical behavior
over layer-wide batches.

Each task must contain:

- outcome;
- likely files or components;
- dependencies;
- implementation action;
- acceptance check;
- exact verification command or evidence;
- rollback note when the task changes persistent state or public contracts.

Order tasks so that:

1. characterization or failing tests protect existing behavior;
2. contracts and boundaries stabilize before consumers;
3. each implementation slice can be verified immediately;
4. broad cleanup follows the behavior change, not precedes it.

Write `tasks/plan.md` for durable multi-step work when the project wants plan
artifacts. Otherwise keep the plan in the task tracker or response.

## Check plan quality

Reject and revise a plan when:

- a task combines unrelated outcomes;
- “implement feature” has no smaller observable slice;
- verification is deferred to the end;
- an assumed file or command has not been inspected;
- migration, compatibility, or rollback risk is ignored.

Proceed to implementation when every acceptance criterion is covered by at
least one task and every task has evidence.
