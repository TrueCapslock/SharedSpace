# SharedSpace Design System

## Design direction

SharedSpace should feel modern, calm, capable, and approachable. Avoid the dense, bureaucratic appearance common in traditional administration/property-management software.

The UI must work equally well for a board member reviewing decisions, a cabin co-owner booking a weekend, and a project participant checking tasks.

## Principles

### Clarity before decoration

The user's current context, important actions, and outstanding responsibilities should be immediately understandable.

### Progressive disclosure

Show common actions first. Advanced configuration should not dominate everyday workflows.

### Responsive by design

Do not create a desktop UI and later squeeze it onto mobile. Navigation, tables, dialogs, forms, and calendars need deliberate mobile behavior.

### Accessible

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Sufficient contrast
- Accessible labels
- Do not communicate state through color alone
- Respect reduced-motion preferences

### Light and dark mode

Both are first-class themes. Components must use semantic design tokens rather than hard-coded theme-specific values.

## Component foundation

Use:

- Tailwind CSS
- shadcn/ui
- Radix primitives where appropriate

shadcn components are starting points owned by the application, not an immutable external design system.

## Suggested semantic tokens

Design tokens should describe purpose rather than literal color:

- background
- surface
- elevated surface
- foreground
- muted foreground
- border
- primary
- secondary
- accent
- success
- warning
- destructive
- info

Final brand palette is intentionally undecided.

## Layout

The application should have a consistent workspace shell containing:

- Workspace switcher
- Primary module navigation
- Contextual page header
- User/profile controls
- Notifications
- Main content region

Mobile navigation may use a different interaction model while preserving the same information architecture.

## Tables

Desktop tables should progressively transform on narrow screens rather than relying on unusable horizontal scrolling for primary workflows. Depending on content, use cards, prioritized columns, expandable rows, or dedicated detail screens.

## Dialogs

Use dialogs for focused, bounded tasks. Do not turn complex multi-step workflows into enormous modal applications.

## Empty states

Empty states should explain what belongs there and offer the next useful action when the user has permission to perform it.

## Status

Use consistent language and visual treatment for status across modules. Avoid creating a unique status vocabulary for every feature unless the domain requires it.

## Motion

Motion should clarify state changes and hierarchy, not provide decoration. Keep transitions subtle and respect reduced-motion preferences.
