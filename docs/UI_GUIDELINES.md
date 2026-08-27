# UI Guidelines

## General

- Design for real workflows, not component showcases.
- Keep primary actions obvious.
- Avoid excessive dashboards full of low-value cards.
- Prefer plain language over administrative jargon.
- Preserve user context when moving between list and detail views.

## Responsive behavior

Every feature should define behavior for:

- Mobile
- Tablet
- Desktop

Do not rely on hover for required functionality.

## Loading

Use the least disruptive loading state appropriate to the interaction. Preserve existing content during background refetches when possible.

## Errors

Errors should explain what happened in user terms and provide a recovery action where possible. Technical diagnostics belong in observability systems.

## Permissions

If the user can view but not edit something, communicate that naturally. Do not show enabled actions that will predictably fail authorization.

Client-side hiding/disabling is UX only; server authorization remains mandatory.

## Destructive actions

Use confirmation when consequences are meaningful or difficult to undo. Confirmation copy should name the consequence rather than asking generic "Are you sure?" questions.

## Forms

- Label fields clearly.
- Validate at useful times without punishing users while typing.
- Preserve input after recoverable errors.
- Explain constraints before submission when possible.
- Mark optional fields rather than visually shouting about every required field.

## Dates and times

Store timestamps in UTC where appropriate, but display and collect calendar semantics in the relevant user/workspace timezone. Make ambiguous date ranges explicit.

## Accessibility

Keyboard navigation, focus management, screen-reader labeling, contrast, and reduced motion should be handled during implementation rather than postponed to a final accessibility pass.
