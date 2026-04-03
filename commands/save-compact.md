Save current working state and compress context at a logical boundary.

Goal: persist all in-progress work before compaction so it can be recovered afterward.

1. Follow the "Before compacting" workflow from the strategic-compact skill (save state to `.compact/state-{branch}.md`, update todos). If there are uncommitted changes, confirm with the user before committing or stashing.
2. Invoke the built-in /compact command to compress context.
3. Follow the "After compaction" recovery steps from the strategic-compact skill (read state file, check todos, read working files, confirm with user).
