const path = require('path');
const { spawnSync } = require('child_process');
const { fileExists, readStdin, log, prevent, detectProjectType, toolExists } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  const cwd = process.cwd();
  const projectType = detectProjectType(cwd);

  let cmd, args, name;

  if (projectType === 'js' && (ext === '.ts' || ext === '.tsx')) {
    if (!fileExists(path.join(cwd, 'tsconfig.json'))) process.exit(0);
    cmd = 'npx';
    args = ['tsc', '--noEmit', '--pretty'];
    name = 'TypeScript';
  } else if (projectType === 'python' && ext === '.py') {
    if (!toolExists('mypy')) process.exit(0);
    cmd = 'mypy';
    args = [filePath];
    name = 'mypy';
  } else if (projectType === 'go' && ext === '.go') {
    if (!toolExists('go')) process.exit(0);
    cmd = 'go';
    args = ['vet', './...'];
    name = 'go vet';
  } else if (projectType === 'rust' && ext === '.rs') {
    if (!toolExists('cargo')) process.exit(0);
    cmd = 'cargo';
    args = ['check'];
    name = 'cargo check';
  } else {
    process.exit(0);
  }

  const r = spawnSync(cmd, args, { cwd, timeout: 15000, encoding: 'utf8' });
  if (r.status !== 0) {
    const output = (r.stdout || r.stderr || '').slice(0, 1000);
    if (output.trim()) {
      prevent(`[typecheck] ${name} errors found. Fix these before continuing:\n\n${output}`);
    }
  }
} catch (e) {
  log(`typecheck error: ${e.message}`);
}
process.exit(0);
