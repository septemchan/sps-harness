## Security Standards

Before every commit, verify:
- [ ] No hardcoded secrets (API keys, passwords, tokens) in source code
- [ ] All user inputs validated and sanitized
- [ ] Database queries use parameterized statements (SQL injection prevention)
- [ ] User-generated HTML is escaped (XSS prevention)
- [ ] CSRF protection enabled on state-changing endpoints
- [ ] Authentication and authorization verified on protected routes
- [ ] Rate limiting applied to public-facing endpoints
- [ ] Error messages expose only user-friendly descriptions, omitting stack traces, file paths, and version strings

Store secrets in environment variables or a secret manager. Validate required secrets are present at application startup, because missing secrets should fail loudly rather than silently.

Rotate any secret that may have been exposed immediately, because delayed rotation increases the window of vulnerability.

When a security issue is found: stop current work immediately, run /security-review, fix all CRITICAL issues before resuming. Use sps-harness's /security-review command to dispatch the security audit agent.

<!-- Added: 2026-03-30 | Source: ECC security.md adapted for Superpowers ecosystem | Reason: 建立安全实践基线 -->
