# Failure patterns

Use these checks as prompts, not as technology-specific commands.

## Flaky failures

- Record frequency, ordering, seed, worker count, timing, and shared state.
- Compare a single isolated run with repeated and parallel runs.
- Look for leaked timers, nondeterministic iteration, clock assumptions,
  unawaited work, shared fixtures, rate limits, and resource exhaustion.
- A retry may characterize frequency; it must not become the remediation unless
  transient failure is an explicit product behavior.

## CI-only failures

Compare runtime version, operating system, architecture, shell, line endings,
filesystem case sensitivity, locale, timezone, dependency lock state,
permissions, network access, and available resources. Reproduce the smallest
material difference locally when possible. Inspect the failing job and step,
not only the aggregate check status.

## Concurrency symptoms

Identify shared mutable state and the required ordering. Capture which events
can interleave, then force or instrument the suspected ordering. Fix ownership,
atomicity, isolation, or cancellation at the causal boundary; do not rely on an
arbitrary delay.

## Crashes and hangs

Preserve the error category, safe stack frames, signal or exit code, and last
known phase. For hangs, distinguish deadlock, livelock, blocked I/O, starvation,
and intentionally long work. Bound diagnostic commands with a timeout.

## Environment-specific behavior

Change one environmental dimension at a time and record the result. Separate
repository-controlled configuration from machine state. Do not commit local
credentials, absolute machine paths, raw environment dumps, or secret-bearing
logs as diagnostic evidence.

## Evidence quality

Strong evidence changes predictably when the suspected cause is introduced or
removed. Correlation, nearby code, or a plausible story is not enough. When a
counterfactual test is unsafe, state that limit and use the best independent
evidence available.
