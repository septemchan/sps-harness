## Security Standards

Secrets and console.log are auto-checked by commit-guard hook. When the hook is unavailable, verify manually before committing:
- Hardcoded secrets → commit-guard.js auto-scans on every commit
- console.log / debugger → commit-guard.js auto-detects on every commit

Before every commit, manually verify:
- [ ] All user inputs validated and sanitized
- [ ] Database queries use parameterized statements (SQL injection prevention)
- [ ] User-generated HTML is escaped (XSS prevention)
- [ ] CSRF protection enabled on state-changing endpoints
- [ ] Authentication and authorization verified on protected routes
- [ ] Rate limiting applied to public-facing endpoints
- [ ] Error messages expose only user-friendly descriptions, omitting stack traces, file paths, and version strings

Store secrets in environment variables or a secret manager. Validate required secrets are present at application startup, because missing secrets should fail loudly rather than silently.

Rotate any secret that may have been exposed immediately, because delayed rotation increases the window of vulnerability.

When a security issue is found: stop current work immediately, run /security-review, fix all critical-severity issues before resuming.

<!-- Added: 2026-03-30 | Source: ECC security.md adapted for Superpowers ecosystem | Reason: 建立安全实践基线 -->
