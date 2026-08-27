# Architecture

## Overview

SharedSpace is a modular, multi-tenant web application centered around the `Workspace` domain concept.

Initial architecture:

```text
Browser / PWA
     |
     v
React + TanStack Start
     |
     +---- Authentication provider (Clerk - proposed)
     |
     +---- Application/server functions
               |
               +---- Neon PostgreSQL
               +---- Cloudflare R2 (documents)
               +---- Upstash Redis (only when needed)
               +---- Resend (email)
               +---- AI provider(s)
               +---- Sentry / PostHog
```

The initial preference is to keep server behavior with the TanStack Start application rather than create a separate backend service without a demonstrated need.

## Architectural goals

- Strong workspace isolation
- Modular product capabilities
- Type-safe end-to-end development
- Clear separation between UI, domain logic, and infrastructure
- Low operational complexity
- Replaceable external providers
- Testable business rules
- Progressive scalability rather than speculative distributed architecture

## Suggested source organization

The exact structure will be validated when bootstrapping the app. Directionally:

```text
src/
  components/
  features/
    workspaces/
    members/
    tasks/
    documents/
    meetings/
    decisions/
    expenses/
    bookings/
    notifications/
  lib/
  routes/
  server/
    auth/
    db/
    permissions/
    services/
  styles/
```

If the repository later becomes a monorepo, shared packages can be extracted when real reuse justifies it. Do not start with a complex monorepo solely for hypothetical future applications.

## Data flow

### Server state

Use TanStack Query where client caching, invalidation, background refetching, or optimistic behavior provides value.

### Routing

All application routing goes through TanStack Router / TanStack Start conventions.

### Forms

Use TanStack Form for non-trivial forms and central validation schemas at trusted boundaries.

### Tables

Use TanStack Table for tables requiring sorting, filtering, selection, pagination, or custom rendering.

## Module architecture

Modules represent capabilities rather than tenant types.

Examples:

- Tasks
- Documents
- Meetings
- Decisions
- Expenses
- Booking

Workspace templates can enable sensible module defaults:

```text
Housing board -> Meetings + Decisions + Documents + Tasks + Expenses
Cabin         -> Booking + Tasks + Expenses + Documents
Boat          -> Booking + Tasks + Expenses + Documents + Maintenance (future)
Project       -> Tasks + Documents + Meetings + Decisions
```

A template is configuration, not a separate application architecture.

## Authorization boundary

Every server operation must derive the authenticated user and verify permission against the target workspace/resource.

Do not treat route guards, hidden buttons, or client state as authorization.

## External services

Provider-specific SDKs should be kept near infrastructure boundaries. Core domain logic should not depend directly on Clerk, R2, Resend, PostHog, or an AI vendor.

## Background work

Do not introduce a job system until asynchronous work requires it. Likely future workloads include document processing, email delivery orchestration, AI indexing, recurring tasks, and notification fan-out.

## Evolution

Split services only when concrete constraints justify the operational complexity: independent scaling, security isolation, runtime requirements, or team ownership. A modular application is preferred over premature microservices.
