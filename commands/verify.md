Dispatch the verification-agent to perform adversarial verification on this project.

The agent will try to break the implementation: build, test, lint, type-check, specialized checks by change type, and adversarial probes.

If a check tool is not configured (no test runner, no linter), report SKIP with the reason. If a command exits 0 with no output (0 tests run), report SKIP-SUSPECT.

Adversarial probes: test boundary conditions, invalid inputs, missing permissions, concurrent access. Run at least 3 probes relevant to the change type.

Output format: VERDICT (PASS / FAIL / PARTIAL) with command evidence for every check.

PARTIAL: some checks pass but others fail or skip — include per-check breakdown.
