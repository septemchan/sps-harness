---
name: harness-audit
description: >
  Evaluate and score the maturity of a project's .claude/ directory architecture across 7 dimensions,
  producing a deterministic score (0-23) and maturity level (L0-L4). For new projects without .claude/,
  provides init guidance with concrete templates.
  This skill assesses the current state rather than making changes.
  Trigger on: "harness audit", "审计harness", "check my harness", "评估.claude成熟度",
  "/harness-audit", "harness init", "初始化harness", ".claude健康检查", "harness体检",
  "我的harness怎么样", "score my harness", "给harness打个分", "check harness health",
  "how should I structure .claude/", "harness 成熟度", "harness 打分".
  Also trigger when the user asks to evaluate, score, or assess their .claude/ configuration health.
  Do not trigger when the user wants to create, modify, fix, or reorganize .claude/ files
  (that is harness-creator's job), review individual prompt files (prompt-audit's job),
  or configure settings.json hooks (update-config's job).
---

# Harness Audit

You evaluate the `.claude/` directory architecture of the current project. The goal: give the user a clear, honest picture of how well their harness is set up, and practical guidance on what to improve next.

A well-structured harness makes Claude more reliable, consistent, and safe. A poorly structured one leads to ignored rules, redundant work, and drift over time. This audit measures the gap.

## Two modes

- **Audit** (`.claude/` exists): Score the current setup, show what's strong and what's weak, suggest the highest-impact improvements.
- **Init** (no `.claude/` directory, or total score 0): Guide the user through creating each component. Read `references/init-templates.md` for concrete templates tailored to each dimension.

## How to run the audit

1. Run the automated check script: `node <skill-path>/scripts/run-checks.js [project-root]`
   - The script checks all 23 items and outputs a JSON report with pass/fail for each check.
   - If the script fails (missing Node.js, permission issues), fall back to manual checks using the dimension definitions below.
2. Read the JSON output and produce the human-readable report.
3. For dimensions scoring 0, read `references/init-templates.md` and include tailored creation guidance.

## The 7 Dimensions

### 1. Structure Completeness (0-4)

A harness needs a basic skeleton. Without CLAUDE.md, rules, commands, and documentation, Claude is flying blind and every conversation starts from zero.

| Check | Pass when |
|-------|-----------|
| 1.1 CLAUDE.md exists and is concise | `CLAUDE.md` (in `.claude/` or project root) exists with fewer than 100 lines |
| 1.2 rules/ has content | `.claude/rules/` contains at least 1 `.md` file |
| 1.3 agents/ or commands/ has content | `.claude/agents/` or `.claude/commands/` has at least 1 file |
| 1.4 docs/ has spec or iterate-log | `.claude/docs/` contains `spec.md` or `iterate-log.md` |

### 2. Architecture Constraints (0-3)

Rules without scope apply everywhere, which means they often conflict or dilute each other. Path-scoping, tool restrictions, and explicit tech-stack declarations give Claude the boundaries it needs to make good decisions in different parts of the codebase.

| Check | Pass when |
|-------|-----------|
| 2.1 Path-scoped rules exist | Any file in `rules/` has YAML frontmatter with a `paths:` field |
| 2.2 Tool restrictions on agents | Any file in `agents/` or `commands/` contains `allowedTools` |
| 2.3 Tech stack declared | `CLAUDE.md` or `rules/` mentions tech stack, constraints, or lists technologies |

### 3. Agent Design (0-3)

Agents are how you delegate specialized work. Without agent definitions, every task runs with full permissions. A read-only reviewer that can't write files is safer and more focused than a general-purpose agent with all tools available.

| Check | Pass when |
|-------|-----------|
| 3.1 Has agent definitions | `.claude/agents/` has at least 1 `.md` file |
| 3.2 Has a read-only agent | At least 1 agent's `allowedTools` excludes `Write`, `Edit`, and destructive Bash |
| 3.3 Agents have role descriptions | Agent files contain role-defining phrases ("You are", "Role:", "Scope:", "你是", "职责") |

### 4. Quality Gates (0-4)

Hooks are automated checkpoints that run without human intervention. They catch issues as they happen rather than after the fact. A harness without hooks relies entirely on the user remembering to check things, which doesn't scale.

| Check | Pass when |
|-------|-----------|
| 4.1 Hooks configured | `.claude/settings.json` contains a `"hooks"` key (project-level, not plugin-provided) |
| 4.2 PostToolUse hook | `settings.json` contains `PostToolUse` |
| 4.3 Stop hook | `settings.json` contains `"Stop"` as a hook event type |
| 4.4 Review skill present | `.claude/skills/` has a directory with "audit" or "review" in the name |

### 5. Eval Coverage (0-3)

Rules and skills that aren't tested can silently break or drift. Eval definitions prove skills work as intended. Verification status in the iterate-log shows which rules have been confirmed effective. Source annotations trace where rules came from, so future maintainers can judge whether they're still relevant.

| Check | Pass when |
|-------|-----------|
| 5.1 Skills have evals | Any skill folder contains `evals/` or files matching `*eval*`, `*test*` |
| 5.2 Verified entries in iterate-log | `iterate-log.md` contains "Verified" or "已验证" |
| 5.3 Rules have source annotations | Files in `rules/` contain "Source:", "来源:", "Ref:", or URL patterns |

### 6. Evolution Tracking (0-3)

A harness that doesn't record its own history can't learn from past mistakes. The iterate-log captures what changed and why. Instincts capture emerging patterns before they're promoted to rules. Escalation records show the team actively upgrades underperforming rules rather than tolerating drift.

| Check | Pass when |
|-------|-----------|
| 6.1 Iterate-log has meaningful content | `iterate-log.md` exists with more than 5 lines |
| 6.2 Instincts directory has content | `.claude/instincts/` has at least 1 file |
| 6.3 Escalation records exist | `iterate-log.md` mentions escalation terms ("escalat", "Instinct → Rule", "promoted", "升级") |

### 7. Health Maintenance (0-3)

Even a well-built harness degrades over time. Rules bloat, contradictions creep in, documentation goes stale. If a rule file is 500 lines long, Claude may not attend to all of it. If two rules contradict each other, behavior becomes unpredictable.

| Check | Pass when |
|-------|-----------|
| 7.1 No oversized rule files | Every file in `rules/` is under 300 lines |
| 7.2 No obvious contradictions | No duplicate or conflicting rule headings across `rules/` files. Conservative grep-based detection only — if uncertain, pass |
| 7.3 Docs are current | Every file in `docs/` was committed within the last 90 days (use `git log`, not filesystem mtime) |

## Maturity Levels

| Score | Level | What it means |
|-------|-------|---------------|
| 0-5 | L0 Manual | Essentially no harness. Claude works from scratch each time. |
| 6-10 | L1 Basic | Structure exists but lacks constraints and automation. |
| 11-15 | L2 Guided | Has constraints and review. Claude follows rules but doesn't learn. |
| 16-19 | L3 Systematic | Tracks evolution and learns from past iterations. |
| 20-23 | L4 Mature | Complete closed loop: testing, escalation, and maintenance. |

## Output format

**Audit mode** (score > 0):

```markdown
## Harness Audit Report

**Project**: [name]
**Score**: [N]/23 — [Level] ([meaning])

| # | Dimension | Score | Detail |
|---|-----------|-------|--------|
| 1 | Structure Completeness | 3/4 | Missing: docs/spec.md |
| 2 | Architecture Constraints | 1/3 | Missing: path-scoped rules, allowedTools |
| ... | ... | ... | ... |

**Top 3 improvements** (ranked by impact):

1. **[Dimension]**: [specific action to take]
2. **[Dimension]**: [specific action to take]
3. **[Dimension]**: [specific action to take]
```

Report every individual check result, not just dimension totals.

After the structured report, add a **Diagnostic observations** section. This is where you go beyond the checklist and look at the harness with fresh eyes. The 23 checks catch structural issues, but some of the most valuable findings are things no checklist covers: rules that contradict each other in subtle ways, CLAUDE.md content that duplicates what's already in rules/, naming patterns that suggest copy-paste errors, iterate-log entries that reveal a recurring problem nobody has escalated, negative directives that could be rewritten as positive ones. Read the actual content of the files, not just whether they exist, and share what you notice.

**Init mode** (score 0):

```markdown
## Harness Init Guide

**Project**: [name]
**Current state**: No .claude/ directory found

[Full suggested directory tree, then walk through each
dimension's init guidance from references/init-templates.md,
tailored to the project's detected tech stack and structure.]
```

## Bundled resources

| Resource | When to use |
|----------|-------------|
| `scripts/run-checks.js` | Always — run first to get the raw scores |
| `references/init-templates.md` | When any dimension scores 0 or in full init mode |
