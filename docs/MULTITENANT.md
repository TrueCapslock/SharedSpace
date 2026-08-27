# Multi-tenancy

## Tenant model

A SharedSpace tenant is a `Workspace`.

Users may belong to zero, one, or many workspaces. Their permissions can differ between workspaces.

## Core invariant

A user must never be able to read, modify, infer, or enumerate another workspace's protected data unless explicitly authorized there.

Cross-workspace leakage is a critical security defect.

## Query rules

For tenant-owned data:

1. Establish authenticated application user.
2. Establish target workspace/resource.
3. Verify active membership and required permission.
4. Query/mutate using workspace-scoped conditions.
5. Verify nested resources belong to the same workspace.

Avoid fetch-by-ID-then-check patterns where a workspace-scoped query can enforce the boundary earlier.

## URLs

Workspace identifiers/slugs in URLs are navigation context, not proof of authorization.

## Caching

Every tenant-aware cache key must include sufficient workspace/user/permission context. Never cache protected workspace data under a globally reusable key.

## Files

File access is authorized through SharedSpace. Object-storage URLs/keys must not bypass workspace permissions.

Use short-lived signed access where appropriate.

## Search and AI

Indexes, embeddings, retrieval, and AI context must preserve workspace and resource-level access boundaries.

Never retrieve globally and filter sensitive results only after sending them to an AI provider.

## Background jobs

Every tenant-specific job payload must carry an explicit workspace context and re-check relevant authorization/business invariants where needed.

## Administration

Future support/admin tooling must use explicit elevated access with auditing. Do not implement hidden tenant bypasses as ordinary application behavior.

## Testing

Tenant isolation tests should deliberately create similar records in multiple workspaces and verify that reads, writes, search, files, exports, and AI retrieval cannot cross boundaries.
