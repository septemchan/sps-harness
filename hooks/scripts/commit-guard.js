const { spawnSync } = require('child_process');
const { readStdin, log } = require('./lib/utils');

try {
  const input = readStdin();
  const command = input?.tool_input?.command || '';

  // Only check git commit commands
  if (!command.includes('git commit')) process.exit(0);

  const cwd = process.cwd();

  // 1. Commit message format check
  // Support -m "msg" and heredoc $(cat <<'EOF'...EOF) formats
  const msgMatch = command.match(/-m\s+["']([^"']+)["']/) ||
                   command.match(/-m\s+"?\$\(cat\s+<<'?EOF'?\n(.+?)\n.*?EOF/s);
  if (msgMatch) {
    const msg = (msgMatch[1] || '').trim();
    const validTypes = /^(feat|fix|refactor|docs|test|chore|perf|ci)(\(.+\))?:\s+.+/;
    if (msg && !validTypes.test(msg)) {
      process.stderr.write(`Commit message does not follow conventional format.\nExpected: <type>: <description>\nTypes: feat, fix, refactor, docs, test, chore, perf, ci\nGot: "${msg.slice(0, 80)}"\n`);
      process.exit(2);
    }
  }

  // 2. console.log / print detection in staged files
  const diff = spawnSync('git', ['diff', '--cached', '--diff-filter=ACM', '-U0'], { cwd, timeout: 10000, encoding: 'utf8' });
  if (diff.stdout) {
    const lines = diff.stdout.split('\n');
    const issues = [];
    let currentFile = '';

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        currentFile = line.split(' b/')[1] || '';
      }
      // Only check added lines (starting with +), skip diff headers
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.slice(1);
        // Skip comments
        if (content.trim().startsWith('//') || content.trim().startsWith('#') || content.trim().startsWith('*')) continue;
        if (/console\.(log|warn|error)\s*\(/.test(content)) {
          issues.push(`  ${currentFile}: ${content.trim().slice(0, 100)}`);
        }
        if (/(?<!\w)print\s*\(/.test(content) && currentFile.endsWith('.py')) {
          issues.push(`  ${currentFile}: ${content.trim().slice(0, 100)}`);
        }
      }
    }

    if (issues.length > 0) {
      process.stderr.write(`Debug output detected in staged files:\n${issues.slice(0, 10).join('\n')}\nRemove console.log/print statements before committing.\n`);
      process.exit(2);
    }

    // 3. Secret leak detection in staged files
    const secretPatterns = [
      { name: 'API key', pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{10,}/i },
      { name: 'Token/Secret', pattern: /(token|secret|password|passwd)\s*[:=]\s*['"][^'"]{8,}/i },
      { name: 'AWS key', pattern: /AKIA[0-9A-Z]{16}/ },
      { name: 'Private key', pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/ }
    ];

    const secrets = [];
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        currentFile = line.split(' b/')[1] || '';
      }
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.slice(1);
        for (const { name, pattern } of secretPatterns) {
          if (pattern.test(content)) {
            secrets.push(`  ${currentFile}: Possible ${name} — ${content.trim().slice(0, 80)}`);
          }
        }
      }
    }

    if (secrets.length > 0) {
      process.stderr.write(`Possible secrets detected in staged files:\n${secrets.slice(0, 10).join('\n')}\nMove secrets to environment variables before committing.\n`);
      process.exit(2);
    }
  }
} catch (e) {
  log(`commit-guard error: ${e.message}`);
}
process.exit(0);
