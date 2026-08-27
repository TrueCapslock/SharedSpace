# SharedSpace Technology Decisions

This file records important technology choices and their rationale. Decisions may change; when they do, preserve the reasoning and document the replacement.

## Status vocabulary

- **Proposed** - preferred direction, not yet validated in implementation
- **Accepted** - current default
- **Superseded** - replaced by another decision

## TD-001 - GitHub for source control

**Status:** Accepted  
**Date:** 2026-08-27

Use GitHub for repository hosting, pull requests, issues, and CI through GitHub Actions.

**Why:** Mature ecosystem, good automation support, and strong integration with Vercel and development tooling.

**Exit strategy:** Standard Git repositories are portable. CI workflows would require adaptation when moving provider.

## TD-002 - Vercel for initial web hosting

**Status:** Accepted for development; commercial plan to be revisited  
**Date:** 2026-08-27

Use Vercel for development/preview deployments and initially as the web runtime.

**Why:** Excellent Git-based deployment workflow and a natural fit for modern React applications.

**Cost caveat:** Vercel Hobby is intended for personal/non-commercial use. Commercial production requires an appropriate paid plan or alternative hosting.

**Exit strategy:** Avoid Vercel-only business logic where practical. Keep application configuration portable enough to move to another Node-compatible/cloud runtime.

## TD-003 - React + TanStack

**Status:** Accepted  
**Date:** 2026-08-27

Use React with TanStack Start as the application foundation.

Use:

- TanStack Router for routing
- TanStack Query for server state
- TanStack Form for non-trivial forms
- TanStack Table for rich tabular UI

**Why:** Strong TypeScript support, composability, control over architecture, and a coherent set of primitives without requiring a heavy opinionated application framework.

**Exit strategy:** Domain/business logic should not depend unnecessarily on React or TanStack APIs.

## TD-004 - Tailwind CSS + shadcn/ui

**Status:** Accepted  
**Date:** 2026-08-27

Use Tailwind CSS with shadcn/ui and Radix primitives where appropriate.

**Why:** Fast product development while retaining ownership and control over component code and design.

**Exit strategy:** Components live in the codebase and can be progressively restyled/replaced.

## TD-005 - Neon PostgreSQL

**Status:** Accepted  
**Date:** 2026-08-27

Use PostgreSQL hosted by Neon.

**Why:** PostgreSQL is a strong fit for SharedSpace's relational domain and Neon provides developer-friendly managed/serverless PostgreSQL with a useful free tier.

**Exit strategy:** Stay on standard PostgreSQL features where practical. Database can migrate to another PostgreSQL provider.

## TD-006 - Clerk for initial authentication

**Status:** Proposed  
**Date:** 2026-08-27

Use Clerk initially for user authentication, but keep provider-specific code behind a thin application boundary.

SharedSpace owns roles, permissions, workspace membership, and authorization.

**Why:** Fast implementation of robust authentication/user flows while keeping application authorization under our control.

**Exit strategy:** Store domain identity/membership independently from Clerk-specific metadata. Maintain an internal user identifier and provider identity mapping.

## TD-007 - Cloudflare R2 for object storage

**Status:** Proposed  
**Date:** 2026-08-27

Use R2 for documents and attachments.

**Why:** S3-compatible object storage, low egress-cost model, and a free usage allowance suitable for early development.

**Exit strategy:** Use an internal storage abstraction and S3-compatible APIs where practical.

## TD-008 - Upstash Redis only when justified

**Status:** Proposed  
**Date:** 2026-08-27

Use Upstash Redis for workloads such as caching, rate limiting, or lightweight queues only when a concrete requirement exists.

**Why:** Serverless-friendly and simple to operate, but unnecessary infrastructure should not be added preemptively.

**Exit strategy:** Keep cache/queue usage behind small interfaces and never make Redis the canonical source of business data.

## TD-009 - Sentry for observability

**Status:** Proposed  
**Date:** 2026-08-27

Use Sentry for error and performance monitoring.

**Exit strategy:** Keep application logging based on standard structured logging concepts so another observability provider can replace it.

## TD-010 - PostHog for product analytics

**Status:** Proposed  
**Date:** 2026-08-27

Use PostHog for product analytics when analytics are introduced.

Privacy and consent requirements must be evaluated before enabling tracking in production.

**Exit strategy:** Centralize analytics calls behind a small application API rather than scattering provider calls throughout UI code.

## TD-011 - Resend for transactional email

**Status:** Proposed  
**Date:** 2026-08-27

Use Resend initially for invitations, notifications, and transactional email.

**Exit strategy:** Use an application mail service abstraction and keep templates independent of provider-specific APIs where reasonable.

## TD-012 - Workspace-based multi-tenancy

**Status:** Accepted  
**Date:** 2026-08-27

`Workspace` is the primary tenant boundary.

A workspace's type/template configures the initial experience, while modules determine available capabilities.

**Why:** This prevents the architecture from becoming tied to housing boards and allows the same platform to support cabins, boats, projects, and future scenarios.

## Open decisions

- ORM / SQL access strategy
- Validation library
- Test runner and browser testing stack
- Background job architecture
- Search strategy
- AI model/provider strategy
- Notification architecture
- Deployment architecture beyond the initial Vercel setup
- Data residency requirements
