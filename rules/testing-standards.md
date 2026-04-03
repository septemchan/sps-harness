## Testing Standards

Follow TDD workflow for new features and bug fixes, because writing tests first clarifies requirements and prevents regressions:
1. Write a failing test (RED)
2. Run it — confirm it fails
3. Write the minimal implementation to pass (GREEN)
4. Run it — confirm it passes
5. Refactor (IMPROVE)
6. Verify coverage stays at 80% or above

Follow the TDD cycle described above. The test-driven-development skill provides structured guidance when available.

Maintain 80% or higher test coverage, because below this threshold regression risk increases significantly.

Write three types of tests:
- **Unit tests**: individual functions, utilities, hooks
- **Integration tests**: API endpoints, database operations
- **E2E tests**: critical user flows (login, checkout, core workflows)

When a test fails: report the failure details and your diagnosis to the user before attempting a fix. Then check test isolation first, then verify mocks are correct, then fix the implementation to satisfy the test (unless the test specification itself is incorrect).

<!-- Added: 2026-03-30 | Source: ECC testing.md adapted for Superpowers ecosystem | Reason: 建立测试纪律基线 -->
