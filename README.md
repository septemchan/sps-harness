# sps-harness

Harness Engineering companion for Superpowers.

## What it does

Complements Superpowers with capabilities it doesn't cover:

- **Coding standards** — built-in rules for code quality, testing, security, and git workflow
- **Project config generation** — `/harvest` reads design docs and generates `.claude/CLAUDE.md`
- **Automated quality checks** — auto-format, typecheck, lint gates on code edits
- **Commit safety** — message format check, console.log detection, secret leak scanning
- **Security review** — read-only agent that audits authentication, payment, and data handling
- **Learning** — extracts work patterns from operation records into actionable rules
- **Health assessment** — evaluates `.claude/` architecture maturity across 7 dimensions (score 0–23)
- **Cross-session memory** — security-reviewer remembers past findings and false positives across sessions

## What it doesn't do

This is NOT a replacement for Superpowers. It provides no Planner, no Generator, no flow-level Evaluator. Those stay in Superpowers where they belong.

## Installation

Requires [Claude Code](https://claude.ai/code) (Anthropic's CLI for Claude).

Run these two commands in your terminal:

```bash
# Step 1: Register this repo as a plugin source
claude plugins marketplace add septemchan/sps-harness

# Step 2: Install the plugin
claude plugins install sps-harness
```

Restart Claude Code after installation. The plugin loads globally — all projects get the hooks, commands, and rules automatically.

## Components

| Type | Count | Contents |
|---|---|---|
| Agent | 1 | security-reviewer (read-only, cross-session memory) |
| Skills | 7 | harness-audit, harvest, product-drafter, product-launcher, prompt-audit, strategic-compact, verification-loop |
| Hooks | 9 | auto-format, typecheck, quality-gate, commit-guard, block-no-verify, completion-guard, suggest-compact, observe, session-start |
| Commands | 6 | /harvest, /security-review, /harness-audit, /save-compact, /learn, /rules |
| Rules | 8 | coding-standards, testing-standards, security-standards, git-standards, workflow-map, harness-method, noise-filter, project-structure |

## Quick start

1. Install the plugin (see above)
2. Run `/harvest` to generate `.claude/CLAUDE.md` for your project
3. Run `/harness-audit` to assess your `.claude/` architecture

## Commands

| Command | What it does |
|---|---|
| `/harvest` | Generate `.claude/CLAUDE.md` from design docs or project files |
| `/security-review` | Dispatch read-only security audit agent |
| `/harness-audit` | Evaluate `.claude/` architecture maturity (7 dimensions, 0–23 score) |
| `/save-compact` | Save state + compress context at logical boundaries |
| `/learn` | Discover work patterns from operation records |
| `/rules` | Quick rule management (list / check / suggest / add) |

## Compatibility

Works alongside:

- **Superpowers** — Planner + Generator + Evaluator agents
- **PM Skills** — `/discover` and `/write-prd` for requirements
