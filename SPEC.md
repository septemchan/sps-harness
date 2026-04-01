# sps-harness — Architecture Decisions

## Hook Type System: Guard / Enhancer / Observer

Three types based on determinism level and output channel:

- **Guard** — can block operations (prevent, stop, deny). Used for: commit-guard (secret detection), block-no-verify (git safety), typecheck (type errors), completion-guard (security file changes). When a guard fires, Claude cannot proceed without addressing the issue.
- **Enhancer** — injects context that influences Claude's next action (inject). Used for: auto-format (reports reformatting), quality-gate (reports lint issues), suggest-compact, ui-prompt, launch-prompt, spec-sync-prompt, check-prompt. Advisory, not blocking.
- **Observer** — records data silently, no output to Claude. Used for: observe (operation recording to .observations.jsonl).

Why this split: CLAUDE.md rules are "suggestions" that Claude may forget. Guards enforce hard constraints at the platform level. Enhancers provide real-time context without blocking. Observers collect data for later analysis.

## Cross-Session Memory (security-reviewer)

security-reviewer agent stores findings in .claude/instincts/.observations.jsonl. Enables:
- False positive tracking — once a finding is marked false positive, it won't be re-reported
- Progressive trust — repeated clean audits reduce noise
- Audit trail — findings persist across sessions for compliance

Why not stateless: security review without memory re-reports the same issues every time, creating alert fatigue. Memory makes the reviewer smarter over time.

## Plugin vs Superpowers Boundary

sps-harness provides: quality gates, security review, learning, health assessment, project config generation.
Superpowers provides: Planner, Generator, Evaluator, brainstorming, writing-plans, subagent-driven-development.

Clear boundary: sps-harness never plans or generates features. Superpowers never enforces code quality or security. They complement, never overlap.

## Workflow-Map Routing

Stage-based routing (not feature-based): detect what stage the project is in (new project, has specs, has code, needs review), then recommend the right tool for that stage. This matches how developers actually think — "what should I do next?" not "which of 15 commands applies here?"

## CJS Not ESM

All hooks use CommonJS (require) because:
- Claude Code plugin runtime loads hooks as child processes via Node.js
- ESM adds complexity (file extensions, top-level await issues) with no benefit for short-lived scripts
- Consistency: all hooks share the same module format

## Quality Hook Multi-Language Support

detectProjectType() checks config files in priority order: package.json/tsconfig.json (JS) → pyproject.toml/requirements.txt (Python) → go.mod (Go) → Cargo.toml (Rust). First match wins.

Each quality hook (auto-format, typecheck, quality-gate) branches by project type and calls the appropriate tool. Missing tools are silently skipped via toolExists() check. Unrecognized project types are silently skipped.
