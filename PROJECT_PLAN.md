# SharedSpace Project Plan

## Vision

Build a modern, flexible platform that makes it dramatically easier for groups to organize things they share.

SharedSpace starts with board work for housing cooperatives and condominiums, while the underlying product is designed for shared cabins, boats, associations, clubs, and project teams as well.

## Product hypothesis

Many apparently different collaboration scenarios share the same primitives:

- People and roles
- Shared resources
- Tasks and responsibilities
- Documents
- Meetings and discussions
- Decisions
- Expenses
- Reservations / bookings
- Notifications
- History and accountability

SharedSpace will build these primitives once and compose them into different workspace types through modules and configuration.

## Target workspace types

### Initial

1. Housing cooperative / condominium board
2. Shared cabin
3. Shared boat
4. General project

### Future possibilities

- Associations and clubs
- Family-owned property
- Shared equipment
- Volunteer groups
- Small committees
- Other member-governed organizations

## MVP

The first useful release should validate the workspace and module model rather than attempt to implement every possible feature.

### Foundation

- Authentication
- User profile
- Workspace creation
- Workspace switching
- Invitations
- Membership
- Roles and permissions
- Module configuration
- Responsive application shell
- Light and dark mode
- Audit/activity foundation

### Core modules

#### Dashboard

- Upcoming items
- Open tasks
- Recent activity
- Important documents
- Relevant notifications
- Module-specific widgets

#### Tasks

- Create and assign tasks
- Due dates
- Status and priority
- Comments/activity
- Links to related resources

#### Documents

- Upload and organize documents
- Metadata and categories
- Permissions
- Version/history strategy
- Search

#### Meetings and decisions

- Meetings
- Agenda
- Cases/items
- Notes/minutes
- Decisions
- Follow-up tasks

#### Expenses

- Register expenses
- Attach receipts
- Categorize expenses
- Track who paid
- Basic settlement/status model

#### Booking

Especially useful for cabins, boats, and other shared resources.

- Calendar
- Reservations
- Availability
- Booking rules
- Conflict prevention

## AI opportunities

AI is an assistant layer, not the source of truth.

Potential capabilities:

- Summarize meeting notes and minutes
- Draft meeting minutes
- Suggest action items from discussions
- Summarize long documents
- Semantic search across permitted documents
- Explain previous decisions and their context
- Draft messages and notices
- Suggest decision text
- Surface unresolved tasks and commitments

All AI functionality must respect workspace boundaries and permissions.

## Roadmap

### Phase 0 - Foundation and product design

- Establish documentation and engineering conventions
- Validate domain model
- Establish design system
- Define workspace/module architecture
- Create initial application skeleton
- Configure CI/CD
- Configure development and preview environments

### Phase 1 - Core platform

- Authentication
- Workspaces
- Membership and invitations
- Roles/permissions
- Dashboard
- Tasks
- Documents
- Notifications foundation

### Phase 2 - Board workflow

- Meetings
- Cases
- Decisions
- Minutes
- Follow-up tasks
- Board-specific workspace template

### Phase 3 - Shared resources

- Booking module
- Expenses
- Resource profiles
- Cabin workspace template
- Boat workspace template

### Phase 4 - Intelligence and automation

- AI assistant
- Document intelligence
- Meeting summaries
- Semantic search
- Notification rules
- Automation framework

### Phase 5 - Ecosystem

- Public/integration API
- Webhooks
- External integrations
- Additional workspace templates
- Import/export tools

## Non-functional goals

- Strong tenant isolation
- Secure-by-default authorization
- Excellent mobile UX
- Accessible UI
- Fast perceived performance
- Observable production system
- Data portability
- Testable modular architecture
- Low operational burden

## Idea bank

Ideas belong here before they are promoted to roadmap commitments.

- Shared maintenance log for cabins and boats
- Boat service log / engine hours
- Cabin inventory
- Polls and voting
- Recurring tasks
- Shared calendar
- Contractors/suppliers directory
- Asset register
- Budgeting
- Expense settlement
- E-signing integration
- Email ingestion
- Calendar integration
- Push notifications
- Offline-friendly mobile experience
- PWA installation
- Workspace templates
- Custom modules/fields
- AI-generated weekly workspace summary

## Open product questions

- Which workspace type should be used for the first end-to-end MVP?
- How configurable should modules be before custom configuration becomes complexity?
- Should a workspace contain multiple bookable resources from the beginning?
- Which permissions need resource-level granularity?
- What data residency requirements will commercial Norwegian customers expect?
- What is the long-term pricing model?

## Decision log

Major technical decisions belong in `TECH_DECISIONS.md`. Product decisions that materially change scope should be recorded here with date, decision, and rationale.

### 2026-08-27

- Project working name is **SharedSpace**.
- Product scope is broader than board portals and should support multiple kinds of shared ownership/work.
- `Workspace` is the core tenant/domain concept.
- Functionality should be modular rather than hard-coded around a single organization type.
