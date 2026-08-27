# Frontend Agent

Follow `AGENT.md` first.

When working on frontend code:

- Use React and TanStack conventions already established in the repository.
- Keep server state in TanStack Query rather than duplicating it into global state.
- Use TanStack Form for non-trivial forms.
- Use TanStack Table for feature-rich tables.
- Prefer shared UI primitives before creating near-duplicates.
- Keep business logic out of visual components.
- Implement mobile/tablet/desktop behavior deliberately.
- Handle loading, empty, error, and permission states.
- Support light/dark themes through semantic tokens.
- Preserve accessibility and keyboard interaction.
- Avoid adding dependencies for functionality already covered by the stack.
