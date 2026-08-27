# Database Agent

Follow `AGENT.md`, `docs/DATABASE.md`, and `docs/MULTITENANT.md` first.

- Preserve explicit workspace ownership for tenant data.
- Prefer referential integrity and database constraints for durable invariants.
- Use version-controlled migrations.
- Consider existing production data in every migration.
- Avoid N+1 query patterns and unbounded reads.
- Make tenant scoping obvious in sensitive queries.
- Do not use Redis/cache as canonical business storage.
- Treat destructive migrations as high risk and document rollback/migration strategy.
