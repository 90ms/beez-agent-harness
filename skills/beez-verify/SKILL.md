---
name: beez-verify
description: Verify software changes with fresh, claim-specific evidence and report failures honestly. Use before declaring work complete, after implementation or bug fixes, when validating acceptance criteria, or whenever the user asks whether code, tests, builds, or runtime behavior actually work.
---

# Verify with Evidence

Verification proves claims. It is not a summary of implementation intent.

## Build an evidence map

1. List the claims that must be true.
2. Map each claim to the narrowest reliable evidence.
3. Read `.harness/project.json` for declared commands when present.
4. Confirm commands from project configuration before running guessed commands.

Use evidence in increasing scope:

1. focused unit or regression test;
2. affected package test, lint, or type check;
3. build or integration test;
4. runtime inspection for behavior that static checks cannot prove.

Do not run expensive or externally mutating checks without appropriate scope
and authority.

## Execute fresh checks

Run checks after the final relevant edit. Record:

- exact command or inspection;
- exit status;
- meaningful result;
- whether a failure is caused by the change, pre-existing, or unresolved.

For user interfaces, verify the rendered state and interaction when tools allow.
For bug fixes, prove both the original failure and the regression guard.

## Decide

Use one of these outcomes:

- **Verified** — all required claims have fresh supporting evidence.
- **Partially verified** — specify exactly what remains unproven and why.
- **Failed** — show the failing evidence and do not claim completion.

Never treat “the code looks right,” an earlier run, or another agent's statement
as current verification.

## Report

Keep the result compact:

- outcome;
- evidence by command or inspection;
- remaining risk or unavailable check.
