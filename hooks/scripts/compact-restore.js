const path = require('path');
const { spawnSync } = require('child_process');
const { readFile, fileExists, log } = require('./lib/utils');

try {
  const cwd = process.cwd();

  // Get current branch
  const r = spawnSync('git', ['branch', '--show-current'], { cwd, timeout: 3000, encoding: 'utf8' });
  const branch = (r.stdout || '').trim() || 'default';

  // Read saved state
  const stateFile = path.join(cwd, '.compact', `state-${branch}.md`);
  if (!fileExists(stateFile)) process.exit(0);

  const content = readFile(stateFile);
  if (!content) process.exit(0);

  // Output additionalContext for SessionStart hook
  const context = `Context was just compacted. Here is the saved working state from before compaction. Use this to resume work seamlessly.\n\n${content}`;
  console.log(JSON.stringify({ additionalContext: context }));
} catch (e) {
  log(`compact-restore error: ${e.message}`);
}
process.exit(0);
