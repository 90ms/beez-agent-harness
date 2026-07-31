# Architecture

Beez Agent Harness is not an agent runtime. It is a thin control layer that
connects reusable Agent Skills, project-owned rules, and local run evidence.

## Components

```text
Global plugin
└── skills/                     reusable workflows

Project adapter
├── AGENTS.md                   agent entry point
└── .harness/
    ├── manifest.json           applied version and managed files
    ├── project.json            project commands and boundaries
    ├── generated/AGENTS.md     harness-generated guidance
    └── runs/<run-id>/          task execution evidence
```

The project owns `project.json`, while the harness owns `generated/`. The CLI
creates operational records under `runs/`, and package updates never manage
those records.

## v0.3 run states

Every run starts as `active` and ends as `completed`, `failed`, or `cancelled`.
Completion is allowed only after all required verification passes.

```text
active -> completed
       -> failed
       -> cancelled
```

The run manifest records the configuration digest, Git baseline, timestamps,
and verification results. It does not persist command text, environment values,
raw stdout/stderr, or model transcripts by default.

`run resume` preserves the active state while appending a resume event. `run
gc` removes only terminal runs older than the requested retention count and
never deletes an active run.

## Safety boundaries

- Preview and check commands do not write files.
- Verification runs only a command registered in `project.json` and selected by
  the operator.
- Managed updates remain confined to `.harness/generated/`.
- Structured state replacement uses a temporary file followed by rename.
- The CLI does not call model APIs, send telemetry, mutate Git, or publish.

See [`SPEC.md`](../../SPEC.md) for the complete contract and acceptance criteria.
