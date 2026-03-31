# CLAUDE.md Rules

Rules specific to CLAUDE.md files and `.claude/rules/*.md` files. These rules check Claude Code memory file best practices in addition to the global rules.

File type detection: file named `CLAUDE.md`, `CLAUDE.local.md`, or path matching `.claude/rules/*.md`.

---

## C-E1: File too long (ERROR)

**Description:** CLAUDE.md exceeds 200 lines (excluding blank lines and HTML comments). Long memory files cause Claude to silently ignore rules buried deep in the content.

> "Keep each CLAUDE.md file under 200 lines."
> — Anthropic, Claude Code Best Practices

> "Keep your guidance files under 200 lines. Every team I've seen with a 500-line CLAUDE.md has rules that Claude regularly ignores."
> — Boris Cherny, *How to Build Software with Claude Code*

**Source:** Anthropic Claude Code Best Practices; Boris Cherny, *How to Build Software with Claude Code*

**When to fix:** File exceeds 200 non-blank, non-comment lines. Split content into `.claude/rules/` files or extract shared context into referenced documents.

**When to ignore:** Never ignore — this is a hard limit backed by observed degradation in rule adherence.

**False positive check:** If the file uses `@path/to/file` import syntax to reference external files, count only non-import lines. Import lines themselves do not contribute to cognitive load since Claude resolves them separately.

---

## C-W1: Deterministic behavior expressed as prompt instruction (WARNING)

**Description:** Must-execute behaviors (permissions, attribution, formatting, auto-lint) are written as natural language instructions instead of being enforced through `settings.json` or hooks. Prompt instructions are probabilistic; settings and hooks are deterministic.

**Patterns to detect:**

- "never run rm -rf" or "don't delete files" → should be `permissions.deny` in `settings.json`
- "don't add Co-Authored-By" or "no co-author line" → should be `attribution.commit` in `settings.json`
- "always run prettier" or "format with prettier after editing" → should be a `PostToolUse` hook
- "run eslint before committing" or "lint before commit" → should be a `PreToolUse` or `Stop` hook

> "Use settings.json for deterministic behaviors... Use PostToolUse hooks for auto-formatting — Claude's output is 90% quality, hooks handle the last 10%."
> — Boris Cherny, *How to Build Software with Claude Code*

**Source:** Boris Cherny, *How to Build Software with Claude Code*

**When to fix:** The behavior must happen every single time without exception. If it's a hard rule with no judgment involved, it belongs in settings or hooks, not in a prompt.

**When to ignore:** The guidance is context-dependent and requires Claude's judgment to decide when to apply it. For example, "prefer functional style" is guidance, not a deterministic rule.

---

## C-W2: Contains information Claude can infer from code (WARNING)

**Description:** The file describes project structure, tech stack, framework versions, or file organization that Claude can derive by reading the codebase. This wastes precious line budget and risks becoming stale when the code changes but the description doesn't.

> "Only include information in CLAUDE.md that Claude cannot infer from the code itself."
> — Anthropic, Claude Code Best Practices

**Source:** Anthropic, Claude Code Best Practices

**When to fix:** The description mirrors what's already visible in the code. Examples: "This project uses React 18 and TypeScript" (visible in `package.json`), "The src/ directory contains components, hooks, and utils" (visible from the file tree), "We use Jest for testing" (visible from config files).

**When to ignore:** The convention is non-obvious or contradicts what the code surface suggests. For example, "We use the `src/legacy/` directory only for migration shims, never for new features" adds context that code alone doesn't convey.

---

## C-W3: Rules not split into focused files (WARNING)

**Description:** A single CLAUDE.md contains 10 or more rules spanning different topics (e.g., code style, testing, deployment, git conventions) without using `.claude/rules/` for conditional, topic-based loading. Monolithic files are harder to maintain and make it impossible to scope rules to specific file paths.

> "Use `.claude/rules/` to split instructions into focused files. Each file can specify `paths` in frontmatter to control when it loads."
> — Anthropic, Claude Code Best Practices

**Source:** Anthropic, Claude Code Best Practices

**When to fix:** The file contains multiple distinct topic sections (style, testing, deployment, git, etc.) and is approaching or exceeding 200 lines. Splitting allows conditional loading via `paths` frontmatter and makes each file easier to review and update.

**When to ignore:** The project is small with a short CLAUDE.md under 100 lines. The overhead of multiple files isn't justified when the entire instruction set fits comfortably in one place.

---

## C-I1: Missing important tags for critical rules (INFO)

**Description:** Rules containing critical keywords ("must", "required", "critical", "essential", or Chinese equivalents like "必须", "禁止", "关键", "务必") are not wrapped in `<important>` tags. Without these tags, critical rules are more likely to be skipped in longer files.

> "Use `<important if=\"...\">` tags to wrap critical rules. The HumanLayer team validated this approach — it significantly reduces rule-skipping in longer files."
> — Boris Cherny, *How to Build Software with Claude Code*

**Source:** Boris Cherny, *How to Build Software with Claude Code*

**When to fix:** This is informational only, not a hard requirement. Consider adding `<important>` tags when a rule is truly critical and the file is long enough that skipping becomes a realistic risk.

**When to ignore:** The file is short (under 50 lines) or the "critical" keyword is used casually rather than indicating a must-follow rule.
