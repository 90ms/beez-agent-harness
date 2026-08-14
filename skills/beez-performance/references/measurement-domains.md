# Measurement domains

Select the domain that represents the actual constraint and retain cross-resource
tradeoffs in the report.

## Latency and throughput

Measure representative concurrency and request mixes. Report median plus a tail
percentile when user experience depends on outliers. Distinguish queueing,
service time, retries, and downstream calls. Throughput gains that increase tail
latency or failure rate need explicit acceptance.

## CPU and memory

Separate steady-state use from startup and peaks. For memory, distinguish live
set, allocation rate, retained objects, native memory, caches, and process RSS.
For suspected leaks, compare growth across repeated equivalent workloads and
verify reclamation after lifecycle boundaries.

## Database and storage

Record representative cardinality, selectivity, schema, cache state, locks, and
transaction behavior. Inspect plans and actual runtime evidence where safe.
Index or query improvements must account for write amplification, storage,
maintenance, and correctness under concurrent writes.

## Bundle, startup, and frontend runtime

Measure shipped and parsed size separately, including compression where it
matches delivery. Connect bundle changes to loading and execution evidence.
For runtime responsiveness, include frame or long-task behavior, device class,
network, cache, hydration, and interaction workload as applicable.

## Microbenchmarks

Isolate the operation, prevent dead-code elimination, include setup only when it
belongs to the user cost, and account for warm-up and runtime optimization. Use
microbenchmarks to test a mechanism; do not generalize them to end-to-end
performance without corroborating measurement.

## Regression budgets

Choose a metric and threshold larger than normal noise, use a stable environment,
retain enough samples, and define the action on failure. Track baseline changes
intentionally so gradual regressions are not normalized away.
