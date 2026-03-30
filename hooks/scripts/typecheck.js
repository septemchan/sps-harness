const path = require('path');
const { spawnSync } = require('child_process');
const { fileExists, readStdin, log, respond } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  // Only check TypeScript files
  if (ext !== '.ts' && ext !== '.tsx') process.exit(0);

  const cwd = process.cwd();
  // Only run if tsconfig.json exists
  if (!fileExists(path.join(cwd, 'tsconfig.json'))) process.exit(0);

  const r = spawnSync('npx', ['tsc', '--noEmit', '--pretty'], { cwd, timeout: 15000, encoding: 'utf8' });
  if (r.status !== 0) {
    const output = (r.stdout || r.stderr || '').slice(0, 500);
    if (output.trim()) {
      respond(`TypeScript: ${output}`);
    }
  }
} catch (e) {
  log(`typecheck error: ${e.message}`);
}
process.exit(0);
