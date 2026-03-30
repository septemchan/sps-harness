const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fileExists, readStdin, log } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  const cwd = process.cwd();

  // JavaScript/TypeScript files
  const jsExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'];
  if (jsExts.includes(ext)) {
    // Priority 1: Biome
    if (fileExists(path.join(cwd, 'biome.json')) || fileExists(path.join(cwd, 'biome.jsonc'))) {
      spawnSync('npx', ['biome', 'format', '--write', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      process.exit(0);
    }
    // Priority 2: Prettier
    const hasPrettier = fs.readdirSync(cwd).some(f => f.startsWith('.prettierrc') || f.startsWith('prettier.config'));
    if (!hasPrettier) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
        if (pkg.devDependencies?.prettier || pkg.dependencies?.prettier) {
          spawnSync('npx', ['prettier', '--write', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
          process.exit(0);
        }
      } catch { /* no package.json or parse error */ }
    } else {
      spawnSync('npx', ['prettier', '--write', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      process.exit(0);
    }
  }

  // Python files
  if (ext === '.py') {
    // Priority 1: Black
    const blackResult = spawnSync('black', ['--check', '--', filePath], { cwd, timeout: 5000, encoding: 'utf8' });
    if (blackResult.error === undefined) {
      spawnSync('black', ['--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
      process.exit(0);
    }
    // Priority 2: Ruff format
    const ruffResult = spawnSync('ruff', ['format', '--', filePath], { cwd, timeout: 10000, encoding: 'utf8' });
    if (ruffResult.error === undefined) process.exit(0);
  }
} catch (e) {
  log(`auto-format error: ${e.message}`);
}
process.exit(0);
