const fs = require('fs');
const path = require('path');
const { readStdin, fileExists, readFile, log, respond } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const cwd = process.cwd();

  // Only trigger for files in docs/superpowers/plans/
  const plansDir = path.join(cwd, 'docs', 'superpowers', 'plans').toLowerCase();
  const normalizedPath = path.resolve(filePath).toLowerCase();
  if (!normalizedPath.startsWith(plansDir)) process.exit(0);

  // Only trigger if Product-Spec.md exists
  const specPath = path.join(cwd, 'Product-Spec.md');
  if (!fileExists(specPath)) process.exit(0);

  // Only trigger on first-time development (app/ doesn't exist or is empty)
  const appDir = path.join(cwd, 'app');
  if (fs.existsSync(appDir)) {
    const contents = fs.readdirSync(appDir);
    if (contents.length > 0) process.exit(0);
  }

  // Only trigger once (use marker file)
  const markerFile = path.join(cwd, '.claude', '.launch-prompted');
  if (fileExists(markerFile)) process.exit(0);
  fs.mkdirSync(path.dirname(markerFile), { recursive: true });
  fs.writeFileSync(markerFile, new Date().toISOString());

  // Read prototype strategy from Product-Spec.md
  const specContent = readFile(specPath) || '';
  const strategyMatch = specContent.match(/原型工具：(.+)/);
  const strategy = strategyMatch ? strategyMatch[1].trim() : '';

  if (strategy.includes('AI Studio')) {
    respond(
      '[product-launcher] 实现计划已完成。原型策略为 Google AI Studio。\n' +
      '请调用 product-launcher skill 生成 AI Studio 输入文本和操作引导。'
    );
  } else if (strategy.includes('Agent SDK')) {
    respond(
      '[product-launcher] 实现计划已完成。原型策略为 Claude Code + Agent SDK，直接进入 executing-plans 开始写代码。'
    );
  } else {
    respond(
      '[product-launcher] 实现计划已完成。原型策略为 Claude Code，直接进入 executing-plans 开始写代码。'
    );
  }
} catch (e) {
  log(`launch-prompt error: ${e.message}`);
}
process.exit(0);
