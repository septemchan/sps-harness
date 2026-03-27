# Init Templates

Use these templates when guiding new project setup or when a dimension scores 0. Tailor to the project's detected tech stack and structure.

## Structure (Dimension 1)

```
.claude/
  CLAUDE.md              ← project instructions, under 100 lines
  rules/
    code-style.md        ← coding conventions
  commands/
    verify.md            ← verification command
  docs/
    spec.md              ← project specification
    iterate-log.md       ← evolution log
```

## Architecture Constraints (Dimension 2)

Path-scoped rule example:
```yaml
# .claude/rules/frontend.md
---
paths:
  - "src/components/**"
  - "src/pages/**"
---
- Use TypeScript strict mode
- Components must be functional, not class-based
```

## Agent Design (Dimension 3)

Read-only agent example:
```markdown
# .claude/agents/reviewer.md
---
name: reviewer
allowedTools:
  - Read
  - Glob
  - Grep
  - Bash(git diff*)
  - Bash(git log*)
---
You are a code reviewer. Analyze code quality and suggest improvements.
You cannot modify files directly.
```

## Quality Gates (Dimension 4)

Hooks configuration example:
```jsonc
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit", "command": "echo 'File modified: $TOOL_INPUT_PATH'" }
    ],
    "Stop": [
      { "command": "echo 'Task completed. Review changes before committing.'" }
    ]
  }
}
```

## Eval Coverage (Dimension 5)

- Add `evals/` directory to each skill with test inputs and expected outputs
- Mark tested rules in iterate-log with "Status: Verified"
- Add "Source:" annotations to rule files explaining their origin

## Evolution Tracking (Dimension 6)

Iterate-log example:
```markdown
# Iterate Log

## 2026-03-27
- **Added**: code-style rule for consistent naming
- **Source**: manual observation during review
- **Status**: Verified
- **Escalation**: Instinct → Rule (promoted after 3 consistent occurrences)
```

## Health Maintenance (Dimension 7)

- Keep each rule file focused and under 300 lines; split by topic when needed
- Review rules quarterly to catch contradictions
- Update or archive docs/ files at least every 90 days
