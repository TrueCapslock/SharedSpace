# API

## Direction

SharedSpace initially uses the server capabilities provided by TanStack Start. A separate public REST/GraphQL API is not required for the first version.

The internal API surface should nevertheless have clear service boundaries so external APIs can be added later without exposing database implementation details.

## Principles

- Authenticate on the server.
- Authorize every protected operation.
- Scope tenant-owned operations to a permitted workspace.
- Validate untrusted input.
- Return stable application-level errors.
- Do not expose database records indiscriminately.
- Keep secrets and provider credentials server-only.
- Prefer idempotent behavior where retries are realistic.

## Resource context

Avoid APIs that accept a `workspaceId` and then blindly trust it.

The server must verify that the authenticated user has the required permission in the target workspace and, for nested resources, that the resource belongs to that workspace.

## Implemented server-function surface

Phase 1 exposes operations as TanStack Start server functions (`createServerFn`)
in `src/server/api/*`, grouped by domain. Each takes the relevant
`workspaceId`, validates input with Zod, and runs through the shared authorization
layer before touching the database.

- `src/server/api/workspaces.ts`: `getMe`, `getWorkspaces`, `getWorkspacePermissions`, `createWorkspaceFn`
- `src/server/api/members.ts`: `getMembers`, `getRoles`, `updateMemberRoleFn`, `removeMemberFn`, `inviteMemberFn`, `getInvitations`, `revokeInvitationFn`, `acceptInvitationFn`
- `src/server/api/tasks.ts`: `getTasks`, `createTaskFn`, `updateTaskFn`, `deleteTaskFn`
- `src/server/api/documents.ts`: `getDocuments`, `createDocumentFn`, `updateDocumentFn`, `deleteDocumentFn`
- `src/server/api/notifications.ts`: `getNotifications`, `getUnreadCount`, `markNotificationReadFn`, `markAllReadFn`

Domain services live in `src/server/<domain>/service.ts` (workspaces, memberships,
invitations, tasks, documents, notifications, roles, activity, users). The API
layer keeps validation + serializable DTOs at the boundary.

## Future public API

Potential future capabilities:

- Workspace/member integration
- Tasks
- Documents metadata
- Bookings
- Meetings and decisions
- Webhooks
- Import/export

A public API should be versioned and designed separately from internal UI/server function contracts.

## Errors

Expose user-safe errors. Internal diagnostics belong in observability tooling and must not leak secrets, SQL, tokens, or sensitive cross-tenant information.

## Rate limiting

Add rate limits where abuse or expensive operations justify them, especially authentication-adjacent endpoints, invitations, email, file operations, exports, and AI requests.
