---
name: strategic-compact
description: Context budget management. Compress at logical boundaries, preserve key state across compaction.
---

# Strategic Compact

You are a context budget manager. When a conversation grows long, guide the compaction process so that critical state survives and work can resume seamlessly after context reset.

## When to compact

Compact at **logical boundaries**, not in the middle of active work.

| Boundary | Example | Safe to compact? |
|----------|---------|------------------|
| Phase transition | Brainstorming done, plan ready | Yes |
| Plan → implementation | Design written, about to start coding | Yes |
| Chunk completed | Feature finished and tested, moving to next | Yes |
| Mid-implementation | Halfway through a function or file | No |
| Debugging | Actively tracing a bug, haven't found root cause | No |
| Waiting for user input | Asked a question, user hasn't answered | No |

**Rule of thumb**: if you can summarize "what's done" and "what's next" as clean, separate items, it's a good boundary.
## What survives compaction (no need to save)

- `CLAUDE.md` and `.claude/rules/` files
- TodoWrite state
- All files on disk (source code, configs, docs)
- Git history and `.claude/settings.json`
## What's lost in compaction (must save before compact)

- Intermediate reasoning and analysis
- File contents held in memory
- Conversation history and verbal decisions
- Exploration results (grep/glob searches, error outputs)
- Architecture understanding built during the session
- Uncommitted decisions ("user said approach B, not A")

## Pre-compact checklist

1. **Save state to file** at `PWF/compact-state.md`: current task, progress, key decisions, working files, open questions, next steps.
2. **Commit or stash dirty work**: uncommitted meaningful progress should be committed (even as WIP) or noted in the state file.
3. **Update TodoWrite**: mark completed items done, ensure in-progress item reflects actual status.
4. **Record unwritten findings**: any important discoveries (bug patterns, API quirks, constraints) not yet in files go into the state file.

## Post-compact recovery

After compaction, restore working context in this order:

1. Read `PWF/compact-state.md` to understand where you left off
2. Read TodoWrite to see the task list and current progress
3. Read the specific files mentioned in the state file to rebuild working context
4. Confirm the plan with the user before resuming work

Do NOT re-explore broadly. The state file tells you exactly where to look.

## Hooks and commands

- **suggest-compact hook** fires at ~50 tool calls. When it fires, check if you're at a logical boundary. If yes, suggest compacting. If no, acknowledge and compact at the next boundary.
- **/compact command** triggers this skill directly. Follow the pre-compact checklist, then compact.

## State file template

Use this structure for `PWF/compact-state.md`:

```markdown
# Compact State — [date]
## Current task
[One-line summary]
## Progress
- [x] Done step
- [ ] Current step (details)
- [ ] Next step
## Key decisions
- [Decision not recorded elsewhere]
## Working files
- `path/to/file` — [why it matters]
## Open questions
- [Unresolved items]
```
