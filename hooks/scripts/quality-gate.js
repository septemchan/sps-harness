const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fileExists, readStdin, log, inject, toolExists } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  const cwd = process.cwd();

  // .claude/ markdown files → suggest prompt-audit
  if ((filePath.includes('.claude/') || filePath.includes('.claude\\')) && ext === '.md') {
    inject('[quality-gate] Edited .claude/ file. Consider running prompt-audit to check quality.');
    process.exit(0);
  }

  // Code files → run file-level linter and inject results
  const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'];
  if (!codeExts.includes(ext)) process.exit(0);

  let lintOutput = '';
  let linterName = '';

  if (fileExists(path.join(cwd, 'biome.json'))) {
    const r = spawnSync('npx', ['biome', 'check', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8', shell: true });
    if (r.status !== 0 && r.stderr) { lintOutput = r.stderr.slice(0, 500); linterName = 'Biome'; }
  } else if (fs.readdirSync(cwd).some(f => f.startsWith('.eslintrc') || f.startsWith('eslint.config'))) {
    const r = spawnSync('npx', ['eslint', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8', shell: true });
    if (r.status !== 0 && r.stdout) { lintOutput = r.stdout.slice(0, 500); linterName = 'ESLint'; }
  } else if (ext === '.py') {
    const r = spawnSync('ruff', ['check', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
    if (r.status !== 0 && r.stdout) { lintOutput = r.stdout.slice(0, 500); linterName = 'Ruff'; }
  } else if (ext === '.go') {
    if (toolExists('golangci-lint')) {
      const r = spawnSync('golangci-lint', ['run', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      if (r.status !== 0 && r.stdout) { lintOutput = r.stdout.slice(0, 500); linterName = 'golangci-lint'; }
    } else if (toolExists('go')) {
      const r = spawnSync('go', ['vet', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      if (r.status !== 0 && r.stderr) { lintOutput = r.stderr.slice(0, 500); linterName = 'go vet'; }
    }
  } else if (ext === '.rs') {
    if (toolExists('cargo')) {
      const r = spawnSync('cargo', ['clippy', '--', '-W', 'clippy::all'], { cwd, timeout: 15000, encoding: 'utf8' });
      if (r.status !== 0) {
        const out = (r.stdout || r.stderr || '').slice(0, 500);
        if (out.trim()) { lintOutput = out; linterName = 'cargo clippy'; }
      }
    }
  }

  if (lintOutput) {
    inject(`[quality-gate] ${linterName} issues found:\n${lintOutput}`);
  }
} catch (e) {
  log(`quality-gate error: ${e.message}`);
}
process.exit(0);
