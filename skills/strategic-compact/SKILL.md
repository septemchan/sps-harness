---
name: strategic-compact
description: Guide context compaction so critical state survives and work resumes seamlessly. Use when the suggest-compact hook fires, the user runs /save-compact, context feels long, or you notice yourself forgetting earlier conversation details. Also use after a context reset to recover state.
---

# Strategic Compact

When a conversation runs long, Claude Code compresses earlier messages to free up context. The compression preserves files on disk but destroys conversation memory: your reasoning, the user's verbal decisions, search results, the architecture understanding you built up. Without preparation, you wake up after compaction not knowing what you were doing or why.

This skill ensures you save that context before compaction and recover it after.

## When to compact

Compact at **logical boundaries**, moments where "what's done" and "what's next" are cleanly separable:

- Brainstorming finished, plan is written
- Design done, about to start coding
- A feature is complete and tested, moving to the next

Don't compact when you're halfway through implementing something, actively debugging without a root cause, or waiting for the user to answer a question. If the suggest-compact reminder fires and you're not at a boundary, acknowledge it and compact at the next one.

## What survives (no action needed)

`CLAUDE.md`, `.claude/rules/`, TodoWrite state, all files on disk, git history, `.claude/settings.json`. These persist automatically.

## Before compacting

Everything only in your head will be lost: intermediate reasoning, verbal decisions ("user said approach B, not A"), search results, your understanding of how the code fits together. If you don't write these down, the post-compaction Claude starts from scratch.

**1. Save state** to `.compact/state-{branch}.md` (use the current git branch name, so multiple sessions on different branches don't overwrite each other):

```markdown
# Compact State — {date}
## Current task
[One-line summary]
## Progress
- [x] Completed step
- [ ] Current step (where exactly you left off)
- [ ] Next step
## Key decisions
- [Decisions made in conversation but not yet in code or docs]
## Working files
- `path/to/file` — [what you were doing with it]
## Open questions
- [Unresolved items]
```

**2. Update TodoWrite** to reflect actual progress.

**3. Commit or stash** meaningful uncommitted work, even as a WIP commit.

## After compaction

1. Read `.compact/state-{branch}.md` to understand where you left off
2. Check TodoWrite for the task list
3. Read the specific files mentioned in the state file (don't re-explore the whole codebase)
4. Confirm with the user before resuming

## Housekeeping

Add `.compact/` to `.gitignore`. These files are temporary session state, not project artifacts.
