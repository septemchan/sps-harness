Dispatch the compliance-reviewer agent to check code against project rules.

<!-- SETUP -->
Verify all four standards files (coding, testing, security, git) are loaded before starting. Report any missing file at the top of the output. If a standards file is missing, report it before proceeding.

If recent changes cannot be determined, audit the full codebase.

Read-only audit — do not modify any files.

<!-- PROCESS -->
Read coding-standards, testing-standards, security-standards, and git-standards, then audit recent changes for compliance.

<!-- OUTPUT -->
Output format:

1. Missing standards files (if any)
2. Compliance Score (0-100)
3. Findings grouped by severity:
   - VIOLATION — rule reference, file:line, evidence
   - WARNING — rule reference, file:line, evidence
   - SUGGESTION — rule reference, file:line, evidence
