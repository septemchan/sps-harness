## Git Standards

Format commit messages as `<type>: <description>` (auto-validated by commit-guard hook), because consistent formatting makes history scannable and enables changelog generation.

Valid types: feat, fix, refactor, docs, test, chore, perf, ci.

Examples:
- `feat: add user authentication flow`
- `fix: prevent duplicate form submissions`
- `refactor: extract validation into shared utility`

When creating pull requests:
1. Analyze the full commit history with `git diff [base-branch]...HEAD`, not just the latest commit
2. Write a summary covering what changed and why
3. Include a test plan with specific verification steps
4. Push with `-u` flag for new branches

Use feature branches for all work. Create branches from main, merge back via PR. Avoid pushing directly to main, because direct pushes bypass review and can introduce regressions.

<!-- Added: 2026-03-30 | Source: ECC git-workflow.md adapted for Superpowers ecosystem | Reason: 统一 git 协作规范 -->
