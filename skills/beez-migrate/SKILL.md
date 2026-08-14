---
name: beez-migrate
description: Plan and deliver reversible software, dependency, API, schema, data, protocol, and infrastructure migrations with explicit compatibility windows, cutover gates, and integrity evidence. Use when requests mention upgrades, migrations, backfills, framework or SDK replacement, schema changes, data movement, 호환성, 업그레이드, 이전, 전환, or 롤백.
---

# Migrate Safely

Treat migration as a transition between two valid states, not a single edit.
Preserve service and data invariants until an accepted cutover is complete.

## Classify the migration

Identify the source and target, affected consumers, and whether the change is:

- code-only: runtime, dependency, framework, SDK, API, protocol, or configuration;
- persistent-state: schema, data representation, backfill, storage, or infrastructure;
- mixed: code and persistent state must coexist across a rollout window.

Planning, dry runs, local changes, repository actions, and live execution are
different authorities. Never execute a production or destructive step without
explicit authority. Do not assume a backup, replica, or restore path exists;
verify it or record it as missing.

Read [migration variants](references/migration-variants.md) for conditional
checks across code-only, API, and persistent-state migrations.

## Define the transition contract

Before implementation, use `$beez-spec` and `$beez-plan` to record:

1. current and target versions or representations;
2. producers, consumers, owners, and external compatibility obligations;
3. invariants for behavior, availability, security, and data integrity;
4. a compatibility matrix for old/new readers and writers;
5. the accepted compatibility window and cutover conditions;
6. observable success metrics, stopping conditions, and failure signals;
7. rollback and roll-forward paths, including the last reversible point.

If a migration is irreversible, classify it as high risk, state why rollback is
unavailable, and require stronger pre-cutover evidence and an explicit decision.

## Sequence reversible stages

Prefer small stages that remain independently deployable and verifiable:

1. inventory dependencies and establish a baseline;
2. expand interfaces or storage so old and new forms can coexist;
3. update producers and consumers in dependency order;
4. dry-run or sample the transformation without mutating live state;
5. backfill or migrate in resumable, observable batches;
6. switch reads or traffic only after readiness checks pass;
7. monitor the compatibility window;
8. contract obsolete paths only after accepted cutover evidence.

Use `$beez-implement` for each scoped stage. Preserve backward compatibility
until the planned cutover point. Make repeated execution idempotent where
possible and define how to resume or compensate after partial failure.

## Verify each state

Use `$beez-verify` to test both the transition and the destination:

- old and new consumer compatibility;
- representative samples, counts, checksums, constraints, or domain invariants;
- empty, malformed, duplicate, maximum-size, and partially migrated states;
- dry-run equivalence and idempotent replay;
- rollback or roll-forward rehearsal at the safest available level;
- project checks and post-cutover observability.

Use `$beez-review` before destructive cleanup, public compatibility breaks,
security-sensitive changes, or live cutover.

## Stop safely

Stop when a consumer is unknown, integrity checks disagree, the recovery path is
untested, a partial failure cannot be resumed, or requested authority does not
cover the next side effect. Preserve the last known safe state and report the
decision needed.

## Report

Report inventory and invariants, completed stage, compatibility status,
integrity evidence, rollback/roll-forward readiness, cutover state, and any
remaining destructive cleanup separately. Never describe a dry run as a live
migration.
