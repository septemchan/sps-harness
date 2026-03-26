---
name: verification-loop
description: 6-phase full-project verification pipeline. Use after completing a feature or before PR.
---

# Verification Loop

You are a verification engineer. Run a 6-phase technical audit on the current project, report PASS/FAIL per phase with specific issues, and produce a summary.

## When to use

- After completing a feature or bug fix
- Before creating a pull request
- When the user says "verify", "audit the project", "run checks", "harness audit", or `/harness-audit`

## Relationship to Superpowers

Complements Superpowers' verification-before-completion skill. Superpowers ensures you prove completion with evidence. This skill specifies WHAT to check (6 technical phases).

## Scope

This is a **full-project** pipeline. It checks the entire codebase, not just changed files. For per-file incremental checks on staged changes, see the quality-gate hook instead.

## Workflow

Run all 6 phases in order. For each phase, detect the appropriate tool automatically, run the check, and report the result. If a phase is not applicable (e.g., no type checker configured), report SKIP with the reason.

---

### Phase 1: Build

**Goal**: Can the project build successfully?

**Detection and execution**:
1. Look for build configuration files in the project root and determine the package manager / build tool:
   - `package.json` with a `build` script → detect lock file (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm) and run `{pm} run build`
   - `Makefile` → `make`
   - `Cargo.toml` → `cargo build`
   - `pyproject.toml` or `setup.py` → `pip install -e .` (dry-run check) or `python -m build`
   - `go.mod` → `go build ./...`
2. If no build step is detected, report SKIP.

**Report**: PASS if exit code 0, FAIL with the first error output otherwise.

---

### Phase 2: Type Check

**Goal**: Are types correct across the project?

**Detection and execution**:
1. Detect the type checker:
   - `tsconfig.json` present → `npx tsc --noEmit`
   - `mypy.ini`, `setup.cfg [mypy]`, or `pyproject.toml [tool.mypy]` → `mypy .`
   - `pyrightconfig.json` or `pyproject.toml [tool.pyright]` → `pyright`
2. If no type checker is detected, report SKIP.

**Report**: PASS if zero errors, FAIL with error count and the first 5 type errors.

---

### Phase 3: Lint

**Goal**: Does the code meet style and quality standards?

**Detection and execution**:
1. Detect the linter:
   - `biome.json` or `biome.jsonc` → `npx biome check .`
   - `.eslintrc.*` or `eslint.config.*` or `package.json` contains `eslint` → `npx eslint .`
   - `ruff.toml` or `pyproject.toml [tool.ruff]` → `ruff check .`
   - `Cargo.toml` → `cargo clippy`
   - `.golangci.yml` → `golangci-lint run`
2. If no linter is detected, report SKIP.

**Report**: PASS if zero warnings/errors, FAIL with issue count and the first 5 issues.

---

### Phase 4: Test Suite

**Goal**: Do tests pass? What is the coverage?

**Detection and execution**:
1. Detect the test runner:
   - `package.json` with a `test` script → `{pm} run test` (add `-- --coverage` if vitest/jest)
   - `pytest.ini`, `pyproject.toml [tool.pytest]`, or `conftest.py` → `pytest --tb=short`
   - `Cargo.toml` → `cargo test`
   - `go.mod` → `go test ./...`
2. If no test runner or no test files are detected, report SKIP.

**Report**: PASS with test count and coverage percentage (if available), FAIL with failing test names and failure messages.

---

### Phase 5: Security Scan

**Goal**: Are there known security vulnerabilities in dependencies?

**Detection and execution**:
1. Detect the audit tool:
   - `package-lock.json` → `npm audit --omit=dev`
   - `yarn.lock` → `yarn audit`
   - `pnpm-lock.yaml` → `pnpm audit`
   - `requirements.txt` or `pyproject.toml` → `pip audit` (if installed) or suggest running `/security-review`
   - `Cargo.lock` → `cargo audit` (if installed)
2. If no lock file is found or audit tool is unavailable, report SKIP and suggest running `/security-review` for a manual review.

**Report**: PASS if zero vulnerabilities, FAIL with vulnerability count broken down by severity (critical/high/moderate/low).

---

### Phase 6: Diff Review

**Goal**: Are the uncommitted/staged changes reasonable and clean?

**Execution** (no detection needed, uses git directly):
1. Run `git diff HEAD` (or `git diff` + `git diff --cached` if there are staged changes) to get all pending changes.
2. If there is no diff (everything is committed), run `git diff HEAD~1` to review the last commit.
3. Review the diff for:
   - **Scope creep**: Changes to files unrelated to the stated task
   - **Accidental deletions**: Removed code that looks unintentional (large block deletions without clear reason)
   - **Debug code**: `console.log`, `debugger`, `print()` statements, `TODO`/`FIXME` left behind
   - **Sensitive data**: Hardcoded secrets, API keys, credentials, `.env` values in code
   - **Large generated files**: Committed build artifacts, lock file churn, minified bundles

**Report**: PASS if the diff is clean, FAIL with specific findings per category.

---

## Output format

After running all 6 phases, produce a summary table followed by details for any FAIL phases.

```
## Verification Summary

| # | Phase          | Result | Detail                        |
|---|----------------|--------|-------------------------------|
| 1 | Build          | PASS   |                               |
| 2 | Type Check     | PASS   |                               |
| 3 | Lint           | FAIL   | 3 errors (see below)          |
| 4 | Test Suite     | PASS   | 42 tests, 87% coverage        |
| 5 | Security Scan  | SKIP   | No lock file found            |
| 6 | Diff Review    | FAIL   | 2 debug statements found      |

### Phase 3: Lint — FAIL
[specific issues here]

### Phase 6: Diff Review — FAIL
[specific findings here]
```

If all phases PASS, end with: **All 6 phases passed. Project is ready for PR.**

If any phase FAILs, end with: **[N] phase(s) failed. Fix the issues above before proceeding.**
