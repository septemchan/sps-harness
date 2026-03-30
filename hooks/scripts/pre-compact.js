const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, ensureDir, log } = require('./lib/utils');

function gitCmd(args, cwd) {
  const r = spawnSync('git', args, { cwd, timeout: 3000, encoding: 'utf8' });
  if (r.status !== 0 || r.error) return null;
  return (r.stdout || '').trim();
}

try {
  const input = readStdin();
  const trigger = input?.trigger || 'unknown';
  const cwd = process.cwd();

  // Get branch name (fallback to 'default' for non-git repos)
  const branch = gitCmd(['branch', '--show-current'], cwd) || 'default';

  // Collect git state
  const commits = gitCmd(['log', '--oneline', '-5'], cwd) || '(not a git repository)';
  const status = gitCmd(['status', '--short'], cwd) || '(not a git repository)';
  const diffStat = gitCmd(['diff', '--stat'], cwd) || '(no changes)';

  // Build state file content
  const timestamp = new Date().toISOString();
  const content = `# Compact State

Saved: ${timestamp}
Trigger: ${trigger}
Branch: ${branch}
Working directory: ${cwd}

## Recent commits
${commits}

## Uncommitted changes
${status || '(clean)'}

## Changed files detail
${diffStat}
`;

  // Save to .compact/state-{branch}.md
  const compactDir = path.join(cwd, '.compact');
  ensureDir(compactDir);
  const stateFile = path.join(compactDir, `state-${branch}.md`);
  fs.writeFileSync(stateFile, content, 'utf8');

  // Add .compact/ to .gitignore if not present
  const gitignorePath = path.join(cwd, '.gitignore');
  const ignoreEntry = '.compact/';
  try {
    const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    if (!existing.includes(ignoreEntry)) {
      fs.appendFileSync(gitignorePath, `\n# sps-harness compact state\n${ignoreEntry}\n`);
    }
  } catch { /* gitignore write failed, not critical */ }

  log(`pre-compact: saved state to ${stateFile}`);
} catch (e) {
  log(`pre-compact error: ${e.message}`);
}
process.exit(0);
