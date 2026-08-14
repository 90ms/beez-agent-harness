# Migration variants

Select only the sections that match the scoped transition.

## Runtime, dependency, or framework

Inventory lockfiles, build environments, plugins, generated code, transitive
constraints, and supported runtimes. Read upstream migration notes from primary
sources. Separate mechanical API changes from behavior changes. Verify clean
installation, build output, tests, and supported runtime matrices.

## SDK, API, or protocol

Map every producer and consumer. Define version negotiation, deprecation, error
semantics, field defaults, ordering, pagination, retry, timeout, and
serialization compatibility. Prefer adapters or dual support during the
compatibility window. Do not remove old behavior until usage and owner approval
meet the cutover condition.

## Schema or persistent data

Use expand-contract where practical. Decide how old and new binaries read and
write each intermediate schema. Make backfills bounded, resumable, observable,
and safe to retry. Record batch identity and progress without persisting secrets
or sensitive row contents. Validate counts and domain invariants, not only
successful command exit.

## Infrastructure or configuration

Inventory state ownership, drift, credentials, network boundaries, quotas, and
dependent services. Preview changes when the platform supports it. Distinguish
repository configuration from live state and require authority for the latter.

## Partial failure

Define the durable checkpoint, how completed work is detected, and whether the
next action is retry, compensate, roll back, or roll forward. Stop if repeated
execution can duplicate or corrupt state. Keep destructive cleanup outside the
recovery path until the migration is proven complete.
