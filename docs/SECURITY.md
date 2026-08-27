# Security

## Security goals

SharedSpace will store information about groups, properties/resources, documents, decisions, bookings, and expenses. Security and privacy are product requirements.

## Authentication

Initial direction: Clerk.

Provider sessions establish identity. SharedSpace maps that identity to an internal user and independently evaluates workspace membership and permissions.

## Authorization

- Enforce authorization server-side.
- Default to deny when permission is unclear.
- Verify resource ownership/workspace association.
- Treat administrative actions as higher risk.
- Keep authorization logic centralized enough to test consistently.

## Tenant isolation

See `MULTITENANT.md`.

Cross-workspace data leakage is a release-blocking security issue.

## Secrets

- Store secrets in platform/environment secret stores.
- Never commit `.env` files containing secrets.
- Never expose server secrets through client-prefixed environment variables.
- Rotate credentials after accidental exposure.

## Input and output

- Validate untrusted input.
- Escape/render user-generated content safely.
- Treat uploaded files as untrusted.
- Validate file type/size and consider malware scanning as requirements evolve.
- Avoid leaking internal error details to users.

## File access

File metadata and permissions live in SharedSpace. Storage keys are not authorization tokens.

Prefer short-lived signed URLs or proxied access after permission checks.

## Invitations

Invitation flows should consider:

- Expiration
- Single/restricted use
- Intended workspace and role
- Revocation
- Email/account mismatch policy
- Audit trail

## Logging

Never intentionally log:

- Passwords
- Session tokens
- API secrets
- Full authentication headers
- Sensitive document contents

Minimize personal data in telemetry.

## AI

Before sending workspace content to an AI provider:

- Verify user access.
- Minimize data sent.
- Understand provider retention/training settings.
- Consider data residency and contractual requirements.
- Keep secrets and unrelated tenant data out of prompts.

AI-generated output must not silently become an authoritative decision or financial record.

## Privacy / compliance

Before commercial production, document and validate:

- GDPR roles and responsibilities
- Data processing agreements
- Subprocessors
- Data residency
- Retention/deletion policies
- User data export/deletion processes
- Cookie/analytics consent requirements
- Backup and recovery
- Incident response

## Dependency security

Keep dependencies current without blindly applying breaking upgrades. Use automated vulnerability reporting where practical and review high-impact dependency changes.
