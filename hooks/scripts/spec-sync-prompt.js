const fs = require('fs');
const path = require('path');
const { readStdin, fileExists, log, respond } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const cwd = process.cwd();

  // Only trigger for files in docs/superpowers/specs/
  const specsDir = path.join(cwd, 'docs', 'superpowers', 'specs');
  const normalizedPath = path.resolve(filePath);
  if (!normalizedPath.startsWith(specsDir)) process.exit(0);

  // Only trigger if Product-Spec.md exists
  if (!fileExists(path.join(cwd, 'Product-Spec.md'))) process.exit(0);

  // Only trigger during iteration phase (app/ has code)
  const appDir = path.join(cwd, 'app');
  if (!fs.existsSync(appDir)) process.exit(0);
  const contents = fs.readdirSync(appDir);
  if (contents.length === 0) process.exit(0);

  respond(
    '[product-launcher] 检测到设计文档变更。请同步更新 Product-Spec.md 和 Product-Changelog.md。\n' +
    '调用 /sync 自动同步，或手动更新。'
  );
} catch (e) {
  log(`spec-sync-prompt error: ${e.message}`);
}
process.exit(0);
