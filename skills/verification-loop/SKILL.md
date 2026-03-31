---
name: verification-loop
description: Run a 6-phase full-project verification (build, types, lint, tests, security, diff review) to check overall project health. Trigger when the user wants a broad project-wide check before merging, releasing, or creating a PR, or after completing a feature/bugfix. Trigger phrases include "verify", "run checks", "audit the project", "check everything", "pre-PR check", "harness audit", "is the project ready", "帮我检查一下项目", "全面检查", "跑通吗", "有没有问题". Also trigger when the user expresses anxiety about breaking things after a large change and wants the whole codebase validated. Skip when the user is: reviewing a specific GitHub PR, writing or adding tests, setting up or configuring linters/tools, fixing a single known bug or type error, code migration, or investigating a specific CI pipeline failure.
---

# Verification Loop

Run a 6-phase technical audit on the current project. Report PASS/FAIL/SKIP per phase, then act on the results: auto-fix trivial issues, report serious ones for the user to decide.

This is a **full-project** pipeline that checks the entire codebase. For per-file incremental checks on staged changes, see the quality-gate hook instead.

This skill complements Superpowers' verification-before-completion skill: that skill ensures you prove completion with evidence, this skill defines what evidence to collect.

## How to run

Execute all 6 phases in order. The ordering matters: each phase builds on confidence from the previous one. If a phase has no applicable tooling configured, report SKIP with the reason and move on.

For each phase, detect the project's toolchain by inspecting config files (package.json, Cargo.toml, pyproject.toml, go.mod, etc.) and choose the appropriate command. A few common mappings are shown as examples, but trust your judgment for setups not listed here.

Report only what the tools actually output. If a command fails or produces unexpected output, quote the real error message rather than paraphrasing or inferring.

## Phases

### Phase 1: Build

Build comes first because nothing else matters if the project doesn't compile. A broken build means type checks, tests, and linting will all produce misleading results.

Detect the build tool from project config and run it. Examples: `pnpm run build`, `cargo build`, `go build ./...`. If no build step exists, SKIP.

Report PASS if exit code 0. On FAIL, show the first error block.

### Phase 2: Type Check

Type errors caught here are cheaper to fix than bugs in production. Running this after a successful build ensures the compiler/bundler output is fresh.

Detect the type checker (tsc, mypy, pyright, etc.) and run it. If none is configured, SKIP.

Report PASS if zero errors. On FAIL, show the error count and the first 5 errors.

### Phase 3: Lint

Lint catches style issues and code smells that type checkers miss. Running after type check means you won't waste time linting code that has fundamental type problems.

Detect the linter (biome, eslint, ruff, clippy, golangci-lint, etc.) and run it. If none is configured, SKIP.

Report PASS if zero warnings/errors. On FAIL, show the issue count and first 5 issues.

### Phase 4: Test Suite

Tests are the core confidence signal. They run after build/types/lint so that test failures reflect actual logic bugs, not compilation or style noise.

Detect the test runner and run it with coverage if supported. If no test runner or no test files exist, SKIP.

Report PASS with test count and coverage percentage (if available). On FAIL, show failing test names and failure messages.

### Phase 5: Security Scan

Dependency vulnerabilities are a release-blocker that's easy to miss. Checking after tests pass means you're scanning a project that actually works, not one with broken fundamentals.

Detect the audit tool from lock files (`npm audit`, `pnpm audit`, `yarn audit`, `pip audit`, `cargo audit`, etc.). If no lock file exists or the audit tool isn't installed, SKIP.

Report PASS if zero vulnerabilities. On FAIL, break down by severity (critical/high/moderate/low).

### Phase 6: Diff Review

This is the human-judgment phase. Automated tools can't catch scope creep or accidental deletions. Review comes last so it focuses only on changes that survived all previous checks.

Run `git diff HEAD` to get pending changes. If everything is committed, use `git diff HEAD~1` for the last commit. Review for:

- **Scope creep**: changes to files unrelated to the stated task
- **Accidental deletions**: large block removals without clear reason
- **Debug code**: leftover `console.log`, `debugger`, `print()`, `TODO`/`FIXME`
- **Sensitive data**: hardcoded secrets, API keys, `.env` values in code
- **Generated files**: build artifacts, minified bundles, excessive lock file churn

Report PASS if clean. On FAIL, list specific findings by category.

## After the phases: what to do with failures

Not all failures are equal. Follow this triage:

**Auto-fix** (do it, then re-run the phase to confirm):
- Lint errors with available auto-fix (`--fix` flag)
- Debug code left in the diff (remove `console.log`, `debugger`, etc.)
- Formatting issues

**Report and wait** (show the issue, ask the user before acting):
- Build failures
- Type errors
- Failing tests
- Security vulnerabilities (the user needs to decide: upgrade, ignore, or defer)
- Scope creep or accidental deletions flagged in diff review

After auto-fixing, re-run only the affected phases and update the summary.

## Output format

Produce a summary table, then details for any FAIL phase:

```
## Verification Summary

| # | Phase          | Result | Detail                        |
|---|----------------|--------|-------------------------------|
| 1 | Build          | PASS   |                               |
| 2 | Type Check     | PASS   |                               |
| 3 | Lint           | PASS   | 3 errors auto-fixed           |
| 4 | Test Suite     | PASS   | 42 tests, 87% coverage        |
| 5 | Security Scan  | SKIP   | No lock file found            |
| 6 | Diff Review    | FAIL   | 2 issues need your input      |

### Phase 6: Diff Review
[specific findings here]
```

If all phases PASS (including after auto-fix): **All phases passed. Ready for PR.**

If any phase needs user input: **[N] issue(s) need your decision. See details above.**

## 已知问题

- pnpm workspace 项目中 `pnpm run build` 需要加 `--filter` 参数，否则会构建所有 package，耗时过长或报错
- `npm audit` 在没有 `package-lock.json`（只有 `pnpm-lock.yaml`）时会报错而非 SKIP，需要根据 lock 文件类型选择正确的 audit 工具
- Phase 6 Diff Review 中，大型 lock 文件变更（如 pnpm-lock.yaml 上千行 diff）会淹没真正的代码变更，应先过滤 lock 文件再 review
- auto-fix lint 错误后如果没有重新运行 type check，可能引入新的类型问题（auto-fix 可能删除 "unused" import 而该 import 实际被类型系统依赖）
