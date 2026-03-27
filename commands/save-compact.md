Run the strategic-compact skill to safely compress context at a logical boundary.

Steps:
1. Follow the "Before compacting" section from the strategic-compact skill (save state to `.compact/state-{branch}.md`, update TodoWrite, commit/stash dirty work)
2. Once state is saved, run Claude Code's built-in /compact to compress context
3. After compaction, follow the "After compaction" recovery steps (read state file, check TodoWrite, read working files, confirm with user)
