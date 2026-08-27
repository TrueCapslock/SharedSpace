# Database

## Platform

SharedSpace uses PostgreSQL, initially hosted by Neon.

The database model must prioritize tenant isolation, referential integrity, auditability, and evolvability.

## Core entities

This is a conceptual starting point, not a final schema.

### User

Application-level identity independent from authentication provider details.

Possible fields:

- `id`
- `display_name`
- `email` (if appropriate as cached/profile data)
- `created_at`
- `updated_at`

External authentication identities should map to the internal user rather than becoming the domain primary key.

### Workspace

Tenant/root domain object.

Possible fields:

- `id`
- `name`
- `slug`
- `workspace_type`
- `settings`
- `created_at`
- `updated_at`

### WorkspaceMembership

Connects users and workspaces.

- `workspace_id`
- `user_id`
- membership status
- role/role references
- invitation/activation metadata

### WorkspaceModule

Records which capabilities are enabled and their configuration.

### Role / Permission

Authorization model. Keep it understandable; avoid an enterprise policy engine before requirements justify it.

## Domain entities

Expected entities include:

- Task
- Document
- Meeting
- MeetingItem / Case
- Decision
- Expense
- Resource
- Booking
- Notification
- Activity/AuditEvent

## Tenant ownership

Every tenant-owned record must have a clear path to a workspace.

Where appropriate, storing `workspace_id` directly on tenant-owned tables is preferred because it makes authorization scoping and database queries explicit even if another parent relation could theoretically derive it.

## IDs

Prefer opaque IDs that are safe to expose in URLs/APIs. Final UUID/ULID strategy remains an implementation decision.

## Timestamps

Use UTC in persistence. Convert to user/workspace timezone for display and calendar semantics.

## Soft deletion

Do not apply soft deletion universally. Use it only for entities where recovery/history/business requirements justify the additional query complexity.

## Auditability

Important operations should produce durable activity/audit records, especially:

- Membership/role changes
- Decisions
- Sensitive document operations
- Expense changes
- Booking changes
- Administrative configuration

Audit records must not become a dumping ground for secrets or unnecessary personal data.

## Files

File bytes live in object storage. PostgreSQL stores metadata, ownership, access information, and object references.

Never grant access to an object solely because a caller knows its storage key.

## Migrations

All schema changes must use version-controlled migrations. Production schema must not be modified manually.

## ORM / query layer

Not yet selected. Evaluate options based on:

- TanStack Start/server runtime compatibility
- Type safety
- Migration quality
- SQL transparency
- PostgreSQL support
- Serverless connection behavior
- Ability to express authorization-safe queries clearly
