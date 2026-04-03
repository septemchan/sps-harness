Dispatch the security-reviewer agent to audit this project for security vulnerabilities.

Read-only review — do not modify any files.

Scope: files changed since last commit + any file matching auth/login/password/payment/token/secret/credential patterns. List all files scanned and patterns matched in the report header.

If no changed files or pattern-matched files exist, report "No security-relevant files found" instead of fabricating findings.

Severity criteria:
- CRITICAL: exploitable without authentication
- HIGH: exploitable with authentication
- MEDIUM: requires specific conditions
- LOW: theoretical or defense-in-depth

Verdict criteria:
- Block: any CRITICAL or 2+ HIGH findings
- Warning: 1 HIGH or 3+ MEDIUM findings
- Approve: all others

Output format: files scanned, then CRITICAL/HIGH/MEDIUM/LOW findings, then Verdict (Block/Warning/Approve).
