# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic
Versioning.

## [Unreleased]

## [0.4.0] - 2026-08-14

### Added

- Six specialized Agent Skills for evidence-backed debugging, reversible
  migrations, scoped security, gated releases, comparable performance work,
  and explicitly authorized GitHub operations, bringing the public inventory
  to 12 Skills.
- A multilingual natural-language routing contract across domain, mode, risk,
  and side-effect axes, with 56 Korean, English, and mixed-language acceptance
  cases plus provider-neutral result schemas and scoring.
- Named verification profiles, workflow metadata, bounded phase checkpoints,
  and optional project-relative artifact SHA-256 evidence in local runs.
- GitHub issue forms, pull request template, CODEOWNERS, contribution and
  governance conventions, dependency review, and grouped Actions updates.
- Release ancestry validation that requires the exact versioned commit to be
  reachable from `origin/main`.

### Changed

- Expanded generated agent guidance to compose specialized workflows while
  preserving negative constraints and separate diagnosis, change, repository,
  publication, and deployment authorities.
- Made Skill validation discover resources recursively and validate frontmatter,
  links, metadata, naming, size, newline, and repository path contracts.
- Added behavior/routing evaluation and package dry-run to Linux and Windows CI
  and to the tag-triggered release gate.
- Updated the v0.4 specification and all Korean and English installation,
  architecture, configuration, CLI, governance, troubleshooting, evaluation,
  and release documentation.

### Security

- Pinned every GitHub Action to an immutable full commit SHA, disabled persisted
  checkout credentials, bounded job runtimes, minimized permissions, and added
  pull request concurrency controls.
- Added Dependency graph-backed pull request review and documented protected
  branch, tag, npm Environment, private vulnerability reporting, and emergency
  bypass controls.
- Bounded checkpoint/event counts, phase and profile names, artifact paths,
  regular-file type, size, and digests without persisting artifact contents.
- Preserved compatibility with valid v0.2 and v0.3 project/run state while
  rejecting malformed workflow and release references.

## [0.3.0] - 2026-07-31

### Added

- Local run lifecycle commands with atomic manifests, append-only events,
  repository identity, configuration digests, resume, and terminal-run cleanup.
- Explicit project verification with required-command completion gates,
  per-command timeouts, and result metadata that excludes raw output.
- `doctor --json`, `init --dry-run`, and `update --diff`.
- Backward-compatible project verification configuration and run, event, and
  evaluation JSON schemas.
- Provider-neutral behavior evaluation fixtures and a deterministic scorer.
- Windows CI coverage alongside the Node.js 20, 22, and 24 Linux matrix.

### Changed

- Updated Korean and English guides, architecture, troubleshooting, Agent
  guidance, and the living specification for v0.3.
- Extended the Next.js preset with required test, lint, and build verification.

### Security

- Reject symlinked Harness paths before initialization, diagnosis, or managed
  updates can cross the project boundary.
- Store command digests and result metadata instead of command text,
  environment values, or raw stdout and stderr.
- Reject successful completion when required evidence is missing, stale,
  failed, timed out, or produced for changed project configuration.

## [0.2.0] - 2026-07-31

### Added

- Strict command option validation, command-specific help,
  `--preset=<name>`, and `--version` support.
- Bilingual configuration, CLI reference, troubleshooting, and release guides.
- A verified, OIDC-based npm and GitHub release workflow.

### Changed

- Made the Korean guide the default README and added a linked English version.
- Hardened runtime validation for manifests, managed paths, hashes, commands,
  and project boundaries.
- Made `doctor` compare managed guidance with its canonical generated content.

## [0.1.0] - 2026-07-24

### Added

- Initial v0.1 specification.
- Codex plugin and public repository scaffolding.
- Six lifecycle skills and Codex skill metadata.
- Zero-dependency project adapter CLI.
- Base and Next.js presets.
- Project initialization, drift detection, update, and health checks.
- JSON schemas, structural validation, tests, and continuous integration.
