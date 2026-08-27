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
