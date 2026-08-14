---
name: beez-debug
description: Diagnose software defects by reproducing symptoms, testing competing hypotheses, identifying an evidence-backed root cause, and adding regression protection when a fix is authorized. Use when requests mention bugs, crashes, flaky tests, CI-only failures, regressions, unexpected behavior, root-cause analysis, or Korean equivalents such as 오류, 실패, 원인, 재현, and 간헐적 문제.
---

# Debug with Evidence

Separate observation, diagnosis, remediation, and proof. A symptom is not a root
cause, and a disappearing failure is not proof of a fix.

## Establish authority

Classify the request before editing:

- diagnose only: inspect, reproduce, localize, and report; do not modify files;
- diagnose and fix: proceed through remediation and regression protection;
- verify an existing fix: test the claimed causal path and regression guard;
- incident execution: apply project and operational authorization gates before
  changing external systems.

Preserve explicit constraints such as "원인만", "수정하지 마", or "do not
rerun". Use `$using-beez-harness` for the overall route.

## Build a reproducible case

1. State expected behavior, observed behavior, earliest known occurrence, and
   affected scope.
2. Capture the smallest safe evidence: error type, relevant stack frames,
   command, exit state, timing, and environment differences. Redact secrets and
   personal data.
3. Reproduce with the narrowest deterministic command or input. Confirm the
   reproduction fails for the expected reason rather than a setup problem.
4. Reduce variables one at a time. Do not use retries, sleeps, skipped checks, or
   broadened timeouts as proof that flakiness is fixed.

Read [failure patterns](references/failure-patterns.md) for flaky, concurrent,
CI-only, crash, and environment-specific failures.

## Test hypotheses

Keep a short hypothesis table with the predicted observation, discriminating
check, and outcome. Prefer checks that can falsify a hypothesis. Localize the
failure across input, state, control flow, dependency, environment, and timing
boundaries.

Claim a root cause only when evidence explains the symptom and distinguishes it
from credible alternatives. If the defect remains unreproducible, report what
was ruled out, the missing evidence, and the smallest next diagnostic step.
Do not make speculative code changes.

## Remediate when authorized

1. Use `$beez-implement` for the smallest change at the causal boundary.
2. Avoid unrelated cleanup and avoid suppressing the symptom.
3. Add a regression guard that fails for the original causal condition and
   passes after the fix.
4. Use `$beez-verify` for the focused reproduction, affected tests, and declared
   project checks.
5. Use `$beez-review` for non-trivial, concurrent, security-sensitive, or
   production-impacting fixes.

## Report distinct evidence

Report these separately:

- reproduction: input or command and observed failure;
- root cause: causal mechanism and discriminating evidence;
- fix scope: changed boundary and why it is minimal, or `not changed`;
- regression evidence: guard and fresh verification results;
- residual risk: unreproduced environments, timing uncertainty, or follow-up.
