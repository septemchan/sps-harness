---
name: harness-audit
description: Evaluate .claude/ architecture maturity. 7 dimensions, 0-23 score, L0-L4 levels. Also guides new project initialization.
---

# Harness Audit

You are a harness architecture auditor. Evaluate the `.claude/` directory structure of the current project against 7 dimensions of maturity, produce a deterministic score (0-23), assign a maturity level (L0-L4), and provide actionable improvement guidance.

## Dual purpose

This skill serves two modes depending on the current state of the project:

- **New project** (no `.claude/` directory or score 0): guide the user through creating each missing component with concrete templates and file structures.
- **Existing project** (`.claude/` exists): score the current setup, highlight weak dimensions, and suggest specific cleanup or improvements.

## When to use

- When the user says "harness audit", "审计 harness", "check my harness", "评估 .claude 成熟度", or `/harness-audit`
- When setting up a new project and the user asks "how should I structure .claude/", "初始化 harness", or "harness init"
- When the user wants to know the health of their `.claude/` configuration

## Workflow

1. Locate the `.claude/` directory in the project root. If it does not exist, report score 0 (L0 Manual) and switch to init guidance mode.
2. Run each of the 7 dimensions below. For every check item, use deterministic methods only: file existence checks, line counts, content grep, directory listing. Do NOT use LLM judgment to determine pass/fail.
3. Score each check item: 1 point if passing, 0 if not.
4. Sum all points to get the total score (0-23).
5. Determine the maturity level from the score table.
6. Produce the report: total score, maturity level, per-dimension breakdown, and top 3 improvement suggestions ranked by impact.
7. For new projects or dimensions scoring 0: output specific creation suggestions with file templates.

---

### Dimension 1: Structure Completeness (0-4)

Checks whether the basic `.claude/` scaffolding is in place.

| # | Check | Method | Points |
|---|-------|--------|--------|
| 1.1 | CLAUDE.md exists and is <100 lines | Check file exists at `.claude/CLAUDE.md` or project-root `CLAUDE.md`; count lines with `wc -l`; pass if exists AND line count < 100 | +1 |
| 1.2 | rules/ directory has content | Check `.claude/rules/` exists and contains at least 1 `.md` file | +1 |
| 1.3 | agents/ or commands/ has content | Check `.claude/agents/` or `.claude/commands/` exists and contains at least 1 file | +1 |
| 1.4 | docs/ has spec.md or iterate-log.md | Check `.claude/docs/` contains a file named `spec.md` or `iterate-log.md` (case-insensitive) | +1 |

**Init guidance** (if dimension scores 0):
```
Suggested structure:
.claude/
  CLAUDE.md              ← project-level instructions, keep under 100 lines
  rules/                 ← scoped rules for different areas
    code-style.md        ← coding conventions
  commands/              ← slash commands
    verify.md            ← verification command
  docs/
    spec.md              ← project specification
    iterate-log.md       ← evolution log
```

---

### Dimension 2: Architecture Constraints (0-3)

Checks whether rules are scoped and constraints are declared.

| # | Check | Method | Points |
|---|-------|--------|--------|
| 2.1 | rules/ has path-scoped rules (YAML frontmatter with paths field) | Grep for `^paths:` or `^- path:` in YAML frontmatter of files under `.claude/rules/` | +1 |
| 2.2 | Agent definitions have allowedTools restrictions | Grep for `allowedTools` in files under `.claude/agents/` or `.claude/commands/` | +1 |
| 2.3 | Clear tech stack/constraint declarations exist | Grep CLAUDE.md or rules/ files for keywords like "tech stack", "stack:", "constraints:", "技术栈", "dependencies", or a list of technologies | +1 |

**Init guidance** (if dimension scores 0):
```yaml
# Example path-scoped rule (.claude/rules/frontend.md):
---
paths:
  - "src/components/**"
  - "src/pages/**"
---
- Use TypeScript strict mode
- Components must be functional, not class-based
```

---

### Dimension 3: Agent Design (0-3)

Checks whether agent definitions exist and follow least-privilege principles.

| # | Check | Method | Points |
|---|-------|--------|--------|
| 3.1 | agents/ has at least 1 agent definition | Check `.claude/agents/` exists and contains at least 1 `.md` file | +1 |
| 3.2 | Has read-only agent (allowedTools without Write/Edit) | Find at least 1 agent file under `.claude/agents/` whose `allowedTools` list does NOT include `Write`, `Edit`, or `Bash` write operations | +1 |
| 3.3 | Agent definitions include role boundary descriptions | Grep agent files for role-defining phrases: "You are", "Role:", "Scope:", "你是", "职责" | +1 |

**Init guidance** (if dimension scores 0):
```markdown
# Example read-only agent (.claude/agents/reviewer.md):
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

---

### Dimension 4: Quality Gates (0-4)

Checks whether automated quality hooks are configured.

| # | Check | Method | Points |
|---|-------|--------|--------|
| 4.1 | settings.json has hooks configuration | Check `.claude/settings.json` exists and contains `"hooks"` key | +1 |
| 4.2 | Has PostToolUse hook | Grep `.claude/settings.json` for `PostToolUse` (case-sensitive) | +1 |
| 4.3 | Has Stop hook | Grep `.claude/settings.json` for `"Stop"` (as a hook event type) | +1 |
| 4.4 | Has prompt-audit or equivalent review skill | Check `.claude/skills/` for a directory named `prompt-audit`, `code-review`, or similar; or grep skills for "audit" or "review" in skill names | +1 |

**Init guidance** (if dimension scores 0):
```jsonc
// Example .claude/settings.json with hooks:
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "echo 'File modified: $TOOL_INPUT_PATH'"
      }
    ],
    "Stop": [
      {
        "command": "echo 'Task completed. Review changes before committing.'"
      }
    ]
  }
}
```

---

### Dimension 5: Eval Coverage (0-3)

Checks whether skills are tested and rules are traceable.

| # | Check | Method | Points |
|---|-------|--------|--------|
| 5.1 | Skills have eval definitions or test cases | Check for `evals/` directories inside any skill folder, or files matching `*eval*`, `*test*` under `.claude/skills/` | +1 |
| 5.2 | iterate-log has Verified status records | Grep `.claude/docs/iterate-log.md` for "Verified", "verified", "VERIFIED", or "已验证" | +1 |
| 5.3 | Rules have source annotations | Grep files in `.claude/rules/` for source markers: "Source:", "来源:", "Ref:", "Reference:", or URL patterns (`http://`, `https://`) | +1 |

**Init guidance** (if dimension scores 0):
```
Suggested additions:
- Add evals/ directory to each skill with test inputs and expected outputs
- In iterate-log.md, mark tested rules with "Status: Verified"
- In each rule file, add "Source:" annotation explaining where the rule came from
```

---

### Dimension 6: Evolution Tracking (0-3)

Checks whether the harness tracks its own evolution over time.

| # | Check | Method | Points |
|---|-------|--------|--------|
| 6.1 | iterate-log.md exists with content | Check `.claude/docs/iterate-log.md` exists and has more than 5 lines of content | +1 |
| 6.2 | instincts/ directory has content | Check `.claude/instincts/` exists and contains at least 1 file | +1 |
| 6.3 | iterate-log has escalation chain records | Grep `.claude/docs/iterate-log.md` for escalation-related terms: "escalat", "升级", "Instinct → Rule", "instinct → rule", "promoted", "提升" | +1 |

**Init guidance** (if dimension scores 0):
```markdown
<!-- Example .claude/docs/iterate-log.md -->
# Iterate Log

## 2026-03-26
- **Added**: code-style rule for consistent naming
- **Source**: manual observation during review
- **Status**: Verified
- **Escalation**: Instinct → Rule (promoted after 3 consistent occurrences)
```

---

### Dimension 7: Health Maintenance (0-3)

Checks whether the harness stays clean and current.

| # | Check | Method | Points |
|---|-------|--------|--------|
| 7.1 | No single rule file exceeds 300 lines | Count lines in each file under `.claude/rules/`; pass if ALL files are under 300 lines | +1 |
| 7.2 | No obvious contradictions between rules | Grep all rule files for contradiction patterns: same topic with opposing directives (e.g., one file says "use semicolons" and another says "no semicolons"). Check for files with identical heading names but different content. Pass if no duplicated or conflicting rule headings found | +1 |
| 7.3 | docs/ has no files >90 days without update | Check `git log` or file modification dates for files in `.claude/docs/`; pass if all files were modified within the last 90 days | +1 |

**Init guidance** (if dimension scores 0):
```
Maintenance practices:
- Keep each rule file focused and under 300 lines; split large files by topic
- Review rules quarterly to catch contradictions
- Update docs/ files at least every 90 days or remove stale ones
```

---

## Maturity levels

| Score | Level | Meaning |
|-------|-------|---------|
| 0-5 | L0 Manual | Basically no harness |
| 6-10 | L1 Basic | Basic structure exists |
| 11-15 | L2 Guided | Has constraints and review |
| 16-19 | L3 Systematic | Has evolution and learning |
| 20-23 | L4 Mature | Complete closed loop |

---

## Output format

**For existing projects (score > 0):**

<example title="existing project report">
## Harness Audit Report

**Project**: [project name]
**Score**: [N]/23 — [Level] ([Level meaning])

**Per-dimension breakdown**

| # | Dimension | Score | Detail |
|---|-----------|-------|--------|
| 1 | Structure Completeness | 3/4 | Missing: docs/spec.md |
| 2 | Architecture Constraints | 1/3 | Missing: path-scoped rules, allowedTools |
| 3 | Agent Design | 0/3 | No agents/ directory |
| 4 | Quality Gates | 2/4 | Missing: Stop hook, review skill |
| 5 | Eval Coverage | 0/3 | No evals or annotations |
| 6 | Evolution Tracking | 1/3 | Missing: instincts/, escalation records |
| 7 | Health Maintenance | 2/3 | 1 rule file exceeds 300 lines |

**Top 3 improvements**

1. **[Dimension name]**: [specific action to take]
2. **[Dimension name]**: [specific action to take]
3. **[Dimension name]**: [specific action to take]
</example>

**For new projects (score 0):**

<example title="new project init guide">
## Harness Init Guide

**Project**: [project name]
**Current state**: No .claude/ directory found

**Recommended setup**

[Output the full suggested directory tree, then walk through
each dimension's init guidance from above, tailored to the
project's detected tech stack and structure.]
</example>

---

## Constraints

- ALL checks must be deterministic: file existence, line counts, content grep, directory listing. No LLM judgment calls for pass/fail decisions.
- Report every individual check item's result, not just dimension totals.
- When suggesting improvements, prioritize dimensions with the lowest scores and highest impact.
- For check 7.2 (contradictions), use a conservative approach: only flag clear textual contradictions found via grep, not semantic analysis. If uncertain, pass the check.
