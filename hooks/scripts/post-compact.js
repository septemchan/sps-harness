const { inject, log } = require('./lib/utils');

try {
  const context = `[sps-harness commands]
- /harvest — generate CLAUDE.md from design docs
- /harness-audit — assess .claude/ maturity
- /security-review — audit auth/payment/data code
- /save-compact — save state + compress context
- /learn — extract work patterns from operation records
- /rules — manage project rules
- /verify — adversarial verification of recent changes
- /compliance-review — compliance check
Route: security files changed → /security-review, design done no config → /harvest, periodic check → /harness-audit`;

  inject(context);
} catch (e) {
  log(`post-compact error: ${e.message}`);
}
process.exit(0);
