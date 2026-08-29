# Technical Decisions

Concise record of notable choices and the reasoning behind them. Add entries as
significant decisions are made; keep them short and link to code/docs.

## ORM / query layer — Drizzle

- **Status:** Adopted (Phase 1)
- **Instead of:** "TanStack DB" (a client-side reactive store, not a server ORM)
- **Why:** A multi-tenant web app needs a server-side query layer with schema,
  migrations, and SQL access. Drizzle adds type safety, PostgreSQL support, and
  versioned `drizzle-kit` migrations.
- **Driver:** `postgres-js` with `prepare: false` (required for Neon transaction
  pooling). See `docs/DATABASE.md`.

## Authentication — Clerk, behind an abstraction

- **Status:** Adopted
- **Why:** The application owns authorization; Clerk is only an identity
  provider. Clerk user IDs map to the internal `users` table rather than
  becoming domain primary keys.
- **Package:** `@clerk/tanstack-react-start` (the current package; replaced the
  deprecated `@clerk/tanstack-start`).
- **Server auth:** Uses Clerk's `auth()`/`getAuth` directly in server functions
  and route loaders (no dependency on request middleware), resolving identity
  from the request session on each call.
- **Degeneracy:** With no `CLERK_SECRET_KEY`, everything resolves to
  unauthenticated; protected routes show a "sign in required" blocker. Real
  setup is driven by `npx clerk@latest init` (CLI) when keys are available.
- **ClerkProvider** is mounted in the root shell (inside `<body>`) and activates
  only when `VITE_CLERK_PUBLISHABLE_KEY` is set.

## Authorization model

- **Status:** Adopted (Phase 1)
- Workspaces provision four built-in per-workspace roles (`owner`, `admin`,
  `member`, `viewer`) at creation, each mapped to a set of permissions in a
  global static catalog (`src/server/authorization/permissions.ts`).
- Every server operation derives the authenticated user, then verifies the
  required permission against the target workspace via
  `requireWorkspacePermission` (`src/server/authorization/authorize.ts`).
- Nested resources are always checked to belong to the requested workspace
  (multitenancy invariant — see `docs/MULTITENANT.md`).

## Client data fetching — TanStack Query

- Adopted for server-state caching/invalidation in the app UI (already part of
  the scaffold). Server functions (`src/server/api/*`) are the boundary.

## Type-safe server-function boundary

- Server functions validate input with **Zod** and return explicitly-typed,
  serializable DTOs (via `JsonValue`) to satisfy TanStack Start's strict
  serialization checks. See `src/server/api/*`.

## Linting

- `@typescript-eslint/no-unnecessary-condition` is disabled: Drizzle types
  `.returning()` as always-non-empty (`[T, ...T[]]`), producing false positives
  on legitimate not-found guards for DB writes.
