# Rules Index

Complete index of all prompt-audit rules, organized by scope and severity.

## Global Rules (apply to all file types)

Read `references/rules-global.md` for full details.

### 🔴 ERROR

| ID | Name | One-line check |
|----|------|---------------|
| G-E1 | Aggressive emphasis | All-caps words like CRITICAL, IMPORTANT, MUST, ALWAYS, NEVER |
| G-E2 | Bare negative without alternative | "Don't do X" without saying what to do instead |
| G-E3 | Negative without reasoning | Prohibitions that don't explain why |
| G-E4 | Quotes as primary delimiters | Using `""` instead of XML tags to separate instructions from data |
| G-E5 | Prescriptive thinking steps | Forcing fixed internal reasoning sequence instead of letting Claude think freely |

### 🟡 WARNING

| ID | Name | One-line check |
|----|------|---------------|
| G-W1 | Data after instructions | Long-form data placed below the query in prompts >2000 chars |
| G-W2 | Elaborate role definition | Role description >3 sentences or using superlatives |
| G-W3 | Examples not in tags | Few-shot examples without `<example>` wrapping |
| G-W4 | No hallucination safeguard | Missing "verify before answering" constraint in factual tasks |
| G-W5 | No destructive action safeguard | Agent prompt without confirmation for irreversible operations |
| G-W6 | No output format spec | Missing positive description of expected output |
| G-W7 | Output constraints as negations | "Don't exceed 500 words" instead of "Write 300-500 words" |
| G-W8 | Format contradiction | Prompt formatting style conflicts with desired output format |
| G-W9 | File location mismatch | File content features don't match filesystem location |
| G-W10 | Missing verification mechanism | Agent/Skill prompt has no way for Claude to verify output quality |

### 🔵 INFO

| ID | Name | What it reports |
|----|------|----------------|
| G-I1 | Example count | Number of `<example>` tags |
| G-I2 | Prompt length | Character count and estimated tokens |
| G-I3 | XML tag inventory | All XML tags and nesting structure |
| G-I4 | Instruction density | Ratio of imperative sentences to explanatory content |

---

## CLAUDE.md Rules

Read `references/rules-claude-md.md` for full details.

| ID | Name | Level | One-line check |
|----|------|-------|---------------|
| C-E1 | File too long | 🔴 | CLAUDE.md exceeds 200 lines |
| C-W1 | Deterministic behavior as prompt | 🟡 | Behavior that should be in settings.json or hooks |
| C-W2 | Contains inferable information | 🟡 | Information Claude can derive from the codebase |
| C-W3 | Rules not split | 🟡 | 10+ topics in one file without using .claude/rules/ |
| C-I1 | Missing important tags | 🔵 | Critical rules not wrapped in `<important>` tags |

---

## SKILL.md Rules

Read `references/rules-skill-md.md` for full details.

| ID | Name | Level | One-line check |
|----|------|-------|---------------|
| S-W1 | Description as summary | 🟡 | Description reads as summary, not trigger condition |
| S-W2 | Over-prescriptive steps | 🟡 | Rigid step sequence constraining Claude's autonomy |
| S-W3 | Missing Gotchas | 🟡 | No section documenting common Claude failure patterns |
| S-W4 | Single-file skill | 🟡 | 300+ line SKILL.md without subdirectory structure |
| S-W5 | Default behavior descriptions | 🟡 | Instructions for things Claude already does by default |
| S-I1 | Frontmatter completeness | 🔵 | Lists used/unused frontmatter fields (13 supported) |

---

## Agent Definition Rules

Read `references/rules-agent-md.md` for full details.

| ID | Name | Level | One-line check |
|----|------|-------|---------------|
| A-W1 | Missing tools whitelist | 🟡 | No `tools` field, agent has unrestricted tool access |
| A-W2 | Generic role definition | 🟡 | Generic role without specific functional domain |
| A-W3 | Missing maxTurns | 🟡 | No turn limit, risk of runaway execution |
| A-I1 | Frontmatter completeness | 🔵 | Lists used/unused frontmatter fields (16 supported) |

---

## Summary

| Scope | 🔴 ERROR | 🟡 WARNING | 🔵 INFO | Total |
|-------|---------|-----------|--------|-------|
| Global | 5 | 10 | 4 | 19 |
| CLAUDE.md | 1 | 3 | 1 | 5 |
| SKILL.md | 0 | 5 | 1 | 6 |
| Agent | 0 | 3 | 1 | 4 |
| **Total** | **6** | **21** | **7** | **34** |
