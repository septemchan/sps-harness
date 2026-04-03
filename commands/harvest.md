Run the harvest skill to generate .claude/CLAUDE.md for this project.

Reads Superpowers design docs (if available) and project files to produce a project-specific configuration that gives Claude context about the tech stack, architecture, commands, and conventions.

If information cannot be determined from scanned files, omit that section rather than guessing.

Output follows the CLAUDE.md template defined in the harvest skill, covering: project summary, tech stack, architecture, key commands, and conventions.

Before writing to disk, show the generated CLAUDE.md to the user for review. If updating an existing file, show a diff instead.

After writing, verify the file is under 100 lines.

Use after brainstorming (before writing-plans) or on any existing project that lacks .claude/CLAUDE.md.
