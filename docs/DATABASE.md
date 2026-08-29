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

**Decision: Drizzle ORM** (with `postgres-js` driver).

- Selected over the initially-considered "TanStack DB" reactive client-side store, which is not a server-side ORM (no schema/migrations/SQL). For a multi-tenant web app a real server-side query layer is required.
- Type-safe queries, strong PostgreSQL support, and version-controlled migrations via `drizzle-kit`.
- Serverless-friendly: postgres-js client uses `prepare: false`, required for Neon-style transaction pooling.

Migration workflow:

```bash
npm run db:generate   # create a new migration from changes to src/server/db/schema.ts
npm run db:migrate    # apply migrations (drizzle-kit, CLI)
npm run db:migrate:run# apply migrations at runtime (drizzle-orm migrator, for serverless)
npm run db:push       # dev-only, push schema directly
npm run db:seed       # idempotent seed of the global permission catalog
npm run db:studio     # inspect DB
```

Schema lives in `src/server/db/schema.ts`; generated migrations in `src/server/db/migrations`.

## Implemented schema

The Phase 1 schema is implemented in `src/server/db/schema.ts` (migration `0000`). Core tables:

- `users` — app-level identity, mapped from Clerk via `clerk_id` (unique). Auth providers never become the domain PK.
- `workspaces` — tenant root (`name`, `slug`, `workspace_type`, `settings`, `created_by_id`).
- `roles` — per-workspace roles. The four built-in roles (`owner`, `admin`, `member`, `viewer`) are provisioned automatically on workspace creation.
- `permissions` — global static capability catalog (seeded, e.g. `tasks:create`, `members:read`).
- `role_permissions` — composite-PK join between roles and permissions.
- `workspace_modules` — which capabilities are enabled per workspace and their config.
- `workspace_memberships` — links users to workspaces (`status`, `role_id`), unique per (user, workspace).
- `invitations` — email invites with an opaque `token`, status, expiry, assigned role.
- `tasks` — title, description, status, priority, assignee, due date; `workspace_id` indexed.
- `documents` — file metadata (`name`, `storage_key`, `mime_type`, `size_bytes`); bytes live in object storage.
- `notifications` — per-user notifications (`user_id`, `workspace_id`, `read_at`).
- `activity_events` — durable audit trail (`workspace_id`, `actor_id`, `action`, `entity_type`, `metadata`).

Every tenant-owned table carries `workspace_id` directly, making authorization scoping and queries explicit (see `MULTITENANT.md`).
