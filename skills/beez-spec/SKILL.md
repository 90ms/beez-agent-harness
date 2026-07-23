---
name: beez-spec
description: Turn a software request into a bounded, testable specification before implementation. Use for new features, behavior changes, integrations, migrations, refactors with meaningful risk, or underspecified coding requests whose acceptance criteria and boundaries must be made explicit.
---

# Specify the Change

Convert the request and repository evidence into an implementable contract.

## Establish context

1. Inspect the relevant code, documentation, interfaces, and tests.
2. Separate known facts from assumptions.
3. Identify the user-visible outcome and affected consumers.
4. Ask only for a missing decision that would materially change the result.

Prefer repository evidence over generic conventions. Do not invent requirements.

## Write the specification

For a durable project feature, create or update `SPEC.md`. For a small scoped
change, keep the specification in the working response or plan.

Include:

1. **Problem** — what is currently difficult or incorrect.
2. **Outcome** — observable behavior after completion.
3. **In scope** — exact capabilities and surfaces.
4. **Out of scope** — tempting adjacent work that will not be done.
5. **Constraints** — compatibility, security, performance, and project rules.
6. **Behavior** — inputs, outputs, states, errors, and edge cases.
7. **Acceptance criteria** — independently verifiable statements.
8. **Verification** — tests, commands, or runtime evidence for each criterion.
9. **Risks and rollback** — include when failure has meaningful impact.

Use concrete language. Replace “handle errors” with the expected error behavior.

## Gate implementation

The specification is ready when:

- each requirement has observable acceptance criteria;
- project boundaries and non-goals are explicit;
- no material decision is hidden as an assumption;
- verification is possible with available tools.

When the user already requested implementation, proceed to planning once the
gate passes. Do not require a redundant approval for routine inferred details.
