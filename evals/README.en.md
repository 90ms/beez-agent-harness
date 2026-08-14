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

## Natural-language routing evaluation

`routing-cases.json` contains 56 Korean, English, and mixed-language requests.
Each case defines the expected domain, mode, risk, side effect, required Skills,
and forbidden actions. The corpus gives explicit coverage to negative
constraints such as "do not edit" and "do not publish", plus requests that
compose multiple workflows.

A routing runner produces `schemas/routing-result.schema.json`, which can be
compared with the suite using:

```bash
node scripts/evaluate-routing.mjs \
  evals/routing-cases.json path/to/routing-result.json
```

Every classification axis must match, required Skills must be selected, and no
forbidden action may be selected. Beez does not call a particular model, so the
same corpus can compare different agents or Skill versions.
