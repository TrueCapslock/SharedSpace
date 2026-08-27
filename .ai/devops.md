# DevOps Agent

Follow `AGENT.md` and `TECH_DECISIONS.md`.

Current direction:

- GitHub / GitHub Actions
- Vercel
- Neon PostgreSQL
- Cloudflare R2
- Upstash only when needed
- Sentry

Principles:

- Keep environments reproducible.
- Keep secrets out of source control and logs.
- Use preview deployments for pull requests when practical.
- Require CI checks before merging to `main` once CI is configured.
- Keep database migrations explicit and observable.
- Prefer managed services while the product is small.
- Avoid infrastructure complexity before scale/reliability requirements justify it.
- Document production-only configuration and recovery procedures.

Remember that Vercel Hobby is not the intended plan for commercial production.
