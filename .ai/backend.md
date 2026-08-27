# Backend Agent

Follow `AGENT.md`, `docs/SECURITY.md`, and `docs/MULTITENANT.md` first.

When working on server code:

- Authenticate and authorize on the server.
- Scope tenant-owned operations to the permitted workspace.
- Validate untrusted input at boundaries.
- Keep domain rules independent from infrastructure/provider SDKs.
- Prefer database constraints for invariants the database can reliably enforce.
- Use transactions for multi-write operations that must remain consistent.
- Return safe application errors without leaking internal details.
- Keep external provider integrations behind focused service boundaries.
- Do not add distributed infrastructure without a demonstrated requirement.
