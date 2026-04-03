## Coding Standards

Prefer immutability: create new objects instead of mutating existing ones, because immutable data prevents hidden side effects and simplifies debugging.

Keep files focused at 200-400 lines, with an upper limit of 800 lines. Split by feature when a file grows beyond this range, because smaller files improve readability and Claude's processing accuracy.

Keep functions under 50 lines with nesting no deeper than 4 levels, because short functions are easier to understand and test.

Handle errors explicitly at every level: return user-friendly messages in UI code, log detailed context on the server side. Silent error swallowing masks bugs and makes debugging harder.

Validate all inputs at system boundaries (user input, external APIs, file content) using schema-based validation when available. Fail fast with clear error messages, because catching bad data early prevents cascading failures.

Before marking work complete, verify:
- Functions are focused (under 50 lines)
- Files are cohesive (under 800 lines)
- No deep nesting (4 levels max)
- Errors handled explicitly
- No hardcoded values (use constants or config)

When a check fails, note the specific file and violation inline before proceeding.

<!-- Added: 2026-03-30 | Source: ECC coding-style.md adapted for Superpowers ecosystem | Reason: 提供通用编码基线 -->
