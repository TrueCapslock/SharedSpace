# Contributing to SharedSpace

## Principles

- Keep changes focused.
- Prefer small, reviewable pull requests.
- Keep documentation and implementation aligned.
- Preserve workspace isolation and server-side authorization.
- Avoid unrelated refactors inside feature changes.

## Suggested workflow

1. Create or select a GitHub issue for meaningful work.
2. Create a branch from `main`.
3. Implement the smallest coherent change.
4. Add/update tests.
5. Run formatting, linting, type checking, and tests locally.
6. Update relevant documentation.
7. Open a pull request describing what changed and why.
8. Use preview deployment for UI/behavior verification when available.
9. Merge only when CI succeeds.

## Branch naming

Suggested patterns:

- `feature/<short-name>`
- `fix/<short-name>`
- `docs/<short-name>`
- `refactor/<short-name>`
- `chore/<short-name>`

## Commits

Prefer Conventional Commit-style messages:

- `feat: add workspace switcher`
- `fix: prevent cross-workspace task lookup`
- `docs: document booking module`
- `refactor: extract permission evaluator`
- `chore: update dependencies`

## Pull requests

A good PR explains:

- Problem / motivation
- Solution
- Important implementation choices
- Security or tenancy implications
- Screenshots for meaningful UI changes
- Testing performed
- Follow-up work intentionally left out

## Quality gates

The exact commands will be added when the application skeleton is created. CI should eventually enforce:

- Formatting
- Linting
- Type checking
- Unit/integration tests
- Build
- Dependency/security checks where useful

## Database changes

- Use migrations; do not manually mutate production schema.
- Keep migrations deterministic.
- Consider existing data when adding required columns or constraints.
- Explain destructive migrations explicitly.
- Tenant-owned tables must maintain a clear workspace relationship.

## Security-sensitive changes

Authorization, invitations, file access, exports, payments/expenses, AI data access, and tenant boundaries deserve additional review and tests.

Client-side visibility checks never replace server-side authorization.

## Dependencies

Before adding a package, ask:

1. Does the current stack already solve this?
2. Is the package actively maintained?
3. Is the license acceptable?
4. Is its bundle/runtime cost justified?
5. Is it being introduced for one trivial helper function?

## Documentation

Update the appropriate docs whenever a change materially alters architecture, data model, API behavior, permissions, deployment, or product direction.
