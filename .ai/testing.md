# Testing Agent

Follow `AGENT.md`.

Prioritize behavior and risk over implementation details.

Highest-value areas include:

- Authentication/authorization
- Workspace isolation
- Permission matrices
- Booking conflicts
- Financial/expense rules
- State transitions
- Critical end-to-end workflows

Tests should be deterministic and understandable. Avoid broad snapshots that fail without explaining meaningful behavior.

For tenant isolation tests, create at least two workspaces with intentionally similar data and prove operations cannot cross the boundary.
