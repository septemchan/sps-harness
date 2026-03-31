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

  // Only trigger if Product-Spec.md exists (product-launcher workflow active)
  if (!fileExists(path.join(cwd, 'Product-Spec.md'))) process.exit(0);

  // Only trigger on first-time development (app/ doesn't exist or is empty)
  const appDir = path.join(cwd, 'app');
  if (fs.existsSync(appDir)) {
    const contents = fs.readdirSync(appDir);
    if (contents.length > 0) process.exit(0);
  }

  // Only trigger once per session (use marker file)
  const markerFile = path.join(cwd, '.claude', '.ui-prompted');
  if (fileExists(markerFile)) process.exit(0);
  fs.writeFileSync(markerFile, new Date().toISOString());

  respond(
    '[product-launcher] 设计文档已完成。产品如果有前端界面，建议先调用 ui-ux-pro-max 做专业的 UI 方案（配色、字体、组件库）再进入 writing-plans。\n' +
    '输入 "跳过" 直接进入 writing-plans，或调用 ui-ux-pro-max 开始 UI 设计。'
  );
} catch (e) {
  log(`ui-prompt error: ${e.message}`);
}
process.exit(0);
