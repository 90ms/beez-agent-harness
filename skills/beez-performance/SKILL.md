---
name: beez-performance
description: Diagnose and improve software latency, throughput, CPU, memory, database, bundle, startup, and frontend runtime behavior through representative baselines and controlled comparisons. Use when requests mention profiling, benchmarks, bottlenecks, regressions, optimization, slow queries, memory growth, bundle size, 성능, 속도, 지연, 병목, 최적화, or 메모리.
---

# Optimize from Comparable Evidence

Measure the user-relevant outcome before changing code. A faster isolated
operation is not automatically a faster or cheaper product.

## Select the mode

- diagnose: define workload, reproduce the symptom, profile, and report likely
  causal boundaries; do not optimize unless requested;
- optimize: make the smallest change supported by a measured bottleneck;
- verify regression: compare a candidate against an accepted baseline and
  budget without speculative changes;
- production experiment: require explicit authority, safe load limits,
  observability, abort conditions, and rollback.

Preserve requests such as "측정만", "explain without benchmarks", or "do not
change files". Do not run load tests against production or paid external systems
without explicit authority.

## Define a representative benchmark

Record:

1. user or system outcome and metric: median and tail latency, throughput, CPU,
   memory, allocations, I/O, query cost, startup, bundle, or frame behavior;
2. representative inputs, data size and shape, concurrency, cache state, and
   warm-up;
3. runtime, hardware or allocation, operating mode, dependencies, and material
   environment settings;
4. correctness, resource, cost, and maintainability invariants;
5. sample count, aggregation, variance, and meaningful improvement or regression
   threshold.

Read [measurement domains](references/measurement-domains.md) for conditional
guidance. Keep secrets, personal data, and sensitive production payloads out of
benchmark fixtures and persisted traces.

## Establish the baseline

Run the same workload enough times to expose variance and warm-up effects.
Record raw aggregate values without cherry-picking the best run. Check whether
instrumentation overhead, background work, thermal limits, network variability,
or cold caches dominate the signal.

If no trustworthy baseline can be obtained, stop optimization and report the
missing measurement capability. Do not substitute intuition for evidence.

## Localize the bottleneck

Use the narrowest applicable profiler, trace, query plan, allocation view,
runtime timeline, or instrumented counters. Form a hypothesis that predicts both
the observed cost and how a change will alter it. Separate the limiting resource
from downstream symptoms.

Use `$beez-debug` when investigating a performance regression or leak. Use
`$beez-security` when optimization changes validation, isolation, caching, or
sensitive data handling.

## Change one causal boundary

Use `$beez-spec` and `$beez-plan` when performance work changes architecture,
contracts, storage, or capacity. Use `$beez-implement` for a minimal change tied
to the measured bottleneck. Do not silently trade correctness, tail latency,
memory, CPU, network, storage, cloud cost, accessibility, or maintainability for
the headline metric.

## Remeasure under the same conditions

Use `$beez-verify` to run the baseline and candidate with the same workload and
material environment. Report absolute values, delta, variance, sample count,
and whether the result crosses the predefined threshold. Run correctness and
project checks independently. Reprofile when the improvement mechanism is not
explained by the expected bottleneck change.

Use `$beez-review` for architecture changes, caching, concurrency, query/index
changes, or tradeoffs across resource classes. Add a stable regression budget
only when CI noise and environment control make its threshold meaningful.

## Report

Report workload, environment, baseline, profile evidence, hypothesis, change,
after-result, variance, correctness evidence, tradeoffs, and residual risk.
Label microbenchmark conclusions narrowly unless end-to-end evidence connects
them to a user-visible outcome.
