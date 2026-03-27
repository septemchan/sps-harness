# superpowers-harness

Harness Engineering companion for Superpowers.

## What it does

Complements Superpowers with capabilities it doesn't cover:

- **Automated quality checks** — lint/typecheck gates on code edits, prompt-audit on `.claude/` edits
- **Security review** — read-only agent that audits authentication, payment, and data handling
- **Learning** — extracts work patterns from operation records into actionable rules
- **Health assessment** — evaluates `.claude/` architecture maturity across 7 dimensions (score 0–23)

## What it doesn't do

This is NOT a replacement for Superpowers. It provides no Planner, no Generator, no flow-level Evaluator. Those stay in Superpowers where they belong.

## Installation

```
claude plugins marketplace add septemchan/superpowers-harness
claude plugins install superpowers-harness
```

## Components

| Type | Count | Contents |
|---|---|---|
| Agent | 1 | security-reviewer (read-only) |
| Skills | 4 | harness-audit, prompt-audit, strategic-compact, verification-loop |
| Hooks | 5 | quality-gate, completion-guard, suggest-compact, observe, session-start |
| Commands | 5 | /security-review, /harness-audit, /save-compact, /learn, /rules |
| Rules | 3 | workflow-map, harness-method, noise-filter |

## Quick start

1. Install the plugin (see above)
2. Run `/harness-audit` to assess your `.claude/` architecture
3. Follow the suggestions to fill gaps

## Commands

| Command | What it does |
|---|---|
| `/security-review` | Dispatch read-only security audit agent |
| `/harness-audit` | Evaluate `.claude/` architecture maturity (7 dimensions, 0–23 score) |
| `/save-compact` | Save state + compress context at logical boundaries |
| `/learn` | Discover work patterns from operation records |
| `/rules` | Quick rule management (list / check / suggest / add) |

## Compatibility

Works alongside:

- **Superpowers** — Planner + Generator + Evaluator agents
- **PM Skills** — `/discover` and `/write-prd` for requirements
