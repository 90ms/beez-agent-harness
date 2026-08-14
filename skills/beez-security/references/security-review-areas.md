# Security review areas

Use architecture and threat scenarios to choose relevant checks. A checklist
without data-flow understanding is insufficient.

## Identity and access

- Authentication state, session lifecycle, recovery, multi-factor assumptions,
  and credential storage.
- Authorization on every server-side action and object, including tenant and
  ownership boundaries.
- Least privilege for service identities, tokens, jobs, and administrative
  paths; safe deny behavior when policy or dependencies fail.

## Input, output, and execution

- Parsing, canonicalization, validation, size limits, file and path handling,
  query construction, template rendering, command execution, and redirects.
- Context-appropriate output encoding and safe error messages.
- Resource exhaustion, decompression, recursion, concurrency, and timeout abuse.

## Secrets and sensitive data

- No secrets in source, logs, artifacts, client bundles, URLs, or diagnostics.
- Encryption and key ownership assumptions, retention, deletion, backups,
  exports, analytics, and cross-tenant isolation.
- Redaction and access control for observability and support tooling.

## Dependencies and supply chain

- Lockfile integrity, provenance, lifecycle scripts, abandoned packages,
  transitive exposure, build permissions, artifact integrity, and release
  credentials.
- Confirm affected versions and remediation from current maintainer advisories,
  registries, vulnerability databases, or vendor bulletins.

## Network and browser boundaries

- Origin, CORS, CSRF, SSRF, redirect, proxy trust, webhook authenticity, TLS,
  cache, cookie, and security-header assumptions where applicable.

## Verification quality

Static analysis and dependency scanning are inputs, not conclusions. Reconcile
tool findings with reachability and architecture. A passing scanner does not
cover runtime policy, business authorization, deployment configuration, or
unknown components.
