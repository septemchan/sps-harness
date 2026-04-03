# sps-harness

Harness Engineering companion plugin for Superpowers. Adds automated quality checks, security review, learning, and health assessment.

## Architecture

- Plugin structure: agents/, skills/, hooks/, rules/, commands/
- Hooks are Node.js scripts in hooks/scripts/, registered in hooks/hooks.json
- Hook types: Guard (can stop via prevent/stop), Enhancer (inject context), Observer (record silently)
- Skills are SKILL.md files in skills/<name>/, may have references/ subdirectory
- Cross-session memory: .claude/instincts/.observations.jsonl
- Plugin metadata: .claude-plugin/plugin.json

## Dev commands

- No build step — hooks are plain Node.js (CommonJS, require)
- Verify hook syntax: `node -c hooks/scripts/<name>.js`
- Verify JSON configs: `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"`
- Test: manually install plugin via `claude plugins install` and verify in a target project

## Code style

- All hooks must wrap logic in try/catch and exit with process.exit(0) — never crash
- Use hooks/scripts/lib/utils.js for shared functions: inject, prevent, stop, deny, guard, log, detectProjectType, toolExists

## Gotchas

<important>
- hooks.json paths must use ${CLAUDE_PLUGIN_ROOT} prefix, not relative paths
- Hook timeouts: file I/O hooks ≤5s, git hooks ≤10s, typecheck ≤15s
</important>
- settings.json deny rules are permission-layer blocking (Claude Code enforces); hooks are script-layer blocking (our code enforces) — different mechanisms
- readStdin() reads fd 0 for Windows compatibility, not /dev/stdin
- Quality hooks (auto-format, typecheck, quality-gate) detect project type via detectProjectType() — JS/TS, Python, Go, Rust supported, others silently skipped
