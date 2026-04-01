const fs = require('fs');
const path = require('path');
const { readStdin, fileExists, log, respond } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const cwd = process.cwd();

  // Only trigger for files in docs/superpowers/specs/
  const specsDir = path.join(cwd, 'docs', 'superpowers', 'specs').toLowerCase();
  const normalizedPath = path.resolve(filePath).toLowerCase();
  if (!normalizedPath.startsWith(specsDir)) process.exit(0);

  const hasProductSpec = fileExists(path.join(cwd, 'Product-Spec.md'));
  const appDir = path.join(cwd, 'app');
  const hasCode = fs.existsSync(appDir) && fs.readdirSync(appDir).length > 0;

  const messages = [];

  // Iteration phase: remind to sync Product-Spec
  if (hasProductSpec && hasCode) {
    messages.push('请同步更新 Product-Spec.md 和 Product-Changelog.md。调用 /sync 自动同步，或手动更新。');
  }

  // Always remind about harvest when design docs change
  messages.push('CLAUDE.md 可能需要更新。调用 /harvest 从设计文档同步项目配置。');

  if (messages.length === 0) process.exit(0);

  respond('[sps-harness] 检测到设计文档变更。\n' + messages.join('\n'));
} catch (e) {
  log(`spec-sync-prompt error: ${e.message}`);
}
process.exit(0);
