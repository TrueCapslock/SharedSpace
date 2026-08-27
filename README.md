# SharedSpace

> Organize what you share.

SharedSpace is a modular platform for groups of people who share resources, responsibilities, decisions, documents, expenses, bookings, and work.

The initial use case is board work for housing cooperatives and condominiums, but the platform is intentionally designed to support additional workspace types such as shared cabins, boats, associations, clubs, and general projects.

## Product principles

- One flexible core instead of separate products for every use case.
- Workspace-based multi-tenancy from day one.
- Features are enabled as modules per workspace.
- Mobile-first and responsive.
- Light and dark mode.
- Strong permissions and auditability.
- AI should assist users, not hide important decisions.
- Avoid unnecessary vendor lock-in.

## Planned frontend stack

- React
- TanStack Start
- TanStack Router
- TanStack Query
- TanStack Form
- TanStack Table
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI primitives where appropriate

### Frontend conventions

- Routing goes through TanStack Router / TanStack Start.
- Server and client data fetching should use TanStack Query where appropriate.
- Complex forms should use TanStack Form.
- Data grids and tables should use TanStack Table.
- Reusable visual components belong in a shared UI layer rather than feature-local duplication.

## Planned platform stack

| Area | Choice | Initial cost model |
| --- | --- | --- |
| Source control | GitHub | Free for the current public repository; paid features may be added later |
| Hosting / web runtime | Vercel | Hobby is free for personal/non-commercial work; commercial production requires Pro or Enterprise |
| Database | Neon PostgreSQL | Free tier available for development and small workloads |
| Authentication | Clerk initially | Free tier available; application permissions remain owned by SharedSpace |
| Object/file storage | Cloudflare R2 | Monthly free allowance available |
| Cache / lightweight queues | Upstash Redis | Free tier available |
| Error monitoring | Sentry | Free developer tier available; verify current limits before production |
| Product analytics | PostHog | Generous usage-based free allowances |
| Transactional email | Resend | Free tier available |

Pricing and free-tier limits change over time. Before production launch, verify current limits, commercial-use restrictions, data residency, compliance requirements, and projected cost for every external service.

## Important hosting note

Vercel Hobby is intended for personal, non-commercial projects. It is suitable while SharedSpace is being developed as a personal project, but a commercial SharedSpace deployment must use an appropriate paid Vercel plan or an alternative hosting platform.

## Core domain concept

The primary tenant boundary is a `Workspace`.

A workspace represents the group/context being managed, for example:

- Housing cooperative / condominium
- Shared cabin
- Shared boat
- Association or club
- Project
- Custom workspace

A workspace can enable modules such as:

- Members
- Roles and permissions
- Tasks
- Documents
- Meetings
- Cases
- Decisions
- Expenses
- Bookings
- Notifications
- Activity / audit log
- AI assistant

## Repository documentation

- [Project plan](PROJECT_PLAN.md)
- [AI development instructions](AGENT.md)
- [Contributing](CONTRIBUTING.md)
- [Technology decisions](TECH_DECISIONS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Multi-tenancy](docs/MULTITENANT.md)
- [Security](docs/SECURITY.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [AI strategy](docs/AI.md)

## Status

SharedSpace is currently in the planning and foundation phase. The documentation in this repository is considered living documentation and should evolve together with the implementation.
