const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { readStdin, log, deny, inject, getTempDir, hashCwd } = require('./lib/utils');

try {
  const input = readStdin();
  const command = input?.tool_input?.command || '';

  if (!command.includes('git commit')) process.exit(0);

  const cwd = process.cwd();
  const issues = [];

  // 1. Commit message format check
  const msgMatch = command.match(/-m\s+"?\$\(cat\s+<<'?EOF'?\n(.+?)\n.*?EOF/s) ||
                   command.match(/-m\s+["']([^"']+)["']/);
  if (msgMatch) {
    const msg = (msgMatch[1] || '').trim();
    const validTypes = /^(feat|fix|refactor|docs|test|chore|perf|ci)(\(.+\))?:\s+.+/;
    if (msg && !validTypes.test(msg)) {
      issues.push(`Commit message "${msg.slice(0, 80)}" does not follow Conventional Commits format. Expected: <type>: <description> (types: feat, fix, refactor, docs, test, chore, perf, ci)`);
    }
  }

  // 2. Staged file analysis
  const diff = spawnSync('git', ['diff', '--cached', '--diff-filter=ACM', '-U0'], { cwd, timeout: 10000, encoding: 'utf8' });
  if (diff.stdout) {
    const lines = diff.stdout.split('\n');
    let currentFile = '';
    const consoleLogs = [];
    const secrets = [];

    const secretPatterns = [
      { name: 'API key', pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{10,}/i },
      { name: 'Token/Secret', pattern: /(token|secret|password|passwd)\s*[:=]\s*['"][^'"]{8,}/i },
      { name: 'AWS key', pattern: /AKIA[0-9A-Z]{16}/ },
      { name: 'Private key', pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/ }
    ];

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        currentFile = line.split(' b/')[1] || '';
      }
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.slice(1);
        if (content.trim().startsWith('//') || content.trim().startsWith('#') || content.trim().startsWith('*')) continue;

        if (/console\.(log|warn|error)\s*\(/.test(content)) {
          consoleLogs.push(`${currentFile}: ${content.trim().slice(0, 100)}`);
        }
        if (/(?<!\w)print\s*\(/.test(content) && currentFile.endsWith('.py')) {
          consoleLogs.push(`${currentFile}: ${content.trim().slice(0, 100)}`);
        }

        for (const { name, pattern } of secretPatterns) {
          if (pattern.test(content)) {
            secrets.push(`${currentFile}: Possible ${name} — ${content.trim().slice(0, 80)}`);
          }
        }
      }
    }

    // Secrets → DENY (hard block)
    if (secrets.length > 0) {
      deny(`Possible secrets detected in staged files:\n${secrets.slice(0, 10).join('\n')}\nMove secrets to environment variables before committing.`);
      process.exit(0);
    }

    // console.log → INJECT (informational)
    if (consoleLogs.length > 0) {
      issues.push(`Debug output in staged files:\n${consoleLogs.slice(0, 10).join('\n')}\nRemove before committing.`);
    }
  }

  // 3. /compliance-review suggestion
  const counterFile = path.join(getTempDir(), `sps-compliance-${hashCwd(cwd)}.json`);
  let complianceRan = false;
  try {
    const data = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
    complianceRan = data.ran === true;
  } catch {}

  if (!complianceRan) {
    issues.push('No /compliance-review has been run this session. Consider running it before committing to check code against project rules.');
  }

  // Output all non-secret issues as inject
  if (issues.length > 0) {
    inject('[sps-harness commit-guard]\n' + issues.join('\n\n'));
  }
} catch (e) {
  log(`commit-guard error: ${e.message}`);
}
process.exit(0);
