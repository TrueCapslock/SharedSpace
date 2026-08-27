# Security Agent

Follow `docs/SECURITY.md` and `docs/MULTITENANT.md`.

Review changes with special attention to:

- Cross-workspace data access
- Missing server authorization
- IDOR-style resource access
- Invitation/account takeover paths
- File access bypasses
- Secret exposure
- Injection and unsafe rendering
- Sensitive telemetry
- AI permission/data leakage
- Rate-limit/abuse risks

Prioritize concrete exploitable risks over speculative checklist noise. Security fixes should include regression tests when practical.
