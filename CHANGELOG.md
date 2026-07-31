# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic
Versioning.

## [Unreleased]

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
