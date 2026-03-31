# Agent Definition Rules

Rules specific to Agent definition files (`.claude/agents/*.md`). These rules check agent design best practices in addition to the global rules.

File type detection: path matching `.claude/agents/*.md` or `~/.claude/agents/*.md`.

---

## A-W1: Missing tools whitelist

Check whether the Agent definition omits the `tools` frontmatter field, giving the agent access to all available tools by default.

Agents should follow the principle of least privilege. An agent that only needs to read and search code should not have access to Edit, Write, or Bash tools. Unrestricted tool access increases the risk of unintended side effects.

**Anthropic says**: "Restrict agent tools to the minimum required for the task. Use the `tools` field to whitelist only the tools the agent needs."

**Source**: Anthropic Claude Code documentation (Sub-agents section)

**When to fix**: The agent has a focused purpose and clearly doesn't need all tools.
**When to ignore**: General-purpose agents that genuinely need broad tool access for their role.

---

## A-W2: Generic role definition

Check whether the Agent's `description` and system prompt define a generic role (e.g., "QA engineer", "backend developer", "code reviewer") without binding it to a specific functional domain or task scope.

Feature-specific agents outperform generic role-based agents. An agent defined as "Reviews authentication code for security vulnerabilities in the OAuth flow" produces better results than one defined as "Security engineer who reviews code."

**Boris (Claude Code creator) says**: "Make feature-specific subagents with skills, not generic QA/backend-engineer agents. The more specific the agent's domain, the better it performs."

**Source**: Boris Cherny, Claude Code tips

**False positive check**: Only flag when the `description` uses generic role words ("engineer", "developer", "analyst", "reviewer") AND does not bind them to a specific functional domain. If the description clearly states a specific task scope (e.g., "Reviews PR diffs for accessibility violations"), do not flag even if the name is generic.

---

## A-W3: Missing maxTurns limit

Check whether the Agent definition omits the `maxTurns` frontmatter field.

Without a turn limit, an agent that encounters a loop (e.g., repeatedly failing test, unresolvable error) will continue consuming tokens indefinitely. Setting `maxTurns` provides a safety net.

**Anthropic says**: "Use `maxTurns` to limit the number of turns a sub-agent can take. This prevents runaway agents from consuming excessive resources."

**Source**: Anthropic Claude Code documentation (Sub-agents section)

**When to fix**: All agents benefit from a maxTurns limit as a safety measure.
**When to ignore**: Agents explicitly designed for long-running tasks where the turn count is intentionally unbounded and monitored by other mechanisms (e.g., hooks).

---

## A-I1: Frontmatter field completeness

List the frontmatter fields present in the Agent definition and note which of the 16 officially supported fields are used vs. unused.

Supported fields: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `initialPrompt`, `color`.

This is informational only — not all fields are needed for every agent.
