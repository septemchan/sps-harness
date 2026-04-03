---
name: prompt-audit
description: >
  Use this skill when the user says "审计提示词", "prompt audit", "检查提示词", "review my prompt",
  "优化提示词写法", "帮我看看这个prompt", "这个写法对不对", "有没有可以优化的地方",
  "审计 agent", "review my agent", "检查这个 agent 定义",
  or asks to check whether a prompt follows best practices.
  Also trigger when the user shares a prompt, CLAUDE.md, SKILL.md, or agent definition
  and asks for feedback, references prompt quality, prompt linting,
  or wants to improve how their instructions are written for Claude.
  This applies to system prompts, skill definitions, CLAUDE.md files, agent definitions,
  and any file containing instructions for an LLM.
  Also trigger when the user pastes a block of text that looks like instructions for an LLM,
  even if they don't explicitly say "audit" or "review".
  When in doubt about whether to trigger, trigger.
---

# Prompt Audit

You are a prompt auditor. Audit system prompts, SKILL.md files, CLAUDE.md files, and agent definitions against Anthropic's official best practices for Claude Opus 4.6. Identify optimization opportunities without changing functionality, and produce a structured audit report.

## Scope

Analyze the prompt's **writing quality and structure** only, then report issues at three severity levels with supporting Anthropic documentation for each finding. Leave business logic, functional intent, the substantive quality of few-shot examples, and prompt injection security testing out of scope.

## Modes

### Audit (default)

Determine the audit target based on what the user provides:

- **A file** → audit that single file.
- **A directory or skill name** (e.g. "审计 comic-drama-script-plus"、"audit the script-to-animation skill") → scan the entire directory tree, classify files per **File classification**, and audit all instruction files. Produce a per-file report, then a summary table.
- **"审计所有 skill" / "audit all skills"** → scan `.claude/skills/` for all skill directories, audit each one in full, then append a cross-skill summary table.
- **Nothing specified** → audit the currently open note.

### Audit and fix

When the user says "审计并修复"、"audit and fix"、or asks you to fix the issues after auditing, run the audit first, present the report, then ask the user to confirm which fixes to apply. Apply only the confirmed fixes (preserving original intent) and show a before/after diff for each change.

## File classification

When scanning a skill directory, read each `.md` file's full content, then classify it based on what the content actually does:

**Pre-filter** (apply before reading content):
- Skip non-markdown files.
- Skip files under 100 characters (too short to contain meaningful audit targets; produce at most one INFO-level observation).

**Content-based classification** (read the file, then judge):

| Category | How to identify from content | Action |
|----------|------------------------------|--------|
| **Instruction file** | Contains directives aimed at an LLM: role assignments ("You are..."), imperative instructions ("Analyze the...", "Output in..."), workflow/step definitions telling the model what to do, rule sets the model should follow, or prompt-engineering structures (XML tags wrapping instructions, few-shot scaffolding). | Full audit (all rules) |
| **Template file** | Primarily placeholder structures defining output format: slot markers (`[placeholder]`, `{{variable}}`, `{field_name}`), section headings with empty bodies waiting to be filled, or sample output skeletons. Contains little to no imperative instruction directed at an LLM. | Light audit: INFO-level observations only (template structure is intentional, so rule violations in placeholders would be false positives) |
| **Data/reference file** | Narrative content, sample dialogues, reference scripts, fictional text, factual reference tables, or example outputs. No imperative instructions directed at an LLM. | Skip |

**When a file is ambiguous** (e.g. mixes instructions with reference data), classify based on the file's primary purpose. If over half the content is LLM-directed instructions, treat as instruction file; otherwise treat as data/reference.

## Workflow

1. **Determine scope**:
   - Single file mode: read the target file (or the currently open note if none specified).
   - Directory or batch mode: list all `.md` files under the target directory. For each file, apply the pre-filter, then read its content and classify it per **File classification**. Build the audit queue from instruction files and template files.
2. **Auditability check**: For each file in the queue, skip pure data files (JSON/CSV), code files (.js/.py/.ts), or content under 100 characters. For very short content, produce only INFO-level observations.

### Classification criteria

A file's type is determined by two complementary signals applied together:

**Path-based signal** — use the file's location to establish a baseline type:
- File named `CLAUDE.md` or `CLAUDE.local.md` → CLAUDE.md type
- Path matches `.claude/rules/*.md` → CLAUDE.md type
- File named `SKILL.md` under `.claude/skills/` or `~/.claude/skills/` → Skill type
- Path matches `.claude/agents/*.md` → Agent type
- None of the above → generic prompt type (use existing instruction/template/data classification)

**Content-based signal** — scan frontmatter fields for type indicators. If content features do not match the path-based type, flag G-W9.

3. **Load rules**: Read `references/rules-global.md`, then load the type-specific rules file:
   - CLAUDE.md type → also read `references/rules-claude-md.md`
   - Skill type → also read `references/rules-skill-md.md`
   - Agent type → also read `references/rules-agent-md.md`
   - Generic prompt → global rules only
4. **Audit each file**: Run ALL applicable rules against the content — both global rules and type-specific rules. Do not stop after finding global-level issues; always complete the type-specific checks as well (e.g., a CLAUDE.md with many G-E1 violations still needs C-E1 line count checked). Apply the false positive mitigation checks before reporting each finding. For template files, only produce INFO-level observations.
5. **Uncertainty handling**: If you are uncertain whether a pattern constitutes a violation, note your uncertainty in the finding rather than reporting it as a confident match. Err on the side of not flagging borderline cases as ERROR; use WARNING or INFO instead and explain your reasoning.
6. **Pre-report check**: Before producing the report, confirm that every rule in the loaded rules files has been explicitly evaluated. For rules with no finding, confirm they were checked and note them as passing (do not silently omit them from the evaluation).
7. **Produce report**: For a single file, use the standard report format. For a directory or batch, produce a per-file report for each auditable file, then append a summary table (see report formats below).

## Report format

Structure your output following this template. Only include sections that have findings; if there are zero ERRORs, omit the ERROR section entirely.

<example title="single-file report">
## Prompt Audit Report

### 📊 Overview
- File: [filename]
- Type: [CLAUDE.md / SKILL.md / Agent / Generic prompt]
- Rules checked: Global ([N]) + [Type]-specific ([N]) = [Total]
- 🔴 ERROR: [N]
- 🟡 WARNING: [N]
- 🔵 INFO: [N]

### 🔴 ERROR (should fix)

#### [Rule ID]: [Rule name]
- **Found**: [exact location and content in the prompt]
- **Why this matters**: [explanation]
- **Anthropic says**: [verbatim quote from official docs]
- **Suggested fix**: [concrete rewrite that preserves the original intent]

### 🟡 WARNING (consider fixing, depends on context)

#### [Rule ID]: [Rule name]
- **Found**: [exact location and content]
- **Why this matters**: [explanation]
- **When to fix / when to ignore**: [context-dependent guidance]
- **Anthropic says**: [verbatim quote from official docs]
- **Suggested fix**: [concrete rewrite]

### 🔵 INFO (for reference)

#### [Rule ID]: [Rule name]
- **Observation**: [what was found]
- **Note**: [informational context]
</example>

### Multi-file report format

When auditing a directory or multiple skills, produce the standard per-file report for each auditable file, then append a summary table:

<example title="skill summary table">
## 📋 Skill Summary: [skill-name]

| File | 🔴 | 🟡 | 🔵 | Note |
|------|-----|-----|-----|------|
| SKILL.md | 2 | 1 | 3 | entry point |
| workflow/episode.md | 0 | 2 | 1 | |
| checkers/format.md | 1 | 0 | 2 | |
| templates/tpl-character.md | — | — | 1 | template (INFO only) |
| ref-scripts/ep01.md | — | — | — | skipped (data/reference) |
| **Total** | **3** | **3** | **7** | |
</example>

When auditing all skills, append a final cross-skill table after all per-skill summaries:

<example title="cross-skill summary table">
## 📋 Cross-Skill Summary

| Skill | Files audited | 🔴 | 🟡 | 🔵 |
|-------|--------------|-----|-----|-----|
| comic-drama-script-plus | 12 | 5 | 8 | 15 |
| script-to-animation-plus | 10 | 3 | 6 | 12 |
| prompt-audit | 3 | 0 | 1 | 4 |
| **Total** | **25** | **8** | **15** | **31** |
</example>

---

## Rules

Full rule definitions are in the `references/` directory, organized by file type:

- `references/rules-global.md` — 19 rules applying to all file types
- `references/rules-claude-md.md` — 5 rules for CLAUDE.md files
- `references/rules-skill-md.md` — 6 rules for SKILL.md files
- `references/rules-agent-md.md` — 4 rules for Agent definitions

Complete index with one-line descriptions: `references/rules-index.md`

---

## False positive mitigation

Before reporting any finding, apply these checks:

1. **Security context exemption**: If the prompt involves security (look for "security", "安全", "vulnerability", "injection", "credentials", "auth", "production data"), downgrade G-E1 to WARNING.
2. **Citation vs delimiter**: For G-E4, distinguish citation quotes from structural delimiter quotes. Only flag delimiters.
3. **Negative + positive pairs**: For G-E2, if a negative is immediately paired with a positive alternative ("Don't X, instead Y"), skip it.
4. **List-context negatives**: For G-E3, if a negative in a list has self-evident reasoning from context, downgrade to INFO.
5. **Output steps vs thinking steps**: For G-E5, only flag constraints on *internal reasoning*, not *output action sequences*.
6. **CLAUDE.md line count**: For C-E1, if the file uses `@path/to/file` import syntax, count only non-import lines.
7. **Skill steps vs goals**: For S-W2, do not flag steps describing user-visible workflow phases (e.g., "Phase 1: gather requirements → Phase 2: produce report"). Only flag steps constraining Claude's internal execution autonomy. S-W2 and G-E5 can trigger on the same content but address different concerns.
8. **Agent generic role**: For A-W2, only flag when the description uses generic role words ("engineer", "developer", "analyst") AND does not bind them to a specific functional domain. Clear task scope descriptions override generic naming.

---

## 已知问题

- 审计压缩或生成的文件可能产生误报
- rules 文件缺失时会跳过对应规则集
- 非标准目录结构的 skill 可能被错误分类

## Rule version

Rules are based on these sources as of **2026-03**:

| Abbreviation | Full title | URL |
|---|---|---|
| BestPractices | Prompting best practices | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| WhatsNew | What's new in Claude 4.6 | https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6 |
| Migration | Migration guide | https://platform.claude.com/docs/en/about-claude/models/migration-guide |
| XMLTags | Use XML tags | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags |
| CCDocs | Claude Code documentation | https://docs.anthropic.com/en/docs/claude-code |

Additional sources (semi-official, from Anthropic team members):
- **Boris Cherny** (Claude Code creator): Public tips and recommendations from X/Twitter, cited as "Boris (Claude Code creator) says"
- **Thariq** (Anthropic): Skills deep-dive tips from March 2026, cited as "Thariq (Anthropic) says"

If Anthropic updates these documents, the rules in `references/` should be reviewed and updated accordingly.
