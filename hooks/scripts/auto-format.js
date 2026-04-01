const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fileExists, readStdin, log, inject } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  const cwd = process.cwd();

  let contentBefore = null;
  try { contentBefore = fs.readFileSync(filePath, 'utf8'); } catch {}

  let formatted = false;
  let formatter = '';

  const jsExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'];
  if (jsExts.includes(ext)) {
    if (fileExists(path.join(cwd, 'biome.json')) || fileExists(path.join(cwd, 'biome.jsonc'))) {
      spawnSync('npx', ['biome', 'format', '--write', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      formatter = 'Biome';
      formatted = true;
    } else {
      const hasPrettier = fs.readdirSync(cwd).some(f => f.startsWith('.prettierrc') || f.startsWith('prettier.config'));
      if (hasPrettier) {
        spawnSync('npx', ['prettier', '--write', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
        formatter = 'Prettier';
        formatted = true;
      } else {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
          if (pkg.devDependencies?.prettier || pkg.dependencies?.prettier) {
            spawnSync('npx', ['prettier', '--write', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
            formatter = 'Prettier';
            formatted = true;
          }
        } catch {}
      }
    }
  }

  if (ext === '.py') {
    const blackResult = spawnSync('black', ['--check', '--', filePath], { cwd, timeout: 5000, encoding: 'utf8' });
    if (blackResult.error === undefined) {
      spawnSync('black', ['--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      formatter = 'Black';
      formatted = true;
    } else {
      const ruffResult = spawnSync('ruff', ['format', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      if (ruffResult.error === undefined) {
        formatter = 'Ruff';
        formatted = true;
      }
    }
  }

  if (formatted && contentBefore !== null) {
    let contentAfter = null;
    try { contentAfter = fs.readFileSync(filePath, 'utf8'); } catch {}
    if (contentAfter !== null && contentBefore !== contentAfter) {
      inject(`[auto-format] ${path.basename(filePath)} was reformatted by ${formatter}. No manual formatting needed.`);
    }
  }
} catch (e) {
  log(`auto-format error: ${e.message}`);
}
process.exit(0);
