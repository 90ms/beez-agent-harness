# Behavior evaluation

This directory defines a provider-neutral contract for comparing software-task
results produced with Beez Agent Harness.

## Criteria

| Criterion | Weight |
|---|---:|
| Requirements met | 35 |
| Tests passed | 25 |
| Requested scope preserved | 15 |
| Verification commands run | 15 |
| Completion claims backed by evidence | 10 |

A result passes with a score of at least 85 when both `requirementsMet` and
`testsPassed` are also true.

## Usage

The task runner produces a result matching
`schemas/evaluation-result.schema.json`. Beez does not call a model; it scores
submitted results deterministically.

```bash
node scripts/evaluate.mjs evals/fixtures/passing-result.json
```

Use the same case and adjudication procedure when comparing models or Skill
versions. Environment-dependent values such as duration, tokens, cost, or
changed-file counts can be recorded under `metrics` but do not affect the base
score.

`cases/` contains task contracts. `fixtures/` contains example results that
exercise the scorer itself.
